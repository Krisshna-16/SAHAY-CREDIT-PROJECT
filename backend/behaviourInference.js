/**
 * SahayCredit — Behaviour Risk Inference Engine (Module 4)
 * =========================================================
 *
 * HOW THIS WORKS (plain language, suitable for demo explanation):
 * ---------------------------------------------------------------
 * This module computes a "Behaviour Score" from a borrower's bank
 * transaction history (received via the RBI Account Aggregator framework).
 *
 * It mirrors the exact feature engineering logic used during training
 * (Python → JavaScript port) to prevent train/inference skew:
 *
 * 1. AA PAYLOAD ADAPTER: Converts AA-standard JSON into internal schema
 * 2. FEATURE EXTRACTION: 9 behavioural features + 1 composite index
 * 3. WOE TRANSFORMATION: Maps raw features through saved WOE bins
 * 4. LOGISTIC REGRESSION: Applies saved coefficients → log-odds → sigmoid → PD
 * 5. CALIBRATION: Applies Platt scaling from the saved calibration map
 *
 * CONSENT REQUIREMENT: This module checks for active "behaviour" consent
 * before computing any features. If consent is not granted, it returns null.
 *
 * The model bundle (behaviour_model_bundle.json) is loaded once at startup.
 */

const fs = require('fs');
const path = require('path');
const { hasActiveConsent, logDataFetch } = require('./consent');

// ── Model Bundle ────────────────────────────────────────────────────────────
let MODEL_BUNDLE = null;

function loadBehaviourModel() {
  const bundlePath = path.join(__dirname, '../ml/behaviour/models/behaviour_model_bundle.json');
  try {
    if (fs.existsSync(bundlePath)) {
      MODEL_BUNDLE = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'));
      console.log(`[Behaviour] Model loaded: v${MODEL_BUNDLE.version}, AUC=${MODEL_BUNDLE.roc_auc.toFixed(4)}`);
      return true;
    }
  } catch (err) {
    console.warn('[Behaviour] Failed to load model bundle:', err.message);
  }
  console.warn('[Behaviour] Model bundle not found. Behaviour scoring will be unavailable.');
  return false;
}


// ── AA Payload Adapter ──────────────────────────────────────────────────────
/**
 * Convert RBI Account Aggregator standard transaction JSON into internal schema.
 *
 * AA payload format (simplified):
 * {
 *   transactions: [
 *     { date: "2024-01-15", type: "CREDIT", amount: 25000, balance: 45000, narration: "..." },
 *     { date: "2024-01-16", type: "DEBIT",  amount: 5000,  balance: 40000, narration: "..." }
 *   ],
 *   orders: [] // standing orders (optional)
 * }
 *
 * Internal schema mirrors Berka:
 *   { date_dt: Date, type: "PRIJEM"|"VYDAJ"|"VYBER", amount: number, balance: number, k_symbol: string }
 */
function parseAAPayload(aaJson) {
  if (!aaJson || !aaJson.transactions || !Array.isArray(aaJson.transactions)) {
    return { transactions: [], orders: [] };
  }

  const transactions = aaJson.transactions.map(tx => {
    // Map AA type to Berka-equivalent
    let berkaType = 'VYDAJ';
    if (tx.type === 'CREDIT' || tx.type === 'credit' || tx.type === 'CR') {
      berkaType = 'PRIJEM';
    } else if (tx.type === 'DEBIT' || tx.type === 'debit' || tx.type === 'DR') {
      berkaType = 'VYDAJ';
    }

    return {
      date_dt: new Date(tx.date),
      type: berkaType,
      amount: parseFloat(tx.amount) || 0,
      balance: parseFloat(tx.balance) || 0,
      k_symbol: tx.category || tx.narration || '',
      operation: tx.mode || ''
    };
  });

  const orders = (aaJson.orders || []).map(o => ({
    amount: parseFloat(o.amount) || 0,
    k_symbol: o.category || ''
  }));

  return { transactions, orders };
}


// ── Feature Functions (JS ports of Python originals) ───────────────────────

