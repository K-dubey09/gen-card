const prisma = require('../prismaClient');
const { buildUserContext, extractTokenFromRequest, verifyAuthToken } = require('../utils/pasetoAuth');

const resolveAuthenticatedUser = async (req) => {
    const token = extractTokenFromRequest(req);

    if (token) {
        try {
            const payload = await verifyAuthToken(token);
            const userId = Number.parseInt(payload.sub || payload.userId, 10);

            if (Number.isFinite(userId)) {
                const tokenUser = await prisma.user.findUnique({ where: { id: userId } });
                if (tokenUser && tokenUser.isActive) {
                    return {
                        user: buildUserContext(tokenUser, payload),
                        authType: 'paseto',
                        token,
                        tokenPayload: payload
                    };
                }
            }
        } catch (error) {
            console.warn('PASETO auth check failed:', error.message);
        }
    }

    if (req.session?.userId) {
        const id = Number.parseInt(req.session.userId, 10);
        if (Number.isFinite(id)) {
            const sessionUser = await prisma.user.findUnique({ where: { id } });
            if (sessionUser && sessionUser.isActive) {
                return {
                    user: buildUserContext(sessionUser),
                    authType: 'session'
                };
            }
        }
    }

    return null;
};

// Authentication middleware
const isAuthenticated = async (req, res, next) => {
    try {
        const auth = await resolveAuthenticatedUser(req);
        if (!auth) {
            return res.status(401).json({ error: 'Authentication required', redirect: '/login' });
        }

        req.user = auth.user;
        req.authType = auth.authType;
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
module.exports.resolveAuthenticatedUser = resolveAuthenticatedUser;

