"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editAndTruncateMessage = exports.getChatHistory = exports.saveChatMessage = exports.deleteChatSession = exports.updateChatSessionTitle = exports.getUserSessions = exports.createChatSession = void 0;
const database_1 = __importDefault(require("../config/database"));
const createChatSession = async (userId, title = 'New Chat') => {
    const [result] = await database_1.default.query('INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)', [userId, title]);
    return result.insertId;
};
exports.createChatSession = createChatSession;
const getUserSessions = async (userId) => {
    const [rows] = await database_1.default.query('SELECT id, title, created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
};
exports.getUserSessions = getUserSessions;
const updateChatSessionTitle = async (sessionId, title) => {
    await database_1.default.query('UPDATE chat_sessions SET title = ? WHERE id = ?', [title, sessionId]);
};
exports.updateChatSessionTitle = updateChatSessionTitle;
const deleteChatSession = async (sessionId, userId) => {
    await database_1.default.query('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
};
exports.deleteChatSession = deleteChatSession;
const saveChatMessage = async (sessionId, userId, role, content) => {
    try {
        await database_1.default.query('INSERT INTO chat_history (session_id, user_id, role, content) VALUES (?, ?, ?, ?)', [sessionId, userId, role, content]);
    }
    catch (error) {
        console.error('Failed to save chat message:', error);
        throw error;
    }
};
exports.saveChatMessage = saveChatMessage;
const getChatHistory = async (userId, sessionId) => {
    try {
        const [rows] = await database_1.default.query('SELECT id, role, content FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC', [userId, sessionId]);
        return rows;
    }
    catch (error) {
        console.error('Failed to retrieve chat history:', error);
        throw error;
    }
};
exports.getChatHistory = getChatHistory;
const editAndTruncateMessage = async (sessionId, userId, messageId, newContent) => {
    // Overwrite the specific message
    await database_1.default.query('UPDATE chat_history SET content = ? WHERE id = ? AND session_id = ? AND user_id = ? AND role = "user"', [newContent, messageId, sessionId, userId]);
    // Wipe out the future path to branch timeline
    await database_1.default.query('DELETE FROM chat_history WHERE id > ? AND session_id = ? AND user_id = ?', [messageId, sessionId, userId]);
};
exports.editAndTruncateMessage = editAndTruncateMessage;
