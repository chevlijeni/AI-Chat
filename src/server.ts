import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/passport';
import { initializeDatabase, sessionStore } from './config/database';

import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import historyRoutes from './routes/historyRoutes';

import { encryptionMiddleware } from './middlewares/encryptionMiddleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 🛡️ Global Security: AES Payload Encryption/Decryption
app.use(encryptionMiddleware);

// Initialize Passport (Don't need sessions anymore!)
app.use(passport.initialize());

// Mount Routes
app.use('/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);

// Initialize Database Schema on startup
initializeDatabase().then(() => {
    console.log("Database initialized successfully (or gracefully handled).");
}).catch(err => {
    console.error("Failed to start server due to DB initialization error:", err);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