function computeCashFlowStability(transactions) {
  if (transactions.length === 0) return { value: 0.0, sourceType: 'direct' };

  // Group by month
  const monthly = {};
  transactions.forEach(tx => {
    const key = `${tx.date_dt.getFullYear()}-${String(tx.date_dt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = 0;
    const dir = tx.type === 'PRIJEM' ? 1.0 : -1.0;
    monthly[key] += tx.amount * dir;
  });

  const flows = Object.values(monthly);
  if (flows.length < 2) return { value: 1.0, sourceType: 'direct' };

  const mean = flows.reduce((a, b) => a + b, 0) / flows.length;
  const variance = flows.reduce((a, b) => a + (b - mean) ** 2, 0) / flows.length;
  const std = Math.sqrt(variance);
  const cov = Math.abs(mean) > 1.0 ? std / Math.abs(mean) : std;

  return { value: isFinite(cov) ? cov : 0.0, sourceType: 'direct' };
}

function computeBalanceTrend(transactions) {
  if (transactions.length < 2) return { value: 0.0, sourceType: 'direct' };

  const sorted = [...transactions].sort((a, b) => a.date_dt - b.date_dt);
  const firstDate = sorted[0].date_dt.getTime();
  const n = sorted.length;
  const x = sorted.map(tx => (tx.date_dt.getTime() - firstDate) / 86400000);
  const y = sorted.map(tx => tx.balance);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;

  return { value: slope, sourceType: 'direct' };
}

function computeIncomeExpenseRatio(transactions) {
  if (transactions.length === 0) return { value: 1.0, sourceType: 'direct' };

  const monthly = {};
  transactions.forEach(tx => {
    const key = `${tx.date_dt.getFullYear()}-${String(tx.date_dt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = { credits: 0, debits: 0 };
    if (tx.type === 'PRIJEM') monthly[key].credits += tx.amount;
    else monthly[key].debits += tx.amount;
  });

  const ratios = Object.values(monthly).map(m => m.credits / Math.max(1.0, m.debits));
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return { value: avg, sourceType: 'direct' };
}

function computeSpendingVolatility(transactions) {
  if (transactions.length === 0) return { value: 0.0, sourceType: 'direct' };

  const monthly = {};
  transactions.filter(tx => tx.type !== 'PRIJEM').forEach(tx => {
    const key = `${tx.date_dt.getFullYear()}-${String(tx.date_dt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = 0;
    monthly[key] += tx.amount;
  });

  const totals = Object.values(monthly);
  if (totals.length < 2) return { value: 0.0, sourceType: 'direct' };

  const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
  const variance = totals.reduce((a, b) => a + (b - mean) ** 2, 0) / (totals.length - 1);
  return { value: Math.sqrt(variance), sourceType: 'direct' };
}

function computeRecurringPaymentDiscipline(transactions) {
  let score = 100.0;

  // Sanction interest penalties
  const penalties = transactions.filter(tx =>
    tx.k_symbol && tx.k_symbol.includes('SANKC')
  );
  if (penalties.length > 0) score -= Math.min(50, penalties.length * 15);

  // Negative balance count
  const negBal = transactions.filter(tx => tx.balance < 0);
  if (negBal.length > 0) score -= Math.min(30, negBal.length * 5);

  return { value: Math.max(0, score), sourceType: 'direct' };
}

function _inferSalaryMedian(transactions) {
  const credits = transactions
    .filter(tx => tx.type === 'PRIJEM' && tx.amount >= 2000)
    .map(tx => tx.amount);
  if (credits.length === 0) return 0;
  credits.sort((a, b) => a - b);
  const mid = Math.floor(credits.length / 2);
  return credits.length % 2 ? credits[mid] : (credits[mid - 1] + credits[mid]) / 2;
}

function computeSalaryRegularity(transactions) {
  if (transactions.length === 0) return { value: 0.0, sourceType: 'proxy' };
  const median = _inferSalaryMedian(transactions);
  if (median <= 0) return { value: 0.0, sourceType: 'proxy' };

  const monthly = {};
  transactions.forEach(tx => {
    const key = `${tx.date_dt.getFullYear()}-${String(tx.date_dt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) monthly[key] = [];
    if (tx.type === 'PRIJEM') monthly[key].push(tx.amount);
  });

  const months = Object.keys(monthly);
  let hits = 0;
  months.forEach(m => {
    const match = monthly[m].some(a => a >= 0.8 * median && a <= 1.2 * median);
    if (match) hits++;
  });

  return { value: months.length > 0 ? hits / months.length : 0, sourceType: 'proxy' };
}

function computeIncomeConsistency(transactions) {
  const median = _inferSalaryMedian(transactions);
  if (median <= 0) return { value: 0.0, sourceType: 'proxy' };

  const salaryCredits = transactions
    .filter(tx => tx.type === 'PRIJEM' && tx.amount >= 0.8 * median && tx.amount <= 1.2 * median)
    .map(tx => tx.amount);

  if (salaryCredits.length < 2) return { value: 0.0, sourceType: 'proxy' };

  const mean = salaryCredits.reduce((a, b) => a + b, 0) / salaryCredits.length;
  const variance = salaryCredits.reduce((a, b) => a + (b - mean) ** 2, 0) / (salaryCredits.length - 1);
  const cov = mean > 0 ? Math.sqrt(variance) / mean : 0;

  return { value: cov, sourceType: 'proxy' };
}

function computeMonthlyIncome(transactions) {
  const median = _inferSalaryMedian(transactions);
  if (median <= 0) {
    const credits = transactions.filter(tx => tx.type === 'PRIJEM');
    if (credits.length === 0) return { value: 0, sourceType: 'proxy' };
    const monthly = {};
    credits.forEach(tx => {
      const key = `${tx.date_dt.getFullYear()}-${String(tx.date_dt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = 0;
      monthly[key] += tx.amount;
    });
    const vals = Object.values(monthly);
    return { value: vals.reduce((a, b) => a + b, 0) / vals.length, sourceType: 'proxy' };
  }

  const salaryCredits = transactions
    .filter(tx => tx.type === 'PRIJEM' && tx.amount >= 0.8 * median && tx.amount <= 1.2 * median)
    .map(tx => tx.amount);

  const avg = salaryCredits.length > 0
    ? salaryCredits.reduce((a, b) => a + b, 0) / salaryCredits.length
    : median;

  return { value: avg, sourceType: 'proxy' };
}

function computeSavingsRatio(transactions) {
  if (transactions.length < 2) return { value: 0.0, sourceType: 'direct' };

  const sorted = [...transactions].sort((a, b) => a.date_dt - b.date_dt);
  const start = sorted[0].balance;
  const end = sorted[sorted.length - 1].balance;
  const totalCredits = sorted
    .filter(tx => tx.type === 'PRIJEM')
    .reduce((s, tx) => s + tx.amount, 0);

  if (totalCredits <= 0) return { value: 0.0, sourceType: 'direct' };
  const ratio = Math.max(-1, Math.min(1, (end - start) / totalCredits));
  return { value: ratio, sourceType: 'direct' };
}

function computeFinancialStabilityIndex(features) {
  const cov = features.cash_flow_stability.value;
  const normStability = Math.max(0, Math.min(100, (2.0 - cov) * 50));

  const slope = features.balance_trend.value;
  const normTrend = Math.max(0, Math.min(100, 50 + slope / 10));

  const ratio = features.income_to_expense_ratio.value;
  const normIeRatio = Math.max(0, Math.min(100, ratio * 50));

  const monthlyIncome = features.monthly_income.value;
  const spendVol = features.spending_volatility.value;
  const relVol = spendVol / Math.max(100, monthlyIncome);
  const normVol = Math.max(0, Math.min(100, (1 - relVol) * 100));

  const normDiscipline = features.recurring_payment_discipline.value;
  const normSalaryReg = features.salary_regularity.value * 100;

  const incCov = features.income_consistency.value;
  const normIncCons = Math.max(0, Math.min(100, (1 - incCov) * 100));

  const savingsRatio = features.savings_ratio.value;
  const normSavings = (savingsRatio + 1) * 50;

  const index =
    0.25 * normDiscipline +
    0.15 * normStability +
    0.15 * normIeRatio +
    0.15 * normSalaryReg +
    0.15 * normSavings +
    0.05 * normTrend +
    0.05 * normVol +
    0.05 * normIncCons;

  return { value: index, sourceType: 'composite' };
}


// ── WOE + Logistic Regression Inference ─────────────────────────────────────

function applyWoe(value, bins) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return bins.reduce((best, b) => b.count > best.count ? b : best, bins[0]).woe;
  }
  for (const b of bins) {
    if (value > b.lower && value <= b.upper) return b.woe;
  }
  if (value <= bins[0].upper) return bins[0].woe;
  return bins[bins.length - 1].woe;
}

function sigmoid(z) {
  return 1.0 / (1.0 + Math.exp(-z));
}

function applyCalibration(rawPd, calibrationMap) {
  // Piecewise linear interpolation from calibration map
  if (!calibrationMap || calibrationMap.length < 2) return rawPd;

  for (let i = 0; i < calibrationMap.length - 1; i++) {
    const lo = calibrationMap[i];
    const hi = calibrationMap[i + 1];
    if (rawPd >= lo.raw && rawPd <= hi.raw) {
      const t = (rawPd - lo.raw) / Math.max(1e-10, hi.raw - lo.raw);
      return lo.calibrated + t * (hi.calibrated - lo.calibrated);
    }
  }
  // Edge cases
  if (rawPd < calibrationMap[0].raw) return calibrationMap[0].calibrated;
  return calibrationMap[calibrationMap.length - 1].calibrated;
}


// ── Main Scoring Function ───────────────────────────────────────────────────

/**
 * Compute behaviour score from transaction data.
 *
 * @param {string} borrowerId - Unique borrower ID
 * @param {Object} transactionData - AA-standard transaction JSON
 * @returns {Object|null} Score result, or null if consent not active / model not loaded
 */
function computeBehaviourScore(borrowerId, transactionData) {
  // Check consent
  if (!hasActiveConsent(borrowerId, 'behaviour')) {
    return null;
  }

  // Check model loaded
  if (!MODEL_BUNDLE) {
    console.warn('[Behaviour] Model not loaded — cannot score.');
    return null;
  }

  logDataFetch(borrowerId, 'behaviour');

  // Parse AA payload
  const { transactions } = parseAAPayload(transactionData);

  if (transactions.length === 0) {
    return {
      subScore: 0,
      contributing: false,
      probabilityOfDefault: 0.5,
      behaviourScore: 0,
      coefficientBreakdown: {},
      confidence: 'Low',
      dataCompleteness: 0,
      features: {},
      explanation: 'No transaction data available'
    };
  }

  // Compute features
  const features = {
    cash_flow_stability: computeCashFlowStability(transactions),
    balance_trend: computeBalanceTrend(transactions),
    income_to_expense_ratio: computeIncomeExpenseRatio(transactions),
    spending_volatility: computeSpendingVolatility(transactions),
    recurring_payment_discipline: computeRecurringPaymentDiscipline(transactions),
    salary_regularity: computeSalaryRegularity(transactions),
    income_consistency: computeIncomeConsistency(transactions),
    monthly_income: computeMonthlyIncome(transactions),
    savings_ratio: computeSavingsRatio(transactions)
  };

  features.financial_stability_index = computeFinancialStabilityIndex(features);

  // Apply WOE bins
  let logOdds = MODEL_BUNDLE.intercept;
  const coefficientBreakdown = {};

  for (const feat of MODEL_BUNDLE.feature_names) {
    const rawVal = features[feat].value;
    const woeVal = applyWoe(rawVal, MODEL_BUNDLE.woe_bins[feat]);
    const coef = MODEL_BUNDLE.coefficients[feat];
    const contribution = woeVal * coef;
    logOdds += contribution;

    const displayName = MODEL_BUNDLE.feature_display_names[feat] || { en: feat, hi: feat };
    coefficientBreakdown[feat] = {
      rawValue: rawVal,
      woeValue: woeVal,
      coefficient: coef,
      contribution: contribution,
      displayName: displayName,
      sourceType: features[feat].sourceType
    };
  }

  // Sigmoid to PD
  const rawPd = sigmoid(logOdds);
  const pd = applyCalibration(rawPd, MODEL_BUNDLE.calibration_map);

  // Convert PD to score (0-100, higher = less risky)
  const behaviourScore = Math.round(Math.max(0, Math.min(100, (1 - pd) * 100)));

  // Confidence based on data completeness
  const nonZeroFeatures = Object.values(features).filter(f => f.value !== 0).length;
  const completeness = nonZeroFeatures / Object.keys(features).length;
  let confidence = 'Low';
  if (completeness >= 0.8) confidence = 'High';
  else if (completeness >= 0.5) confidence = 'Medium';

  // Sort contributions for explanation (top factors)
  const sortedFactors = Object.entries(coefficientBreakdown)
    .sort(([, a], [, b]) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 5);

  const factorExplanations = sortedFactors.map(([name, data]) => {
    const dir = data.contribution < 0 ? 'increases' : 'decreases';
    const pts = Math.abs(Math.round(data.contribution * 10));
    return `${data.displayName.en} ${dir} risk by ${pts} pts`;
  });

  return {
    subScore: behaviourScore,
    contributing: true,
    probabilityOfDefault: pd,
    behaviourScore,
    coefficientBreakdown,
    confidence,
    dataCompleteness: completeness,
    features,
    explanation: `Behaviour score ${behaviourScore}/100 from ${transactions.length} transactions. ${factorExplanations.join('. ')}.`
  };
}


module.exports = {
  loadBehaviourModel,
  parseAAPayload,
  computeBehaviourScore,
  // Exported for testing
  computeCashFlowStability,
  computeBalanceTrend,
  computeIncomeExpenseRatio,
  computeSpendingVolatility,
  computeRecurringPaymentDiscipline,
  computeSalaryRegularity,
  computeIncomeConsistency,
  computeMonthlyIncome,
  computeSavingsRatio,
  computeFinancialStabilityIndex
};
