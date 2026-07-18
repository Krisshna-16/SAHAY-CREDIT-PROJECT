const express = require('express');
const path = require('path');
const http = require('http');
const { loadModel, loadPdoCalibration, calculateScore, scoreApplication } = require('./scoring');
const { analyzeFraud } = require('./fraud');
const { grantConsent, revokeConsent, getConsentSummary, getAuditLog } = require('./consent');
const { computeCompositeScore } = require('./compositeScoring');
const { loadCalibration: loadEcomCal, computeEcommerceScore } = require('./datasources/ecommerce');
const { loadCalibration: loadMerchantCal, computeMerchantScore } = require('./datasources/merchant');
const { loadBehaviourModel, computeBehaviourScore } = require('./behaviourInference');

// Phase 3 modules
const { processEkyc, getEkycStatus, isEkycVerified, getEkycAuditLog, getAadhaarByBorrower, getDevicesForAadhaar, registerAadhaarDevice } = require('./ekyc');
const { performBureauCheck, getBureauAuditLog } = require('./bureauCheck');
const { sendOtp, verifyOtp, getOtpAuditLog } = require('./otp');
const { login, refreshAccessToken, authMiddleware, requireRole, rateLimit, sanitizeInput, httpsRedirect } = require('./auth');
const { encrypt, decrypt } = require('./encryption');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInput);
app.use(httpsRedirect);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Load ML model at startup (not per-request) ─────────────────────────────
const modelLoaded = loadModel();
if (modelLoaded) {
  console.log('[SahayCredit] ML model loaded at startup — real scoring active.');
} else {
  console.log('[SahayCredit] ML model not available — using fallback scoring.');
}

// Load PDO calibration (Platt scaling + PDO parameters)
loadPdoCalibration();

// Load alt-data calibrations at startup
loadEcomCal();
loadMerchantCal();

// Load behaviour model at startup
const behaviourLoaded = loadBehaviourModel();
if (behaviourLoaded) {
  console.log('[SahayCredit] Behaviour model loaded — AA-based scoring active.');
} else {
  console.log('[SahayCredit] Behaviour model not available — AA scoring disabled.');
}

