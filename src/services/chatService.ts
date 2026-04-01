import genAI from '../config/gemini';
import { saveChatMessage, getChatHistory } from './dbService';

interface ChatMessage {
    role: string;
    content: string;
}

class ChatService {
    public async generateResponse(sessionId: number, userId: number, currentMessages: ChatMessage[]): Promise<string> {
        // Find the latest user message from the request
        const latestUserMsg = currentMessages.slice().reverse().find(m => m.role !== 'system' && m.role !== 'ai' && m.role !== 'model');

        if (latestUserMsg) {
            await saveChatMessage(sessionId, userId, 'user', latestUserMsg.content);
        }

        return this.generateResponseFromDbOnly(sessionId, userId);
    }

    public async generateResponseFromDbOnly(sessionId: number, userId: number): Promise<string> {
        let systemInstruction = "You are Jeni AI, a helpful, intelligent, and friendly AI assistant created by Jeni. Your goal is to assist the user with any questions they have, providing clear, concise, and friendly answers.";

        // Fetch FULL history from database to ensure continuity regardless of frontend state
        const dbHistory = await getChatHistory(userId, sessionId);

        const historyForGemini: any[] = [];

        for (const msg of dbHistory) {
            if (msg.role === 'system') {
                systemInstruction = msg.content;
            } else {
                historyForGemini.push({
                    role: msg.role === 'ai' || msg.role === 'model' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
        }

        // Use gemini-2.5-flash as decided previously
        const requestModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction
        });

        const result = await requestModel.generateContent({ contents: historyForGemini });
        const responseText = result.response.text();

        // Save AI response
        await saveChatMessage(sessionId, userId, 'ai', responseText);

        return responseText;
    }
}

export default new ChatService();
