/**
 * SahayCredit Fraud Detection Module (Phase 1.5 Hardened)
 * =========================================================
 * Independent fraud detection engine that analyzes borrower behavioral
 * signals for suspicious patterns. This module NEVER auto-rejects —
 * it only flags for the lender dashboard's manual review.
 *
 * PHASE 1.5 CHANGE (Gap 3 fix):
 * Each rule now accepts input from either:
 *   - REAL derived signals (computed from actual data in the scoring pipeline)
 *   - SIMULATED signals (manual slider values from the lender dashboard)
 * Every flag includes a `dataSource: "real" | "simulated"` field indicating
 * which mode the rule ran in. Rules that inherently require data connectors
 * SahayCredit doesn't yet have (e.g., real-time bank feeds) are explicitly
 * documented as simulated-only in this version.
 *
 * Output shape:
 * {
 *   riskLevel: "low" | "medium" | "high",
 *   flags: [{ code, description, severity, dataSource, sourceDetail }],
 *   manualReviewRequired: boolean,
 *   score: number (0-100, higher = more suspicious)
 * }
 */

// ── Signal Source Detection ────────────────────────────────────────────────
/**
 * Determine whether a signal object contains real derived data or simulated
 * slider values. Real signals will have a `_source` property set to "real"
 * by the scoring pipeline. All signals from the lender dashboard's in-memory
 * application records are considered simulated unless explicitly tagged.
 */
function getDataSource(signal) {
  if (!signal) return "simulated";
  if (signal._source === "real") return "real";
  return "simulated";
}

/**
 * Helper: build a flag object with consistent shape.
 */
function flag(code, description, severity, dataSource, sourceDetail) {
  return {
    code,
    description,
    severity,
    dataSource: dataSource || "simulated",
    sourceDetail: sourceDetail || (dataSource === "real"
      ? "Derived from pipeline data"
      : "Based on dashboard slider value")
  };
}


// ── Fraud Detection Rules ───────────────────────────────────────────────────

/**
 * Rule 1: Circular Transactions
 * Detects same amount flowing in and out within short windows.
 * Proxy: If UPI inflow and outflow are suspiciously balanced (>95% match)
 *
 * DATA SOURCE: Simulated-only in this version. Real circular transaction
 * detection requires access to actual UPI transaction ledgers with inflow/
 * outflow amounts, which SahayCredit does not yet have a live connector for.
 */
function checkCircularTransactions(signals) {
  const flags_out = [];
  if (signals.upi && signals.upi.rating > 0) {
    const upiRating = signals.upi.rating;
    const upiSource = getDataSource(signals.upi);
    const divSource = getDataSource(signals.merchantDiversity);

    // High transaction volume with zero or near-zero business growth indicator
    if (upiRating > 80 && signals.merchantDiversity && signals.merchantDiversity.rating < 20) {
      flags_out.push(flag(
        "CIRC_TX_001",
        "High UPI volume with minimal merchant diversity — possible circular transactions",
        "high",
        // Both inputs must be real for the flag to be real
        (upiSource === "real" && divSource === "real") ? "real" : "simulated",
        `UPI data: ${upiSource}, merchant diversity data: ${divSource}`
      ));
    }
  }
  return flags_out;
}

/**
 * Rule 2: Fake Salary Credits
 * Detects irregular credit patterns that claim to be salary.
 *
 * DATA SOURCE: Simulated-only. Detecting fake salary credits requires
 * actual bank statement data with credit timestamps and amounts.
 * The salaryConsistency signal currently comes from dashboard sliders.
 */
function checkFakeSalaryCredits(signals) {
  const flags_out = [];
  if (signals.salaryConsistency) {
    const consistency = signals.salaryConsistency.rating;
    const value = signals.salaryConsistency.value;
    const source = getDataSource(signals.salaryConsistency);

    // Claims regular salary but consistency rating is very low
    if (value === "Very Regular" && consistency < 40) {
      flags_out.push(flag(
        "FAKE_SAL_001",
        "Declared 'Very Regular' salary but consistency metrics indicate otherwise",
        "high",
        source,
        `Salary consistency data: ${source}`
      ));
    }

    // Irregular salary with high claimed income
    if (consistency < 30 && signals.upi && signals.upi.rating > 85) {
      flags_out.push(flag(
        "FAKE_SAL_002",
        "Very irregular income credits despite high UPI transaction volume",
        "medium",
        (source === "real" && getDataSource(signals.upi) === "real") ? "real" : "simulated",
        `Salary data: ${source}, UPI data: ${getDataSource(signals.upi)}`
      ));
    }
  }
  return flags_out;
}

/**
 * Rule 3: Sudden Income Spike
 * Detects income/transaction volume that spikes >3σ from expected patterns.
 *
 * DATA SOURCE: Simulated-only. Requires time-series transaction history
 * to compute statistical deviation.
 */
