const User = require('../models/mongodb/User');

// Authentication middleware
const isAuthenticated = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
            error: 'Authentication required',
            redirect: '/login'
        });
    }

    try {
        // For MongoDB, attach full user object
        if (process.env.DB_TYPE === 'mongodb') {
            const user = await User.findById(req.session.userId).select('-password');
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            if (!user.isActive) {
                return res.status(403).json({ error: 'Account is deactivated' });
            }
            req.user = {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role,
                credits: user.credits,
                isActive: user.isActive
            };
        } else {
            // For SQLite, use session data
            req.user = {
                id: req.session.userId,
                username: req.session.username
            };
        }
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

// Legacy alias
const authMiddleware = isAuthenticated;

module.exports = { isAuthenticated, authMiddleware };
module.exports.isAuthenticated = isAuthenticated;
module.exports.default = authMiddleware;

