/**
 * SahayCredit — E-Commerce Purchase Behavior Module
 * ====================================================
 *
 * HOW THIS WORKS (plain language, suitable for demo explanation):
 * ---------------------------------------------------------------
 * This module analyzes a borrower's online purchase history to assess their
 * financial discipline. It looks at four things:
 *
 * 1. PURCHASE FREQUENCY — How regularly does the borrower shop online?
 *    Regular, consistent purchasing patterns suggest stable finances.
 *
 * 2. ORDER VALUE STABILITY — Are their order amounts roughly consistent,
 *    or wildly varying? A stable spending pattern is a positive signal.
 *
 * 3. CATEGORY DIVERSITY — Do they buy from many different categories
 *    (groceries, electronics, clothing) or just one? Diverse spending
 *    suggests a well-rounded, stable lifestyle.
 *
 * 4. DISPUTE/RETURN RATIO — How often do they leave very low reviews
 *    combined with late deliveries? High dispute rates may indicate
 *    impulsive purchasing or unreliable payment behavior.
 *
 * Each feature is scored 0–100 by comparing the borrower's value against
 * calibration thresholds derived from the real Olist Brazilian E-Commerce
 * dataset (96,461 delivered orders from 96,096 customers). The four scores
 * are combined into a single 0–100 sub-score using a transparent weighted sum.
 *
 * IMPORTANT: This is a RULES-BASED scorecard, not a black-box classifier.
 * The Olist dataset has no credit/default label — it is used only to
 * calibrate what "normal" e-commerce behavior looks like. This makes the
 * scoring logic fully transparent and explainable in a live demo.
 *
 * CONSENT REQUIREMENT: This module checks for active e-commerce consent
 * before computing any features. If consent is not granted, it returns null.
 */

const fs = require('fs');
const path = require('path');
const { hasActiveConsent, logDataFetch } = require('../consent');

// ── Load Calibration Data ──────────────────────────────────────────────────
let CALIBRATION = null;

function loadCalibration() {
  const calPath = path.join(__dirname, '../../ml/data/processed/ecommerce_calibration.json');
  try {
    if (fs.existsSync(calPath)) {
      CALIBRATION = JSON.parse(fs.readFileSync(calPath, 'utf-8'));
      console.log(`[Ecommerce] Calibration loaded: ${CALIBRATION.dataset}`);
      return true;
    }
  } catch (err) {
    console.warn('[Ecommerce] Failed to load calibration:', err.message);
  }

  // Hardcoded fallback from published Olist statistics
  CALIBRATION = {
    purchase_frequency: {
      percentiles: { p10: 0.5, p25: 0.8, p50: 1.0, p75: 1.5, p90: 2.5 }
    },
    order_value_stability: {
      percentiles: { p10: 0.05, p25: 0.15, p50: 0.35, p75: 0.65, p90: 1.2 }
    },
    category_diversity: {
      percentiles: { p10: 1, p25: 1, p50: 1, p75: 2, p90: 3 }
    },
    dispute_ratio: {
      percentiles: { p10: 0, p25: 0, p50: 0, p75: 0.05, p90: 0.15 }
    }
  };
  console.log('[Ecommerce] Using hardcoded Olist calibration fallback.');
  return true;
}

// ── Percentile-Based Scoring ───────────────────────────────────────────────
/**
 * Convert a raw feature value into a 0–100 score based on percentile thresholds.
 *
 * @param {number} value - Raw feature value
 * @param {Object} percentiles - { p10, p25, p50, p75, p90 }
 * @param {boolean} invertScale - If true, LOWER values are better (e.g., dispute ratio)
 * @returns {number} Score 0–100
 */
function percentileScore(value, percentiles, invertScale = false) {
  const { p10, p25, p50, p75, p90 } = percentiles;

  let score;
  if (value <= p10) score = 10;
  else if (value <= p25) score = 25;
  else if (value <= p50) score = 50;
  else if (value <= p75) score = 75;
  else if (value <= p90) score = 90;
  else score = 95;

  return invertScale ? (100 - score) : score;
}

// ── Feature Extractors ────────────────────────────────────────────────────

/**
 * Calculate purchase frequency from an order history.
 *
 * @param {Array} orders - Array of order objects with `date` (ISO string) and `amount`
 * @returns {number} Orders per month
 */
function calcPurchaseFrequency(orders) {
  if (!orders || orders.length === 0) return 0;
  if (orders.length === 1) return 1;

  const dates = orders.map(o => new Date(o.date)).sort((a, b) => a - b);
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const monthsSpan = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30.44));

  return orders.length / monthsSpan;
}

/**
 * Calculate coefficient of variation of order values (lower = more stable).
 *
 * @param {Array} orders - Array of order objects with `amount`
 * @returns {number} CV ratio (0 = perfectly stable)
 */
