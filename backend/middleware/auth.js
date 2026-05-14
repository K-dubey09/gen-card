const prisma = require('../prismaClient');

// Authentication middleware
const isAuthenticated = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
            error: 'Authentication required',
            redirect: '/login'
        });
    }

    try {
        const id = parseInt(req.session.userId, 10);
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }
        req.user = {
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            credits: user.credits,
            isActive: user.isActive
        };
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

