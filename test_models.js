const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // There is no direct listModels in the SDK easily accessible without an HTTP call or similar
        // but we can try a few standard ones.
        const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent('Hi');
                console.log(`SUCCESS: ${modelName}`);
            } catch (e) {
                console.log(`FAILED: ${modelName} - ${e.message}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
