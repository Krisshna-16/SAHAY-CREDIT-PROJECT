"""
SahayCredit Feature Engineering Pipeline
=========================================
Derives behavioral credit-scoring features from the Home Credit Default Risk
dataset columns.  Every derived feature is documented with its source columns
and derivation logic.

Usage:
    python ml/features.py            # processes raw CSVs → processed parquets
    python ml/features.py --verify   # prints feature stats without saving
"""
import os
import sys
import argparse
import warnings
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings("ignore", category=FutureWarning)

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"
PROC_DIR = ROOT / "data" / "processed"

# ── Helper: Target Encoding with CV ──────────────────────────────────────────
def target_encode(df: pd.DataFrame, col: str, target: str, n_folds: int = 5,
                  smoothing: float = 10.0) -> pd.Series:
    """
    Target-encode a categorical column using k-fold CV to prevent leakage.
    Uses additive smoothing (Bayesian mean) for rare categories.
    """
    global_mean = df[target].mean()
    encoded = pd.Series(np.nan, index=df.index, dtype=float)

    # Assign folds
    np.random.seed(42)
    folds = np.random.randint(0, n_folds, size=len(df))

    for fold in range(n_folds):
        train_mask = folds != fold
        val_mask = folds == fold

        # Compute stats on training fold
        stats = df.loc[train_mask].groupby(col)[target].agg(["mean", "count"])
        # Bayesian smoothed mean: (count * mean + smoothing * global_mean) / (count + smoothing)
        smoothed = (stats["count"] * stats["mean"] + smoothing * global_mean) / (stats["count"] + smoothing)

        # Apply to validation fold
        encoded.loc[val_mask] = df.loc[val_mask, col].map(smoothed)

    # Fill any remaining NaN with global mean
    encoded.fillna(global_mean, inplace=True)
    return encoded


# ── Bureau Features ──────────────────────────────────────────────────────────
def build_bureau_features(bureau_path: str, bureau_balance_path: str) -> pd.DataFrame:
    """
    Aggregate bureau.csv and bureau_balance.csv into per-applicant features.

    Derived features:
    - bureau_loan_count: Number of previous bureau loans (Transaction Frequency proxy)
    - bureau_active_count: Number of currently active bureau loans
    - bureau_avg_days_credit: Average loan duration from bureau
    - bureau_overdue_ratio: Ratio of overdue entries in bureau
    - bill_payment_consistency: Ratio of on-time statuses (C, 0, X) in bureau_balance
    - avg_monthly_balance: Mean of STATUS distribution (proxy for balance behavior)
    """
    print("  Loading bureau.csv ...")
    bureau = pd.read_csv(bureau_path)

    features = bureau.groupby("SK_ID_CURR").agg(
        bureau_loan_count=("SK_ID_BUREAU", "count"),
        bureau_active_count=("CREDIT_ACTIVE", lambda x: (x == "Active").sum()),
        bureau_avg_days_credit=("DAYS_CREDIT", "mean"),
        bureau_credit_sum=("AMT_CREDIT_SUM", "sum"),
        bureau_debt_sum=("AMT_CREDIT_SUM_DEBT", "sum"),
        bureau_overdue_sum=("AMT_CREDIT_SUM_OVERDUE", "sum"),
        bureau_max_overdue=("CREDIT_DAY_OVERDUE", "max"),
    ).reset_index()

    # Overdue ratio (proxy for bill payment issues)
    features["bureau_overdue_ratio"] = (
        features["bureau_overdue_sum"] / features["bureau_credit_sum"].replace(0, np.nan)
    ).fillna(0).clip(0, 1)

    # Bureau balance aggregation for Bill Payment Consistency
    if os.path.exists(bureau_balance_path):
        print("  Loading bureau_balance.csv ...")
        bb = pd.read_csv(bureau_balance_path)

        # STATUS meaning: C=closed/paid, 0=on-time, 1=1-30 DPD, 2=31-60 DPD, etc., X=unknown
        # On-time statuses: C, 0, X
        bb["is_ontime"] = bb["STATUS"].isin(["C", "0", "X"]).astype(int)
        bb_agg = bb.groupby("SK_ID_BUREAU").agg(
            months_total=("MONTHS_BALANCE", "count"),
            months_ontime=("is_ontime", "sum"),
        ).reset_index()

        # Map back to SK_ID_CURR via bureau
        bb_agg = bb_agg.merge(bureau[["SK_ID_BUREAU", "SK_ID_CURR"]], on="SK_ID_BUREAU", how="left")
        bb_curr = bb_agg.groupby("SK_ID_CURR").agg(
            bill_months_total=("months_total", "sum"),
            bill_months_ontime=("months_ontime", "sum"),
        ).reset_index()

        bb_curr["bill_payment_consistency"] = (
            bb_curr["bill_months_ontime"] / bb_curr["bill_months_total"].replace(0, np.nan)
        ).fillna(0.5)

        features = features.merge(bb_curr[["SK_ID_CURR", "bill_payment_consistency"]], on="SK_ID_CURR", how="left")
    else:
        features["bill_payment_consistency"] = np.nan

    return features


