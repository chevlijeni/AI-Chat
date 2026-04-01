import { Response } from 'express';

export function handleGeminiError(error: any, res: Response): void {
    console.error('Gemini Error:', error);
    let errorMsg = error.message || 'Failed to fetch response from Gemini';

    if (errorMsg.includes('429') || errorMsg.includes('Quota exceeded')) {
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