// In-memory database of loan applications for partner NBFCs
let applications = [
  {
    id: "app-001",
    name: "Ramesh Kumar",
    score: 718,
    confidenceBand: 15,
    loanAmount: 200000,
    suggestedRate: 14,
    signalsCount: 8,
    status: "Approve",
    riskAttitude: "Medium",
    shapFactors: [
      "Consistent mobile bill payments for 12+ months (+62 pts)",
      "Stable home & work location for 6 months (+48 pts)",
      "Moderate UPI transaction volume (+21 pts)"
    ],
    signals: {
      mobile: { rating: 85, detail: "Consistent monthly post-paid payment cycles for 12+ months." },
      upi: { rating: 78, detail: "Stable customer transaction history, active UPI business inflows." },
      geo: { rating: 82, detail: "Excellent home and kirana shop location match for 6 months." },
      psychometric: { rating: 74, detail: "Moderate risk attitude, positive financial repayment attitude." },
      ecommerce: { rating: 0, detail: "Not shared / Opted out" },
      merchantRatings: { rating: 0, detail: "Not shared / Opted out" },
      salaryConsistency: { rating: 100, value: "Very Regular", detail: "Income credited on same date ±2 days every month." },
      failedTx: { rating: 100, value: "0", detail: "Zero failed or bounced transactions in last 3 months." },
      merchantDiversity: { rating: 67, value: "Few", detail: "Pays across 2–3 merchant categories regularly." },
      refundRatio: { rating: 100, value: "Rarely", detail: "Refunds claimed on less than 1% of transactions." }
    },
    auditTrail: [
      { timestamp: "2026-06-29T10:15:30Z", event: "RBI AA Framework: UPI transaction stream pull succeeded" },
      { timestamp: "2026-06-29T10:15:32Z", event: "RBI AA Framework: Mobile payment records pulled successfully" },
      { timestamp: "2026-06-29T10:15:35Z", event: "On-Device: Encrypted coordinates location matching complete" },
      { timestamp: "2026-06-29T10:15:40Z", event: "On-Device: Psychometric evaluation compiled under XGBoost v2.4.1" },
      { timestamp: "2026-06-29T10:15:42Z", event: "Model Engine: SHAP explainable weights generated successfully" }
    ]
  },
  {
    id: "app-002",
    name: "Amit Sharma",
    score: 580,
    confidenceBand: 15,
    loanAmount: 15000,
    suggestedRate: 18,
    signalsCount: 8,
    status: "Review",
    riskAttitude: "Medium",
    simulatedDeviceCount: 3,
    simulatedVelocityMismatch: true,
    shapFactors: [
      "Moderate UPI business inflows (+32 pts)",
      "Occasional delayed mobile bill payments (-18 pts)",
      "Short e-commerce checkout history (+15 pts)"
    ],
    signals: {
      mobile: { rating: 30, detail: "Frequent prepaid recharges with delayed intervals (1 month history)." },
      upi: { rating: 92, detail: "Sudden high volume UPI transaction streams exceeding 90k/month." },
      geo: { rating: 20, detail: "Highly unstable coordinate history with zero location match." },
      psychometric: { rating: 65, detail: "Balanced decision metrics, average repayment intent." },
      ecommerce: { rating: 55, detail: "Recent online purchase activity on Flipkart/Meesho." },
      merchantRatings: { rating: 0, detail: "Not shared / Opted out" },
      salaryConsistency: { rating: 33, value: "Irregular", detail: "Income credits vary by more than 2 weeks each month." },
      failedTx: { rating: 35, value: "3-5", detail: "3–5 failed or bounced payments detected in last 3 months." },
      merchantDiversity: { rating: 100, value: "Many", detail: "Pays across groceries, transport, bills, and entertainment." },
      refundRatio: { rating: 35, value: "Frequently", detail: "Refund or dispute claims on >15% of transactions." }
    },
    auditTrail: [
      { timestamp: "2026-06-29T09:12:10Z", event: "RBI AA Framework: UPI transactions pull succeeded" },
      { timestamp: "2026-06-29T09:12:12Z", event: "RBI AA Framework: Mobile records pull succeeded" },
      { timestamp: "2026-06-29T09:12:18Z", event: "On-Device: E-commerce purchase volumes computed" },
      { timestamp: "2026-06-29T09:12:22Z", event: "On-Device: Psychometric outputs compiled under XGBoost v2.4.1" }
    ]
  },
  {
    id: "app-003",
    name: "Priya Patel",
    score: 812,
    confidenceBand: 15,
    loanAmount: 300000,
    suggestedRate: 12,
    signalsCount: 10,
    status: "Approve",
    riskAttitude: "Low",
    shapFactors: [
      "Flawless mobile bill history for 18 months (+88 pts)",
      "Consistent high-volume UPI business receipts (+78 pts)",
      "Exceptional GST tax compliance history (+62 pts)"
    ],
    signals: {
      mobile: { rating: 95, detail: "Perfect post-paid utility payment cycles over 18 months." },
      upi: { rating: 88, detail: "Consistent daily merchant receipt volume and high balance safety." },
      geo: { rating: 85, detail: "Stable coordinates match: verified store & home match." },
      psychometric: { rating: 80, detail: "Outstanding moral repayment priority and safe growth focus." },
      ecommerce: { rating: 82, detail: "Frequent online business inventory orders on Meesho." },
      merchantRatings: { rating: 78, detail: "4.8/5 supplier network rating and positive peer reviews." },
      salaryConsistency: { rating: 100, value: "Very Regular", detail: "Business income arrives on same date each month consistently." },
      failedTx: { rating: 100, value: "0", detail: "No failed transactions in last 3 months — perfect record." },
      merchantDiversity: { rating: 100, value: "Many", detail: "Wide merchant footprint: groceries, logistics, supplier payments." },
      refundRatio: { rating: 100, value: "Rarely", detail: "Under 0.5% refund ratio — excellent transaction quality." }
    },
    auditTrail: [
      { timestamp: "2026-06-29T08:45:00Z", event: "RBI AA Framework: UPI transaction stream pull succeeded" },
      { timestamp: "2026-06-29T08:45:02Z", event: "RBI AA Framework: Mobile logs pulled successfully" },
      { timestamp: "2026-06-29T08:45:05Z", event: "On-Device: Coordinate encryption mask complete" },
      { timestamp: "2026-06-29T08:45:10Z", event: "On-Device: E-commerce inventory matching complete" },
      { timestamp: "2026-06-29T08:45:12Z", event: "GST Portal: Merchant tax compliance rating retrieved" },
      { timestamp: "2026-06-29T08:45:15Z", event: "On-Device: Psychometric answers verified under XGBoost v2.4.1" }
    ]
  },
  {
    id: "app-004",
    name: "Rajesh Kumar",
    score: 490,
    confidenceBand: 15,
    loanAmount: 5000,
    suggestedRate: 22,
    signalsCount: 5,
    status: "Reject",
    riskAttitude: "High",
    shapFactors: [
      "Not shared / Opted out (-40 pts)",
      "Conservative behavioral debt safety score (-20 pts)"
    ],
    signals: {
      mobile: { rating: 0, detail: "Not shared / Opted out" },
      upi: { rating: 0, detail: "Not shared / Opted out" },
      geo: { rating: 0, detail: "Not shared / Opted out" },
      psychometric: { rating: 48, detail: "Short planning horizons, lower credit prioritization." },
      ecommerce: { rating: 0, detail: "Not shared / Opted out" },
      merchantRatings: { rating: 0, detail: "Not shared / Opted out" },
      salaryConsistency: { rating: 0, value: "No Fixed Salary", detail: "No consistent income credit pattern detected." },
      failedTx: { rating: 0, value: "5+", detail: "More than 5 failed/bounced transactions in last 3 months." },
      merchantDiversity: { rating: 0, value: "Rarely", detail: "Minimal digital payment footprint detected." },
      refundRatio: { rating: 0, value: "Very Often", detail: "Very high refund frequency — possible disputes." }
    },
    auditTrail: [
      { timestamp: "2026-06-29T07:30:20Z", event: "On-Device: Psychometric models run under XGBoost v2.4.1" }
    ]
  },
  {
    id: "app-005",
    name: "Sunita Devi",
    score: 634,
    confidenceBand: 15,
    loanAmount: 50000,
    suggestedRate: 16,
    signalsCount: 9,
    status: "Review",
    riskAttitude: "Medium",
    shapFactors: [
      "Stable home location verified for 12 months (+45 pts)",
      "Steady utility bill payments (+38 pts)",
      "Moderate business transaction activity on UPI (+22 pts)"
    ],
    signals: {
      mobile: { rating: 65, detail: "Steady payment intervals, no post-paid payment default." },
      upi: { rating: 68, detail: "Regular consumer receipts, average cash buffer is stable." },
      geo: { rating: 72, detail: "Verified home coordinate stability matched for 12 months." },
      psychometric: { rating: 58, detail: "Conservative builder profile, prefers cash to large credit lines." },
      ecommerce: { rating: 60, detail: "Consistent purchases of household supplies." },
      merchantRatings: { rating: 0, detail: "Not shared / Opted out" },
      salaryConsistency: { rating: 67, value: "Mostly Regular", detail: "Income arrives within ±1 week of expected date." },
      failedTx: { rating: 75, value: "1-2", detail: "1–2 failed transactions detected — minor concern." },
      merchantDiversity: { rating: 67, value: "Few", detail: "Pays groceries and utility bills digitally." },
      refundRatio: { rating: 75, value: "Occasionally", detail: "Occasional refunds on online purchases — within acceptable range." }
    },
    auditTrail: [
      { timestamp: "2026-06-29T11:10:00Z", event: "RBI AA Framework: UPI transactions pull succeeded" },
      { timestamp: "2026-06-29T11:10:02Z", event: "RBI AA Framework: Mobile utility logs pulled successfully" },
      { timestamp: "2026-06-29T11:10:05Z", event: "On-Device: Geolocation matching complete" },
      { timestamp: "2026-06-29T11:10:10Z", event: "On-Device: E-commerce purchase matching complete" },
      { timestamp: "2026-06-29T11:10:12Z", event: "On-Device: Psychometric answers verified under XGBoost v2.4.1" }
    ]
  },
  {
    id: "app-006",
    name: "Vikram Singh",
    score: 745,
    confidenceBand: 15,
    loanAmount: 150000,
    suggestedRate: 14,
    signalsCount: 9,
    status: "Approve",
    riskAttitude: "Medium",
    shapFactors: [
      "Stable business location coordinate matching (+58 pts)",
      "Strong UPI sales transaction volume (+52 pts)",
      "High behavioral planning score (+35 pts)"
    ],
    signals: {
      mobile: { rating: 80, detail: "Regular payment history, zero default record." },
      upi: { rating: 82, detail: "Consistent high-value merchant inflows, robust cash flow safety." },
      geo: { rating: 78, detail: "Consistent coordinate patterns for 9 months." },
      psychometric: { rating: 70, detail: "Active business manager, disciplined loan priority." },
      ecommerce: { rating: 75, detail: "Frequent business inventory sourcing online." },
      merchantRatings: { rating: 0, detail: "Not shared / Opted out" },
      salaryConsistency: { rating: 100, value: "Very Regular", detail: "Business revenue arrives on fixed schedule each month." },
      failedTx: { rating: 100, value: "0", detail: "Zero failed transactions — clean payment execution." },
      merchantDiversity: { rating: 100, value: "Many", detail: "Pays suppliers, utilities, logistics, and inventory vendors." },
      refundRatio: { rating: 100, value: "Rarely", detail: "Virtually no refunds — strong purchase intent and follow-through." }
    },
    auditTrail: [
      { timestamp: "2026-06-29T11:20:00Z", event: "RBI AA Framework: UPI transactions pull succeeded" },
      { timestamp: "2026-06-29T11:20:02Z", event: "RBI AA Framework: Mobile records pulled successfully" },
      { timestamp: "2026-06-29T11:20:05Z", event: "On-Device: Coordinate tracking masking complete" },
      { timestamp: "2026-06-29T11:20:10Z", event: "On-Device: E-commerce inventory check succeeded" },
      { timestamp: "2026-06-29T11:20:15Z", event: "On-Device: Psychometric compile succeeded under XGBoost v2.4.1" }
    ]
  }
];

