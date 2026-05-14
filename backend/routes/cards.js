const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { isAuthenticated } = require('../middleware/auth');

// Import MongoDB models if using MongoDB
let User, Transaction, Session, Document;
if (process.env.DB_TYPE === 'mongodb') {
    User = require('../models/mongodb/User');
    Transaction = require('../models/mongodb/Transaction');
    Session = require('../models/mongodb/Session');
    Document = require('../models/mongodb/Document');
} else {
    const models = require('../models');
    User = models.User;
    Transaction = models.Transaction;
}

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/bmp',
            'image/tiff'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, TXT, and image files (JPG, PNG, BMP, TIFF) are allowed'));
        }
    }
});

// Calculate credits needed
const calculateCredits = (numCards) => {
    return Math.max(1, Math.floor(numCards / 5));
};

// Generate cards from file
router.post('/generate-from-file', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        const { numCards = 10 } = req.body;
        const file = req.file;

        console.log(`Generate from file: numCards=${numCards}, file=${file?.originalname}`);

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get user based on database type
        let user;
        if (process.env.DB_TYPE === 'mongodb') {
            user = await User.findById(req.user.id);
        } else {
            user = await User.findByPk(req.session.userId);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const creditsNeeded = calculateCredits(parseInt(numCards));

        // Check credits
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
                timeout: 300000, // 5 minutes for large PDFs with OCR (41 pages)
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        const cards = aiResponse.data.cards;

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        // Deduct credits (skip for admin)
        if (user.role !== 'admin') {
            user.credits -= creditsNeeded;
            await user.save();
        }

        // Record transaction (skip for admin)
        if (user.role !== 'admin') {
            if (process.env.DB_TYPE === 'mongodb') {
                await Transaction.create({
                    userId: user._id,
                    type: 'credit_usage',
                    amount: 0,
                    credits: -creditsNeeded,
                    status: 'completed',
                    metadata: {
                        description: `Generated ${cards.length} cards from ${file.originalname}`,
                        cardsGenerated: cards.length,
                        fileName: file.originalname
                    }
                });
            } else {
                await Transaction.create({
                    userId: user.id,
                    type: 'usage',
                    amount: -creditsNeeded,
                    description: `Generated ${cards.length} cards from ${file.originalname}`
                });
            }
        }

        res.json({
            success: true,
            cards,
            creditsUsed: user.role === 'admin' ? 0 : creditsNeeded,
            creditsRemaining: user.credits
        });
    } catch (error) {
        console.error('Card generation error:', error);
        res.status(500).json({ error: 'Failed to generate cards' });
    }
});

// Generate cards from text
router.post('/generate-from-text', isAuthenticated, async (req, res) => {
    try {
        const { text, numCards = 10 } = req.body;

        console.log(`Generate from text: numCards=${numCards}, text length=${text?.length}`);

        if (!text || text.length < 100) {
            return res.status(400).json({ error: 'Text must be at least 100 characters' });
        }

        // Get user based on database type
        let user;
        if (process.env.DB_TYPE === 'mongodb') {
            user = await User.findById(req.user.id);
        } else {
            user = await User.findByPk(req.session.userId);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const creditsNeeded = calculateCredits(parseInt(numCards));

        // Check credits (skip for admin)
        if (user.role !== 'admin' && user.credits < creditsNeeded) {
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

        // Deduct credits (skip for admin)
        if (user.role !== 'admin') {
            user.credits -= creditsNeeded;
            await user.save();
        }

        // Record transaction (skip for admin)
        if (user.role !== 'admin') {
            if (process.env.DB_TYPE === 'mongodb') {
                await Transaction.create({
                    userId: user._id,
                    type: 'credit_usage',
                    amount: 0,
                    credits: -creditsNeeded,
                    status: 'completed',
                    metadata: {
                        description: `Generated ${cards.length} cards from text`,
                        cardsGenerated: cards.length,
                        textLength: text.length
                    }
                });
            } else {
                await Transaction.create({
                    userId: user.id,
                    type: 'usage',
                    amount: -creditsNeeded,
                    description: `Generated ${cards.length} cards from text input`
                });
            }
        }

        res.json({
            success: true,
            cards,
            creditsUsed: user.role === 'admin' ? 0 : creditsNeeded,
            creditsRemaining: user.credits
        });
    } catch (error) {
        console.error('Card generation error:', error);
        res.status(500).json({ error: 'Failed to generate cards' });
    }
});

// Generate cards from uploaded document
router.post('/generate-from-document', isAuthenticated, async (req, res) => {
    try {
        const { documentId, num_cards = 10 } = req.body;
        const numCards = parseInt(num_cards);

        console.log(`Generate from document: documentId=${documentId}, num_cards=${num_cards}, parsed=${numCards}`);

        if (!documentId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }

        // Only MongoDB supports documents
        if (process.env.DB_TYPE !== 'mongodb') {
            return res.status(400).json({ error: 'Document generation requires MongoDB' });
        }

        // Get user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get document
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Verify document belongs to user
        if (document.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Access denied to this document' });
        }

        const creditsNeeded = calculateCredits(parseInt(numCards));

        // Check credits (skip for admin)
        if (user.role !== 'admin' && user.credits < creditsNeeded) {
            return res.status(400).json({
                error: `Insufficient credits. Need ${creditsNeeded}, you have ${user.credits}`,
                showRecharge: true
            });
        }

        // Check if file exists
        if (!fs.existsSync(document.filePath)) {
            return res.status(404).json({ error: 'Document file not found on server' });
        }

        // Call Python AI service
        const formData = new FormData();
        formData.append('file', fs.createReadStream(document.filePath), {
            filename: document.originalName || document.fileName,
            contentType: document.fileType
        });
        formData.append('num_cards', numCards);

        const aiResponse = await axios.post(
            process.env.AI_SERVICE_URL || 'http://localhost:5001/generate-cards',
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 180000, // 3 minutes for card generation + images
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        console.log('✅ AI Response status:', aiResponse.status);
        console.log('📊 AI Response data:', JSON.stringify(aiResponse.data, null, 2));
        console.log('🔍 AI Response data.cards exists:', 'cards' in aiResponse.data);
        console.log('🔍 AI Response data.cards type:', typeof aiResponse.data.cards);
        console.log('🔍 AI Response data.cards length:', aiResponse.data.cards?.length);

        const cards = aiResponse.data.cards;

        // Deduct credits (skip for admin)
        if (user.role !== 'admin') {
            user.credits -= creditsNeeded;
            await user.save();
        }

        // Record transaction (skip for admin)
        if (user.role !== 'admin') {
            await Transaction.create({
                userId: user._id,
                type: 'credit_usage',
                amount: 0,
                credits: -creditsNeeded,
                status: 'completed',
                metadata: {
                    description: `Generated ${cards.length} cards from document: ${document.originalName || document.fileName}`,
                    cardsGenerated: cards.length,
                    documentId: document._id,
                    fileName: document.originalName || document.fileName
                }
            });
        }

        res.json({
            success: true,
            cards,
            creditsUsed: user.role === 'admin' ? 0 : creditsNeeded,
            creditsRemaining: user.credits,
            documentId: document._id
        });
    } catch (error) {
        console.error('Card generation from document error:', error);
        console.error('Error message:', error.message);
        console.error('Error response data:', error.response?.data);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to generate cards from document',
            details: error.message,
            aiError: error.response?.data
        });
    }
});

module.exports = router;
