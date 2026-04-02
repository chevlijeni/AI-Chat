"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'fallback-encryption-secret-32-chars-long';
// Get raw 32-byte hash buffer for maximum compatibility
const key = crypto_1.default.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();
const algorithm = 'aes-256-cbc';
/**
 * Encrypts a string into a URL-friendly Base64 package
 */
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
}
/**
 * Decrypts Base64 package back into plain text
 */
function decrypt(text) {
    try {
        const [iv_b64, data_b64] = text.split(':');
        const iv = Buffer.from(iv_b64, 'base64');
        const encryptedText = Buffer.from(data_b64, 'base64');
        const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Invalid encrypted data');
    }
}