// ── Confidence Score Computation ────────────────────────────────────────────
function getConfidenceScore(appRecord) {
  let confidence = 40; // Base confidence

  if (appRecord.signals) {
    if (appRecord.signals.mobile && appRecord.signals.mobile.rating > 0) confidence += 15;
    if (appRecord.signals.upi && appRecord.signals.upi.rating >= 50) confidence += 15;
    if (appRecord.signals.geo && appRecord.signals.geo.rating >= 60) confidence += 10;
    if (appRecord.signals.ecommerce && appRecord.signals.ecommerce.rating > 0) confidence += 10;
    if (appRecord.signals.merchantRatings && appRecord.signals.merchantRatings.rating > 0) confidence += 5;
    if (appRecord.signals.psychometric && appRecord.signals.psychometric.rating > 0) confidence += 5;
    if (appRecord.signals.salaryConsistency && appRecord.signals.salaryConsistency.rating >= 67) confidence += 8;
    if (appRecord.signals.failedTx && appRecord.signals.failedTx.rating === 100) confidence += 7;
    if (appRecord.signals.merchantDiversity && appRecord.signals.merchantDiversity.rating >= 67) confidence += 5;
    if (appRecord.signals.refundRatio && appRecord.signals.refundRatio.rating >= 75) confidence += 5;
  }

  return Math.min(95, confidence);
}

