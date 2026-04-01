import crypto from 'crypto';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'fallback-encryption-secret-32-chars-long';
// Ensure the key is exactly 32 bytes for AES-256
const key = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest('base64').substr(0, 32);
const algorithm = 'aes-256-cbc';

/**
 * Encrypts a string into a hex-encoded cipher text
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Send IV attached to the result so it can be used for decryption
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts hex-encoded cipher text back into plain text
 */
export function decrypt(text: string): string {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Invalid encrypted data');
    }
}
