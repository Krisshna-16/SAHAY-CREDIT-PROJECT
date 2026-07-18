/**
 * SahayCredit — Composite Scoring Engine (v2 — with Behaviour sub-score)
 * ========================================================================
 *
 * HOW THIS WORKS (plain language, suitable for demo explanation):
 * ---------------------------------------------------------------
 * The composite score merges the core financial score (from the XGBoost model)
 * with up to three alternative-data sub-scores:
 *   - E-Commerce purchase behavior (if consented)
 *   - Merchant/business ratings (if consented AND MSME)
 *   - Behaviour Risk Score from AA transaction data (if consented)
 *
 * The core financial model is ALWAYS the dominant anchor (≥50% weight).
 * Alternative data can only IMPROVE the overall picture — it adds resolution,
 * not risk. If a borrower doesn't consent to sharing alt data, they still
 * get a score from the core model alone. No penalty for opting out.
 *
 * WEIGHT SCHEDULE:
 *   Core only:            100% core
 *   Core + 1 alt source:  75% core / 25% alt
 *   Core + 2 alt sources: 60% core / 20% alt / 20% alt
 *   Core + 3 alt sources: 50% core / 17% alt / 17% alt / 16% alt
 *
 * CONFIDENCE SCORE:
 *   1 source  → 55% confidence (Moderate)
 *   2 sources → 72% confidence (Good)
 *   3 sources → 85% confidence (High)
 *   4 sources → 92% confidence (Very High)
 *
 * IMPORTANT: The composite score is a CALIBRATED score on the 300–900 scale.
 * Alt-data sub-scores (0–100) are rescaled to the credit score range before
 * weighted combination.
 *
 * FRAUD GATE: Fraud detection is INDEPENDENT — it never blends into the
 * weighted composite. A flagged applicant goes to manual review regardless
 * of their composite score.
 */

/**
 * Compute the composite credit score from core + alt-data sub-scores.
 *
 * @param {number} coreScore - Core financial score (300–900) from scoring.js
 * @param {Object|null} ecommerceResult - From ecommerce.js or null
 *   { subScore: 0-100, contributing: boolean, features: {...} }
 * @param {Object|null} merchantResult - From merchant.js or null
 *   { subScore: 0-100, contributing: boolean, features: {...} }
 * @param {Object|null} behaviourResult - From behaviourInference.js or null
 *   { subScore: 0-100, contributing: boolean, features: {...}, coefficientBreakdown: {...} }
 * @returns {Object} Composite result
 */
function computeCompositeScore(coreScore, ecommerceResult, merchantResult, behaviourResult) {
  // Determine which sources are contributing
  const hasEcom = ecommerceResult && ecommerceResult.contributing === true;
  const hasMerchant = merchantResult && merchantResult.contributing === true;
  const hasBehaviour = behaviourResult && behaviourResult.contributing === true;

  const altCount = (hasEcom ? 1 : 0) + (hasMerchant ? 1 : 0) + (hasBehaviour ? 1 : 0);
  const sourceCount = 1 + altCount;

  // If only core model, return it directly
  if (altCount === 0) {
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

  // Determine weights based on number of contributing alt sources
  let weights;
  const altSources = [];
  if (hasEcom) altSources.push('ecommerce');
  if (hasMerchant) altSources.push('merchant');
  if (hasBehaviour) altSources.push('behaviour');

  if (altCount === 1) {
    weights = { core: 0.75 };
    weights[altSources[0]] = 0.25;
  } else if (altCount === 2) {
    weights = { core: 0.60 };
    weights[altSources[0]] = 0.20;
    weights[altSources[1]] = 0.20;
  } else if (altCount === 3) {
    weights = { core: 0.50 };
    weights[altSources[0]] = 0.17;
    weights[altSources[1]] = 0.17;
    weights[altSources[2]] = 0.16;
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

  if (hasBehaviour) {
    const behaviourScaled = rescale(behaviourResult.subScore);
    composite += weights.behaviour * behaviourScaled;
    breakdown.behaviour = {
      score: behaviourScaled,
      subScore: behaviourResult.subScore,
      weight: weights.behaviour,
      label: 'Behaviour Risk Score (AA)',
      features: behaviourResult.features,
      coefficientBreakdown: behaviourResult.coefficientBreakdown,
      probabilityOfDefault: behaviourResult.probabilityOfDefault,
      confidence: behaviourResult.confidence,
      explanation: behaviourResult.explanation
    };
  }

  // Clamp to valid range
  const finalScore = Math.round(Math.max(300, Math.min(900, composite)));

  // Confidence based on number of contributing sources
  const confidenceMap = { 1: 55, 2: 72, 3: 85, 4: 92 };
  const confidenceLabelMap = { 1: 'Moderate', 2: 'Good', 3: 'High', 4: 'Very High' };

  // Build explanation
  const parts = [`Core model (${Math.round(weights.core * 100)}%)`];
  if (hasEcom) parts.push(`E-commerce (${Math.round(weights.ecommerce * 100)}%: ${ecommerceResult.subScore}/100)`);
  if (hasMerchant) parts.push(`Merchant ratings (${Math.round(weights.merchant * 100)}%: ${merchantResult.subScore}/100)`);
  if (hasBehaviour) parts.push(`Behaviour (${Math.round(weights.behaviour * 100)}%: ${behaviourResult.subScore}/100)`);

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
