/**
 * SahayCredit OTP Verification Module
 * ======================================
 * Pluggable OTP delivery with email as the working default provider.
 * SMS path is documented as a ready-to-configure alternative.
 *
 * Security:
 *   - Time-limited: 5 minutes
 *   - Single-use: consumed on successful verification
 *   - Rate-limited: max 3 OTP requests per destination per 10 minutes
 *   - Never logged in plaintext to any persistent log
 *   - Stored as HMAC hash, not plaintext
 *
 * Provider interface:
 *   sendOtp(destination, channel) -> { success, messageId?, error? }
 *   verifyOtp(destination, code)  -> { success, error? }
 */

const crypto = require('crypto');

// ── OTP Configuration ──────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;           // 5 minutes
const OTP_MAX_ATTEMPTS = 3;                   // Max verification attempts per OTP
const OTP_RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const OTP_RATE_LIMIT_MAX = 3;                  // Max 3 OTPs per destination per window
const OTP_HMAC_SECRET = process.env.OTP_HMAC_SECRET || crypto.randomBytes(32).toString('hex');

// ── In-Memory OTP Store ────────────────────────────────────────────────────
// In production: Redis or encrypted database with TTL
const otpStore = new Map();       // destination -> { hash, expiresAt, attempts, createdAt }
const rateLimitStore = new Map(); // destination -> [{ timestamp }]
const otpAuditLog = [];

// ── OTP Generation ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random numeric OTP.
 */
