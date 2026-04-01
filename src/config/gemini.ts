import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(apiKey);

export default genAI;
