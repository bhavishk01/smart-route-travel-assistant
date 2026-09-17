const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(googleIdToken) {
    const ticket = await googleClient.verifyIdToken({
        idToken: googleIdToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload();
}

async function findOrCreateGoogleUser(payload) {
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
        user = await User.create({
            googleId: payload.sub,
            name: payload.name,
            email: payload.email.toLowerCase(),
        });
    }

    return user;
}

async function signupWithPassword(name, email, password) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        const error = new Error('An account with this email already exists');
        error.statusCode = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalizedEmail, passwordHash });
    return user;
}

async function loginWithPassword(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.passwordHash) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    return user;
}

function issueAppToken(user) {
    return jwt.sign(
        { userId: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyAppToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
    verifyGoogleToken,
    findOrCreateGoogleUser,
    signupWithPassword,
    loginWithPassword,
    issueAppToken,
    verifyAppToken,
};