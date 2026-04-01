"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHistory = exports.saveChatMessage = void 0;
const database_1 = __importDefault(require("../config/database"));
const saveChatMessage = async (userId, role, content) => {
    try {
        await database_1.default.query('INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)', [userId, role, content]);
    }
    catch (error) {
        console.error('Failed to save chat message:', error);
        throw error;
    }
};
exports.saveChatMessage = saveChatMessage;
const getChatHistory = async (userId) => {
    try {
        const [rows] = await database_1.default.query('SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at ASC', [userId]);
        return rows;
    }
    catch (error) {
        console.error('Failed to retrieve chat history:', error);
        throw error;
    }
};
exports.getChatHistory = getChatHistory;
