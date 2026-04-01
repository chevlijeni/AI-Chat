import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
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

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: '/auth/google/callback'
}, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
        const googleId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '';
        const displayName = profile.displayName;
        const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        // Check if user exists
        const [existingUsers] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE google_id = ?', [googleId]);

        if (existingUsers.length > 0) {
            // User exists, login
            return done(null, existingUsers[0]);
        }

        // New user, insert into DB
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (google_id, email, display_name, avatar_url) VALUES (?, ?, ?, ?)',
            [googleId, email, displayName, avatarUrl]
        );

        const newUser = {
            id: result.insertId,
            google_id: googleId,
            email,
            display_name: displayName,
            avatar_url: avatarUrl
        };

        return done(null, newUser);
    } catch (error: any) {
        console.error('Error during Google authentication:', error);
        return done(error, undefined);
    }
}));

export default passport;
