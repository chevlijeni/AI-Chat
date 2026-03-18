const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
    console.log(`\nTesting ${modelName}...`);
    try {
        const requestModel = genAI.getGenerativeModel({ model: modelName });
        const result = await requestModel.generateContent({ contents: [{role: 'user', parts: [{text: "Hello"}]}]});
        console.log(`SUCCESS [${modelName}]:`, result.response.text());
    } catch (error) {
        console.error(`ERROR [${modelName}]:`, error.message);
    }
}

async function run() {
    await testModel('gemini-2.0-flash-lite');
    await testModel('gemini-2.5-flash');
    await testModel('gemini-1.5-flash');
}
run();
