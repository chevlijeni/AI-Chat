import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import pool from './database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            done(null, rows[0]);
        } else {
            done(new Error("User not found"), null);
        }
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: '/auth/github/callback',
    scope: ['user:email']
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        const githubId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const displayName = profile.displayName || profile.username;
        const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        // Check if user exists
        const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE github_id = ?', [githubId]);

        if (existingUsers.length > 0) {
            return done(null, existingUsers[0]);
        }

        // New user, insert into DB
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (github_id, email, display_name, avatar_url) VALUES (?, ?, ?, ?)',
            [githubId, email, displayName, avatarUrl]
        );

        const newUser = {
            id: result.insertId,
            github_id: githubId,
            email,
            display_name: displayName,
            avatar_url: avatarUrl
        };

        return done(null, newUser);
    } catch (error: any) {
        console.error('❌ Passport GitHub Strategy Error:', error);
        return done(error, undefined);
    }
}));

export default passport;
