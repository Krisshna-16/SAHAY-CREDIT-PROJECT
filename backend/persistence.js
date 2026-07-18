const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = path.join(__dirname, 'applications_store.json');
const algorithm = 'aes-256-cbc';

// Read or initialize encryption key
function getSecretKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // If not set, use a fallback for safety in dev (though the user will specify it)
    return crypto.createHash('sha256').update('default-fallback-dev-key').digest();
  }
  return crypto.createHash('sha256').update(key).digest();
}

// Encrypt data using AES-256-CBC
function encrypt(val) {
  if (val === undefined || val === null) return null;
  const text = String(val);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getSecretKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt data using AES-256-CBC
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, getSecretKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    console.error('[Persistence] Decryption failed:', e.message);
    return null;
  }
}

// Compute SHA-256 hash of a string
function sha256(value) {
  if (!value) return null;
  const normalized = value.replace(/\s/g, '').toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Load real applications from persistent store, decrypting income & financial fields
function loadSavedApplications() {
  if (!fs.existsSync(STORE_PATH)) {
    return [];
  }
  try {
    const rawData = fs.readFileSync(STORE_PATH, 'utf8');
    const encryptedApps = JSON.parse(rawData);
    
    return encryptedApps.map(app => {
      // Decrypt income and other financial fields
      const decryptedAmount = decrypt(app.encryptedLoanAmount);
      const decryptedRate = decrypt(app.encryptedSuggestedRate);
      const decryptedIncome = decrypt(app.encryptedIncome);

      return {
        ...app,
        loanAmount: decryptedAmount ? parseFloat(decryptedAmount) : 0,
        suggestedRate: decryptedRate ? parseFloat(decryptedRate) : 18,
        income: decryptedIncome ? parseFloat(decryptedIncome) : 0,
        // Ensure sensitive raw fields are deleted (should not be in file anyway)
        rawAadhaar: undefined,
        rawPan: undefined
      };
    });
  } catch (err) {
    console.error('[Persistence] Error loading applications store:', err);
    return [];
  }
}

// Save a new application record with encryption/hashing applied
function saveApplication(appRecord, rawIdentity = null) {
  let savedList = [];
  if (fs.existsSync(STORE_PATH)) {
    try {
      savedList = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      savedList = [];
    }
  }

  // Extract Aadhaar/PAN from rawIdentity if provided, or preserve from appRecord
  let aadhaarMasked = appRecord.aadhaarMasked || null;
  let aadhaarHash = appRecord.aadhaarHash || null;
  let panMasked = appRecord.panMasked || null;
  let panHash = appRecord.panHash || null;

  if (rawIdentity) {
    const rawNum = rawIdentity.number ? rawIdentity.number.replace(/\s/g, '') : '';
    if (rawIdentity.type === 'aadhaar') {
      aadhaarMasked = 'XXXX-XXXX-' + rawNum.slice(-4);
      aadhaarHash = sha256(rawNum);
    } else if (rawIdentity.type === 'pan') {
      const rawPan = rawNum.toUpperCase();
      panMasked = rawPan.slice(0, 2) + 'XXXXXX' + rawPan.slice(-2);
      panHash = sha256(rawPan);
    }
  }

  // Calculate income
  const incomeVal = appRecord.loanAmount * 2.5;

  // Build the record to save (with sensitive data protected)
  const secureRecord = {
    ...appRecord,
    // Sensitive identity fields
    aadhaarMasked,
    aadhaarHash,
    panMasked,
    panHash,
    // Encrypted financials
    encryptedLoanAmount: encrypt(appRecord.loanAmount),
    encryptedSuggestedRate: encrypt(appRecord.suggestedRate),
    encryptedIncome: encrypt(incomeVal),
    // Remove plaintext fields from disk record
    loanAmount: undefined,
    suggestedRate: undefined,
    rawAadhaar: undefined,
    rawPan: undefined
  };

  const existingIndex = savedList.findIndex(a => a.id === secureRecord.id);
  if (existingIndex >= 0) {
    savedList[existingIndex] = secureRecord;
  } else {
    savedList.push(secureRecord);
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(savedList, null, 2), 'utf8');
}

module.exports = {
  encrypt,
  decrypt,
  sha256,
  loadSavedApplications,
  saveApplication
};