function checkSuddenIncomeSpike(signals) {
  const flags_out = [];

  const upiRating = (signals.upi && signals.upi.rating) || 0;
  const mobileRating = (signals.mobile && signals.mobile.rating) || 0;
  const upiSource = getDataSource(signals.upi);
  const mobileSource = getDataSource(signals.mobile);
  const combined = (upiSource === "real" && mobileSource === "real") ? "real" : "simulated";

  // Very high current activity but very short established history
  if (upiRating > 80 && mobileRating < 30) {
    flags_out.push(flag(
      "SPIKE_001",
      "Unusual income spike — high UPI activity with short payment history",
      "high",
      combined,
      `UPI data: ${upiSource}, mobile data: ${mobileSource}`
    ));
  }

  // Moderate spike signal
  if (upiRating > 70 && mobileRating < 50 && mobileRating > 0) {
    flags_out.push(flag(
      "SPIKE_002",
      "Recent transaction volume significantly exceeds established payment pattern",
      "medium",
      combined,
      `UPI data: ${upiSource}, mobile data: ${mobileSource}`
    ));
  }

  return flags_out;
}

/**
 * Rule 4: High Transaction Velocity
 * Detects unusually high transaction frequency that may indicate bot activity.
 *
 * DATA SOURCE: Simulated-only. Requires real-time transaction feed with
 * timestamps to compute velocity.
 */
function checkHighTransactionVelocity(signals) {
  const flags_out = [];

  const upiRating = (signals.upi && signals.upi.rating) || 0;
  const geoRating = (signals.geo && signals.geo.rating) || 0;
  const upiSource = getDataSource(signals.upi);
  const geoSource = getDataSource(signals.geo);
  const combined = (upiSource === "real" && geoSource === "real") ? "real" : "simulated";

  // Very high transactions from unstable location
  if (upiRating > 90 && geoRating < 20) {
    flags_out.push(flag(
      "VELOCITY_001",
      "Extremely high transaction velocity from unstable location — possible bot activity",
      "high",
      combined,
      `UPI data: ${upiSource}, geo data: ${geoSource}`
    ));
  }

  // High transactions with unstable geo
  if (upiRating > 60 && geoRating < 30 && geoRating > 0) {
    flags_out.push(flag(
      "VELOCITY_002",
      "High transactions despite unstable location pattern",
      "medium",
      combined,
      `UPI data: ${upiSource}, geo data: ${geoSource}`
    ));
  }

  return flags_out;
}

/**
 * Rule 5: Repeated Failed Transactions
 * High ratio of failed/bounced transactions indicates payment issues.
 *
 * DATA SOURCE: Can be REAL when derived from XGBoost model features.
 * The model's `failed_tx_ratio` feature (from previous_application.csv)
 * provides real transaction failure data when available. When bureau data
 * is unavailable (current blocker), falls back to slider.
 */
function checkRepeatedFailedTx(signals) {
  const flags_out = [];

  if (signals.failedTx) {
    const failedRating = signals.failedTx.rating;
    const failedValue = signals.failedTx.value;
    const source = getDataSource(signals.failedTx);

    // Many failed transactions
    if (failedRating === 0 || failedValue === "5+") {
      flags_out.push(flag(
        "FAILED_TX_001",
        "More than 5 failed/bounced transactions in recent period — high payment risk",
        "high",
        source,
        `Failed transaction data: ${source}`
      ));
    } else if (failedRating < 50 || failedValue === "3-5") {
      flags_out.push(flag(
        "FAILED_TX_002",
        "Multiple failed transactions detected — moderate payment risk",
        "medium",
        source,
        `Failed transaction data: ${source}`
      ));
    }
  }

  return flags_out;
}

/**
 * Rule 6: Multiple Identity / Synthetic Identity
 * Detects possible synthetic identity fraud.
 *
 * DATA SOURCE: Simulated-only. Zero-digital-presence detection across
 * "all channels" implies checking channels SahayCredit doesn't actually
 * poll (telecom records, multiple bank feeds, social media footprint).
 * This is a known limitation — the rule runs on slider inputs only.
 */
function checkMultipleIdentity(signals) {
  const flags_out = [];

  const mobileRating = (signals.mobile && signals.mobile.rating) || 0;
  const upiRating = (signals.upi && signals.upi.rating) || 0;
  const geoRating = (signals.geo && signals.geo.rating) || 0;
  const ecomRating = (signals.ecommerce && signals.ecommerce.rating) || 0;
  const merchantRating = (signals.merchantRatings && signals.merchantRatings.rating) || 0;

  // Zero digital footprint across all channels
  const totalRating = mobileRating + upiRating + geoRating + ecomRating + merchantRating;
  if (totalRating === 0) {
    flags_out.push(flag(
      "IDENTITY_001",
      "Minimal digital activity — possible synthetic identity profile",
      "high",
      "simulated",
      "Requires multi-channel verification (telecom, bank, social) — not yet connected"
    ));
  }

  // Very low digital presence
  if (totalRating > 0 && totalRating < 50 && mobileRating === 0) {
    flags_out.push(flag(
      "IDENTITY_002",
      "Very limited digital footprint with no mobile payment history",
      "medium",
      "simulated",
      "Requires telecom verification — not yet connected"
    ));
  }

  return flags_out;
}

