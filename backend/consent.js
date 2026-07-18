/**
 * SahayCredit Consent Management Module
 * =======================================
 *
 * HOW THIS WORKS (plain language, suitable for demo explanation):
 * ---------------------------------------------------------------
 * Before SahayCredit can use any alternative data source (like e-commerce
 * purchase history or merchant ratings), the borrower must explicitly grant
 * consent for that specific source. Each consent record tracks:
 *   - Which borrower gave consent
 *   - Which data source they consented to
 *   - When they granted it
 *   - A plain-language purpose string explaining why the data is collected
 *   - Whether/when they revoked it
 *
 * No data source module is allowed to fetch or compute features without
 * first checking for an active consent record. Revoking consent immediately
 * stops that source from contributing to future score calculations.
 *
 * All consent events (grants, revocations, and data fetches) are recorded
 * in an audit log for regulatory compliance.
 */

// ── In-Memory Consent Store ────────────────────────────────────────────────
// In production, this would be a database table with encryption at rest.
// For the hackathon demo, we use an in-memory Map keyed by "borrowerId:sourceId".

const consentStore = new Map();
const auditLog = [];

// Known data sources and their purpose strings
const DATA_SOURCES = {
  ecommerce: {
    id: 'ecommerce',
    name: 'E-Commerce Purchase History',
    purposeEn: 'Share e-commerce purchase history to strengthen your credit assessment',
    purposeHi: 'अपनी क्रेडिट मूल्यांकन को मजबूत करने के लिए ई-कॉमर्स खरीद इतिहास साझा करें',
    description: 'Analyzes purchase frequency, order value stability, category diversity, and return/dispute patterns to supplement the core credit score.'
  },
  merchantRatings: {
    id: 'merchantRatings',
    name: 'Business/Merchant Ratings',
    purposeEn: 'Share business/merchant ratings to strengthen your credit assessment',
    purposeHi: 'अपनी क्रेडिट मूल्यांकन को मजबूत करने के लिए व्यापार/व्यापारी रेटिंग साझा करें',
    description: 'For MSME applicants: analyzes customer review trends, sentiment patterns, and review volume consistency to assess business health.',
    msmeOnly: true
  },
  behaviour: {
    id: 'behaviour',
    name: 'Bank Transaction History (AA)',
    purposeEn: 'Share bank transaction history via Account Aggregator to strengthen your credit assessment',
    purposeHi: 'अपनी क्रेडिट मूल्यांकन को मजबूत करने के लिए अकाउंट एग्रीगेटर के माध्यम से बैंक लेनदेन इतिहास साझा करें',
    description: 'Analyzes cash flow stability, income regularity, spending patterns, and savings behaviour from consented bank transaction data to compute a Behaviour Risk Score.'
  }
};

/**
 * Generate a unique consent record key.
 */
function consentKey(borrowerId, sourceId) {
  return `${borrowerId}:${sourceId}`;
}

/**
 * Log an audit event.
 */
function logAuditEvent(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };
  auditLog.push(entry);
  return entry;
}

/**
 * Grant consent for a specific data source.
 *
 * @param {string} borrowerId - Unique borrower identifier
 * @param {string} sourceId - Data source ID ('ecommerce' or 'merchantRatings')
 * @returns {Object} The created consent record
 */
function grantConsent(borrowerId, sourceId) {
  if (!DATA_SOURCES[sourceId]) {
    throw new Error(`Unknown data source: ${sourceId}`);
  }

  const key = consentKey(borrowerId, sourceId);
  const source = DATA_SOURCES[sourceId];

  const record = {
    borrowerId,
    sourceId,
    sourceName: source.name,
    purposeString: source.purposeEn,
    grantedAt: new Date().toISOString(),
    revokedAt: null
  };

  consentStore.set(key, record);

  logAuditEvent({
    type: 'CONSENT_GRANTED',
    borrowerId,
    sourceId,
    sourceName: source.name,
    purposeString: source.purposeEn
  });

  return record;
}

/**
 * Revoke consent for a specific data source.
 * Immediately marks the consent as revoked. Any stored raw data for this
 * source should be deleted by the caller.
 *
 * NOTE (known next step): A full encryption/TTL/data-localization layer
 * is out of scope for this phase. In production, revocation would also
 * trigger cryptographic deletion of all derived features.
 *
 * @param {string} borrowerId
 * @param {string} sourceId
 * @returns {Object|null} The updated record, or null if no consent existed
 */
function revokeConsent(borrowerId, sourceId) {
  const key = consentKey(borrowerId, sourceId);
  const record = consentStore.get(key);

  if (!record) {
    return null;
  }

  record.revokedAt = new Date().toISOString();
  consentStore.set(key, record);

  logAuditEvent({
    type: 'CONSENT_REVOKED',
    borrowerId,
    sourceId,
    sourceName: record.sourceName,
    revokedAt: record.revokedAt
  });

  return record;
}

/**
 * Check whether a borrower has ACTIVE consent for a data source.
 * Active = granted AND not revoked.
 *
 * @param {string} borrowerId
 * @param {string} sourceId
 * @returns {boolean}
 */
function hasActiveConsent(borrowerId, sourceId) {
  const key = consentKey(borrowerId, sourceId);
  const record = consentStore.get(key);

  if (!record) return false;
  if (record.revokedAt !== null) return false;

  return true;
}

/**
 * Log a data fetch event (called by data source modules before computing).
 *
 * @param {string} borrowerId
 * @param {string} sourceId
 */
function logDataFetch(borrowerId, sourceId) {
  logAuditEvent({
    type: 'DATA_FETCHED',
    borrowerId,
    sourceId,
    consentActive: hasActiveConsent(borrowerId, sourceId)
  });
}

/**
 * Get a summary of all consent records for a borrower.
 *
 * @param {string} borrowerId
 * @returns {Object} Summary with status for each source
 */
function getConsentSummary(borrowerId) {
  const summary = {};

  for (const [sourceId, source] of Object.entries(DATA_SOURCES)) {
    const key = consentKey(borrowerId, sourceId);
    const record = consentStore.get(key);

    summary[sourceId] = {
      sourceId,
      sourceName: source.name,
      purposeEn: source.purposeEn,
      purposeHi: source.purposeHi,
      msmeOnly: source.msmeOnly || false,
      consented: hasActiveConsent(borrowerId, sourceId),
      grantedAt: record ? record.grantedAt : null,
      revokedAt: record ? record.revokedAt : null
    };
  }

  return summary;
}

/**
 * Get the full audit log (for the regulatory audit panel).
 */
function getAuditLog() {
  return auditLog;
}

/**
 * Get the list of known data sources.
 */
function getDataSources() {
  return DATA_SOURCES;
}

module.exports = {
  grantConsent,
  revokeConsent,
  hasActiveConsent,
  logDataFetch,
  getConsentSummary,
  getAuditLog,
  getDataSources,
  DATA_SOURCES
};