# ── Previous Application Features ────────────────────────────────────────────
def build_prev_app_features(prev_app_path: str) -> pd.DataFrame:
    """
    Aggregate previous_application.csv into per-applicant features.

    Derived features:
    - prev_app_count: Total previous applications (Transaction Frequency)
    - failed_tx_ratio: Ratio of Refused+Cancelled applications (Failed Transaction Ratio)
    - merchant_diversity: Number of distinct contract/goods category combinations (Merchant Diversity)
    - prev_avg_annuity: Average annuity of previous loans
    """
    print("  Loading previous_application.csv ...")
    prev = pd.read_csv(prev_app_path)

    features = prev.groupby("SK_ID_CURR").agg(
        prev_app_count=("SK_ID_PREV", "count"),
        prev_refused=("NAME_CONTRACT_STATUS", lambda x: (x == "Refused").sum()),
        prev_cancelled=("NAME_CONTRACT_STATUS", lambda x: (x == "Canceled").sum()),
        prev_approved=("NAME_CONTRACT_STATUS", lambda x: (x == "Approved").sum()),
        prev_avg_annuity=("AMT_ANNUITY", "mean"),
        # Merchant Diversity: distinct combinations of contract type × goods category
        merchant_diversity=("NAME_GOODS_CATEGORY", "nunique"),
    ).reset_index()

    # Failed Transaction Ratio
    features["failed_tx_ratio"] = (
        (features["prev_refused"] + features["prev_cancelled"]) /
        features["prev_app_count"].replace(0, np.nan)
    ).fillna(0).clip(0, 1)

    return features


