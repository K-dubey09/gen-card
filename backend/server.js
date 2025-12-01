const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/cards');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/user');
const { syncDatabase } = require('./models');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
    try {
        // Sync database
        await syncDatabase();
        
        app.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log('📚 CARD MAKER - Node.js Backend');
            console.log('='.repeat(60));
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`🌐 API: http://localhost:${PORT}/api`);
            console.log(`🔐 Authentication: Enabled`);
            console.log(`💳 Payments: Stripe Integration`);
            console.log(`🤖 AI Service: Python microservice`);
            console.log(`\n${'='.repeat(60)}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
