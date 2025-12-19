import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * If not set, generates a random key (for development only)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.DISCORD_BOT_TOKEN_ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DISCORD_BOT_TOKEN_ENCRYPTION_KEY must be set in production");
    }
    // Development fallback - WARNING: not secure, use only for testing
    console.warn("⚠️ WARNING: Using default encryption key. Set DISCORD_BOT_TOKEN_ENCRYPTION_KEY in production!");
    return crypto.scryptSync("default-dev-key", "salt", 32);
  }
  
  // Convert hex string to buffer if needed, or use directly if it's a proper key
  if (key.length === 64) {
    // Assume hex encoded 32-byte key
    return Buffer.from(key, "hex");
  }
  
  // Otherwise derive key using scrypt
  return crypto.scryptSync(key, "discord-bot-token-salt", 32);
}

/**
 * Encrypt a Discord bot token
 * @param text - The token to encrypt
 * @returns Encrypted token as hex string
 */
export function encryptToken(text: string): string {
  if (!text) {
    return text;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted
  const result = Buffer.concat([salt, iv, tag, encrypted]);

  return result.toString("hex");
}

/**
 * Decrypt a Discord bot token
 * @param encryptedText - The encrypted token as hex string
 * @returns Decrypted token
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    const data = Buffer.from(encryptedText, "hex");

    // Extract components
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.subarray(ENCRYPTED_POSITION);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    // If decryption fails, return empty string (token might be stored in plain text from before encryption was implemented)
    return "";
  }
}

/**
 * Generate a secure encryption key (for initial setup)
 * Run this once to generate a key for DISCORD_BOT_TOKEN_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}