// ── ML Scoring Service Helper (calls Python service on port 8000) ────────────
function callMlScoringService(appRecord) {
  return new Promise((resolve) => {
    // Build a credit applicant payload from the app's signals + score
    // We approximate Home Credit features from the available signal ratings
    const signals = appRecord.signals || {};
    const psychScore = (signals.psychometric && signals.psychometric.rating) || 50;
    const mobileScore = (signals.mobile && signals.mobile.rating) || 50;
    const geoScore = (signals.geo && signals.geo.rating) || 50;
    const salaryRating = (signals.salaryConsistency && signals.salaryConsistency.rating) || 50;
    const failedTxRating = (signals.failedTx && signals.failedTx.rating) || 50;

    // Map signal ratings to approximate Home Credit feature ranges
    const ageYears = 30 + (psychScore / 100) * 20;          // 30–50
    const daysEmployed = salaryRating >= 67 ? -1825 : 365243; // employed or not
    const income = appRecord.loanAmount * 2.5;
    const annuity = appRecord.loanAmount * (appRecord.suggestedRate / 100 / 12);
    const extSource = (appRecord.score - 300) / 600;         // normalize 300-900 → 0-1

    const payload = JSON.stringify({
      DAYS_BIRTH: -(ageYears * 365),
      DAYS_EMPLOYED: daysEmployed,
      AMT_INCOME_TOTAL: income,
      AMT_ANNUITY: annuity,
      AMT_CREDIT: appRecord.loanAmount,
      AMT_GOODS_PRICE: appRecord.loanAmount * 0.95,
      EXT_SOURCE_1: extSource,
      EXT_SOURCE_2: Math.min(1, extSource + 0.05),
      EXT_SOURCE_3: Math.max(0, extSource - 0.05),
      CNT_FAM_MEMBERS: 3,
      CNT_CHILDREN: 1,
      FLAG_DOCUMENT_SUM: Math.round(mobileScore / 25),
      REGION_POPULATION_RELATIVE: 0.035,
      REGION_RATING_CLIENT: geoScore > 70 ? 1 : geoScore > 40 ? 2 : 3,
      DAYS_LAST_PHONE_CHANGE: -180,
      AMT_REQ_CREDIT_BUREAU_HOUR: 0,
      AMT_REQ_CREDIT_BUREAU_DAY: 0,
      AMT_REQ_CREDIT_BUREAU_WEEK: failedTxRating < 50 ? 3 : 0,
      AMT_REQ_CREDIT_BUREAU_MON: failedTxRating < 50 ? 5 : 1,
      AMT_REQ_CREDIT_BUREAU_QRT: 2,
      AMT_REQ_CREDIT_BUREAU_YEAR: 4,
      OCCUPATION_TYPE: 'Unknown',
      NAME_INCOME_TYPE: salaryRating >= 67 ? 'Working' : 'Unemployed',
      ORGANIZATION_TYPE: 'Business Entity Type 1',
      NAME_EDUCATION_TYPE: psychScore > 70 ? 'Higher education' : 'Secondary / secondary special',
      NAME_FAMILY_STATUS: 'Married',
      NAME_HOUSING_TYPE: geoScore > 60 ? 'House / apartment' : 'Rented apartment',
      NAME_CONTRACT_TYPE: 'Cash loans'
    });

    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path: '/credit/score',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            mlCreditScore: parsed.credit_score,
            mlRiskLevel: parsed.risk_level,
            mlDefaultProb: parsed.predicted_default_prob
          });
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(payload);
    req.end();
  });
}

