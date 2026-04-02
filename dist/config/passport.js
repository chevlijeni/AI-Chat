"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
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
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: '/auth/github/callback',
    scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const githubId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const displayName = profile.displayName || profile.username;
        const avatarUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;
        // Check if user exists
        const [existingUsers] = await database_1.default.query('SELECT * FROM users WHERE github_id = ?', [githubId]);
        if (existingUsers.length > 0) {
            return done(null, existingUsers[0]);
        }
        // New user, insert into DB
        const [result] = await database_1.default.query('INSERT INTO users (github_id, email, display_name, avatar_url) VALUES (?, ?, ?, ?)', [githubId, email, displayName, avatarUrl]);
        const newUser = {
            id: result.insertId,
            github_id: githubId,
            email,
            display_name: displayName,
            avatar_url: avatarUrl
        };
        return done(null, newUser);
    }
    catch (error) {
        console.error('Error during GitHub authentication:', error);
        return done(error, undefined);
    }
}));
exports.default = passport_1.default;
