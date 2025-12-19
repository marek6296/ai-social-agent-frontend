import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.DISCORD_BOT_TOKEN_ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DISCORD_BOT_TOKEN_ENCRYPTION_KEY must be set in production');
    }
    console.warn('⚠️ WARNING: Using default encryption key. Set DISCORD_BOT_TOKEN_ENCRYPTION_KEY in production!');
    return crypto.scryptSync('default-dev-key', 'salt', 32);
  }
  
  // Convert hex string to buffer if needed
  if (key.length === 64) {
    // Assume hex encoded 32-byte key
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise derive key using scrypt
  return crypto.scryptSync(key, 'discord-bot-token-salt', 32);
}

/**
 * Decrypt a Discord bot token
 * @param encryptedText - The encrypted token as hex string or plain text
 * @returns Decrypted token or original text if decryption fails or not encrypted
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  // Check if text looks like a Discord bot token (plain text)
  // Discord tokens contain dots and are 50-100 characters
  const looksLikeDiscordToken = encryptedText.includes('.') && 
                                 encryptedText.length >= 50 && 
                                 encryptedText.length <= 100 &&
                                 /^[A-Za-z0-9._-]+$/.test(encryptedText);
  
  if (looksLikeDiscordToken) {
    // Already looks like a plain text Discord token, return as-is
    return encryptedText;
  }

  // Check if text looks like encrypted data (hex string, long enough)
  // Encrypted data should be at least ENCRYPTED_POSITION bytes = 96 bytes = 192 hex chars
  const isLikelyEncrypted = encryptedText.length > 192 && /^[0-9a-fA-F]+$/.test(encryptedText);
  
  if (!isLikelyEncrypted) {
    // Doesn't look like encrypted data, probably plain text token (even if unusual format)
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

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const decryptedText = decrypted.toString('utf8');

    // Verify decrypted text looks like a Discord token
    if (decryptedText.includes('.') && 
        decryptedText.length >= 50 && 
        decryptedText.length <= 100 &&
        /^[A-Za-z0-9._-]+$/.test(decryptedText)) {
      return decryptedText;
    } else {
      // Decryption succeeded but result doesn't look like a valid Discord token
      console.warn('⚠️ Decryption succeeded but result does not look like valid Discord token');
      return encryptedText; // Return original encrypted text
    }
  } catch (error) {
    // Decryption failed - token might be plain text (not encrypted)
    console.log('⚠️ Decryption failed, will try using as plain text token');
    return encryptedText;
  }
}