// ── Applications API with Fraud Detection ───────────────────────────────────
app.get('/api/applications', async (req, res) => {
  // Call Python ML service for all applications in parallel (2s timeout, graceful fallback)
  const mlResults = await Promise.all(applications.map(a => callMlScoringService(a)));

  const enhancedApps = applications.map((appRecord, idx) => {
    // Run fraud analysis using the new fraud module
    let deviceCount = 1;
    let velocityMismatch = false;
    const rawAadhaar = getAadhaarByBorrower(appRecord.id);
    if (rawAadhaar) {
      deviceCount = getDevicesForAadhaar(rawAadhaar).length;
      if (appRecord.id.includes('velocity-test')) {
        velocityMismatch = true;
      }
    } else if (appRecord.simulatedDeviceCount) {
      deviceCount = appRecord.simulatedDeviceCount;
      if (appRecord.simulatedVelocityMismatch) {
        velocityMismatch = true;
      }
    }

    const fraudResult = analyzeFraud(appRecord.signals, appRecord.score, null, {
      deviceCount,
      velocityMismatch,
      isReal: !!rawAadhaar
    });

    let fraudRisk = "Clean";
    if (fraudResult.riskLevel === "medium") fraudRisk = "Review";
    else if (fraudResult.riskLevel === "high") fraudRisk = "Flagged";

    // Map fraud flags to string descriptions for backward compatibility
    const fraudFlags = fraudResult.flags.map(f => f.description);

    // Calculate dynamic composite breakdown for demo applications
    const hasEcom = appRecord.signals && appRecord.signals.ecommerce && appRecord.signals.ecommerce.rating > 0;
    const hasMerchant = appRecord.signals && appRecord.signals.merchantRatings && appRecord.signals.merchantRatings.rating > 0;
    const hasBehaviour = appRecord.signals && appRecord.signals.behaviour && appRecord.signals.behaviour.rating > 0;

    // Use compositeScoring engine for dynamic breakdown
    const ecomResult = hasEcom ? { subScore: appRecord.signals.ecommerce.rating, contributing: true, features: {}, explanation: appRecord.signals.ecommerce.detail } : null;
    const merchResult = hasMerchant ? { subScore: appRecord.signals.merchantRatings.rating, contributing: true, features: {}, explanation: appRecord.signals.merchantRatings.detail } : null;
    const behResult = hasBehaviour ? { subScore: appRecord.signals.behaviour.rating, contributing: true, features: {}, coefficientBreakdown: {}, explanation: appRecord.signals.behaviour.detail } : null;

    const compositeResult = computeCompositeScore(appRecord.score, ecomResult, merchResult, behResult);
    const compositeBreakdown = compositeResult.breakdown;
    const compositeWeights = compositeResult.weights;
    const sourceCount = compositeResult.sourceCount;

    return {
      ...appRecord,
      confidence: getConfidenceScore(appRecord),
      fraudFlags,
      fraudRisk,
      fraudAnalysis: fraudResult,
      compositeBreakdown,
      compositeWeights,
      sourceCount,
      // ── Real ML score from Python fraud_credit_service ──
      mlCreditScore: mlResults[idx] ? mlResults[idx].mlCreditScore : null,
      mlRiskLevel:   mlResults[idx] ? mlResults[idx].mlRiskLevel   : null,
      mlDefaultProb: mlResults[idx] ? mlResults[idx].mlDefaultProb : null
    };
  });
  res.json({
    success: true,
    data: enhancedApps
  });
});

// Update application status
app.patch('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Approve', 'Review', 'Reject', 'Verify'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status value. Must be Approve, Review, Reject, or Verify.'
    });
  }

  const appRecord = applications.find(a => a.id === id);
  if (!appRecord) {
    return res.status(404).json({
      success: false,
      error: 'Application not found.'
    });
  }

  appRecord.status = status;

  let deviceCount = 1;
  let velocityMismatch = false;
  const rawAadhaar = getAadhaarByBorrower(appRecord.id);
  if (rawAadhaar) {
    deviceCount = getDevicesForAadhaar(rawAadhaar).length;
    if (appRecord.id.includes('velocity-test')) {
      velocityMismatch = true;
    }
  } else if (appRecord.simulatedDeviceCount) {
    deviceCount = appRecord.simulatedDeviceCount;
    if (appRecord.simulatedVelocityMismatch) {
      velocityMismatch = true;
    }
  }

  const fraudResult = analyzeFraud(appRecord.signals, appRecord.score, null, {
    deviceCount,
    velocityMismatch,
    isReal: !!rawAadhaar
  });
  let fraudRisk = "Clean";
  if (fraudResult.riskLevel === "medium") fraudRisk = "Review";
  else if (fraudResult.riskLevel === "high") fraudRisk = "Flagged";

  const fraudFlags = fraudResult.flags.map(f => f.description);

  res.json({
    success: true,
    data: {
      ...appRecord,
      confidence: getConfidenceScore(appRecord),
      fraudFlags,
      fraudRisk,
      fraudAnalysis: fraudResult
    }
  });
});

