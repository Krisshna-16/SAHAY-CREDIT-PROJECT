/**
 * SahayCredit — Composite Scoring Engine
 * ========================================
 *
 * HOW THIS WORKS (plain language, suitable for demo explanation):
 * ---------------------------------------------------------------
 * The composite score merges the core financial score (from the XGBoost model)
 * with up to two alternative-data sub-scores:
 *   - E-Commerce purchase behavior (if consented)
 *   - Merchant/business ratings (if consented AND MSME)
 *
 * The core financial model is ALWAYS the dominant anchor (≥60% weight).
 * Alternative data can only IMPROVE the overall picture — it adds resolution,
 * not risk. If a borrower doesn't consent to sharing alt data, they still
 * get a score from the core model alone. No penalty for opting out.
 *
 * WEIGHT SCHEDULE:
 *   Core only:           100% core
 *   Core + 1 alt source: 75% core / 25% alt
 *   Core + 2 alt sources: 60% core / 20% ecom / 20% merchant
 *
 * CONFIDENCE SCORE:
 *   1 source → 55% confidence
 *   2 sources → 72% confidence
 *   3 sources → 85% confidence
 *
 * IMPORTANT: The composite score is a CALIBRATED score on the 300–900 scale.
 * Alt-data sub-scores (0–100) are rescaled to the credit score range before
 * weighted combination.
 */

/**
 * Compute the composite credit score from core + alt-data sub-scores.
 *
 * @param {number} coreScore - Core financial score (300–900) from scoring.js
 * @param {Object|null} ecommerceResult - From ecommerce.js or null
 *   { subScore: 0-100, contributing: boolean, features: {...} }
 * @param {Object|null} merchantResult - From merchant.js or null
 *   { subScore: 0-100, contributing: boolean, features: {...} }
 * @returns {Object} Composite result
 */
function computeCompositeScore(coreScore, ecommerceResult, merchantResult) {
  // Determine which sources are contributing
  const hasEcom = ecommerceResult && ecommerceResult.contributing === true;
  const hasMerchant = merchantResult && merchantResult.contributing === true;

  const sourceCount = 1 + (hasEcom ? 1 : 0) + (hasMerchant ? 1 : 0);

  // If only core model, return it directly
  if (!hasEcom && !hasMerchant) {
    return {
      compositeScore: coreScore,
      sourceCount: 1,
      weights: { core: 1.0 },
      breakdown: {
        core: { score: coreScore, weight: 1.0, label: 'Core Financial Model' }
      },
      confidenceScore: 55,
      confidenceLabel: 'Moderate',
      explanation: 'Score based solely on core financial model (XGBoost).'
    };
  }

  // Rescale alt-data sub-scores (0-100) to credit score range (300-900)
  const rescale = (subScore) => 300 + (subScore / 100) * 600;

  // Determine weights
  let weights;
  if (hasEcom && hasMerchant) {
    weights = { core: 0.60, ecommerce: 0.20, merchant: 0.20 };
  } else if (hasEcom) {
    weights = { core: 0.75, ecommerce: 0.25 };
  } else {
    weights = { core: 0.75, merchant: 0.25 };
  }

  // Compute weighted composite
  let composite = weights.core * coreScore;
  const breakdown = {
    core: { score: coreScore, weight: weights.core, label: 'Core Financial Model (XGBoost)' }
  };

  if (hasEcom) {
    const ecomScaled = rescale(ecommerceResult.subScore);
    composite += weights.ecommerce * ecomScaled;
    breakdown.ecommerce = {
      score: ecomScaled,
      subScore: ecommerceResult.subScore,
      weight: weights.ecommerce,
      label: 'E-Commerce Behavior',
      features: ecommerceResult.features,
      explanation: ecommerceResult.explanation
    };
  }

  if (hasMerchant) {
    const merchantScaled = rescale(merchantResult.subScore);
    composite += weights.merchant * merchantScaled;
    breakdown.merchant = {
      score: merchantScaled,
      subScore: merchantResult.subScore,
      weight: weights.merchant,
      label: 'Merchant Ratings (MSME)',
      features: merchantResult.features,
      explanation: merchantResult.explanation
    };
  }

  // Clamp to valid range
  const finalScore = Math.round(Math.max(300, Math.min(900, composite)));

  // Confidence based on number of contributing sources
  const confidenceMap = { 1: 55, 2: 72, 3: 85 };
  const confidenceLabelMap = { 1: 'Moderate', 2: 'Good', 3: 'High' };

  // Build explanation
  const parts = [`Core model (${Math.round(weights.core * 100)}%)`];
  if (hasEcom) parts.push(`E-commerce (${Math.round(weights.ecommerce * 100)}%: ${ecommerceResult.subScore}/100)`);
  if (hasMerchant) parts.push(`Merchant ratings (${Math.round(weights.merchant * 100)}%: ${merchantResult.subScore}/100)`);

  return {
    compositeScore: finalScore,
    sourceCount,
    weights,
    breakdown,
    confidenceScore: confidenceMap[sourceCount],
    confidenceLabel: confidenceLabelMap[sourceCount],
    explanation: `Composite from ${sourceCount} source(s): ${parts.join(', ')}.`
  };
}

module.exports = {
  computeCompositeScore
};
