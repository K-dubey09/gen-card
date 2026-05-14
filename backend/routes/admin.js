const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin, hasPermission } = require('../middleware/rbac');
const prisma = require('../prismaClient');

let MUser, MSession, MDocument, MTransaction;
if (process.env.DB_TYPE === 'mongodb') {
  MUser = require('../models/mongodb/User');
  MSession = require('../models/mongodb/Session');
  MDocument = require('../models/mongodb/Document');
  MTransaction = require('../models/mongodb/Transaction');
}

// Get dashboard statistics (Admin only)
router.get('/stats', isAuthenticated, isAdmin, async (req, res) => {
  try {
    if (process.env.DB_TYPE === 'mongodb') {
      const [
        totalUsers,
        activeUsers,
        totalSessions,
        totalDocuments,
        totalTransactions,
        recentUsers,
        recentSessions
      ] = await Promise.all([
        MUser.countDocuments(),
        MUser.countDocuments({ isActive: true }),
        MSession.countDocuments(),
        MDocument.countDocuments(),
        MTransaction.countDocuments(),
        MUser.find().sort({ createdAt: -1 }).limit(10).select('-password'),
        MSession.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'username email')
      ]);

      const creditStats = await MUser.aggregate([
        { $group: { _id: null, totalCredits: { $sum: '$credits' }, avgCredits: { $avg: '$credits' } } }
      ]);

      const roleDistribution = await MUser.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      return res.json({
        stats: {
          users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
          sessions: totalSessions,
          documents: totalDocuments,
          transactions: totalTransactions,
          credits: { total: creditStats[0]?.totalCredits || 0, average: Math.round(creditStats[0]?.avgCredits || 0) },
          roles: roleDistribution
        },
        recentUsers,
        recentSessions
      });
    }

    // Prisma/Postgres path
    const [totalUsers, activeUsers, totalSessions, totalDocuments, totalTransactions] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.session.count(),
      prisma.document.count(),
      prisma.transaction.count()
    ]);

    const recentUsers = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, username: true, email: true, createdAt: true, role: true } });
    const recentSessions = await prisma.session.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { id: true, username: true, email: true } } } });

    const creditAgg = await prisma.user.aggregate({ _sum: { credits: true }, _avg: { credits: true } });
    const totalCredits = creditAgg._sum?.credits || 0;
    const avgCredits = Math.round(creditAgg._avg?.credits || 0);

    const roleDistribution = await prisma.user.groupBy({ by: ['role'], _count: { role: true } });

    res.json({
      stats: {
        users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        sessions: totalSessions,
        documents: totalDocuments,
        transactions: totalTransactions,
        credits: { total: totalCredits, average: avgCredits },
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
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    if (process.env.DB_TYPE === 'mongodb') {
      const query = {};
      if (role) query.role = role;
      if (search) query.$or = [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const users = await MUser.find(query).select('-password').sort({ createdAt: -1 }).limit(take).skip(skip);
      const count = await MUser.countDocuments(query);
      return res.json({ users, totalPages: Math.ceil(count / take), currentPage: page, total: count });
    }

    // Prisma path
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) where.OR = [{ username: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];

    const [users, count] = await Promise.all([
      prisma.user.findMany({ where, select: { password: false, id: true, username: true, email: true, credits: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.user.count({ where })
    ]);

    res.json({ users, totalPages: Math.ceil(count / take), currentPage: page, total: count });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details (Admin only)
router.get('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (process.env.DB_TYPE === 'mongodb') {
      const user = await MUser.findById(req.params.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      const [sessionCount, documentCount, transactionCount] = await Promise.all([
        MSession.countDocuments({ userId: user._id }),
        MDocument.countDocuments({ userId: user._id }),
        MTransaction.countDocuments({ userId: user._id })
      ]);
      return res.json({ user, stats: { sessions: sessionCount, documents: documentCount, transactions: transactionCount } });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { password: false, id: true, username: true, email: true, credits: true, role: true, isActive: true, createdAt: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [sessionCount, documentCount, transactionCount] = await Promise.all([
      prisma.session.count({ where: { userId: id } }),
      prisma.document.count({ where: { userId: id } }),
      prisma.transaction.count({ where: { userId: id } })
    ]);

    res.json({ user, stats: { sessions: sessionCount, documents: documentCount, transactions: transactionCount } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (Admin only)
router.put('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { role, credits, isActive } = req.body;
    const id = parseInt(req.params.id, 10);
    const data = {};
    if (role) data.role = role;
    if (credits !== undefined) data.credits = credits;
    if (isActive !== undefined) data.isActive = isActive;

    if (process.env.DB_TYPE === 'mongodb') {
      const user = await MUser.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ message: 'User updated successfully', user });
    }

    const user = await prisma.user.update({ where: { id }, data });
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (req.user.id === String(id)) return res.status(400).json({ error: 'You cannot delete your own account' });

    if (process.env.DB_TYPE === 'mongodb') {
      const user = await MUser.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await Promise.all([
        MSession.deleteMany({ userId: user._id }),
        MDocument.deleteMany({ userId: user._id }),
        MTransaction.deleteMany({ userId: user._id }),
        MUser.findByIdAndDelete(req.params.id)
      ]);
      return res.json({ message: 'User and associated data deleted successfully' });
    }

    // Prisma: delete related records then user in a transaction
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.document.deleteMany({ where: { userId: id } }),
      prisma.transaction.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
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
    const id = parseInt(req.params.id, 10);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid credit amount' });

    if (process.env.DB_TYPE === 'mongodb') {
      const user = await MUser.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.credits += amount;
      await user.save();
      await MTransaction.create({ userId: user._id, type: 'credit_purchase', amount: 0, credits: amount, status: 'completed', metadata: { reason: reason || 'Admin credit grant', addedBy: req.user.id } });
      return res.json({ message: 'Credits added successfully', user: { id: user._id, username: user.username, credits: user.credits } });
    }

    // Prisma path
    const updated = await prisma.user.update({ where: { id }, data: { credits: { increment: amount } } });
    await prisma.transaction.create({ data: { userId: id, type: 'credit_purchase', amount: 0, credits: amount, status: 'completed', metadata: { reason: reason || 'Admin credit grant', addedBy: req.user.id } } });
    res.json({ message: 'Credits added successfully', user: { id: updated.id, username: updated.username, credits: updated.credits } });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Get all sessions (Admin only)
router.get('/sessions', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    if (process.env.DB_TYPE === 'mongodb') {
      const query = userId ? { userId } : {};
      const sessions = await MSession.find(query).populate('userId', 'username email').sort({ createdAt: -1 }).limit(take).skip(skip);
      const count = await MSession.countDocuments(query);
      return res.json({ sessions, totalPages: Math.ceil(count / take), currentPage: page, total: count });
    }

    const where = {};
    if (userId) where.userId = parseInt(userId, 10);
    const [sessions, count] = await Promise.all([
      prisma.session.findMany({ where, include: { user: { select: { id: true, username: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.session.count({ where })
    ]);
    res.json({ sessions, totalPages: Math.ceil(count / take), currentPage: page, total: count });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Delete any session (Admin only)
router.delete('/sessions/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (process.env.DB_TYPE === 'mongodb') {
      const session = await MSession.findByIdAndDelete(req.params.id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      return res.json({ message: 'Session deleted successfully' });
    }
    const deleted = await prisma.session.delete({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'Session not found' });
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
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    if (process.env.DB_TYPE === 'mongodb') {
      const query = userId ? { userId } : {};
      const documents = await MDocument.find(query).populate('userId', 'username email').sort({ createdAt: -1 }).limit(take).skip(skip);
      const count = await MDocument.countDocuments(query);
      return res.json({ documents, totalPages: Math.ceil(count / take), currentPage: page, total: count });
    }

    const where = {};
    if (userId) where.userId = parseInt(userId, 10);
    const [documents, count] = await Promise.all([
      prisma.document.findMany({ where, include: { user: { select: { id: true, username: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.document.count({ where })
    ]);
    res.json({ documents, totalPages: Math.ceil(count / take), currentPage: page, total: count });
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

    if (process.env.DB_TYPE === 'mongodb') {
      const newUsers = await MUser.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
      const sessionActivity = await MSession.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
      const activeUsers = await MSession.aggregate([{ $group: { _id: '$userId', sessionCount: { $sum: 1 } } }, { $sort: { sessionCount: -1 } }, { $limit: 10 }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } }, { $unwind: '$user' }, { $project: { username: '$user.username', email: '$user.email', sessionCount: 1 } }]);
      return res.json({ newUsers, sessionActivity, activeUsers });
    }

    // Prisma: aggregate in JS
    const users = await prisma.user.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true } });
    const sessions = await prisma.session.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true, userId: true } });

    const formatDate = (d) => d.toISOString().slice(0, 10);
    const newUsers = users.reduce((acc, u) => { const k = formatDate(u.createdAt); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
    const sessionActivity = sessions.reduce((acc, s) => { const k = formatDate(s.createdAt); acc[k] = (acc[k] || 0) + 1; return acc; }, {});

    const counts = await prisma.session.groupBy({ by: ['userId'], _count: { _all: true }, orderBy: { _count: { _all: 'desc' } }, take: 10 });
    const userIds = counts.map(c => c.userId);
    const usersMap = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true, email: true } });
    const userById = Object.fromEntries(usersMap.map(u => [u.id, u]));
    const activeUsers = counts.map(c => ({ user: userById[c.userId], sessionCount: c._count._all }));

    res.json({ newUsers, sessionActivity, activeUsers });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
