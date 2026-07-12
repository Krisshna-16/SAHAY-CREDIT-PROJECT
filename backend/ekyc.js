/**
 * SahayCredit eKYC Module (Sandbox Mode)
 * ========================================
 * eKYC (Sandbox Mode) — architecture ready for DigiLocker/UIDAI integration.
 *
 * This module provides a pluggable identity verification interface.
 * The sandbox provider performs realistic checks that can be done without
 * a licensed UIDAI/DigiLocker API:
 *   - Document format/quality validation
 *   - Basic ID number pattern matching (Aadhaar 12-digit, PAN XXXXX0000X)
 *   - Name/DOB field extraction simulation
 *   - Simulated match/no-match with confidence score
 *
 * Production integration:
 *   Replace the sandbox provider with a real provider (e.g., DigiLocker,
 *   UIDAI eKYC, or a KYC-as-a-service provider like Signzy/Hyperverge)
 *   by implementing the same verifyIdentity() interface.
 *
 * Per-borrower eKYC status: verified | pending | failed
 * All operations logged to audit trail.
 */

const crypto = require('crypto');

// ── In-Memory eKYC Store ────────────────────────────────────────────────────
// In production: encrypted database table
const ekycStore = new Map();
const ekycAuditLog = [];

// ── Pluggable Provider Interface ────────────────────────────────────────────

/**
 * Verify identity using the configured provider.
 * @param {Object} documentData - { type, number, name, dob, selfieBase64? }
 * @param {string} provider - Provider name: 'sandbox' | 'digilocker' | 'uidai'
 * @returns {Object} { verified, confidence, details, provider, mode }
 */
function verifyIdentity(documentData, provider = 'sandbox') {
  const providers = {
    sandbox: sandboxVerify,
    // Future: digilocker: digiLockerVerify,
    // Future: uidai: uidaiVerify,
  };

  const verifyFn = providers[provider];
  if (!verifyFn) {
    return {
      verified: false,
      confidence: 0,
      details: { error: `Unknown provider: ${provider}` },
      provider,
      mode: 'error'
    };
  }

  return verifyFn(documentData);
}

// ── Sandbox Provider ────────────────────────────────────────────────────────

/**
 * Sandbox eKYC provider — performs realistic validation checks without
 * calling any external API. Clearly labeled as sandbox mode.
 */
function sandboxVerify(data) {
  const checks = [];
  let confidence = 0;

  // 1. Document type validation
  const validTypes = ['aadhaar', 'pan', 'voter_id', 'passport', 'driving_license'];
  if (!data.type || !validTypes.includes(data.type.toLowerCase())) {
    return {
      verified: false,
      confidence: 0,
      details: {
        error: `Invalid document type. Accepted: ${validTypes.join(', ')}`,
        checks: [{ check: 'document_type', passed: false }]
      },
      provider: 'sandbox',
      mode: 'sandbox'
    };
  }
  checks.push({ check: 'document_type', passed: true });
  confidence += 15;

  // 2. ID number pattern validation
  const patterns = {
    aadhaar: /^\d{12}$/,
    pan: /^[A-Z]{5}\d{4}[A-Z]$/,
    voter_id: /^[A-Z]{3}\d{7}$/,
    passport: /^[A-Z]\d{7}$/,
    driving_license: /^[A-Z]{2}\d{2}\s?\d{11}$/
  };

  const pattern = patterns[data.type.toLowerCase()];
  const numberValid = pattern && pattern.test((data.number || '').toUpperCase().replace(/\s/g, ''));
  checks.push({ check: 'id_number_format', passed: numberValid, pattern: pattern?.source });
  if (numberValid) confidence += 25;

  // 3. Name validation (non-empty, reasonable length)
  const nameValid = data.name && data.name.trim().length >= 2 && data.name.trim().length <= 100;
  checks.push({ check: 'name_present', passed: nameValid });
  if (nameValid) confidence += 15;

  // 4. DOB validation (valid date, age 18-100)
  let dobValid = false;
  if (data.dob) {
    const dob = new Date(data.dob);
    if (!isNaN(dob.getTime())) {
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      dobValid = age >= 18 && age <= 100;
    }
  }
  checks.push({ check: 'dob_valid', passed: dobValid });
  if (dobValid) confidence += 15;

  // 5. Selfie/liveness placeholder
  const selfieProvided = !!data.selfieBase64;
  checks.push({ check: 'selfie_provided', passed: selfieProvided, note: 'Liveness check requires real provider' });
  if (selfieProvided) confidence += 10;

  // 6. Simulated cross-reference check (sandbox: always passes if format checks pass)
  const crossRefPassed = numberValid && nameValid && dobValid;
  checks.push({ check: 'cross_reference', passed: crossRefPassed, note: 'Simulated — real check requires UIDAI/DigiLocker API' });
  if (crossRefPassed) confidence += 20;

  const verified = confidence >= 70; // Need at least 70% confidence

  return {
    verified,
    confidence,
    details: {
      checks,
      extractedFields: {
        name: nameValid ? data.name.trim() : null,
        dob: dobValid ? data.dob : null,
        documentType: data.type,
        documentNumber: numberValid ? maskId(data.number, data.type) : null
      }
    },
    provider: 'sandbox',
    mode: 'sandbox'
  };
}