function generateOtp() {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0);
  return String(num % Math.pow(10, OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

/**
 * Hash OTP for storage (never store plaintext).
 */
function hashOtp(otp) {
  return crypto.createHmac('sha256', OTP_HMAC_SECRET).update(otp).digest('hex');
}


// ── Rate Limiting ──────────────────────────────────────────────────────────

function checkRateLimit(destination) {
  const now = Date.now();
  const key = destination.toLowerCase();

  let history = rateLimitStore.get(key) || [];
  // Remove entries outside window
  history = history.filter(t => now - t < OTP_RATE_LIMIT_WINDOW);
  rateLimitStore.set(key, history);

  if (history.length >= OTP_RATE_LIMIT_MAX) {
    const oldestInWindow = Math.min(...history);
    const retryAfter = Math.ceil((oldestInWindow + OTP_RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

function recordOtpSend(destination) {
  const key = destination.toLowerCase();
  const history = rateLimitStore.get(key) || [];
  history.push(Date.now());
  rateLimitStore.set(key, history);
}


// ── Pluggable Provider Interface ────────────────────────────────────────────

/**
 * Send OTP to a destination via the specified channel.
 * @param {string} destination - Email address or phone number
 * @param {string} channel - 'email' | 'sms'
 * @returns {Object} { success, messageId?, error?, retryAfter? }
 */
function sendOtp(destination, channel = 'email') {
  // Rate limit check
  const rateCheck = checkRateLimit(destination);
  if (!rateCheck.allowed) {
    otpAuditLog.push({
      timestamp: new Date().toISOString(),
      action: 'otp_send_rate_limited',
      destination: maskDestination(destination),
      channel
    });
    return {
      success: false,
      error: 'Too many OTP requests. Please try again later.',
      retryAfter: rateCheck.retryAfter
    };
  }

  // Generate OTP
  const otp = generateOtp();
  const hash = hashOtp(otp);

  // Store hashed OTP
  otpStore.set(destination.toLowerCase(), {
    hash,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    createdAt: Date.now()
  });

  recordOtpSend(destination);

  // Dispatch via channel
  const providers = {
    email: sendViaEmail,
    sms: sendViaSms,
  };

  const sendFn = providers[channel];
  if (!sendFn) {
    return { success: false, error: `Unknown channel: ${channel}` };
  }

  const result = sendFn(destination, otp);

  // Audit log (NEVER log the OTP itself)
  otpAuditLog.push({
    timestamp: new Date().toISOString(),
    action: 'otp_sent',
    destination: maskDestination(destination),
    channel,
    success: result.success,
    // OTP is NOT logged here — only the hash exists in otpStore
  });

  return result;
}

/**
 * Verify an OTP code.
 * @param {string} destination - Email address or phone number
 * @param {string} code - OTP code entered by user
 * @returns {Object} { success, error? }
 */
function verifyOtp(destination, code) {
  const key = destination.toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    otpAuditLog.push({
      timestamp: new Date().toISOString(),
      action: 'otp_verify_failed',
      destination: maskDestination(destination),
      reason: 'no_otp_found'
    });
    return { success: false, error: 'No OTP found. Please request a new one.' };
  }

  // Check expiry
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    otpAuditLog.push({
      timestamp: new Date().toISOString(),
      action: 'otp_verify_failed',
      destination: maskDestination(destination),
      reason: 'expired'
    });
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Check max attempts
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(key);
    otpAuditLog.push({
      timestamp: new Date().toISOString(),
      action: 'otp_verify_failed',
      destination: maskDestination(destination),
      reason: 'max_attempts_exceeded'
    });
    return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
  }

  // Verify hash
  const codeHash = hashOtp(code);
  if (codeHash !== record.hash) {
    record.attempts++;
    otpAuditLog.push({
      timestamp: new Date().toISOString(),
      action: 'otp_verify_failed',
      destination: maskDestination(destination),
      reason: 'wrong_code',
      attemptsUsed: record.attempts
    });
    return {
      success: false,
      error: `Invalid OTP. ${OTP_MAX_ATTEMPTS - record.attempts} attempt(s) remaining.`
    };
  }

  // Success — consume the OTP (single-use)
  otpStore.delete(key);
  otpAuditLog.push({
    timestamp: new Date().toISOString(),
    action: 'otp_verified',
    destination: maskDestination(destination)
  });

  return { success: true };
}


// ── Email Provider (Working Default) ────────────────────────────────────────
// Uses console logging as the delivery mechanism in development.
// In production, configure nodemailer with a real SMTP provider.

function sendViaEmail(email, otp) {
  // In a real deployment, use nodemailer:
  //   const transporter = nodemailer.createTransport({ ... });
  //   await transporter.sendMail({ to: email, subject: 'SahayCredit OTP', text: `Your OTP: ${otp}` });

  // For development/demo: log the OTP to console only (not to persistent logs)
  console.log(`[OTP-DEV] OTP for ${maskDestination(email)}: ${otp} (console-only, not persisted)`);

  return {
    success: true,
    messageId: `dev-${Date.now()}`,
    channel: 'email',
    mode: 'development',
    note: 'OTP printed to server console (development mode). Configure SMTP for production.'
  };
}


// ── SMS Provider (Documented, Ready to Configure) ───────────────────────────
// SMS delivery requires a paid gateway (Twilio, MSG91, etc.) with API keys.
// This function documents the integration point.

function sendViaSms(phone, otp) {
  // SMS integration point:
  //
  // Twilio example:
  //   const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
  //   await client.messages.create({
  //     body: `Your SahayCredit verification code: ${otp}`,
  //     from: process.env.TWILIO_PHONE,
  //     to: phone
  //   });
  //
  // MSG91 example:
  //   const response = await fetch('https://api.msg91.com/api/v5/otp', {
  //     method: 'POST',
  //     headers: { 'authkey': process.env.MSG91_KEY },
  //     body: JSON.stringify({ mobile: phone, otp })
  //   });

  console.log(`[OTP-DEV] SMS OTP for ${maskDestination(phone)}: ${otp} (SMS not configured)`);

  return {
    success: true,
    messageId: `sms-dev-${Date.now()}`,
    channel: 'sms',
    mode: 'development',
    note: 'SMS gateway not configured. Set TWILIO_SID/TWILIO_AUTH or MSG91_KEY for production.'
  };
}


// ── Helpers ─────────────────────────────────────────────────────────────────

function maskDestination(dest) {
  if (!dest) return '***';
  if (dest.includes('@')) {
    const [local, domain] = dest.split('@');
    return local.slice(0, 2) + '***@' + domain;
  }
  // Phone number
  return dest.slice(0, 3) + '****' + dest.slice(-2);
}

function getOtpAuditLog() {
  return [...otpAuditLog];
}


module.exports = {
  sendOtp,
  verifyOtp,
  getOtpAuditLog,
  maskDestination
};
