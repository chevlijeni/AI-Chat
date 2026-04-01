"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gemini_1 = __importDefault(require("../config/gemini"));
const dbService_1 = require("./dbService");
class ChatService {
    async generateResponse(sessionId, userId, currentMessages) {
        // Find the latest user message from the request
        const latestUserMsg = currentMessages.slice().reverse().find(m => m.role !== 'system' && m.role !== 'ai' && m.role !== 'model');
        if (latestUserMsg) {
            await (0, dbService_1.saveChatMessage)(sessionId, userId, 'user', latestUserMsg.content);
        }
        return this.generateResponseFromDbOnly(sessionId, userId);
    }
    async generateResponseFromDbOnly(sessionId, userId) {
        let systemInstruction = "You are Jeni AI, a helpful, intelligent, and friendly AI assistant created by Jeni. Your goal is to assist the user with any questions they have, providing clear, concise, and friendly answers.";
        // Fetch FULL history from database to ensure continuity regardless of frontend state
        const dbHistory = await (0, dbService_1.getChatHistory)(userId, sessionId);
        const historyForGemini = [];
        for (const msg of dbHistory) {
            if (msg.role === 'system') {
                systemInstruction = msg.content;
            }
            else {
                historyForGemini.push({
                    role: msg.role === 'ai' || msg.role === 'model' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
        }
        // Use gemini-2.5-flash as decided previously
        const requestModel = gemini_1.default.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction
        });
        const result = await requestModel.generateContent({ contents: historyForGemini });
        const responseText = result.response.text();
        // Save AI response
        await (0, dbService_1.saveChatMessage)(sessionId, userId, 'ai', responseText);
        return responseText;
    }
}
exports.default = new ChatService();
