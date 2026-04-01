"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
const errorHandler_1 = require("../utils/errorHandler");
// Dynamic import for dbService to prevent circular dependencies
const dbService = __importStar(require("../services/dbService"));
class ChatController {
    async createSession(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const { title } = req.body;
            const sessionId = await dbService.createChatSession(userId, title || 'New Chat');
            res.json({ sessionId });
        }
        catch (error) {
            console.error('Error creating session:', error);
            res.status(500).json({ error: 'Failed to create chat session' });
        }
    }
    async getSessions(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const sessions = await dbService.getUserSessions(userId);
            res.json({ sessions });
        }
        catch (error) {
            console.error('Error fetching sessions:', error);
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }
    async getHistory(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const sessionId = parseInt(req.params.sessionId, 10);
            if (isNaN(sessionId)) {
                res.status(400).json({ error: 'Invalid session ID' });
                return;
            }
            const history = await dbService.getChatHistory(userId, sessionId);
            res.json({ history });
        }
        catch (error) {
            console.error('Error fetching history:', error);
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }
    async deleteSession(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const sessionId = parseInt(req.params.sessionId, 10);
            if (isNaN(sessionId)) {
                res.status(400).json({ error: 'Invalid session ID' });
                return;
            }
            await dbService.deleteChatSession(sessionId, userId);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error deleting session:', error);
            res.status(500).json({ error: 'Failed to delete chat session' });
        }
    }
    async editAndResend(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const sessionId = parseInt(req.params.sessionId, 10);
            const messageId = parseInt(req.params.messageId, 10);
            const { newContent } = req.body;
            if (isNaN(sessionId) || isNaN(messageId) || !newContent) {
                res.status(400).json({ error: 'Invalid inputs' });
                return;
            }
            // 1. Truncate and update
            await dbService.editAndTruncateMessage(sessionId, userId, messageId, newContent);
            // 2. Resend the history to Gemini
            const responseText = await chatService_1.default.generateResponseFromDbOnly(sessionId, userId);
            // Return the full history so frontend can quickly repaint
            const newHistory = await dbService.getChatHistory(userId, sessionId);
            res.json({ message: { role: 'ai', content: responseText }, fullHistory: newHistory });
        }
        catch (error) {
            (0, errorHandler_1.handleGeminiError)(error, res);
        }
    }
    async handleChat(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized. Please login to chat.' });
                return;
            }
            const { messages, sessionId } = req.body;
            const userId = req.user.id;
            if (!messages || !Array.isArray(messages)) {
                res.status(400).json({ error: 'Messages array is required' });
                return;
            }
            if (!sessionId) {
                res.status(400).json({ error: 'Session ID is required' });
                return;
            }
            const responseText = await chatService_1.default.generateResponse(sessionId, userId, messages);
            // Optionally rename the chat if it's the first message
            if (messages.filter(m => m.role === 'user').length === 1) {
                const title = messages.find(m => m.role === 'user')?.content.substring(0, 30) + '...';
                if (title)
                    await dbService.updateChatSessionTitle(sessionId, title);
            }
            // Also return the ID of the saved user message so frontend can edit it later! 
            // Better yet, just return full history. Overkill? No, returning full history gives the IDs sync.
            const newHistory = await dbService.getChatHistory(userId, sessionId);
            res.json({
                message: {
                    role: 'ai',
                    content: responseText
                },
                fullHistory: newHistory
            });
        }
        catch (error) {
            (0, errorHandler_1.handleGeminiError)(error, res);
        }
    }
}
exports.default = new ChatController();
