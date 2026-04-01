import { Request, Response, NextFunction } from 'express';
import { encrypt, decrypt } from '../utils/crypto';

/**
 * Middleware to decrypt incoming request bodies and encrypt outgoing responses
 */
export function encryptionMiddleware(req: Request, res: Response, next: NextFunction) {
    // 1. Decrypt incoming body if it contains 'data'
    if (req.body && req.body.data && typeof req.body.data === 'string') {
        try {
            const decryptedString = decrypt(req.body.data);
            req.body = JSON.parse(decryptedString);
        } catch (err) {
            console.error('Failed to decrypt request body:', err);
            return res.status(400).json({ error: 'Invalid encrypted payload' });
        }
    }

    // 2. Wrap res.json to encrypt outgoing responses
    const originalJson = res.json;
    res.json = function (body: any): Response {
        // Don't encrypt if it's already an error or if we shouldn't (e.g. status 401)
        if (res.statusCode >= 400 || !body) {
            return originalJson.call(this, body);
        }

        try {
            const encryptedData = encrypt(JSON.stringify(body));
            return originalJson.call(this, { data: encryptedData });
        } catch (err) {
            console.error('Failed to encrypt response body:', err);
            return originalJson.call(this, body);
        }
    };

    next();
}
