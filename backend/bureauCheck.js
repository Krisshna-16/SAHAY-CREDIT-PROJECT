/**
 * SahayCredit Credit Bureau Eligibility Gate (Sandbox Mode)
 * ==========================================================
 * Bureau Eligibility Gate (Simulated Registry) — architecture ready for
 * CIBIL/Experian/Equifax/CRIF API integration.
 *
 * Core premise: SahayCredit serves borrowers with NO existing credit history.
 * This gate checks whether a person already has a formal credit record.
 * If they do, they're routed to "You may already be eligible for traditional
 * credit" instead of proceeding — SahayCredit complements, doesn't compete
 * with, traditional credit bureaus.
 *
 * The sandbox provider uses a small local dataset of synthetic PAN-to-status
 * records. Swapping in a real bureau API is a config change, not a rewrite.
 *
 * All checks are logged to the audit trail.
 */

// ── Simulated Bureau Registry ───────────────────────────────────────────────
// Synthetic records — NOT real people. Used for demo/testing only.
// In production, replace with a real CIBIL/Experian API call.
const SYNTHETIC_BUREAU_REGISTRY = new Map([
  // Borrowers WITH existing credit history (should be routed away)
  ['ABCDE1234F', { hasHistory: true, score: 720, loanCount: 3, name: 'Existing Credit User A' }],
  ['FGHIJ5678K', { hasHistory: true, score: 680, loanCount: 1, name: 'Existing Credit User B' }],
  ['KLMNO9012P', { hasHistory: true, score: 755, loanCount: 5, name: 'Existing Credit User C' }],
  ['PQRST3456U', { hasHistory: true, score: 610, loanCount: 2, name: 'Existing Credit User D' }],
  ['UVWXY7890Z', { hasHistory: true, score: 790, loanCount: 7, name: 'Existing Credit User E' }],
  ['AAAAA1111A', { hasHistory: true, score: 650, loanCount: 1, name: 'Existing Credit User F' }],
  ['BBBBB2222B', { hasHistory: true, score: 700, loanCount: 4, name: 'Existing Credit User G' }],
  ['CCCCC3333C', { hasHistory: true, score: 740, loanCount: 2, name: 'Existing Credit User H' }],
  ['DDDDD4444D', { hasHistory: true, score: 580, loanCount: 1, name: 'Existing Credit User I' }],
  ['EEEEE5555E', { hasHistory: true, score: 810, loanCount: 6, name: 'Existing Credit User J' }],

  // Borrowers WITHOUT credit history (thin-file — should proceed)
  ['THINF0001A', { hasHistory: false, score: null, loanCount: 0, name: 'Thin-File User A' }],
  ['THINF0002B', { hasHistory: false, score: null, loanCount: 0, name: 'Thin-File User B' }],
  ['THINF0003C', { hasHistory: false, score: null, loanCount: 0, name: 'Thin-File User C' }],
  ['THINF0004D', { hasHistory: false, score: null, loanCount: 0, name: 'Thin-File User D' }],
  ['THINF0005E', { hasHistory: false, score: null, loanCount: 0, name: 'Thin-File User E' }],
  // Demo PANs for hackathon walkthrough
  ['RAMKM1234R', { hasHistory: false, score: null, loanCount: 0, name: 'Ramesh Kumar' }],
  ['SUNLM5678S', { hasHistory: false, score: null, loanCount: 0, name: 'Sunita Devi' }],
  ['VIKSH9012V', { hasHistory: false, score: null, loanCount: 0, name: 'Vikram Sharma' }],
  ['PRIYA3456P', { hasHistory: false, score: null, loanCount: 0, name: 'Priya Patel' }],
  ['ARJUN7890A', { hasHistory: false, score: null, loanCount: 0, name: 'Arjun Singh' }],
]);

const bureauAuditLog = [];


// ── Pluggable Provider Interface ────────────────────────────────────────────

/**
 * Check whether a person has existing formal credit history.
 * @param {Object} identity - { pan, name?, dob? }
 * @param {string} provider - 'sandbox' | 'cibil' | 'experian' | 'equifax' | 'crif'
 * @returns {Object} { hasExistingCredit, bureauScore, recommendation, provider, mode }
 */
function checkBureauHistory(identity, provider = 'sandbox') {
  const providers = {
    sandbox: sandboxBureauCheck,
    // Future: cibil: cibilBureauCheck,
    // Future: experian: experianBureauCheck,
  };

  const checkFn = providers[provider];
  if (!checkFn) {
    return {
      hasExistingCredit: false,
      bureauScore: null,
      recommendation: 'proceed',
      details: { error: `Unknown provider: ${provider}` },
      provider,
      mode: 'error'
    };
  }

  return checkFn(identity);
}

// ── Sandbox Provider ────────────────────────────────────────────────────────

function sandboxBureauCheck(identity) {
  const pan = (identity.pan || '').toUpperCase().replace(/\s/g, '');

  // Validate PAN format
  if (!pan || !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) {
    return {
      hasExistingCredit: false,
      bureauScore: null,
      recommendation: 'invalid_pan',
      details: {
        error: 'Invalid PAN format. Expected: XXXXX0000X',
        panProvided: pan ? pan.slice(0, 2) + '***' + pan.slice(-1) : 'none'
      },
      provider: 'sandbox',
      mode: 'sandbox'
    };
  }

  // Look up in synthetic registry
  const record = SYNTHETIC_BUREAU_REGISTRY.get(pan);

  if (record && record.hasHistory) {
    return {
      hasExistingCredit: true,
      bureauScore: record.score,
      loanCount: record.loanCount,
      recommendation: 'route_to_traditional',
      message: 'You may already be eligible for traditional credit products. ' +
               'SahayCredit is designed for borrowers without existing credit history.',
      details: {
        registryMatch: true,
        note: 'Simulated bureau registry (sandbox mode)'
      },
      provider: 'sandbox',
      mode: 'sandbox'
    };
  }

  // No history found (either in registry as thin-file, or not in registry at all)
  // Default assumption for unknown PANs: no existing credit history (thin-file)
  return {
    hasExistingCredit: false,
    bureauScore: null,
    loanCount: 0,
    recommendation: 'proceed',
    message: 'No existing credit bureau record found. You are eligible for SahayCredit alternative credit assessment.',
    details: {
      registryMatch: !!record,
      note: 'Simulated bureau registry (sandbox mode)'
    },
    provider: 'sandbox',
    mode: 'sandbox'
  };
}


// ── Bureau Check with Audit Logging ─────────────────────────────────────────

/**
 * Perform bureau check and log to audit trail.
 */
function performBureauCheck(borrowerId, identity, provider = 'sandbox') {
  const result = checkBureauHistory(identity, provider);

  // Audit log entry (never logs full PAN)
  const maskedPan = identity.pan
    ? identity.pan.slice(0, 2) + '***' + identity.pan.slice(-1)
    : 'none';

  bureauAuditLog.push({
    timestamp: new Date().toISOString(),
    action: 'bureau_check',
    borrowerId,
    outcome: result.hasExistingCredit ? 'found_existing_credit' : 'no_credit_history',
    recommendation: result.recommendation,
    provider: result.provider,
    mode: result.mode,
    panMasked: maskedPan
  });

  return result;
}

/**
 * Get bureau check audit log.
 */
function getBureauAuditLog() {
  return [...bureauAuditLog];
}


module.exports = {
  checkBureauHistory,
  performBureauCheck,
  getBureauAuditLog
};
