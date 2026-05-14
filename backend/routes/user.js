const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const prisma = require('../prismaClient');

const router = express.Router();

// Get user info
router.get('/info', isAuthenticated, async (req, res) => {
    try {
        if (process.env.DB_TYPE === 'postgres' || process.env.DB_TYPE === 'postgresql' || process.env.DB_TYPE === 'prisma') {
            const id = parseInt(req.session.userId, 10);
            const user = await prisma.user.findUnique({ where: { id }, select: { id: true, username: true, email: true, credits: true, createdAt: true } });
            if (!user) return res.status(404).json({ error: 'User not found' });
            return res.json({ user });
        }

        // Fallback to Sequelize
        const models = require('../models');
        const user = await models.User.findByPk(req.session.userId, { attributes: ['id', 'username', 'email', 'credits', 'createdAt'] });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// Get transactions
router.get('/transactions', isAuthenticated, async (req, res) => {
    try {
        if (process.env.DB_TYPE === 'postgres' || process.env.DB_TYPE === 'postgresql' || process.env.DB_TYPE === 'prisma') {
            const id = parseInt(req.session.userId, 10);
            const transactions = await prisma.transaction.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50 });
            return res.json({ transactions });
        }

        const models = require('../models');
        const transactions = await models.Transaction.findAll({ where: { userId: req.session.userId }, order: [['createdAt', 'DESC']], limit: 50 });
        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

module.exports = router;
