"""
SahayCredit — Behaviour Model Trainer (Module 3)
==================================================
WOE + Logistic Regression trainer for Behaviour Scorecard.
Outputs a JS-portable model bundle (JSON) for the inference engine.

Usage:
    python ml/behaviour/trainModel.py
"""
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import (
    roc_auc_score, classification_report, confusion_matrix,
    precision_recall_curve, f1_score
)
from sklearn.calibration import CalibratedClassifierCV

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from ml.behaviour.woe import compute_woe_bins, apply_woe_series, compute_iv

DATA_DIR = ROOT / "ml" / "behaviour" / "data"
MODEL_DIR = ROOT / "ml" / "behaviour" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

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

# Display names for the lender dashboard (EN/HI)
FEATURE_DISPLAY_NAMES = {
    "cash_flow_stability": {"en": "Cash Flow Stability", "hi": "नकदी प्रवाह स्थिरता"},
    "balance_trend": {"en": "Balance Trend", "hi": "बैलेंस ट्रेंड"},
    "income_to_expense_ratio": {"en": "Income-to-Expense Ratio", "hi": "आय-व्यय अनुपात"},
    "spending_volatility": {"en": "Spending Volatility", "hi": "खर्च में अस्थिरता"},
    "recurring_payment_discipline": {"en": "Payment Discipline", "hi": "भुगतान अनुशासन"},
    "salary_regularity": {"en": "Salary Regularity", "hi": "वेतन नियमितता"},
    "income_consistency": {"en": "Income Consistency", "hi": "आय स्थिरता"},
    "monthly_income": {"en": "Monthly Income", "hi": "मासिक आय"},
    "savings_ratio": {"en": "Savings Ratio", "hi": "बचत अनुपात"},
    "financial_stability_index": {"en": "Financial Stability Index", "hi": "वित्तीय स्थिरता सूचकांक"},
}


