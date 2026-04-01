"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
const errorHandler_1 = require("../utils/errorHandler");
const dbService_1 = require("../services/dbService");
class ChatController {
    async handleChat(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized. Please login to chat.' });
                return;
            }
            const { messages } = req.body;
            const userId = req.user.id;
            if (!messages || !Array.isArray(messages)) {
                res.status(400).json({ error: 'Messages array is required' });
                return;
            }
            const responseText = await chatService_1.default.generateResponse(userId, messages);
            res.json({
                message: {
                    role: 'ai',
                    content: responseText
                }
            });
        }
        catch (error) {
            (0, errorHandler_1.handleGeminiError)(error, res);
        }
    }
    async getHistory(req, res) {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = req.user.id;
            const history = await (0, dbService_1.getChatHistory)(userId);
            res.json({ history });
        }
        catch (error) {
            console.error('Error fetching history:', error);
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }
}
exports.default = new ChatController();
