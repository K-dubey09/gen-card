const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const authMongoRoutes = require('./routes/authMongo');
const cardRoutes = require('./routes/cards');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/user');
const roadmapRoutes = require('./routes/roadmap');
const sessionsRoutes = require('./routes/sessions');
const documentsRoutes = require('./routes/documents');
const adminRoutes = require('./routes/admin');
const { syncDatabase } = require('./models');

const app = express();

// Connect to MongoDB
const dbType = process.env.DB_TYPE || 'mongodb';
if (dbType === 'mongodb') {
  connectDB();
}

// Middleware
app.use(helmet());
// CORS configuration
// - In development or when CORS_ALLOW_ALL=true, allow all origins (echo origin)
// - Otherwise, use CLIENT_URLS / CLIENT_URL (comma-separated list) as whitelist
const allowAllCors = process.env.CORS_ALLOW_ALL === 'true' || process.env.NODE_ENV !== 'production';

if (allowAllCors) {
    // Allow any origin for dev/testing; this echoes the request origin
    app.use(cors({ origin: true, credentials: true }));
    app.options('*', cors({ origin: true, credentials: true }));
    console.log('CORS: Allowing all origins (development/CORS_ALLOW_ALL=true)');
} else {
    const clientOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (e.g., server-to-server, curl, Postman)
            if (!origin) return callback(null, true);

            if (clientOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            }

            // Log rejected origins for debugging
            console.warn(`Blocked CORS request from origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        exposedHeaders: ['Content-Range', 'X-Total-Count']
    }));

    // Ensure preflight requests are handled for allowed origins
    app.options('*', cors({ origin: clientOrigins, credentials: true }));
}
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
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Routes
app.use('/api/auth', dbType === 'mongodb' ? authMongoRoutes : authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/admin', adminRoutes);

// Debug endpoint: returns the request Origin header and some headers for CORS troubleshooting
app.get('/api/debug/origin', (req, res) => {
    const origin = req.get('origin') || null;
    console.log('CORS Debug - Origin header:', origin);
    const debugHeaders = {
        origin: req.headers.origin || null,
        referer: req.headers.referer || null,
        host: req.headers.host || null,
        'user-agent': req.headers['user-agent'] || null
    };
    res.json({ success: true, origin, headers: debugHeaders });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      database: dbType,
      timestamp: new Date().toISOString() 
    });
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
