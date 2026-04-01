import { Router, Request, Response } from 'express';
import passport from 'passport';

const router: Router = Router();

// Initiate Google Login
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google Login Callback
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/?error=login_failed'
}), (req: Request, res: Response) => {
    // Successful authentication, redirect to home.
    res.redirect('/');
});

// Check Authentication Status
router.get('/status', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: {
                id: (req.user as any).id,
                display_name: (req.user as any).display_name,
                avatar_url: (req.user as any).avatar_url
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout
router.get('/logout', (req: Request, res: Response, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

export default router;
