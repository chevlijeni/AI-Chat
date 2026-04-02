import { Router, Request, Response } from 'express';
import passport from 'passport';

const router: Router = Router();

// Initiate GitHub Login
router.get('/github', passport.authenticate('github', {
    scope: ['user:email']
}));

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret';

// GitHub Login Callback
router.get('/github/callback', passport.authenticate('github', {
    failureRedirect: '/?error=login_failed',
    session: false
}), (req: Request, res: Response) => {
    const user = req.user as any;
    const token = jwt.sign(
        { id: user.id, display_name: user.display_name, avatar_url: user.avatar_url },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
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
