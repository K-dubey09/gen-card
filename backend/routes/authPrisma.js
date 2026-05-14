const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../prismaClient');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: existingUser.username === username ? 'Username already exists' : 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                credits: 10,
                role: 'user'
            }
        });

        await prisma.transaction.create({
            data: {
                userId: user.id,
                type: 'credit_purchase',
                amount: 0,
                credits: 10,
                status: 'completed',
                metadata: { description: 'Welcome bonus - 10 free credits' }
            }
        });

        req.session.userId = user.id.toString();
        req.session.username = user.username;
        req.session.role = user.role;

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                credits: user.credits,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Prisma register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username/Email and password are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

        req.session.userId = user.id.toString();
        req.session.username = user.username;
        req.session.role = user.role;

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                credits: user.credits,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Prisma login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ success: true });
    });
});

// Status
router.get('/status', async (req, res) => {
    if (!req.session.userId) return res.json({ authenticated: false });

    try {
        const id = parseInt(req.session.userId, 10);
        const user = await prisma.user.findUnique({ where: { id } });
        if (user && user.isActive) {
            res.json({ authenticated: true, userId: req.session.userId, user: { id: user.id, username: user.username, email: user.email, credits: user.credits, role: user.role } });
        } else {
            req.session.destroy(() => {});
            res.json({ authenticated: false });
        }
    } catch (error) {
        console.error('Prisma status error:', error);
        res.json({ authenticated: false });
    }
});

module.exports = router;
