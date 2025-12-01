const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { User, Transaction, CardGeneration } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and TXT files are allowed'));
        }
    }
});

// Calculate credits needed
const calculateCredits = (numCards) => {
    return Math.max(1, Math.floor(numCards / 5));
};

// Generate cards from file
router.post('/generate-from-file', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const { numCards = 10 } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user = await User.findByPk(req.session.userId);
        const creditsNeeded = calculateCredits(parseInt(numCards));

        if (user.credits < creditsNeeded) {
            return res.status(400).json({
                error: `Insufficient credits. Need ${creditsNeeded}, you have ${user.credits}`,
                showRecharge: true
            });
        }

        // Call Python AI service
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype
        });
        formData.append('num_cards', numCards);

        const aiResponse = await axios.post(
            process.env.AI_SERVICE_URL || 'http://localhost:5001/generate-cards',
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 60000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const cards = aiResponse.data.cards;

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        // Deduct credits
        user.credits -= creditsNeeded;
        await user.save();

        // Record transaction
        await Transaction.create({
            userId: user.id,
            type: 'usage',
            amount: -creditsNeeded,
            description: `Generated ${cards.length} cards from ${file.originalname}`
        });

        // Record card generation
        await CardGeneration.create({
            userId: user.id,
            cardsGenerated: cards.length,
            creditsUsed: creditsNeeded,
            fileName: file.originalname
        });

        res.json({
            success: true,
            cards,
            creditsUsed: creditsNeeded,
            creditsRemaining: user.credits
        });
    } catch (error) {
        console.error('Card generation error:', error);
        res.status(500).json({ error: 'Failed to generate cards' });
    }
});

// Generate cards from text
router.post('/generate-from-text', authMiddleware, async (req, res) => {
    try {
        const { text, numCards = 10 } = req.body;

        if (!text || text.length < 100) {
            return res.status(400).json({ error: 'Text must be at least 100 characters' });
        }

        const user = await User.findByPk(req.session.userId);
        const creditsNeeded = calculateCredits(parseInt(numCards));

        if (user.credits < creditsNeeded) {
            return res.status(400).json({
                error: `Insufficient credits. Need ${creditsNeeded}, you have ${user.credits}`,
                showRecharge: true
            });
        }

        // Call Python AI service
        const aiResponse = await axios.post(
            process.env.AI_SERVICE_URL || 'http://localhost:5001/generate-cards',
            { text, num_cards: numCards },
            { timeout: 60000 }
        );

        const cards = aiResponse.data.cards;

        // Deduct credits
        user.credits -= creditsNeeded;
        await user.save();

        // Record transaction
        await Transaction.create({
            userId: user.id,
            type: 'usage',
            amount: -creditsNeeded,
            description: `Generated ${cards.length} cards from text input`
        });

        // Record card generation
        await CardGeneration.create({
            userId: user.id,
            cardsGenerated: cards.length,
            creditsUsed: creditsNeeded
        });

        res.json({
            success: true,
            cards,
            creditsUsed: creditsNeeded,
            creditsRemaining: user.credits
        });
    } catch (error) {
        console.error('Card generation error:', error);
        res.status(500).json({ error: 'Failed to generate cards' });
    }
});

module.exports = router;
