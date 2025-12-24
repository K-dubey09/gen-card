const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/mongodb/User');
const Transaction = require('../models/mongodb/Transaction');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check existing user
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({ 
                error: existingUser.username === username 
                    ? 'Username already exists' 
                    : 'Email already registered'
            });
        }

        // Create user (password will be hashed by pre-save hook)
        const user = await User.create({
            username,
            email,
            password,
            credits: 10,
            role: 'user',
            isActive: true
        });

        // Create welcome bonus transaction
        await Transaction.create({
            userId: user._id,
            type: 'credit_purchase',
            amount: 0,
            credits: 10,
            status: 'completed',
            metadata: {
                description: 'Welcome bonus - 10 free credits'
            }
        });

        // Set session
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.role = user.role;

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                credits: user.credits,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Login attempt:', { username, passwordLength: password?.length });

        if (!username || !password) {
            return res.status(400).json({ error: 'Username/Email and password are required' });
        }

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        console.log('User found:', user ? `Yes (${user.username})` : 'No');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is active
        if (!user.isActive) {
            console.log('Account inactive:', user.username);
            return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
        }

        const validPassword = await user.comparePassword(password);
        console.log('Password valid:', validPassword);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.role = user.role;

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                credits: user.credits,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

// Check auth status
router.get('/status', async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId).select('-password');
            if (user && user.isActive) {
                res.json({ 
                    authenticated: true, 
                    userId: req.session.userId,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        credits: user.credits,
                        role: user.role
                    }
                });
            } else {
                req.session.destroy();
                res.json({ authenticated: false });
            }
        } catch (error) {
            res.json({ authenticated: false });
        }
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
