const express = require('express');
const axios = require('axios');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Generate roadmap from cards
router.post('/generate', isAuthenticated, async (req, res) => {
    try {
        const { cards, topic } = req.body;

        if (!cards || cards.length === 0) {
            return res.status(400).json({ error: 'No cards provided' });
        }

        // Call Python AI service
        const aiResponse = await axios.post(
            (process.env.AI_SERVICE_URL || 'http://localhost:5001').replace('/generate-cards', '/generate-roadmap'),
            { cards, topic },
            { timeout: 60000 }
        );

        res.json({
            success: true,
            roadmap: aiResponse.data.roadmap,
            cards: aiResponse.data.cards
        });
    } catch (error) {
        console.error('Roadmap generation error:', error);
        res.status(500).json({ error: 'Failed to generate roadmap' });
    }
});

module.exports = router;
