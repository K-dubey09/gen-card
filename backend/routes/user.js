const express = require('express');
const { User, Transaction } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user info
router.get('/info', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.session.userId, {
            attributes: ['id', 'username', 'email', 'credits', 'createdAt']
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Get transactions
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: { userId: req.session.userId },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

module.exports = router;