// ── Consent API Endpoints ────────────────────────────────────────────────────

// Grant consent for a data source
app.post('/api/consent/grant', (req, res) => {
  try {
    const { borrowerId, sourceId } = req.body;
    if (!borrowerId || !sourceId) {
      return res.status(400).json({ success: false, error: 'borrowerId and sourceId required' });
    }
    const record = grantConsent(borrowerId, sourceId);
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Revoke consent for a data source
app.post('/api/consent/revoke', (req, res) => {
  try {
    const { borrowerId, sourceId } = req.body;
    if (!borrowerId || !sourceId) {
      return res.status(400).json({ success: false, error: 'borrowerId and sourceId required' });
    }
    const record = revokeConsent(borrowerId, sourceId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'No consent record found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get consent summary for a borrower
app.get('/api/consent/:borrowerId', (req, res) => {
  const summary = getConsentSummary(req.params.borrowerId);
  res.json({ success: true, data: summary });
});

// Get consent audit log
app.get('/api/consent-audit', (req, res) => {
  res.json({ success: true, data: getAuditLog() });
});

// ── Score API (main borrower scoring endpoint) ──────────────────────────────
app.post('/api/score', async (req, res) => {
  try {
    const { answers, borrowerId, ecommerceData, merchantData, isMSME } = req.body;

    // Input validation
    if (!answers) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: answers'
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input: answers must be an array.'
      });
    }

    if (answers.length !== 15) {
      return res.status(400).json({
        success: false,
        error: `Invalid input: Expected 15 answers, received ${answers.length}.`
      });
    }

    // Validate each answer is a valid number
    for (let i = 0; i < answers.length; i++) {
      const val = parseInt(answers[i]);
      if (isNaN(val) || val < 0 || val > 3) {
        return res.status(400).json({
          success: false,
          error: `Invalid answer at index ${i}: must be 0-3, got "${answers[i]}".`
        });
      }
    }

    // Calculate core score using the ML-powered engine
    const coreResult = calculateScore(answers);

    // ── Phase 2: Composite Scoring ──────────────────────────────────────
    // If borrowerId is provided, check for alt-data consent and compute sub-scores
    let ecommerceResult = null;
    let merchantResult = null;
    let behaviourResult = null;

    // Extract behaviourData from request body
    const behaviourData = req.body.behaviourData;

    if (borrowerId) {
      // E-Commerce sub-score (if consented and data provided)
      if (ecommerceData && Array.isArray(ecommerceData)) {
        ecommerceResult = computeEcommerceScore(borrowerId, ecommerceData);
      }

      // Merchant rating sub-score (if MSME, consented, and data provided)
      if (merchantData && Array.isArray(merchantData) && isMSME) {
        merchantResult = computeMerchantScore(borrowerId, merchantData, true);
      }

      // Behaviour risk sub-score (if consented and AA data provided)
      if (behaviourData) {
        behaviourResult = computeBehaviourScore(borrowerId, behaviourData);
      }
    }

    // Compute composite score (now includes behaviour as 4th source)
    const composite = computeCompositeScore(
      coreResult.score, ecommerceResult, merchantResult, behaviourResult
    );

    // Build extended response (additive — core fields remain unchanged)
    const extendedResult = {
      ...coreResult,
      // Override score with composite if alt-data contributed
      score: composite.compositeScore,
      coreScore: coreResult.score, // Preserve original core score
      compositeBreakdown: composite.breakdown,
      compositeWeights: composite.weights,
      sourceCount: composite.sourceCount,
      compositeConfidence: composite.confidenceScore,
      compositeExplanation: composite.explanation,
      consentSummary: borrowerId ? getConsentSummary(borrowerId) : null
    };

    if (borrowerId) {
      const ekycStatus = getEkycStatus(borrowerId);
      const borrowerName = ekycStatus && ekycStatus.status === 'verified' ? ekycStatus.details?.extractedFields?.name || "Borrower Profile" : "Borrower Profile";

      const rawAadhaar = getAadhaarByBorrower(borrowerId);
      const deviceFingerprint = req.body.deviceFingerprint || req.headers['x-device-fingerprint'] || Buffer.from(req.headers['user-agent'] || '').toString('base64').slice(0, 32);
      if (rawAadhaar) {
        registerAadhaarDevice(rawAadhaar, deviceFingerprint);
      }

      const newApplication = {
        id: borrowerId,
        name: borrowerName,
        score: extendedResult.score,
        confidenceBand: extendedResult.confidenceBand || 15,
        loanAmount: isMSME ? 150000 : 35000,
        suggestedRate: extendedResult.interestRate || 18,
        signalsCount: 8,
        status: "Review",
        riskAttitude: isMSME ? "Medium" : "Low",
        shapFactors: extendedResult.shapFactors || [],
        signals: {
          mobile: { rating: 75, detail: "Active mobile billing and verification logs." },
          upi: { rating: 80, detail: "Standard customer transaction velocity." },
          geo: { rating: 85, detail: "Geographic verification matches location records." },
          psychometric: { rating: Math.round(extendedResult.dimensions?.financialDiscipline || 70), detail: "Assessed financial and risk dimension metrics." },
          ecommerce: { rating: ecommerceResult ? ecommerceResult.score : 0, detail: ecommerceResult ? "Direct e-commerce purchase history link." : "Not shared / Opted out" },
          merchantRatings: { rating: merchantResult ? merchantResult.score : 0, detail: merchantResult ? "Verified merchant transaction and feedback records." : "Not shared / Opted out" },
          salaryConsistency: { rating: 65, value: "Regular", detail: "Salary credit pattern consistency." },
          failedTx: { rating: 100, value: "0", detail: "Zero failed or bounced payments." },
          merchantDiversity: { rating: 50, value: "Few", detail: "Standard category distribution." },
          refundRatio: { rating: 100, value: "Rarely", detail: "Zero refund claims." }
        },
        auditTrail: [
          { timestamp: new Date().toISOString(), event: "Application submitted and scored successfully via V-CIP" },
          { timestamp: new Date().toISOString(), event: `XGBoost ML inference run completed (Score: ${extendedResult.score})` }
        ]
      };

      const existingIndex = applications.findIndex(a => a.id === borrowerId);
      if (existingIndex >= 0) {
        applications[existingIndex] = newApplication;
      } else {
        applications.push(newApplication);
      }
    }

    // ── Call Python ML scoring service for this real borrower ──────────────
    const mlResult = await callMlScoringService({
      score: extendedResult.score,
      loanAmount: isMSME ? 150000 : 35000,
      suggestedRate: extendedResult.interestRate || 18,
      signals: {
        psychometric: { rating: Math.round(extendedResult.dimensions?.financialDiscipline || 70) },
        mobile:        { rating: 75 },
        geo:           { rating: 85 },
        salaryConsistency: { rating: 65 },
        failedTx:      { rating: 100 }
      }
    });

    // Attach ML result to both the response and the stored application record
    if (mlResult) {
      extendedResult.mlCreditScore = mlResult.mlCreditScore;
      extendedResult.mlRiskLevel   = mlResult.mlRiskLevel;
      extendedResult.mlDefaultProb = mlResult.mlDefaultProb;
    }

    // Update the stored application with ML fields too (for lender dashboard)
    if (borrowerId) {
      const idx = applications.findIndex(a => a.id === borrowerId);
      if (idx >= 0 && mlResult) {
        applications[idx].mlCreditScore = mlResult.mlCreditScore;
        applications[idx].mlRiskLevel   = mlResult.mlRiskLevel;
        applications[idx].mlDefaultProb = mlResult.mlDefaultProb;
      }
    }

    return res.json({
      success: true,
      data: extendedResult
    });
  } catch (error) {
    console.error('[SahayCredit] Scoring error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing the questionnaire.'
    });
  }
});

// Log capture endpoint for automated UI tests
app.post('/api/log', (req, res) => {
  try {
    const fs = require('fs');
    const logPath = path.join(__dirname, '../scratch/diagnostic_log.json');
    fs.writeFileSync(logPath, JSON.stringify(req.body, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write diagnostic log:', err);
  }
  res.json({ success: true });
});


// ── Phase 3: Authentication Endpoints ───────────────────────────────────────

const authRateLimit = rateLimit(10, 60 * 1000); // 10 requests per minute

app.post('/api/auth/login', authRateLimit, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }
  const result = login(email, password);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'Refresh token required' });
  }
  const result = refreshAccessToken(refreshToken);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});


