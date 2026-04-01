"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// Initiate Google Login
router.get('/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email']
}));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret';
// Google Login Callback
router.get('/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: '/?error=login_failed',
    session: false // We are using JWT, not sessions
}), (req, res) => {
    // Successful authentication, generate JWT
    const user = req.user;
    const token = jsonwebtoken_1.default.sign({ id: user.id, display_name: user.display_name, avatar_url: user.avatar_url }, JWT_SECRET, { expiresIn: '7d' });
    // Redirect to frontend with token in URL
    res.redirect(`/?token=${token}`);
});
const authMiddleware_1 = require("../middlewares/authMiddleware");
// Check Authentication Status (Now using JWT)
router.get('/status', authMiddleware_1.authenticateToken, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});
// Logout - Client side just removes the token, but we can provide a dummy endpoint
router.get('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;
