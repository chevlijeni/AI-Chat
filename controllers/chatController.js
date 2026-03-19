const chatService = require('../services/chatService');
const { handleGeminiError } = require('../utils/errorHandler');

class ChatController {
    async handleChat(req, res) {
        try {
            const { messages } = req.body;

            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ error: 'Messages array is required' });
            }

            const responseText = await chatService.generateResponse(messages);

            res.json({
                message: {
                    role: 'ai',
                    content: responseText
                }
            });
        } catch (error) {
            handleGeminiError(error, res);
        }
    }
}

module.exports = new ChatController();