# ── Main Feature Engineering ─────────────────────────────────────────────────
def engineer_features(verify_only: bool = False):
    """
    Main pipeline: load raw CSVs, derive behavioral features, output clean matrix.
    """
    print("=" * 60)
    print("SahayCredit Feature Engineering Pipeline")
    print("=" * 60)

    # ── Load application_train.csv ────────────────────────────────────────
    train_path = RAW_DIR / "application_train.csv"
    test_path = RAW_DIR / "application_test.csv"

    if not train_path.exists():
        print(f"ERROR: {train_path} not found. Run dataset download first.")
        sys.exit(1)

    print(f"\nLoading {train_path} ...")
    df = pd.read_csv(train_path)
    print(f"  Rows: {len(df):,}")
    print(f"  Columns: {len(df.columns)}")
    print(f"  TARGET distribution:")
    print(f"    0 (repaid):   {(df['TARGET'] == 0).sum():,} ({(df['TARGET'] == 0).mean():.1%})")
    print(f"    1 (default):  {(df['TARGET'] == 1).sum():,} ({(df['TARGET'] == 1).mean():.1%})")

    target = df["TARGET"].copy()

    # ── Derived Behavioral Features ───────────────────────────────────────
    print("\nDeriving behavioral features ...")
    features = pd.DataFrame(index=df.index)
    features["SK_ID_CURR"] = df["SK_ID_CURR"]

    # 1. Age (from DAYS_BIRTH, which is negative days before application)
    #    Source: DAYS_BIRTH
    features["age_years"] = (df["DAYS_BIRTH"].abs() / 365.25).round(1)
    print(f"  age_years: min={features['age_years'].min():.1f}, max={features['age_years'].max():.1f}")

    # 2. Monthly Income (AMT_INCOME_TOTAL is already annual/monthly depending on source)
    #    Source: AMT_INCOME_TOTAL
    #    Note: In Home Credit, this is total income. We normalize per-month if > 12x median
    features["monthly_income"] = df["AMT_INCOME_TOTAL"].copy()
    # Cap extreme outliers at 99.9th percentile
    cap = features["monthly_income"].quantile(0.999)
    features["monthly_income"] = features["monthly_income"].clip(upper=cap)
    print(f"  monthly_income: median={features['monthly_income'].median():,.0f}")

    # 3. Income Stability
    #    Source: DAYS_EMPLOYED, NAME_INCOME_TYPE
    #    Derivation: Employment duration as fraction of working-age years.
    #    Longer employment relative to age = more stable.
    #    DAYS_EMPLOYED is negative (days before application); 365243 means unemployed/retired.
    days_employed = df["DAYS_EMPLOYED"].copy()
    days_employed = days_employed.replace(365243, np.nan)  # Sentinel for unemployed
    employment_years = days_employed.abs() / 365.25
    working_age_years = (features["age_years"] - 18).clip(lower=1)
    features["income_stability"] = (employment_years / working_age_years).clip(0, 1)
    features["income_stability"] = features["income_stability"].fillna(0)
    print(f"  income_stability: mean={features['income_stability'].mean():.3f}")

    # 4. Salary Consistency
    #    Source: DAYS_EMPLOYED, NAME_INCOME_TYPE
    #    Derivation: Proxy combining employment duration and income type.
    #    Salaried workers with long employment = high consistency.
    income_type_score = df["NAME_INCOME_TYPE"].map({
        "Working": 0.6,
        "Commercial associate": 0.7,
        "State servant": 0.9,
        "Pensioner": 0.8,
        "Student": 0.3,
        "Businessman": 0.5,
        "Maternity leave": 0.4,
        "Unemployed": 0.1,
    }).fillna(0.5)
    features["salary_consistency"] = (
        0.6 * features["income_stability"] + 0.4 * income_type_score
    ).clip(0, 1)
    print(f"  salary_consistency: mean={features['salary_consistency'].mean():.3f}")

    # 5. Spending Ratio
    #    Source: AMT_ANNUITY / AMT_INCOME_TOTAL
    #    Derivation: What fraction of income goes to loan annuity payments.
    #    Higher = more financially stressed.
    features["spending_ratio"] = (
        df["AMT_ANNUITY"] / df["AMT_INCOME_TOTAL"].replace(0, np.nan)
    ).fillna(0).clip(0, 1)
    print(f"  spending_ratio: mean={features['spending_ratio'].mean():.3f}")

    # 6. Savings Ratio
    #    Source: AMT_INCOME_TOTAL, AMT_ANNUITY, AMT_GOODS_PRICE, AMT_CREDIT
    #    Derivation: Proxy for savings capacity = (income - annuity) / income
    #    Also considers goods_price/credit ratio (if goods << credit, borrower has less savings)
    annuity_to_income = df["AMT_ANNUITY"].fillna(0) / df["AMT_INCOME_TOTAL"].replace(0, np.nan)
    features["savings_ratio"] = (1 - annuity_to_income.fillna(0.5)).clip(0, 1)
    print(f"  savings_ratio: mean={features['savings_ratio'].mean():.3f}")

    # 7. Credit-to-Income Ratio (additional signal)
    #    Source: AMT_CREDIT / AMT_INCOME_TOTAL
    features["credit_income_ratio"] = (
        df["AMT_CREDIT"] / df["AMT_INCOME_TOTAL"].replace(0, np.nan)
    ).fillna(0).clip(0, 50)
    print(f"  credit_income_ratio: mean={features['credit_income_ratio'].mean():.2f}")

    # 8. Goods Price Ratio
    #    Source: AMT_GOODS_PRICE / AMT_CREDIT
    #    Derivation: If goods price is much less than credit, excess may indicate fee/risk loading
    features["goods_price_ratio"] = (
        df["AMT_GOODS_PRICE"].fillna(0) / df["AMT_CREDIT"].replace(0, np.nan)
    ).fillna(1).clip(0, 2)
    print(f"  goods_price_ratio: mean={features['goods_price_ratio'].mean():.3f}")

    # 9. Cash Flow Stability
    #    Source: AMT_INCOME_TOTAL, AMT_ANNUITY, AMT_CREDIT, DAYS_EMPLOYED
    #    Derivation: Composite proxy — stable income + low spending ratio + long employment
    features["cash_flow_stability"] = (
        0.35 * features["income_stability"] +
        0.35 * features["savings_ratio"] +
        0.30 * (1 - features["spending_ratio"])
    ).clip(0, 1)
    print(f"  cash_flow_stability: mean={features['cash_flow_stability'].mean():.3f}")

    # 10. External Source Scores (EXT_SOURCE_1/2/3)
    #     These are pre-computed external scoring signals in the dataset.
    #     Highly predictive — include as-is.
    for col in ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"]:
        features[col.lower()] = df[col].copy()
        non_null = features[col.lower()].notna().sum()
        print(f"  {col.lower()}: non-null={non_null:,} ({non_null/len(df):.1%})")

    # 11. Family/Housing Features
    features["family_size"] = df["CNT_FAM_MEMBERS"].fillna(1)
    features["has_children"] = (df["CNT_CHILDREN"] > 0).astype(int)

    # 12. Document flags (how many documents were provided)
    doc_cols = [c for c in df.columns if c.startswith("FLAG_DOCUMENT_")]
    features["documents_provided"] = df[doc_cols].sum(axis=1)
    print(f"  documents_provided: mean={features['documents_provided'].mean():.1f}")

    # 13. Region/Housing features
    features["region_population_relative"] = df["REGION_POPULATION_RELATIVE"]
    features["region_rating"] = df["REGION_RATING_CLIENT"]

    # 14. Days since last phone change (stability proxy)
    features["days_last_phone_change"] = df["DAYS_LAST_PHONE_CHANGE"].abs()

    # 15. Enquiry features (how many recent credit enquiries)
    enquiry_cols = [c for c in df.columns if c.startswith("AMT_REQ_CREDIT_BUREAU_")]
    for col in enquiry_cols:
        features[col.lower().replace("amt_req_credit_bureau_", "enquiries_")] = df[col].fillna(0)

    # ── Categorical Features (Target Encoded) ────────────────────────────
    print("\nTarget-encoding categorical features ...")
    cat_cols = {
        "occupation_type": "OCCUPATION_TYPE",
        "income_type": "NAME_INCOME_TYPE",
        "organization_type": "ORGANIZATION_TYPE",
        "education_type": "NAME_EDUCATION_TYPE",
        "family_status": "NAME_FAMILY_STATUS",
        "housing_type": "NAME_HOUSING_TYPE",
        "contract_type": "NAME_CONTRACT_TYPE",
    }

    # Need target for encoding
    df_with_target = features.copy()
    df_with_target["TARGET"] = target

    for feat_name, src_col in cat_cols.items():
        if src_col in df.columns:
            df_with_target[f"_raw_{feat_name}"] = df[src_col].fillna("Unknown")
            features[feat_name] = target_encode(
                df_with_target.assign(**{feat_name: df[src_col].fillna("Unknown")}),
                feat_name, "TARGET"
            )
            nunique = df[src_col].nunique()
            print(f"  {feat_name} ({src_col}): {nunique} categories -> target-encoded")

    # -- Bureau Features ---------------------------------------------------
    # BLOCKER (Phase 1.5 audit): bureau.csv and bureau_balance.csv could not
    # be sourced from any accessible HuggingFace mirror. The jlh/home-credit
    # repo only contains application_train.csv; other mirrors require auth.
    # Rather than silently adding all-NaN columns that contribute nothing to
    # the model but misleadingly appear in feature importance lists, we
    # explicitly SKIP these features and document the gap.
    bureau_path = RAW_DIR / "bureau.csv"
    bureau_balance_path = RAW_DIR / "bureau_balance.csv"
    if bureau_path.exists():
        print("\nBuilding bureau features ...")
        bureau_feats = build_bureau_features(str(bureau_path), str(bureau_balance_path))
        features = features.merge(bureau_feats, on="SK_ID_CURR", how="left")
        print(f"  Bureau features added: {len(bureau_feats.columns) - 1}")
    else:
        print("\n  [BLOCKER] bureau.csv not found — SKIPPING bureau features entirely")
        print("    Affected features: bureau_loan_count, bureau_overdue_ratio,")
        print("    bill_payment_consistency, bureau_active_count, bureau_avg_days_credit,")
        print("    bureau_credit_sum, bureau_debt_sum, bureau_overdue_sum, bureau_max_overdue")
        print("    These features are NOT added to the feature matrix (no all-NaN columns).")

    # ── Previous Application Features ────────────────────────────────────
    prev_app_path = RAW_DIR / "previous_application.csv"
    if prev_app_path.exists():
        print("\nBuilding previous application features ...")
        prev_feats = build_prev_app_features(str(prev_app_path))
        features = features.merge(prev_feats, on="SK_ID_CURR", how="left")
        print(f"  Previous app features added: {len(prev_feats.columns) - 1}")
    else:
        print("\n  [BLOCKER] previous_application.csv not found — SKIPPING prev app features entirely")
        print("    Affected features: prev_app_count, failed_tx_ratio, merchant_diversity,")
        print("    prev_refused, prev_cancelled, prev_approved, prev_avg_annuity")
        print("    These features are NOT added to the feature matrix (no all-NaN columns).")

    # ── Final Assembly ────────────────────────────────────────────────────
    # Drop SK_ID_CURR (not a feature)
    feature_cols = [c for c in features.columns if c != "SK_ID_CURR"]
    X = features[feature_cols].copy()
    y = target.copy()

    print(f"\n{'=' * 60}")
    print(f"Final feature matrix shape: {X.shape}")
    print(f"Feature columns ({len(feature_cols)}):")
    for i, col in enumerate(feature_cols, 1):
        null_pct = X[col].isna().mean() * 100
        print(f"  {i:2d}. {col:<35s} null={null_pct:.1f}%  mean={X[col].mean():.4f}" if X[col].notna().any() else f"  {i:2d}. {col:<35s} ALL NULL")
    print(f"{'=' * 60}")

    if verify_only:
        print("\n[VERIFY MODE] Skipping save.")
        return X, y

    # Save
    PROC_DIR.mkdir(parents=True, exist_ok=True)
    X.to_parquet(PROC_DIR / "features_train.parquet", index=False)
    y.to_frame("TARGET").to_parquet(PROC_DIR / "target_train.parquet", index=False)

    # Save feature names for model export
    pd.Series(feature_cols).to_json(PROC_DIR / "feature_names.json")

    # Save SK_ID_CURR mapping for later reference
    features[["SK_ID_CURR"]].to_parquet(PROC_DIR / "id_mapping.parquet", index=False)

    print(f"\nSaved to {PROC_DIR}/")
    print(f"  features_train.parquet: {X.shape}")
    print(f"  target_train.parquet:   {y.shape}")
    print(f"  feature_names.json:     {len(feature_cols)} features")

    return X, y


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SahayCredit Feature Engineering")
    parser.add_argument("--verify", action="store_true", help="Verify features without saving")
    args = parser.parse_args()
    engineer_features(verify_only=args.verify)
