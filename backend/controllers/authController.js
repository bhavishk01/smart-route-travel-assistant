const authService = require('../services/authService');

async function googleLogin(req, res) {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ status: 'error', message: 'Missing credential' });
        }

        const payload = await authService.verifyGoogleToken(credential);
        const user = await authService.findOrCreateGoogleUser(payload);
        const token = authService.issueAppToken(user);

        res.json({ status: 'ok', token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Google login failed:', error.message);
        res.status(401).json({ status: 'error', message: 'Invalid Google token' });
    }
}

async function signup(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Name, email and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters' });
        }

        const user = await authService.signupWithPassword(name, email, password);
        const token = authService.issueAppToken(user);

        res.json({ status: 'ok', token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Signup failed:', error.message);
        res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Signup failed' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        const user = await authService.loginWithPassword(email, password);
        const token = authService.issueAppToken(user);

        res.json({ status: 'ok', token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error('Login failed:', error.message);
        res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Login failed' });
    }
}

module.exports = { googleLogin, signup, login };