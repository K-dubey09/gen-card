const express = require('express');
const router = express.Router();
const Session = require('../models/mongodb/Session');
const User = require('../models/mongodb/User');
const { isAuthenticated } = require('../middleware/auth');

// Get all sessions for user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get single session
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Increment view count
    session.viewCount += 1;
    await session.save();
    
    res.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Save new session
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, topic, cards, roadmap, sourceType, sourceFileName, creditsUsed, tags, documentId } = req.body;
    
    const session = new Session({
      userId: req.user.id,
      title,
      topic,
      cards,
      roadmap,
      sourceType,
      sourceFileName,
      creditsUsed,
      tags: tags || [],
      documentId: documentId || null
    });
    
    await session.save();
    
    res.json({ 
      success: true, 
      session,
      message: 'Session saved successfully' 
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Update session
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ 
      success: true, 
      session,
      message: 'Session updated successfully' 
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Toggle favorite
router.patch('/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isFavorite = !session.isFavorite;
    await session.save();
    
    res.json({ 
      success: true, 
      isFavorite: session.isFavorite 
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Delete session
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Search sessions
router.get('/search/:query', isAuthenticated, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user.id,
      $text: { $search: req.params.query }
    }).sort({ createdAt: -1 });
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error searching sessions:', error);
    res.status(500).json({ error: 'Failed to search sessions' });
  }
});

module.exports = router;
