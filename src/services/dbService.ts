import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export const createChatSession = async (userId: number, title: string = 'New Chat'): Promise<number> => {
    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
        [userId, title]
    );
    return result.insertId;
};

export const getUserSessions = async (userId: number): Promise<{ id: number; title: string; created_at: Date }[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, title, created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
    );
    return rows as any;
};

export const updateChatSessionTitle = async (sessionId: number, title: string): Promise<void> => {
    await pool.query('UPDATE chat_sessions SET title = ? WHERE id = ?', [title, sessionId]);
};

export const deleteChatSession = async (sessionId: number, userId: number): Promise<void> => {
    await pool.query('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
};

export const saveChatMessage = async (sessionId: number, userId: number, role: 'user' | 'ai' | 'system', content: string): Promise<void> => {
    try {
        await pool.query(
            'INSERT INTO chat_history (session_id, user_id, role, content) VALUES (?, ?, ?, ?)',
            [sessionId, userId, role, content]
        );
    } catch (error) {
        console.error('Failed to save chat message:', error);
        throw error;
    }
};

export const getChatHistory = async (userId: number, sessionId: number): Promise<{ id: number; role: string; content: string }[]> => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, role, content FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC',
            [userId, sessionId]
        );
        return rows as { id: number; role: string; content: string }[];
    } catch (error) {
        console.error('Failed to retrieve chat history:', error);
        throw error;
    }
};

export const editAndTruncateMessage = async (sessionId: number, userId: number, messageId: number, newContent: string): Promise<void> => {
    // Overwrite the specific message
    await pool.query(
        'UPDATE chat_history SET content = ? WHERE id = ? AND session_id = ? AND user_id = ? AND role = "user"',
        [newContent, messageId, sessionId, userId]
    );

    // Wipe out the future path to branch timeline
    await pool.query(
        'DELETE FROM chat_history WHERE id > ? AND session_id = ? AND user_id = ?',
        [messageId, sessionId, userId]
    );
};
