"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const database_1 = __importDefault(require("./database"));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const [rows] = await database_1.default.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            done(null, rows[0]);
        }
        else {
            done(new Error("User not found"), null);
        }
    }
    catch (error) {
        done(error, null);
    }
});
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const googleId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '';
        const displayName = profile.displayName;
        const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
        // Check if user exists
        const [existingUsers] = await database_1.default.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        if (existingUsers.length > 0) {
            // User exists, login
            return done(null, existingUsers[0]);
        }
        // New user, insert into DB
        const [result] = await database_1.default.query('INSERT INTO users (google_id, email, display_name, avatar_url) VALUES (?, ?, ?, ?)', [googleId, email, displayName, avatarUrl]);
        const newUser = {
            id: result.insertId,
            google_id: googleId,
            email,
            display_name: displayName,
            avatar_url: avatarUrl
        };
        return done(null, newUser);
    }
    catch (error) {
        console.error('Error during Google authentication:', error);
        return done(error, undefined);
    }
}));
exports.default = passport_1.default;
