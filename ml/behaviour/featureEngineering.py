"""
SahayCredit — Behavioural Feature Engineering Module
=====================================================
Computes 9 behavioural features + 1 composite index from Berka transaction history.
Enforces strict date windowing to prevent label leakage.

Usage:
    python ml/behaviour/featureEngineering.py
"""
import sys
import argparse
import numpy as np
import pandas as pd
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = ROOT / "ml" / "behaviour" / "data" / "raw"


def parse_berka_date(date_val):
    """
    Parse Berka date (YYMMDD format) to datetime.
    Example: 930705 -> 1993-07-05
    """
    if isinstance(date_val, pd.Series):
        return pd.to_datetime(date_val.astype(str).str.zfill(6), format="%y%m%d")
    date_str = str(int(date_val)).zfill(6)
    return pd.to_datetime(date_str, format="%y%m%d")


# ── Feature 1: Cash Flow Stability (Direct) ──────────────────────────────────
def computeCashFlowStability(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Monthly net cash flow (credits - debits) per account; coefficient of variation across months.
    Direct source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    if len(df) == 0:
        return {"value": 0.0, "sourceType": "direct"}

    # Assign direction
    df['direction'] = df['type'].map({'PRIJEM': 1.0, 'VYDAJ': -1.0, 'VYBER': -1.0}).fillna(-1.0)
    df['net_amount'] = df['amount'] * df['direction']
    
    # Group by month
    df['month'] = df['date_dt'].dt.to_period('M')
    monthly_flows = df.groupby('month')['net_amount'].sum()
    
    if len(monthly_flows) < 2:
        return {"value": 1.0, "sourceType": "direct"}  # default fallback stability (lower is better or standard CoV)

    mean_flow = monthly_flows.mean()
    std_flow = monthly_flows.std()
    
    # CoV = std / abs(mean)
    cov = std_flow / abs(mean_flow) if abs(mean_flow) > 1.0 else std_flow
    if np.isnan(cov) or np.isinf(cov):
        cov = 0.0
        
    return {"value": float(cov), "sourceType": "direct"}


# ── Feature 2: Balance Trend (Direct) ────────────────────────────────────────
def computeBalanceTrend(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Linear regression slope of balance over time.
    Direct source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    if len(df) < 2:
        return {"value": 0.0, "sourceType": "direct"}

    df = df.sort_values('date_dt')
    first_date = df['date_dt'].min()
    df['days'] = (df['date_dt'] - first_date).dt.days

    # Linear regression slope: N * sum(x*y) - sum(x)*sum(y) / (N * sum(x^2) - (sum(x))^2)
    n = len(df)
    x = df['days'].values
    y = df['balance'].values
    denom = (n * np.sum(x**2) - (np.sum(x))**2)
    if denom == 0:
        slope = 0.0
    else:
        slope = (n * np.sum(x * y) - np.sum(x) * np.sum(y)) / denom

    return {"value": float(slope), "sourceType": "direct"}


# ── Feature 3: Income-to-Expense Ratio (Direct) ────────────────────────────────
def computeIncomeExpenseRatio(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Ratio of Sum(credits)/Sum(debits) per month, averaged.
    Direct source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    if len(df) == 0:
        return {"value": 1.0, "sourceType": "direct"}

    df['month'] = df['date_dt'].dt.to_period('M')
    
    # Calculate monthly credits and debits
    monthly_stats = []
    for month, group in df.groupby('month'):
        credits = group[group['type'] == 'PRIJEM']['amount'].sum()
        debits = group[group['type'].isin(['VYDAJ', 'VYBER'])]['amount'].sum()
        ratio = credits / max(1.0, debits)
        monthly_stats.append(ratio)
        
    avg_ratio = np.mean(monthly_stats) if monthly_stats else 1.0
    return {"value": float(avg_ratio), "sourceType": "direct"}


# ── Feature 4: Spending Volatility (Direct) ───────────────────────────────────
def computeSpendingVolatility(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Std. dev. of monthly withdrawal totals.
    Direct source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    if len(df) == 0:
        return {"value": 0.0, "sourceType": "direct"}

    df['month'] = df['date_dt'].dt.to_period('M')
    monthly_withdrawals = df[df['type'].isin(['VYDAJ', 'VYBER'])].groupby('month')['amount'].sum()
    
    if len(monthly_withdrawals) < 2:
        return {"value": 0.0, "sourceType": "direct"}
        
    std_val = monthly_withdrawals.std()
    return {"value": float(std_val) if not np.isnan(std_val) else 0.0, "sourceType": "direct"}


# ── Feature 5: Recurring Payment Discipline (Direct) ──────────────────────────
def computeRecurringPaymentDiscipline(trans_df: pd.DataFrame, order_df: pd.DataFrame, loan_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Standing orders execution consistency + negative balance penalties (SANKC. UROK) + loan status defaults.
    Direct source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    score = 100.0

    # 1. Sanction interest penalties check
    penalty_tx = df[df['k_symbol'] == 'SANKC. UROK']
    if len(penalty_tx) > 0:
        score -= min(50.0, len(penalty_tx) * 15.0)

    # 2. Negative balance count
    neg_balances = df[df['balance'] < 0]
    if len(neg_balances) > 0:
        score -= min(30.0, len(neg_balances) * 5.0)

    # NOTE: Previous version had a loan-status check here (lines 164-171)
    # that read loan.status in ['B','D'] — THIS WAS TARGET LEAKAGE.
    # loan.status B/D IS the label (default=1). Removed during validation audit.

    return {"value": float(max(0.0, score)), "sourceType": "direct"}


# ── Helper for Inferred Salary ────────────────────────────────────────────────
def _infer_salary_median(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> float:
    """Helper to infer median recurring monthly salary credit."""
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    credits = df[df['type'] == 'PRIJEM']
    if len(credits) == 0:
        return 0.0
    
    # Salary in Berka is usually >= 5000 and occurs in regular credits
    # Let's filter credits >= 2000 CZK
    salary_candidates = credits[credits['amount'] >= 2000.0]['amount'].values
    if len(salary_candidates) == 0:
        return 0.0
    
    return float(np.median(salary_candidates))


# ── Feature 6: Salary Regularity (Proxy) ─────────────────────────────────────
def computeSalaryRegularity(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Identify largest recurring credit and compute fraction of months where a matching credit occurs.
    Proxy source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    if len(df) == 0:
        return {"value": 0.0, "sourceType": "proxy"}

    median_salary = _infer_salary_median(trans_df, account_id, as_of_date)
    if median_salary <= 0.0:
        return {"value": 0.0, "sourceType": "proxy"}

    df['month'] = df['date_dt'].dt.to_period('M')
    months = df['month'].unique()
    
    hits = 0
    for m in months:
        m_credits = df[(df['month'] == m) & (df['type'] == 'PRIJEM')]
        # Check if any credit is close to the inferred median salary
        matches = m_credits[(m_credits['amount'] >= 0.8 * median_salary) & (m_credits['amount'] <= 1.2 * median_salary)]
        if len(matches) > 0:
            hits += 1

    regularity = hits / len(months) if len(months) > 0 else 0.0
    return {"value": float(regularity), "sourceType": "proxy"}


# ── Feature 7: Income Consistency (Proxy) ─────────────────────────────────────
def computeIncomeConsistency(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Coefficient of variation of the inferred salary-like credit amount month over month.
    Proxy source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    median_salary = _infer_salary_median(trans_df, account_id, as_of_date)
    if median_salary <= 0.0:
        return {"value": 0.0, "sourceType": "proxy"}

    # Find all credits close to the inferred median salary
    credits = df[(df['type'] == 'PRIJEM') & (df['amount'] >= 0.8 * median_salary) & (df['amount'] <= 1.2 * median_salary)]
    if len(credits) < 2:
        return {"value": 0.0, "sourceType": "proxy"}

    mean_salary = credits['amount'].mean()
    std_salary = credits['amount'].std()
    cov = std_salary / mean_salary if mean_salary > 0 else 0.0
    return {"value": float(cov), "sourceType": "proxy"}


# ── Feature 8: Monthly Income (Proxy) ─────────────────────────────────────────
def computeMonthlyIncome(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    Average of the inferred salary-like credit.
    Proxy source.
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    median_salary = _infer_salary_median(trans_df, account_id, as_of_date)
    if median_salary <= 0.0:
        # Fallback to average credit amount per month
        credits = df[df['type'] == 'PRIJEM']
        if len(credits) == 0:
            return {"value": 0.0, "sourceType": "proxy"}
        df['month'] = df['date_dt'].dt.to_period('M')
        monthly_credits = df[df['type'] == 'PRIJEM'].groupby('month')['amount'].sum()
        return {"value": float(monthly_credits.mean()) if len(monthly_credits) > 0 else 0.0, "sourceType": "proxy"}

    # Inferred salary-like credits
    credits = df[(df['type'] == 'PRIJEM') & (df['amount'] >= 0.8 * median_salary) & (df['amount'] <= 1.2 * median_salary)]
    avg_salary = credits['amount'].mean() if len(credits) > 0 else median_salary
    return {"value": float(avg_salary), "sourceType": "proxy"}


# ── Feature 9: Savings Ratio (Direct) ─────────────────────────────────────────
def computeSavingsRatio(trans_df: pd.DataFrame, account_id: int, as_of_date: pd.Timestamp) -> dict:
    """
    (End balance - start balance) / total credits over the window.
    Direct source (approximate).
    """
    df = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (df['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"

    if len(df) < 2:
        return {"value": 0.0, "sourceType": "direct"}

    df = df.sort_values('date_dt')
    start_balance = df.iloc[0]['balance']
    end_balance = df.iloc[-1]['balance']
    
    total_credits = df[df['type'] == 'PRIJEM']['amount'].sum()
    if total_credits <= 0.0:
        return {"value": 0.0, "sourceType": "direct"}

    savings_ratio = (end_balance - start_balance) / total_credits
    # Clamp between -1.0 and 1.0 for stability
    savings_ratio = max(-1.0, min(1.0, savings_ratio))
    return {"value": float(savings_ratio), "sourceType": "direct"}


# ── Feature 10: Financial Stability Index (Composite) ───────────────────────
def computeFinancialStabilityIndex(features: dict) -> dict:
    """
    Composite score computed as a weighted sum of normalized inputs.
    Higher = more stable.
    """
    # Normalize features to 0-100 scale (higher = better)
    
    # 1. Cash Flow Stability: CoV (lower is better). Clamp and invert.
    cov = features["cash_flow_stability"]["value"]
    norm_stability = max(0.0, min(100.0, (2.0 - cov) * 50.0))
    
    # 2. Balance Trend: Slope (higher is better). Clamp.
    slope = features["balance_trend"]["value"]
    norm_trend = max(0.0, min(100.0, 50.0 + slope / 10.0))
    
    # 3. Income-to-Expense Ratio: Ratio (higher is better). Clamp.
    ratio = features["income_to_expense_ratio"]["value"]
    norm_ie_ratio = max(0.0, min(100.0, ratio * 50.0))
    
    # 4. Spending Volatility: Volatility relative to income.
    monthly_income = features["monthly_income"]["value"]
    spending_vol = features["spending_volatility"]["value"]
    rel_vol = spending_vol / max(100.0, monthly_income)
    norm_vol = max(0.0, min(100.0, (1.0 - rel_vol) * 100.0))
    
    # 5. Recurring Payment Discipline: Directly in 0-100 range.
    norm_discipline = features["recurring_payment_discipline"]["value"]
    
    # 6. Salary Regularity: Directly in 0-1 range.
    norm_salary_reg = features["salary_regularity"]["value"] * 100.0
    
    # 7. Income Consistency: CoV of salary (lower is better).
    inc_cov = features["income_consistency"]["value"]
    norm_inc_cons = max(0.0, min(100.0, (1.0 - inc_cov) * 100.0))
    
    # 8. Savings Ratio: -1 to 1 range. Map to 0-100.
    savings_ratio = features["savings_ratio"]["value"]
    norm_savings = (savings_ratio + 1.0) * 50.0

    # Weights
    weights = {
        "discipline": 0.25,
        "stability": 0.15,
        "ie_ratio": 0.15,
        "salary_reg": 0.15,
        "savings": 0.15,
        "trend": 0.05,
        "vol": 0.05,
        "inc_cons": 0.05
    }
    
    index_val = (
        weights["discipline"] * norm_discipline +
        weights["stability"] * norm_stability +
        weights["ie_ratio"] * norm_ie_ratio +
        weights["salary_reg"] * norm_salary_reg +
        weights["savings"] * norm_savings +
        weights["trend"] * norm_trend +
        weights["vol"] * norm_vol +
        weights["inc_cons"] * norm_inc_cons
    )

    return {"value": float(index_val), "sourceType": "composite"}


# ── Main Entry Point ──────────────────────────────────────────────────────────
def extractFeatures(account_id: int, trans_df: pd.DataFrame, order_df: pd.DataFrame, loan_df: pd.DataFrame, as_of_date: pd.Timestamp) -> dict:
    """
    Main extraction function used for both training and inference.
    Filters raw data up to as_of_date, executes all feature functions,
    and returns a flat dictionary of results.
    """
    # Enforce pre-loan-date-only windowing rule
    # Filter transactions strictly up to as_of_date
    trans_filtered = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)].copy()
    assert (trans_filtered['date_dt'] <= as_of_date).all(), "Data leakage: Transaction date after loan origination date!"
    
    # Extract features
    feat_stability = computeCashFlowStability(trans_df, account_id, as_of_date)
    feat_trend = computeBalanceTrend(trans_df, account_id, as_of_date)
    feat_ie_ratio = computeIncomeExpenseRatio(trans_df, account_id, as_of_date)
    feat_volatility = computeSpendingVolatility(trans_df, account_id, as_of_date)
    feat_discipline = computeRecurringPaymentDiscipline(trans_df, order_df, loan_df, account_id, as_of_date)
    
    feat_salary_reg = computeSalaryRegularity(trans_df, account_id, as_of_date)
    feat_inc_cons = computeIncomeConsistency(trans_df, account_id, as_of_date)
    feat_monthly_inc = computeMonthlyIncome(trans_df, account_id, as_of_date)
    feat_savings_ratio = computeSavingsRatio(trans_df, account_id, as_of_date)

    features = {
        "cash_flow_stability": feat_stability,
        "balance_trend": feat_trend,
        "income_to_expense_ratio": feat_ie_ratio,
        "spending_volatility": feat_volatility,
        "recurring_payment_discipline": feat_discipline,
        "salary_regularity": feat_salary_reg,
        "income_consistency": feat_inc_cons,
        "monthly_income": feat_monthly_inc,
        "savings_ratio": feat_savings_ratio
    }

    # Add composite Financial Stability Index
    features["financial_stability_index"] = computeFinancialStabilityIndex(features)
    
    return features


def test_feature_engineering():
    """Unit test against a few sample accounts."""
    print("\n" + "=" * 60)
    print("Testing Feature Engineering Module against Berka data")
    print("=" * 60)

    # Load tables
    trans_path = RAW_DIR / "trans.csv"
    order_path = RAW_DIR / "order.csv"
    loan_path = RAW_DIR / "loan.csv"

    if not trans_path.exists() or not loan_path.exists():
        print(f"Error: {trans_path} or {loan_path} does not exist. Run downloadBerka.py first.")
        sys.exit(1)

    print("Loading data...")
    trans_df = pd.read_csv(trans_path, sep=';')
    order_df = pd.read_csv(order_path, sep=';')
    loan_df = pd.read_csv(loan_path, sep=';')

    # Convert dates to datetime
    print("Parsing dates...")
    trans_df['date_dt'] = parse_berka_date(trans_df['date'])
    loan_df['date_dt'] = parse_berka_date(loan_df['date'])

    # Pick 3 sample accounts that have loans
    sample_loans = loan_df.head(3)
    print(f"Picked {len(sample_loans)} sample accounts from loan table:")
    
    for _, row in sample_loans.iterrows():
        acct_id = int(row['account_id'])
        loan_date = row['date_dt']
        loan_status = row['status']
        print(f"\nAccount ID: {acct_id} | Loan Date: {loan_date.strftime('%Y-%m-%d')} | Status: {loan_status}")
        
        # Extract features
        features = extractFeatures(acct_id, trans_df, order_df, loan_df, loan_date)
        
        # Print feature values
        for f_name, f_data in features.items():
            print(f"  - {f_name:<30s}: value={f_data['value']:<12.4f} [{f_data['sourceType']}]")


if __name__ == "__main__":
    test_feature_engineering()