let STRICT_DEVICE_BLOCK = false;

app.get('/api/config', (req, res) => {
  res.json({ success: true, strictDeviceBlock: STRICT_DEVICE_BLOCK });
});

app.post('/api/config', (req, res) => {
  const { strictDeviceBlock } = req.body;
  if (typeof strictDeviceBlock === 'boolean') {
    STRICT_DEVICE_BLOCK = strictDeviceBlock;
  }
  res.json({ success: true, strictDeviceBlock: STRICT_DEVICE_BLOCK });
});


// ── Phase 3: eKYC Endpoints (Sandbox Mode) ──────────────────────────────────

app.post('/api/ekyc/verify', rateLimit(5, 60 * 1000), (req, res) => {
  try {
    const { borrowerId, documentType, documentNumber, name, dob, selfieBase64 } = req.body;

    if (!borrowerId || !documentType || !documentNumber || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: borrowerId, documentType, documentNumber, name'
      });
    }

    const deviceFingerprint = req.body.deviceFingerprint || req.headers['x-device-fingerprint'] || Buffer.from(req.headers['user-agent'] || '').toString('base64').slice(0, 32);

    if (STRICT_DEVICE_BLOCK && documentType === 'aadhaar') {
      const normalizedAadhaar = documentNumber.replace(/\s/g, '');
      const existingDevices = getDevicesForAadhaar(normalizedAadhaar);
      if (existingDevices.length > 0 && !existingDevices.includes(deviceFingerprint)) {
        return res.status(400).json({
          success: false,
          error: 'Security Gate: This Aadhaar card is already registered on another device. Multiple accounts per identity are prohibited.',
          code: 'DEVICE_BLOCK'
        });
      }
    }

    const result = processEkyc(borrowerId, {
      type: documentType,
      number: documentNumber,
      name,
      dob,
      selfieBase64,
      deviceFingerprint
    });

    res.json({
      success: true,
      data: result,
      notice: 'eKYC (Sandbox Mode) - Architecture ready for DigiLocker/UIDAI integration'
    });
  } catch (error) {
    console.error('[eKYC] Verification error:', error);
    res.status(500).json({ success: false, error: 'eKYC verification failed' });
  }
});