/**
 * Rule 7: Income vs Cash Flow Mismatch
 * Declared income significantly exceeds observed transaction activity.
 *
 * DATA SOURCE: REAL when the XGBoost model's features (income_stability,
 * spending_ratio, cash_flow_stability) are used. The model features are
 * derived from application_train.csv's actual income/employment data.
 * Psychometric signals remain slider-based.
 */
function checkIncomeCashFlowMismatch(signals, score, modelFeatures) {
  const flags_out = [];

  // Check if we have real model-derived features
  const hasRealFeatures = modelFeatures && modelFeatures._source === "real";

  // If psychometric score suggests high financial capability but
  // transaction signals are very low
  const psychRating = (signals.psychometric && signals.psychometric.rating) || 0;
  const upiRating = (signals.upi && signals.upi.rating) || 0;
  const psychSource = getDataSource(signals.psychometric);
  const upiSource = getDataSource(signals.upi);

  // High self-reported financial discipline but very low actual activity
  if (psychRating > 80 && upiRating < 20) {
    flags_out.push(flag(
      "MISMATCH_001",
      "High declared financial discipline inconsistent with low transaction activity",
      "medium",
      (psychSource === "real" && upiSource === "real") ? "real" : "simulated",
      `Psychometric data: ${psychSource}, UPI data: ${upiSource}`
    ));
  }

  // Score gaming pattern — all features at maximum
  const mobileRating = (signals.mobile && signals.mobile.rating) || 0;
  const geoRating = (signals.geo && signals.geo.rating) || 0;
  const ecomRating = (signals.ecommerce && signals.ecommerce.rating) || 0;

  if (mobileRating >= 95 && upiRating >= 95 && geoRating >= 95 && ecomRating >= 95 && psychRating >= 95) {
    flags_out.push(flag(
      "MISMATCH_002",
      "All behavioral signals at maximum — possible data manipulation or score gaming",
      "high",
      "simulated",
      "Score gaming detection requires cross-referencing multiple independent data sources"
    ));
  }

  // Real feature-based mismatch: if model shows high income_stability but
  // low cash_flow_stability, flag it
  if (hasRealFeatures) {
    const incStab = modelFeatures.income_stability || 0;
    const cfStab = modelFeatures.cash_flow_stability || 0;
    if (incStab > 0.8 && cfStab < 0.3) {
      flags_out.push(flag(
        "MISMATCH_004",
        "Model detects high income stability but poor cash flow — possible income inflation",
        "medium",
        "real",
        "Derived from XGBoost model features (income_stability, cash_flow_stability)"
      ));
    }
  }

  return flags_out;
}


// ── Main Fraud Analysis Function ────────────────────────────────────────────

/**
 * Analyze a borrower's signals for fraud indicators.
 *
 * @param {Object} signals - The borrower's behavioral signals object
 *   Expected shape: { mobile: {rating, detail, _source?}, upi: {...}, ... }
 *   If a signal has _source: "real", it's treated as derived from real data.
 * @param {number} [score] - Optional credit score (300-900) for mismatch checks
 * @param {Object} [modelFeatures] - Optional model feature values for real-data rules
 * @returns {Object} Fraud analysis result
 */
function analyzeFraud(signals, score, modelFeatures) {
  if (!signals || typeof signals !== "object") {
    return {
      riskLevel: "low",
      flags: [],
      manualReviewRequired: false,
      score: 0
    };
  }

  // Run all detection rules
  const allFlags = [
    ...checkCircularTransactions(signals),
    ...checkFakeSalaryCredits(signals),
    ...checkSuddenIncomeSpike(signals),
    ...checkHighTransactionVelocity(signals),
    ...checkRepeatedFailedTx(signals),
    ...checkMultipleIdentity(signals),
    ...checkIncomeCashFlowMismatch(signals, score, modelFeatures),
  ];

  // Deduplicate flags by code
  const seen = new Set();
  const uniqueFlags = allFlags.filter(f => {
    if (seen.has(f.code)) return false;
    seen.add(f.code);
    return true;
  });

  // Compute fraud risk score (0-100)
  const severityWeights = { high: 30, medium: 15, low: 5 };
  let fraudScore = 0;
  uniqueFlags.forEach(f => {
    fraudScore += severityWeights[f.severity] || 10;
  });
  fraudScore = Math.min(100, fraudScore);

  // Determine risk level
  let riskLevel = "low";
  if (fraudScore >= 50) riskLevel = "high";
  else if (fraudScore >= 20) riskLevel = "medium";

  // Manual review required if any high-severity flag or score >= 30
  const hasHighSeverity = uniqueFlags.some(f => f.severity === "high");
  const manualReviewRequired = hasHighSeverity || fraudScore >= 30;

  // Summary statistics
  const realCount = uniqueFlags.filter(f => f.dataSource === "real").length;
  const simCount = uniqueFlags.filter(f => f.dataSource === "simulated").length;

  return {
    riskLevel,
    flags: uniqueFlags,
    manualReviewRequired,
    score: fraudScore,
    dataSourceSummary: {
      realFlags: realCount,
      simulatedFlags: simCount,
      totalFlags: uniqueFlags.length
    }
  };
}

module.exports = {
  analyzeFraud
};
