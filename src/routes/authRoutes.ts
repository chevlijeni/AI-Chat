import { Router, Request, Response } from 'express';
import passport from 'passport';

const router: Router = Router();

// Initiate Google Login
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret';

// Google Login Callback
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/?error=login_failed',
    session: false // We are using JWT, not sessions
}), (req: Request, res: Response) => {
    // Successful authentication, generate JWT
    const user = req.user as any;
    const token = jwt.sign(
        { id: user.id, display_name: user.display_name, avatar_url: user.avatar_url },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Redirect to frontend with token in URL
    res.redirect(`/?token=${token}`);
});

import { authenticateToken, AuthRequest } from '../middlewares/authMiddleware';

// Check Authentication Status (Now using JWT)
router.get('/status', authenticateToken, (req: AuthRequest, res: Response) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});

// Logout - Client side just removes the token, but we can provide a dummy endpoint
router.get('/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logged out successfully' });
});

export default router;
