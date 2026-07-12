/**
 * SahayCredit Encryption Module
 * ================================
 * AES-256-GCM encryption for sensitive data at rest.
 * Used for KYC documents, consent records, and raw alt-data.
 *
 * Key management: via ENCRYPTION_KEY environment variable.
 * In production: use AWS KMS, GCP Cloud KMS, or HashiCorp Vault.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive a 32-byte key from the environment variable or a default
// WARNING: The default key is for development only. In production,
// ENCRYPTION_KEY must be set via environment variable.
function getKey() {
  const keySource = process.env.ENCRYPTION_KEY || 'sahaycredit-dev-key-change-in-production';
  return crypto.createHash('sha256').update(keySource).digest();
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted string in format: iv:authTag:ciphertext (hex-encoded)
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM encrypted string.
 * @param {string} encryptedString - In format: iv:authTag:ciphertext (hex-encoded)
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedString) {
  const [ivHex, authTagHex, ciphertext] = encryptedString.split(':');
  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error('Invalid encrypted string format');
  }

  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt an object (serializes to JSON first).
 */
function encryptObject(obj) {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt and parse a JSON object.
 */
function decryptObject(encryptedString) {
  return JSON.parse(decrypt(encryptedString));
}

/**
 * Hash sensitive data for lookup (one-way, not reversible).
 * Used for indexing encrypted records without decrypting them.
 */
function hashForLookup(data) {
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}


module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashForLookup
};
