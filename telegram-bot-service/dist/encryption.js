"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptToken = decryptToken;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;
/**
 * Get encryption key from environment variable
 */
function getEncryptionKey() {
    const key = process.env.TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY || process.env.DISCORD_BOT_TOKEN_ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY or DISCORD_BOT_TOKEN_ENCRYPTION_KEY must be set in production');
        }
        console.warn('⚠️ WARNING: Using default encryption key. Set TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY in production!');
        return crypto_1.default.scryptSync('default-dev-key', 'salt', 32);
    }
    // Convert hex string to buffer if needed
    if (key.length === 64) {
        // Assume hex encoded 32-byte key
        return Buffer.from(key, 'hex');
    }
    // Otherwise derive key using scrypt
    return crypto_1.default.scryptSync(key, 'telegram-bot-token-salt', 32);
}
/**
 * Decrypt a Telegram bot token
 * @param encryptedText - The encrypted token as hex string
 * @returns Decrypted token or original text if decryption fails
 */
function decryptToken(encryptedText) {
    if (!encryptedText) {
        return encryptedText;
    }
    // Check if text looks like a Telegram bot token (plain text)
    // Telegram tokens have format: NNNNNNNNNN:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    // They're usually 45-50 characters long and contain a colon
    const looksLikeTelegramToken = encryptedText.includes(':') &&
        encryptedText.length >= 40 &&
        encryptedText.length <= 60 &&
        /^[0-9]+:[A-Za-z0-9_-]+$/.test(encryptedText);
    if (looksLikeTelegramToken) {
        // Already looks like a plain text Telegram token, return as-is
        return encryptedText;
    }
    // Check if text looks like encrypted data (hex string, long enough)
    // Encrypted data should be at least ENCRYPTED_POSITION bytes = 96 bytes = 192 hex chars
    const isLikelyEncrypted = encryptedText.length > 192 && /^[0-9a-fA-F]+$/.test(encryptedText);
    if (!isLikelyEncrypted) {
        // Doesn't look like encrypted data, probably plain text token
        return encryptedText;
    }
    // Try to decrypt (it's likely encrypted)
    try {
        const key = getEncryptionKey();
        const data = Buffer.from(encryptedText, 'hex');
        // Check if data is long enough
        if (data.length < ENCRYPTED_POSITION) {
            // Too short to be encrypted, probably plain text
            return encryptedText;
        }
        // Extract components
        const salt = data.subarray(0, SALT_LENGTH);
        const iv = data.subarray(SALT_LENGTH, TAG_POSITION);
        const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
        const encrypted = data.subarray(ENCRYPTED_POSITION);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        const decryptedText = decrypted.toString('utf8');
        // Verify decrypted text looks like a Telegram token
        if (decryptedText.includes(':') &&
            decryptedText.length >= 40 &&
            decryptedText.length <= 60 &&
            /^[0-9]+:[A-Za-z0-9_-]+$/.test(decryptedText)) {
            return decryptedText;
        }
        else {
            // Decryption succeeded but result doesn't look like a valid Telegram token
            console.warn('⚠️ Decryption succeeded but result does not look like valid Telegram token');
            return encryptedText;
        }
    }
    catch (error) {
        // Decryption failed - token might be plain text or encrypted with different key
        console.log('⚠️ Decryption failed, will try using as plain text token');
        return encryptedText;
    }
}
//# sourceMappingURL=encryption.js.map