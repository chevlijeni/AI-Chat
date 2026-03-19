const genAI = require('../config/gemini');

class ChatService {
    async generateResponse(messages) {
        let systemInstruction = "You are Jeni AI, a helpful, intelligent, and friendly AI assistant created by Jeni. Your goal is to assist the user with any questions they have, providing clear, concise, and friendly answers.";
        const history = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemInstruction = msg.content;
            } else {
                history.push({
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

        const result = await requestModel.generateContent({ contents: history });
        return result.response.text();
    }
}

module.exports = new ChatService();
