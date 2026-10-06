const authService = require('../services/authService');

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = authService.verifyAppToken(token);
        req.userId = payload.userId;
        next();
    } catch (error) {
        res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth };