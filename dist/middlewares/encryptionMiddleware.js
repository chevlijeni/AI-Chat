"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionMiddleware = encryptionMiddleware;
const crypto_1 = require("../utils/crypto");
/**
 * Middleware to decrypt incoming request bodies and encrypt outgoing responses
 */
function encryptionMiddleware(req, res, next) {
    // 1. Decrypt incoming body if it contains 'data'
    if (req.body && req.body.data && typeof req.body.data === 'string') {
        try {
            const decryptedString = (0, crypto_1.decrypt)(req.body.data);
            req.body = JSON.parse(decryptedString);
        }
        catch (err) {
            console.error('Failed to decrypt request body:', err);
            return res.status(400).json({ error: 'Invalid encrypted payload' });
        }
    }
    // 2. Wrap res.json to encrypt outgoing responses
    const originalJson = res.json;
    res.json = function (body) {
        // Don't encrypt if it's already an error or if we shouldn't (e.g. status 401)
        if (res.statusCode >= 400 || !body) {
            return originalJson.call(this, body);
        }
        try {
            const encryptedData = (0, crypto_1.encrypt)(JSON.stringify(body));
            return originalJson.call(this, { data: encryptedData });
        }
        catch (err) {
            console.error('Failed to encrypt response body:', err);
            return originalJson.call(this, body);
        }
    };
    next();
}
