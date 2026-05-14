const express = require('express');
const prisma = require('../prismaClient');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Get all sessions for user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions (Prisma):', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get single session
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await prisma.session.update({ where: { id }, data: { viewCount: session.viewCount + 1 } });

    res.json({ session: { ...session, viewCount: session.viewCount + 1 } });
  } catch (error) {
    console.error('Error fetching session (Prisma):', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Save new session
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const { title, topic, cards, roadmap, sourceType, sourceFileName, creditsUsed, tags, documentId } = req.body;

    const session = await prisma.session.create({
      data: {
        userId,
        title,
        topic: topic || null,
        cards: cards || [],
        roadmap: roadmap || null,
        sourceType,
        sourceFileName: sourceFileName || null,
        creditsUsed: creditsUsed || 0,
        tags: tags || null
      }
    });

    res.json({ success: true, session, message: 'Session saved successfully' });
  } catch (error) {
    console.error('Error saving session (Prisma):', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Update session
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);

    // ensure ownership
    const existing = await prisma.session.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ error: 'Session not found' });

    const updated = await prisma.session.update({ where: { id }, data: req.body });
    res.json({ success: true, session: updated, message: 'Session updated successfully' });
  } catch (error) {
    console.error('Error updating session (Prisma):', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Toggle favorite
router.patch('/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const updated = await prisma.session.update({ where: { id }, data: { isFavorite: !session.isFavorite } });
    res.json({ success: true, isFavorite: updated.isFavorite });
  } catch (error) {
    console.error('Error toggling favorite (Prisma):', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Delete session
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await prisma.session.delete({ where: { id } });
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session (Prisma):', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Search sessions (simple title/topic contains)
router.get('/search/:query', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const q = req.params.query;
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { topic: { contains: q, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ sessions });
  } catch (error) {
    console.error('Error searching sessions (Prisma):', error);
    res.status(500).json({ error: 'Failed to search sessions' });
  }
});

module.exports = router;
