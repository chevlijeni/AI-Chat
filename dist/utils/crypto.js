"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'fallback-encryption-secret-32-chars-long';
// Ensure the key is exactly 32 bytes for AES-256
const key = crypto_1.default.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest('base64').substr(0, 32);
const algorithm = 'aes-256-cbc';
/**
 * Encrypts a string into a hex-encoded cipher text
 */
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Send IV attached to the result so it can be used for decryption
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
/**
 * Decrypts hex-encoded cipher text back into plain text
 */
function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto_1.default.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Invalid encrypted data');
    }
}