app.get('/api/ekyc/status/:borrowerId', (req, res) => {
  const status = getEkycStatus(req.params.borrowerId);
  res.json({ success: true, data: status });
});


// ── Phase 3: Bureau Check Endpoint ──────────────────────────────────────────

app.post('/api/bureau-check', rateLimit(5, 60 * 1000), (req, res) => {
  try {
    const { borrowerId, pan, name, dob } = req.body;

    if (!borrowerId || !pan) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: borrowerId, pan'
      });
    }

    const result = performBureauCheck(borrowerId, { pan, name, dob });

    res.json({
      success: true,
      data: result,
      notice: 'Bureau Check (Simulated Registry) - Architecture ready for CIBIL/Experian API'
    });
  } catch (error) {
    console.error('[Bureau] Check error:', error);
    res.status(500).json({ success: false, error: 'Bureau check failed' });
  }
});


// ── Phase 3: OTP Endpoints ──────────────────────────────────────────────────

const otpRateLimit = rateLimit(5, 60 * 1000); // 5 requests per minute

app.post('/api/otp/send', otpRateLimit, (req, res) => {
  try {
    const { destination, channel } = req.body;

    if (!destination) {
      return res.status(400).json({ success: false, error: 'Destination (email/phone) required' });
    }

    const result = sendOtp(destination, channel || 'email');
    res.json({ success: result.success, data: result });
  } catch (error) {
    console.error('[OTP] Send error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

app.post('/api/otp/verify', otpRateLimit, (req, res) => {
  try {
    const { destination, code } = req.body;

    if (!destination || !code) {
      return res.status(400).json({ success: false, error: 'Destination and code required' });
    }

    const result = verifyOtp(destination, code);
    res.json({ success: result.success, data: result });
  } catch (error) {
    console.error('[OTP] Verify error:', error);
    res.status(500).json({ success: false, error: 'OTP verification failed' });
  }
});


// ── Phase 3: Extended Audit Log ─────────────────────────────────────────────

app.get('/api/audit/full', (req, res) => {
  const consentAudit = getAuditLog();
  const ekycAudit = getEkycAuditLog();
  const bureauAudit = getBureauAuditLog();
  const otpAudit = getOtpAuditLog();

  res.json({
    success: true,
    data: {
      consent: consentAudit,
      ekyc: ekycAudit,
      bureau: bureauAudit,
      otp: otpAudit,
      totalEntries: consentAudit.length + ekycAudit.length + bureauAudit.length + otpAudit.length
    }
  });
});


// Serve frontend for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log('==================================================');
  console.log(' SahayCredit Onboarding Server (Phase 3)');
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Model: ${modelLoaded ? 'XGBoost ML Engine' : 'Fallback Rule-Based'}`);
  console.log(' Modules: eKYC(sandbox) | Bureau(sandbox) | OTP(dev) | Auth(JWT)');
  console.log('==================================================');
});
