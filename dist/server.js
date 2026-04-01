"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("./config/passport"));
const database_1 = require("./config/database");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const historyRoutes_1 = __importDefault(require("./routes/historyRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Setup Express Session
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    store: database_1.sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Mount Routes
app.use('/auth', authRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/history', historyRoutes_1.default);
// Initialize Database Schema on startup
(0, database_1.initializeDatabase)().then(() => {
    console.log("Database initialized successfully (or gracefully handled).");
}).catch(err => {
    console.error("Failed to start server due to DB initialization error:", err);
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