function calcOrderValueCV(orders) {
  if (!orders || orders.length < 2) return 0;

  const amounts = orders.map(o => o.amount).filter(a => a > 0);
  if (amounts.length < 2) return 0;

  const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  if (mean === 0) return 0;

  const variance = amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Count distinct product categories in the order history.
 *
 * @param {Array} orders - Array of order objects with optional `category` field
 * @returns {number} Number of distinct categories
 */
function calcCategoryDiversity(orders) {
  if (!orders || orders.length === 0) return 0;

  const categories = new Set();
  for (const order of orders) {
    if (order.category) {
      categories.add(order.category.toLowerCase());
    }
  }

  return categories.size || 1; // At least 1 if orders exist
}

/**
 * Calculate dispute/return proxy ratio.
 * Uses combination of low review score (1-2 stars) and late delivery flag.
 *
 * @param {Array} orders - Array of order objects with optional `reviewScore` and `wasLate`
 * @returns {number} Dispute ratio (0 to 1)
 */
function calcDisputeRatio(orders) {
  if (!orders || orders.length === 0) return 0;

  let disputes = 0;
  for (const order of orders) {
    const lowReview = order.reviewScore && order.reviewScore <= 2;
    const wasLate = order.wasLate === true;
    if (lowReview && wasLate) disputes++;
  }

  return disputes / orders.length;
}


// ── Main Scoring Function ──────────────────────────────────────────────────

/**
 * Compute the e-commerce sub-score for a borrower.
 *
 * @param {string} borrowerId - Borrower's unique ID
 * @param {Array} orderHistory - Array of order objects:
 *   [{ date: "2025-01-15", amount: 1200, category: "electronics",
 *      reviewScore: 4, wasLate: false }, ...]
 * @returns {Object|null} Sub-score result, or null if consent not granted
 *   { subScore: 72, features: {...}, contributing: true }
 */
function computeEcommerceScore(borrowerId, orderHistory) {
  // ── Consent gate ──
  if (!hasActiveConsent(borrowerId, 'ecommerce')) {
    return null;
  }

  // Log the data fetch for audit purposes
  logDataFetch(borrowerId, 'ecommerce');

  // Ensure calibration is loaded
  if (!CALIBRATION) loadCalibration();

  // Handle empty order history
  if (!orderHistory || orderHistory.length === 0) {
    return {
      subScore: 0,
      contributing: false,
      features: {
        purchaseFrequency: { raw: 0, score: 0 },
        orderValueStability: { raw: 0, score: 0 },
        categoryDiversity: { raw: 0, score: 0 },
        disputeRatio: { raw: 0, score: 100 }
      },
      explanation: 'No e-commerce order history available'
    };
  }

  // ── Extract features ──
  const freqRaw = calcPurchaseFrequency(orderHistory);
  const cvRaw = calcOrderValueCV(orderHistory);
  const catRaw = calcCategoryDiversity(orderHistory);
  const disputeRaw = calcDisputeRatio(orderHistory);

  // ── Score each feature against calibration ──
  const freqScore = percentileScore(freqRaw, CALIBRATION.purchase_frequency.percentiles);
  const stabilityScore = percentileScore(cvRaw, CALIBRATION.order_value_stability.percentiles, true);
  const catScore = percentileScore(catRaw, CALIBRATION.category_diversity.percentiles);
  const disputeScore = percentileScore(disputeRaw, CALIBRATION.dispute_ratio.percentiles, true);

  // ── Weighted composite ──
  // Weights: frequency 30%, stability 25%, diversity 20%, dispute 25%
  const subScore = Math.round(
    0.30 * freqScore +
    0.25 * stabilityScore +
    0.20 * catScore +
    0.25 * disputeScore
  );

  return {
    subScore: Math.max(0, Math.min(100, subScore)),
    contributing: true,
    features: {
      purchaseFrequency: { raw: Math.round(freqRaw * 100) / 100, score: freqScore },
      orderValueStability: { raw: Math.round(cvRaw * 100) / 100, score: stabilityScore },
      categoryDiversity: { raw: catRaw, score: catScore },
      disputeRatio: { raw: Math.round(disputeRaw * 1000) / 1000, score: disputeScore }
    },
    explanation: `E-commerce score based on ${orderHistory.length} orders: ` +
                 `frequency=${freqScore}/100, stability=${stabilityScore}/100, ` +
                 `diversity=${catScore}/100, disputes=${disputeScore}/100`
  };
}

module.exports = {
  loadCalibration,
  computeEcommerceScore,
  // Exported for testing
  calcPurchaseFrequency,
  calcOrderValueCV,
  calcCategoryDiversity,
  calcDisputeRatio
};
