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
// Google Login Callback
router.get('/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: '/?error=login_failed'
}), (req, res) => {
    // Successful authentication, redirect to home.
    res.redirect('/');
});
// Check Authentication Status
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                display_name: req.user.display_name,
                avatar_url: req.user.avatar_url
            }
        });
    }
    else {
        res.json({ authenticated: false });
    }
});
// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});
exports.default = router;
