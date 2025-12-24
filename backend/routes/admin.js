const express = require('express');
const router = express.Router();
const User = require('../models/mongodb/User');
const Session = require('../models/mongodb/Session');
const Document = require('../models/mongodb/Document');
const Transaction = require('../models/mongodb/Transaction');
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin, hasPermission } = require('../middleware/rbac');

// Get dashboard statistics (Admin only)
router.get('/stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      totalDocuments,
      totalTransactions,
      recentUsers,
      recentSessions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Session.countDocuments(),
      Document.countDocuments(),
      Transaction.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password'),
      Session.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'username email')
    ]);

    // Calculate total credits distributed
    const creditStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCredits: { $sum: '$credits' },
          avgCredits: { $avg: '$credits' }
        }
      }
    ]);

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        sessions: totalSessions,
        documents: totalDocuments,
        transactions: totalTransactions,
        credits: {
          total: creditStats[0]?.totalCredits || 0,
          average: Math.round(creditStats[0]?.avgCredits || 0)
        },
        roles: roleDistribution
      },
      recentUsers,
      recentSessions
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users (Admin only)
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details (Admin only)
router.get('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's statistics
    const [sessionCount, documentCount, transactionCount] = await Promise.all([
      Session.countDocuments({ userId: user._id }),
      Document.countDocuments({ userId: user._id }),
      Transaction.countDocuments({ userId: user._id })
    ]);

    res.json({
      user,
      stats: {
        sessions: sessionCount,
        documents: documentCount,
        transactions: transactionCount
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (Admin only)
router.put('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { role, credits, isActive } = req.body;
    
    const updateData = {};
    if (role) updateData.role = role;
    if (credits !== undefined) updateData.credits = credits;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Delete user's data
    await Promise.all([
      Session.deleteMany({ userId: user._id }),
      Document.deleteMany({ userId: user._id }),
      Transaction.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(req.params.id)
    ]);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Add credits to user (Admin only)
router.post('/users/:id/credits', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid credit amount' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.credits += amount;
    await user.save();

    // Create transaction record
    await Transaction.create({
      userId: user._id,
      type: 'credit_purchase',
      amount: 0,
      credits: amount,
      status: 'completed',
      metadata: {
        reason: reason || 'Admin credit grant',
        addedBy: req.user.id
      }
    });

    res.json({ 
      message: 'Credits added successfully', 
      user: { 
        id: user._id, 
        username: user.username, 
        credits: user.credits 
      } 
    });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Get all sessions (Admin only)
router.get('/sessions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    
    const query = userId ? { userId } : {};

    const sessions = await Session.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Session.countDocuments(query);

    res.json({
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Delete any session (Admin only)
router.delete('/sessions/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Get all documents (Admin only)
router.get('/documents', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    
    const query = userId ? { userId } : {};

    const documents = await Document.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Document.countDocuments(query);

    res.json({
      documents,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get system analytics (Admin only)
router.get('/analytics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // New users per day
    const newUsers = await User.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Sessions created per day
    const sessionActivity = await Session.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Most active users
    const activeUsers = await Session.aggregate([
      {
        $group: {
          _id: '$userId',
          sessionCount: { $sum: 1 }
        }
      },
      { $sort: { sessionCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          email: '$user.email',
          sessionCount: 1
        }
      }
    ]);

    res.json({
      newUsers,
      sessionActivity,
      activeUsers
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
