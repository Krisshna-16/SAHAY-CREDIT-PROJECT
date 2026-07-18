"""
SahayCredit — Behaviour Training Set Generator (Module 2)
==========================================================
Iterates all accounts that have a loan record, computes features
using the pre-loan-date-only window, labels by loan status,
and outputs a single flat CSV for the model trainer.

Usage:
    python ml/behaviour/buildTrainingSet.py
"""
import sys
import time
import numpy as np
import pandas as pd
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from ml.behaviour.featureEngineering import extractFeatures, parse_berka_date

RAW_DIR = ROOT / "ml" / "behaviour" / "data" / "raw"
OUT_DIR = ROOT / "ml" / "behaviour" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FEATURE_NAMES = [
    "cash_flow_stability",
    "balance_trend",
    "income_to_expense_ratio",
    "spending_volatility",
    "recurring_payment_discipline",
    "salary_regularity",
    "income_consistency",
    "monthly_income",
    "savings_ratio",
    "financial_stability_index"
]


def build_training_set():
    print("=" * 60)
    print("SahayCredit — Building Behaviour Training Set")
    print("=" * 60)

    # Load raw tables
    print("\n[1/4] Loading raw Berka tables ...")
    trans_df = pd.read_csv(RAW_DIR / "trans.csv", sep=';', low_memory=False)
    order_df = pd.read_csv(RAW_DIR / "order.csv", sep=';')
    loan_df = pd.read_csv(RAW_DIR / "loan.csv", sep=';')

    # Parse dates
    print("[2/4] Parsing dates ...")
    trans_df['date_dt'] = parse_berka_date(trans_df['date'])
    loan_df['date_dt'] = parse_berka_date(loan_df['date'])

    # Label: 1 if loan status in {B, D} (bad), else 0 (good)
    # Berka loan status meanings:
    #   A = finished, no problems (good)
    #   B = finished, loan not paid (bad)
    #   C = running, OK so far (good)
    #   D = running, client in debt (bad)
    loan_df['label'] = loan_df['status'].map({'A': 0, 'B': 1, 'C': 0, 'D': 1}).astype(int)

    print(f"    Total loans: {len(loan_df)}")
    print(f"    Status distribution: {dict(loan_df['status'].value_counts())}")
    print(f"    Label distribution: 0 (good) = {(loan_df['label'] == 0).sum()}, 1 (bad) = {(loan_df['label'] == 1).sum()}")
    print(f"    Default rate: {loan_df['label'].mean():.2%}")

    # Build feature rows
    print("\n[3/4] Extracting features for each loan account ...")
    rows = []
    skipped = 0
    errors = 0
    start_time = time.time()

    for i, (_, loan_row) in enumerate(loan_df.iterrows()):
        account_id = int(loan_row['account_id'])
        as_of_date = loan_row['date_dt']
        label = int(loan_row['label'])
        loan_id = int(loan_row['loan_id'])

        # Check if we have enough transaction history
        acct_trans = trans_df[(trans_df['account_id'] == account_id) & (trans_df['date_dt'] <= as_of_date)]
        if len(acct_trans) < 3:
            skipped += 1
            continue

        try:
            features = extractFeatures(account_id, trans_df, order_df, loan_df, as_of_date)
            row = {
                "loan_id": loan_id,
                "account_id": account_id,
                "label": label,
                "loan_status": loan_row['status'],
                "loan_date": as_of_date.strftime('%Y-%m-%d'),
                "n_transactions": len(acct_trans)
            }
            for f_name in FEATURE_NAMES:
                row[f_name] = features[f_name]["value"]
                row[f_name + "_source"] = features[f_name]["sourceType"]
            rows.append(row)
        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"    Error for account {account_id}: {e}")

        if (i + 1) % 50 == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed
            remaining = (len(loan_df) - i - 1) / rate
            print(f"    Processed {i + 1}/{len(loan_df)} ({rate:.1f} acct/s, ~{remaining:.0f}s remaining)")

    elapsed = time.time() - start_time
    print(f"    Done in {elapsed:.1f}s")

    # Save to CSV
    df = pd.DataFrame(rows)
    out_path = OUT_DIR / "behaviour_training_set.csv"
    df.to_csv(out_path, index=False)

    # Report
    print(f"\n[4/4] Training Set Summary")
    print("=" * 60)
    print(f"  Total loans:   {len(loan_df)}")
    print(f"  Rows produced: {len(df)}")
    print(f"  Skipped (< 3 txns): {skipped}")
    print(f"  Errors: {errors}")
    print(f"\n  Class balance:")
    print(f"    Good (0): {(df['label'] == 0).sum()} ({(df['label'] == 0).mean():.1%})")
    print(f"    Bad  (1): {(df['label'] == 1).sum()} ({(df['label'] == 1).mean():.1%})")
    print(f"\n  Feature missingness:")
    for f_name in FEATURE_NAMES:
        missing = df[f_name].isna().sum()
        zero_pct = (df[f_name] == 0.0).mean() * 100
        print(f"    {f_name:<35s}: missing={missing}, zeros={zero_pct:.1f}%")

    print(f"\n  Saved to: {out_path}")
    print("=" * 60)

    return df


if __name__ == "__main__":
    build_training_set()
