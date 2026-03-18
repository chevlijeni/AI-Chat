const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;

    try {
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

        // Initialize the model for this request to pass system instructions
        const requestModel = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-lite',
            systemInstruction
        });

        // Pass the entire parsed chat history
        const result = await requestModel.generateContent({ contents: history });
        const responseText = result.response.text();

        res.json({
            message: {
                role: 'ai',
                content: responseText
            }
        });
    } catch (error) {
        console.error('Gemini Error:', error);
        let errorMsg = error.message || 'Failed to fetch response from Gemini';

        if (errorMsg.includes('429') || errorMsg.includes('Quota exceeded')) {
            // Check if there is a specific retry delay that implies a 1-minute timeout
            if (errorMsg.includes('retryDelay') && !errorMsg.includes('retryDelay":"0s"')) {
                errorMsg = "⏳ **Rate Limit Reached**: You are typing too fast for the Free Tier! Please wait 1 minute before sending your next message.";
            } else {
                errorMsg = "🛑 **API Quota Reached**: You have exhausted your Gemini AI Free Tier quota. Please wait a minute, or if you've been chatting all day, you may need to wait until tomorrow!";
            }
        } else if (errorMsg.includes('503')) {
            errorMsg = "⚠️ **High Demand**: Google's AI servers are currently experiencing high traffic. Please try again in a few moments.";
        }

        res.status(500).json({ error: errorMsg });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