def train_model():
    print("=" * 60)
    print("SahayCredit — Behaviour Model Trainer")
    print("=" * 60)

    # Load training set
    train_path = DATA_DIR / "behaviour_training_set.csv"
    if not train_path.exists():
        print(f"Error: {train_path} does not exist. Run buildTrainingSet.py first.")
        sys.exit(1)

    df = pd.read_csv(train_path)
    print(f"\n[1/6] Loaded training set: {len(df)} rows")
    print(f"  Class balance: good={( df['label'] == 0).sum()}, bad={(df['label'] == 1).sum()}")
    print(f"  Default rate: {df['label'].mean():.2%}")

    # ── Step 2: Stratified Train/Test Split ──────────────────────────────
    X = df[FEATURE_NAMES].copy()
    y = df['label'].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n[2/6] Train/Test split: train={len(X_train)}, test={len(X_test)}")
    print(f"  Train default rate: {y_train.mean():.2%}")
    print(f"  Test default rate:  {y_test.mean():.2%}")

    # ── Step 3: WOE Binning ──────────────────────────────────────────────
    print(f"\n[3/6] Computing WOE bins ...")
    woe_bins = {}
    iv_report = {}

    for feat in FEATURE_NAMES:
        bins = compute_woe_bins(X_train[feat], y_train, n_bins=5)
        woe_bins[feat] = bins
        iv = compute_iv(bins)
        iv_report[feat] = iv
        print(f"  {feat:<35s}: IV={iv:.4f}, {len(bins)} bins")

    # Apply WOE to train/test
    X_train_woe = pd.DataFrame()
    X_test_woe = pd.DataFrame()
    for feat in FEATURE_NAMES:
        X_train_woe[feat] = apply_woe_series(X_train[feat], woe_bins[feat])
        X_test_woe[feat] = apply_woe_series(X_test[feat], woe_bins[feat])

    # ── Step 4: Logistic Regression ──────────────────────────────────────
    print(f"\n[4/6] Training Logistic Regression ...")
    model = LogisticRegression(
        penalty='l2',
        C=1.0,
        class_weight='balanced',  # Handle class imbalance
        max_iter=1000,
        random_state=42,
        solver='lbfgs'
    )
    model.fit(X_train_woe, y_train)

    # Print coefficients
    print(f"\n  Fitted Coefficients:")
    coefficients = {}
    for feat, coef in zip(FEATURE_NAMES, model.coef_[0]):
        coefficients[feat] = float(coef)
        direction = "(+risk)" if coef > 0 else "(-risk)"
        print(f"    {feat:<35s}: {coef:+.4f} {direction}")
    print(f"    {'Intercept':<35s}: {model.intercept_[0]:+.4f}")

    # ── Step 5: Evaluate ─────────────────────────────────────────────────
    print(f"\n[5/6] Evaluation on test set ...")

    # Predictions
    y_pred_proba = model.predict_proba(X_test_woe)[:, 1]
    y_pred = model.predict(X_test_woe)

    # ROC-AUC
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"  ROC-AUC: {auc:.4f}")

    # Classification report
    print(f"\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Good (0)', 'Bad (1)']))

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"  Confusion Matrix:")
    print(f"    {'':>15s}  Pred Good  Pred Bad")
    print(f"    {'Actual Good':>15s}  {cm[0][0]:>9d}  {cm[0][1]:>8d}")
    print(f"    {'Actual Bad':>15s}  {cm[1][0]:>9d}  {cm[1][1]:>8d}")

    # ── Step 5b: Platt Scaling (Isotonic Recalibration) ──────────────────
    print(f"\n  Calibrating probabilities (Platt scaling) ...")
    calibrated_model = CalibratedClassifierCV(model, method='isotonic', cv=3)
    calibrated_model.fit(X_train_woe, y_train)

    y_cal_proba = calibrated_model.predict_proba(X_test_woe)[:, 1]
    cal_auc = roc_auc_score(y_test, y_cal_proba)
    print(f"  Calibrated ROC-AUC: {cal_auc:.4f}")

    # Build calibration map (simple percentile-based lookup table for JS)
    cal_percentiles = np.percentile(y_cal_proba, np.arange(0, 101, 5))
    raw_percentiles = np.percentile(y_pred_proba, np.arange(0, 101, 5))
    calibration_map = []
    for raw_p, cal_p in zip(raw_percentiles, cal_percentiles):
        calibration_map.append({"raw": float(raw_p), "calibrated": float(cal_p)})

    # ── Step 6: Export Model Bundle ──────────────────────────────────────
    print(f"\n[6/6] Exporting model bundle ...")

    # Serialize WOE bins (convert numpy types to Python native)
    serializable_woe = {}
    for feat, bins in woe_bins.items():
        serializable_woe[feat] = [
            {
                "lower": float(b["lower"]) if not np.isinf(b["lower"]) else -1e18,
                "upper": float(b["upper"]) if not np.isinf(b["upper"]) else 1e18,
                "woe": float(b["woe"]),
                "iv": float(b["iv"]),
                "count": int(b["count"])
            }
            for b in bins
        ]

    bundle = {
        "version": "1.0.0",
        "algorithm": "LogisticRegression",
        "description": "Behaviour Risk Model trained on Berka PKDD'99 dataset",
        "training_date": pd.Timestamp.now().isoformat(),
        "training_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "roc_auc": float(auc),
        "calibrated_roc_auc": float(cal_auc),
        "default_rate": float(y.mean()),
        "woe_bins": serializable_woe,
        "coefficients": coefficients,
        "intercept": float(model.intercept_[0]),
        "calibration_map": calibration_map,
        "feature_names": FEATURE_NAMES,
        "feature_display_names": FEATURE_DISPLAY_NAMES,
        "iv_report": {k: float(v) for k, v in iv_report.items()}
    }

    bundle_path = MODEL_DIR / "behaviour_model_bundle.json"
    with open(bundle_path, 'w', encoding='utf-8') as f:
        json.dump(bundle, f, indent=2, ensure_ascii=False)

    print(f"  Saved: {bundle_path}")
    print(f"  Bundle size: {bundle_path.stat().st_size:,} bytes")
    print(f"\n  Model Summary:")
    print(f"    Algorithm: Logistic Regression + WOE binning")
    print(f"    Features: {len(FEATURE_NAMES)}")
    print(f"    ROC-AUC: {auc:.4f} (raw), {cal_auc:.4f} (calibrated)")
    print(f"    Default rate: {y.mean():.2%}")
    print("=" * 60)

    return bundle


if __name__ == "__main__":
    train_model()