/**
 * Mask sensitive ID numbers for logging (show first/last few chars only)
 */
function maskId(number, type) {
  if (!number) return null;
  const n = number.replace(/\s/g, '');
  if (type === 'aadhaar' && n.length === 12) {
    return 'XXXX-XXXX-' + n.slice(-4);
  }
  if (n.length > 4) {
    return n.slice(0, 2) + 'X'.repeat(n.length - 4) + n.slice(-2);
  }
  return 'XXXX';
}


// ── eKYC Status Management ──────────────────────────────────────────────────

/**
 * Process eKYC verification for a borrower.
 * Stores result and logs to audit trail.
 */
function processEkyc(borrowerId, documentData, provider = 'sandbox') {
  const result = verifyIdentity(documentData, provider);

  const status = result.verified ? 'verified' : 'failed';
  const record = {
    borrowerId,
    status,
    confidence: result.confidence,
    provider: result.provider,
    mode: result.mode,
    documentType: documentData.type,
    documentNumberMasked: result.details?.extractedFields?.documentNumber || 'N/A',
    verifiedAt: result.verified ? new Date().toISOString() : null,
    lastAttempt: new Date().toISOString(),
    attempts: (ekycStore.get(borrowerId)?.attempts || 0) + 1
  };

  ekycStore.set(borrowerId, record);

  // Audit log entry (never logs raw document numbers)
  ekycAuditLog.push({
    timestamp: new Date().toISOString(),
    action: 'ekyc_verification',
    borrowerId,
    outcome: status,
    confidence: result.confidence,
    provider: result.provider,
    mode: result.mode,
    documentType: documentData.type,
    attempt: record.attempts
  });

  return {
    ...result,
    ekycStatus: status,
    attempts: record.attempts
  };
}

/**
 * Get eKYC status for a borrower.
 */
function getEkycStatus(borrowerId) {
  const record = ekycStore.get(borrowerId);
  if (!record) {
    return { status: 'pending', message: 'eKYC verification not yet initiated' };
  }
  return {
    status: record.status,
    confidence: record.confidence,
    provider: record.provider,
    mode: record.mode,
    documentType: record.documentType,
    verifiedAt: record.verifiedAt,
    lastAttempt: record.lastAttempt,
    attempts: record.attempts
  };
}

/**
 * Check if borrower has passed eKYC (gate for loan progression).
 */
function isEkycVerified(borrowerId) {
  const record = ekycStore.get(borrowerId);
  return record?.status === 'verified';
}

/**
 * Get eKYC audit log entries.
 */
function getEkycAuditLog() {
  return [...ekycAuditLog];
}


module.exports = {
  verifyIdentity,
  processEkyc,
  getEkycStatus,
  isEkycVerified,
  getEkycAuditLog
};
