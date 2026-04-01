import { Request, Response } from 'express';
import chatService from '../services/chatService';
import { handleGeminiError } from '../utils/errorHandler';
// Dynamic import for dbService to prevent circular dependencies
import * as dbService from '../services/dbService';

class ChatController {
    public async createSession(req: Request, res: Response): Promise<void> {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = (req.user as any).id;
            const { title } = req.body;
            const sessionId = await dbService.createChatSession(userId, title || 'New Chat');
            res.json({ sessionId });
        } catch (error) {
            console.error('Error creating session:', error);
            res.status(500).json({ error: 'Failed to create chat session' });
        }
    }

    public async getSessions(req: Request, res: Response): Promise<void> {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = (req.user as any).id;
            const sessions = await dbService.getUserSessions(userId);
            res.json({ sessions });
        } catch (error) {
            console.error('Error fetching sessions:', error);
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    }

    public async getHistory(req: Request, res: Response): Promise<void> {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const userId = (req.user as any).id;
            const sessionId = parseInt(req.params.sessionId as string, 10);

            if (isNaN(sessionId)) {
                res.status(400).json({ error: 'Invalid session ID' });
                return;
            }

            const history = await dbService.getChatHistory(userId, sessionId);
            res.json({ history });
        } catch (error) {
            console.error('Error fetching history:', error);
            res.status(500).json({ error: 'Failed to fetch chat history' });
        }
    }

    public async deleteSession(req: Request, res: Response): Promise<void> {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const userId = (req.user as any).id;
            const sessionId = parseInt(req.params.sessionId as string, 10);
            if (isNaN(sessionId)) {
                res.status(400).json({ error: 'Invalid session ID' });
                return;
            }
            await dbService.deleteChatSession(sessionId, userId);
            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting session:', error);
            res.status(500).json({ error: 'Failed to delete chat session' });
        }
    }

    public async editAndResend(req: Request, res: Response): Promise<void> {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const userId = (req.user as any).id;
            const sessionId = parseInt(req.params.sessionId as string, 10);
            const messageId = parseInt(req.params.messageId as string, 10);
            const { newContent } = req.body;

            if (isNaN(sessionId) || isNaN(messageId) || !newContent) {
                res.status(400).json({ error: 'Invalid inputs' });
                return;
            }

            // 1. Truncate and update
            await dbService.editAndTruncateMessage(sessionId, userId, messageId, newContent);

            // 2. Resend the history to Gemini
            const responseText = await chatService.generateResponseFromDbOnly(sessionId, userId);

            // Return the full history so frontend can quickly repaint
            const newHistory = await dbService.getChatHistory(userId, sessionId);
            res.json({ message: { role: 'ai', content: responseText }, fullHistory: newHistory });

        } catch (error) {
            handleGeminiError(error, res);
        }
    }

    public async handleChat(req: Request, res: Response): Promise<void> {
        try {
            if (!req.isAuthenticated()) {
                res.status(401).json({ error: 'Unauthorized. Please login to chat.' });
                return;
            }

            const { messages, sessionId } = req.body;
            const userId = (req.user as any).id;

            if (!messages || !Array.isArray(messages)) {
                res.status(400).json({ error: 'Messages array is required' });
                return;
            }

            if (!sessionId) {
                res.status(400).json({ error: 'Session ID is required' });
                return;
            }

            const responseText = await chatService.generateResponse(sessionId, userId, messages);

            // Optionally rename the chat if it's the first message
            if (messages.filter(m => m.role === 'user').length === 1) {
                const title = messages.find(m => m.role === 'user')?.content.substring(0, 30) + '...';
                if (title) await dbService.updateChatSessionTitle(sessionId, title);
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

        } catch (error) {
            handleGeminiError(error, res);
        }
    }
}

export default new ChatController();
