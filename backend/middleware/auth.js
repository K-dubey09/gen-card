// Authentication middleware
const authMiddleware = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ 
            error: 'Authentication required',
            redirect: '/login'
        });
    }
    next();
};

module.exports = authMiddleware;
