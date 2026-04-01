import crypto from 'crypto';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'fallback-encryption-secret-32-chars-long';
// Get raw 32-byte hash buffer for maximum compatibility
const key = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();
const algorithm = 'aes-256-cbc';

/**
 * Encrypts a string into a URL-friendly Base64 package
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
}

/**
 * Decrypts Base64 package back into plain text
 */
export function decrypt(text: string): string {
    try {
        const [iv_b64, data_b64] = text.split(':');
        const iv = Buffer.from(iv_b64, 'base64');
        const encryptedText = Buffer.from(data_b64, 'base64');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText as any, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Invalid encrypted data');
    }
}
