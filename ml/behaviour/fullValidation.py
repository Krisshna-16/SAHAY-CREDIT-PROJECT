"""
SahayCredit -- Behaviour Model Full Validation (15-Point Checklist)
===================================================================
Run: python ml/behaviour/fullValidation.py

Produces:
    ml/behaviour/validation/  -- all charts + report
"""
import sys, os, json, warnings
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

from ml.behaviour.featureEngineering import extractFeatures, parse_berka_date
from ml.behaviour.woe import compute_woe_bins, apply_woe_series, compute_iv

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, classification_report, confusion_matrix,
    precision_recall_curve, average_precision_score, f1_score,
    brier_score_loss, log_loss
)
from sklearn.calibration import calibration_curve

# Try SHAP; if missing, skip
try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

# Try matplotlib; if missing, skip plots
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    HAS_PLT = True
except ImportError:
    HAS_PLT = False

RAW_DIR = ROOT / "ml" / "behaviour" / "data" / "raw"
OUT_DIR = ROOT / "ml" / "behaviour" / "validation"
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


# ====================================================================
# 1. Load data
# ====================================================================
def load_data():
    trans = pd.read_csv(RAW_DIR / "trans.csv", sep=';', low_memory=False)
    order = pd.read_csv(RAW_DIR / "order.csv", sep=';')
    loan  = pd.read_csv(RAW_DIR / "loan.csv", sep=';')

    trans['date_dt'] = parse_berka_date(trans['date'])
    loan['date_dt']  = parse_berka_date(loan['date'])
    loan['label'] = loan['status'].map({'A': 0, 'B': 1, 'C': 0, 'D': 1}).astype(int)

    return trans, order, loan


# ====================================================================
# 2-3. Build feature matrix (re-extract from raw, no cached CSV)
# ====================================================================
def build_feature_matrix(trans, order, loan):
    rows = []
    for _, lr in loan.iterrows():
        acct = int(lr['account_id'])
        dt   = lr['date_dt']
        cnt  = len(trans[(trans['account_id'] == acct) & (trans['date_dt'] <= dt)])
        if cnt < 3:
            continue
        try:
            feats = extractFeatures(acct, trans, order, loan, dt)
            row = {
                "loan_id": int(lr['loan_id']),
                "account_id": acct,
                "label": int(lr['label']),
                "status": lr['status'],
            }
            for f in FEATURE_NAMES:
                row[f] = feats[f]["value"]
            rows.append(row)
        except Exception as e:
            pass
    return pd.DataFrame(rows)


# ====================================================================
# 5. Customer-level stratified train/val/test split (60/20/20)
# ====================================================================
def customer_level_split(df, seed=42):
    """
    Split by account_id so no account appears in more than one fold.
    In Berka, each account has exactly one loan, so account_id == customer.
    """
    rng = np.random.RandomState(seed)
    accounts = df[['account_id', 'label']].drop_duplicates()
    accounts = accounts.sample(frac=1.0, random_state=rng).reset_index(drop=True)

    # Stratified by label
    good = accounts[accounts['label'] == 0].reset_index(drop=True)
    bad  = accounts[accounts['label'] == 1].reset_index(drop=True)

    def split_ids(ids_df, fracs=(0.6, 0.2, 0.2)):
        n = len(ids_df)
        n1 = int(n * fracs[0])
        n2 = int(n * (fracs[0] + fracs[1]))
        return ids_df.iloc[:n1], ids_df.iloc[n1:n2], ids_df.iloc[n2:]

    g_tr, g_va, g_te = split_ids(good)
    b_tr, b_va, b_te = split_ids(bad)

    train_ids = set(pd.concat([g_tr, b_tr])['account_id'])
    val_ids   = set(pd.concat([g_va, b_va])['account_id'])
    test_ids  = set(pd.concat([g_te, b_te])['account_id'])

    return (
        df[df['account_id'].isin(train_ids)].copy(),
        df[df['account_id'].isin(val_ids)].copy(),
        df[df['account_id'].isin(test_ids)].copy()
    )


# ====================================================================
# 7. Leakage audit
# ====================================================================
def audit_leakage(trans, order, loan):
    """
    Inspect computeRecurringPaymentDiscipline for target leakage.
    Lines 164-171 of featureEngineering.py check loan.status for (B,D)
    which is the target label itself.
    """
    findings = []

    # Check 1: recurring_payment_discipline uses loan status
    from ml.behaviour import featureEngineering as fe
    import inspect
    src = inspect.getsource(fe.computeRecurringPaymentDiscipline)
    if "status" in src and ("'B'" in src or "'D'" in src):
        findings.append({
            "feature": "recurring_payment_discipline",
            "issue": "CRITICAL: Reads loan.status (B/D) which IS the target label. "
                     "This directly encodes the answer into a feature.",
            "severity": "CRITICAL",
            "lines": "featureEngineering.py:164-171",
            "effect": "Accounts with B/D loans get score -= 80, which deterministically "
                      "separates defaults from non-defaults."
        })

    # Check 2: financial_stability_index includes recurring_payment_discipline
    # so it is also contaminated by transitivity
    findings.append({
        "feature": "financial_stability_index",
        "issue": "Composite feature includes recurring_payment_discipline (weight=0.25). "
                 "Contaminated via transitivity.",
        "severity": "HIGH",
        "lines": "featureEngineering.py:300-360",
        "effect": "FSI gets an outsized IV=3.83 because 25% of its value is target-derived."
    })

    return findings


# ====================================================================
# Run validation WITH leakage (original model) and WITHOUT
# ====================================================================
def train_and_evaluate(X_tr, y_tr, X_va, y_va, X_te, y_te, features_list, tag=""):
    """Train WOE+LR, evaluate on all three splits. Return results dict."""

    # WOE binning (fit on train only)
    woe_bins = {}
    iv_report = {}
    for f in features_list:
        bins = compute_woe_bins(X_tr[f], y_tr, n_bins=5)
        woe_bins[f] = bins
        iv_report[f] = compute_iv(bins)

    def transform(X, woe_b):
        out = pd.DataFrame()
        for f in features_list:
            out[f] = apply_woe_series(X[f], woe_b[f])
        return out

    Xw_tr = transform(X_tr, woe_bins)
    Xw_va = transform(X_va, woe_bins)
    Xw_te = transform(X_te, woe_bins)

    model = LogisticRegression(C=1.0, class_weight='balanced', max_iter=1000,
                               random_state=42, solver='lbfgs')
    model.fit(Xw_tr, y_tr)

    # Predictions
    prob_tr = model.predict_proba(Xw_tr)[:, 1]
    prob_va = model.predict_proba(Xw_va)[:, 1]
    prob_te = model.predict_proba(Xw_te)[:, 1]
    pred_te = model.predict(Xw_te)

    # Metrics
    auc_tr = roc_auc_score(y_tr, prob_tr)
    auc_va = roc_auc_score(y_va, prob_va) if y_va.sum() > 0 else float('nan')
    auc_te = roc_auc_score(y_te, prob_te) if y_te.sum() > 0 else float('nan')

    cm = confusion_matrix(y_te, pred_te)
    report = classification_report(y_te, pred_te, target_names=['Good(0)', 'Bad(1)'], output_dict=True)
    f1_bad = report['Bad(1)']['f1-score']
    prec_bad = report['Bad(1)']['precision']
    rec_bad  = report['Bad(1)']['recall']

    pr_auc = average_precision_score(y_te, prob_te) if y_te.sum() > 0 else float('nan')
    brier  = brier_score_loss(y_te, prob_te)

    # Calibration curve data
    if HAS_PLT and y_te.sum() > 0:
        try:
            fraction_pos, mean_predicted = calibration_curve(y_te, prob_te, n_bins=8, strategy='quantile')
        except Exception:
            fraction_pos, mean_predicted = calibration_curve(y_te, prob_te, n_bins=5)
    else:
        fraction_pos, mean_predicted = np.array([]), np.array([])

    # Coefficients
    coefs = {f: float(c) for f, c in zip(features_list, model.coef_[0])}
    intercept = float(model.intercept_[0])

    # SHAP (if available)
    shap_values_dict = {}
    if HAS_SHAP:
        try:
            explainer = shap.LinearExplainer(model, Xw_tr)
            sv = explainer.shap_values(Xw_te)
            shap_importance = np.abs(sv).mean(axis=0)
            for f, imp in zip(features_list, shap_importance):
                shap_values_dict[f] = float(imp)
        except Exception as e:
            shap_values_dict = {"error": str(e)}

    return {
        "tag": tag,
        "auc_train": auc_tr,
        "auc_val": auc_va,
        "auc_test": auc_te,
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
        "precision_bad": prec_bad,
        "recall_bad": rec_bad,
        "f1_bad": f1_bad,
        "pr_auc": pr_auc,
        "brier_score": brier,
        "calibration_fraction_pos": fraction_pos.tolist(),
        "calibration_mean_predicted": mean_predicted.tolist(),
        "iv_report": iv_report,
        "coefficients": coefs,
        "intercept": intercept,
        "shap_importance": shap_values_dict,
        "model": model,
        "woe_bins": woe_bins,
        "Xw_te": Xw_te,
        "prob_te": prob_te,
        "y_te": y_te,
    }


# ====================================================================
# Chart generation
# ====================================================================
def save_charts(results, tag):
    if not HAS_PLT:
        return

    # 1. Calibration Curve
    fig, ax = plt.subplots(figsize=(6, 5))
    fp = results["calibration_fraction_pos"]
    mp = results["calibration_mean_predicted"]
    if len(fp) > 0:
        ax.plot(mp, fp, 's-', label=f'{tag} (Brier={results["brier_score"]:.4f})')
        ax.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Perfect calibration')
    ax.set_xlabel('Mean predicted probability')
    ax.set_ylabel('Fraction of positives')
    ax.set_title(f'Calibration Curve [{tag}]')
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUT_DIR / f"calibration_{tag}.png", dpi=150)
    plt.close(fig)

    # 2. SHAP bar chart
    if results["shap_importance"] and "error" not in results["shap_importance"]:
        shap_df = pd.DataFrame({
            "Feature": list(results["shap_importance"].keys()),
            "SHAP |mean|": list(results["shap_importance"].values())
        }).sort_values("SHAP |mean|", ascending=True)

        fig, ax = plt.subplots(figsize=(8, 5))
        ax.barh(shap_df["Feature"], shap_df["SHAP |mean|"], color='#2196F3')
        ax.set_xlabel('mean |SHAP value|')
        ax.set_title(f'SHAP Feature Importance [{tag}]')
        fig.tight_layout()
        fig.savefig(OUT_DIR / f"shap_{tag}.png", dpi=150)
        plt.close(fig)

    # 3. IV bar chart
    iv_df = pd.DataFrame({
        "Feature": list(results["iv_report"].keys()),
        "IV": list(results["iv_report"].values())
    }).sort_values("IV", ascending=True)

    fig, ax = plt.subplots(figsize=(8, 5))
    colors = ['#f44336' if v > 0.5 else '#FF9800' if v > 0.3 else '#4CAF50' for v in iv_df["IV"]]
    ax.barh(iv_df["Feature"], iv_df["IV"], color=colors)
    ax.axvline(0.5, color='red', linestyle='--', alpha=0.7, label='Suspicious (IV>0.5)')
    ax.set_xlabel('Information Value')
    ax.set_title(f'WOE Information Value [{tag}]')
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUT_DIR / f"iv_{tag}.png", dpi=150)
    plt.close(fig)

    # 4. Confusion matrix heatmap
    cm = np.array(results["confusion_matrix"])
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(cm, cmap='Blues')
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(['Pred Good', 'Pred Bad'])
    ax.set_yticklabels(['Actual Good', 'Actual Bad'])
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(cm[i][j]), ha='center', va='center',
                    color='white' if cm[i][j] > cm.max()/2 else 'black', fontsize=16)
    ax.set_title(f'Confusion Matrix (TEST) [{tag}]')
    fig.tight_layout()
    fig.savefig(OUT_DIR / f"confusion_{tag}.png", dpi=150)
    plt.close(fig)


# ====================================================================
# MAIN
# ====================================================================
def main():
    report_lines = []
    def P(msg=""):
        print(msg)
        report_lines.append(msg)

    P("=" * 80)
    P("SahayCredit Behaviour Model -- Full Validation Report")
    P("=" * 80)

    # --- 1. Dataset ---
    P("\n## 1. DATASET USED")
    P("   Name: Berka Financial Dataset (PKDD 1999 Discovery Challenge)")
    P("   Source: Kaggle (marceloventura/the-berka-dataset)")
    P("   Contents: Czech banking transactions, loans, orders, accounts")
    P("   Loaded from: ml/behaviour/data/raw/")

    # Load
    trans, order, loan = load_data()

    # --- 2. Number of samples ---
    P(f"\n## 2. NUMBER OF SAMPLES")
    P(f"   Total loans: {len(loan)}")
    P(f"   Accounts with >= 3 pre-loan transactions: (building features ...)")

    # Build feature matrix from scratch
    P("\n   [Building feature matrix from raw data ...]")
    df = build_feature_matrix(trans, order, loan)
    P(f"   Usable samples: {len(df)}")

    # --- 3. Default vs non-default ---
    P(f"\n## 3. DEFAULT vs NON-DEFAULT")
    n_good = (df['label'] == 0).sum()
    n_bad  = (df['label'] == 1).sum()
    P(f"   Non-default (0): {n_good} ({n_good/len(df):.1%})")
    P(f"   Default (1):     {n_bad}  ({n_bad/len(df):.1%})")
    P(f"   Default rate:    {n_bad/len(df):.2%}")

    # --- 4-5. Train/Val/Test split (customer-level) ---
    P(f"\n## 4-5. TRAIN / VALIDATION / TEST SPLIT")
    P(f"   Method: CUSTOMER-LEVEL stratified split (by account_id)")
    P(f"   Ratios: 60% train / 20% validation / 20% test")
    P(f"   Seed: 42")

    df_train, df_val, df_test = customer_level_split(df, seed=42)

    P(f"   Train:      {len(df_train)} samples ({len(df_train)/len(df):.1%}), "
      f"default rate = {df_train['label'].mean():.2%}")
    P(f"   Validation: {len(df_val)} samples ({len(df_val)/len(df):.1%}), "
      f"default rate = {df_val['label'].mean():.2%}")
    P(f"   Test:       {len(df_test)} samples ({len(df_test)/len(df):.1%}), "
      f"default rate = {df_test['label'].mean():.2%}")
    P(f"   Customer overlap check: "
      f"train^val = {len(set(df_train['account_id']) & set(df_val['account_id']))}, "
      f"train^test = {len(set(df_train['account_id']) & set(df_test['account_id']))}, "
      f"val^test = {len(set(df_val['account_id']) & set(df_test['account_id']))}")

    # --- 6. Engineered features ---
    P(f"\n## 6. ENGINEERED FEATURES")
    for i, f in enumerate(FEATURE_NAMES, 1):
        P(f"   {i:>2d}. {f}")

    # --- 7. Leakage audit ---
    P(f"\n## 7. TARGET LEAKAGE AUDIT")
    leakage_findings = audit_leakage(trans, order, loan)
    if leakage_findings:
        P(f"   *** LEAKAGE DETECTED: {len(leakage_findings)} finding(s) ***")
        for finding in leakage_findings:
            P(f"\n   Feature: {finding['feature']}")
            P(f"   Severity: {finding['severity']}")
            P(f"   Location: {finding['lines']}")
            P(f"   Issue: {finding['issue']}")
            P(f"   Effect: {finding['effect']}")
    else:
        P(f"   No leakage detected.")

    # ================================================================
    # Train WITH leakage (original model, to explain 0.9732 AUC)
    # ================================================================
    P(f"\n{'='*80}")
    P(f"## MODEL A: WITH LEAKAGE (reproducing original 0.9732 AUC)")
    P(f"{'='*80}")

    X_tr = df_train[FEATURE_NAMES]
    y_tr = df_train['label']
    X_va = df_val[FEATURE_NAMES]
    y_va = df_val['label']
    X_te = df_test[FEATURE_NAMES]
    y_te = df_test['label']

    res_leak = train_and_evaluate(X_tr, y_tr, X_va, y_va, X_te, y_te, FEATURE_NAMES, tag="with_leakage")

    # --- 8-12: Metrics (with leakage) ---
    P(f"\n## 8. CONFUSION MATRIX (TEST)")
    cm = res_leak["confusion_matrix"]
    P(f"                Pred Good  Pred Bad")
    P(f"   Actual Good  {cm[0][0]:>9d}  {cm[0][1]:>8d}")
    P(f"   Actual Bad   {cm[1][0]:>9d}  {cm[1][1]:>8d}")

    P(f"\n## 9-11. ROC-AUC")
    P(f"   TRAIN:      {res_leak['auc_train']:.4f}")
    P(f"   VALIDATION: {res_leak['auc_val']:.4f}")
    P(f"   TEST:       {res_leak['auc_test']:.4f}")

    P(f"\n## 12. PRECISION, RECALL, F1, PR-AUC (TEST)")
    P(f"   Precision (Bad): {res_leak['precision_bad']:.4f}")
    P(f"   Recall (Bad):    {res_leak['recall_bad']:.4f}")
    P(f"   F1 (Bad):        {res_leak['f1_bad']:.4f}")
    P(f"   PR-AUC:          {res_leak['pr_auc']:.4f}")

    P(f"\n## 13. CALIBRATION + BRIER SCORE")
    P(f"   Brier Score: {res_leak['brier_score']:.4f}")

    P(f"\n## 14. SHAP FEATURE IMPORTANCE")
    if res_leak['shap_importance'] and "error" not in res_leak['shap_importance']:
        sorted_shap = sorted(res_leak['shap_importance'].items(), key=lambda x: -x[1])
        for f, v in sorted_shap:
            flag = " *** LEAKY ***" if f in ("recurring_payment_discipline", "financial_stability_index") else ""
            P(f"   {f:<40s}: {v:.4f}{flag}")
    else:
        P(f"   SHAP unavailable: {res_leak['shap_importance']}")

    P(f"\n## Information Value (WOE)")
    for f in FEATURE_NAMES:
        iv = res_leak['iv_report'][f]
        flag = " *** SUSPICIOUS (IV > 0.5) ***" if iv > 0.5 else ""
        P(f"   {f:<40s}: IV = {iv:.4f}{flag}")

    # Save charts
    save_charts(res_leak, "with_leakage")

    # ================================================================
    # 15. Explain the 0.9732 AUC and demonstrate leakage
    # ================================================================
    P(f"\n{'='*80}")
    P(f"## 15. WHY AUC = 0.9732 -- LEAKAGE DEMONSTRATION")
    P(f"{'='*80}")

    P(f"\n   ROOT CAUSE: computeRecurringPaymentDiscipline (featureEngineering.py:164-171)")
    P(f"   checks `loan.status in (B, D)` and subtracts 80 points from the discipline score.")
    P(f"   Since loan status B/D *is* the label (label=1), this feature directly encodes")
    P(f"   the target. financial_stability_index (25% weighted from discipline) is also")
    P(f"   contaminated by transitivity.")
    P(f"")
    P(f"   Evidence:")
    P(f"   - recurring_payment_discipline has IV = {res_leak['iv_report']['recurring_payment_discipline']:.4f}")
    P(f"     (low IV because the leaky loan-status check happens to all B/D accounts identically)")
    P(f"   - financial_stability_index has IV = {res_leak['iv_report']['financial_stability_index']:.4f}")
    P(f"     (massively inflated: >0.5 is suspicious, >3.0 is near-certain leakage)")
    P(f"")
    P(f"   The discipline feature's direct leakage is partially masked by the WOE binning")
    P(f"   (only 1 bin for discipline = low IV) but the FSI composite amplifies it.")

    # Demonstrate: remove leaky features and retrain
    P(f"\n   REMEDIATION: Remove the leaky loan-status check from")
    P(f"   computeRecurringPaymentDiscipline (lines 164-171) and retrain.")
    P(f"   Below we simulate this by dropping the 2 contaminated features.")

    CLEAN_FEATURES = [f for f in FEATURE_NAMES
                      if f not in ("recurring_payment_discipline", "financial_stability_index")]

    P(f"\n{'='*80}")
    P(f"## MODEL B: WITHOUT LEAKAGE (8 clean features)")
    P(f"{'='*80}")
    P(f"   Features used: {CLEAN_FEATURES}")

    X_tr_clean = df_train[CLEAN_FEATURES]
    X_va_clean = df_val[CLEAN_FEATURES]
    X_te_clean = df_test[CLEAN_FEATURES]

    res_clean = train_and_evaluate(X_tr_clean, y_tr, X_va_clean, y_va, X_te_clean, y_te, CLEAN_FEATURES, tag="without_leakage")

    P(f"\n## CLEAN MODEL METRICS (TEST)")
    cm2 = res_clean["confusion_matrix"]
    P(f"   Confusion Matrix:")
    P(f"                Pred Good  Pred Bad")
    P(f"   Actual Good  {cm2[0][0]:>9d}  {cm2[0][1]:>8d}")
    P(f"   Actual Bad   {cm2[1][0]:>9d}  {cm2[1][1]:>8d}")
    P(f"")
    P(f"   ROC-AUC TRAIN:      {res_clean['auc_train']:.4f}")
    P(f"   ROC-AUC VALIDATION: {res_clean['auc_val']:.4f}")
    P(f"   ROC-AUC TEST:       {res_clean['auc_test']:.4f}")
    P(f"   Precision (Bad):    {res_clean['precision_bad']:.4f}")
    P(f"   Recall (Bad):       {res_clean['recall_bad']:.4f}")
    P(f"   F1 (Bad):           {res_clean['f1_bad']:.4f}")
    P(f"   PR-AUC:             {res_clean['pr_auc']:.4f}")
    P(f"   Brier Score:        {res_clean['brier_score']:.4f}")

    if res_clean['shap_importance'] and "error" not in res_clean['shap_importance']:
        P(f"\n   SHAP Importance (clean model):")
        sorted_shap = sorted(res_clean['shap_importance'].items(), key=lambda x: -x[1])
        for f, v in sorted_shap:
            P(f"   {f:<40s}: {v:.4f}")

    P(f"\n   IV Report (clean model):")
    for f in CLEAN_FEATURES:
        P(f"   {f:<40s}: IV = {res_clean['iv_report'][f]:.4f}")

    save_charts(res_clean, "without_leakage")

    # ================================================================
    # VERDICT
    # ================================================================
    P(f"\n{'='*80}")
    P(f"## VERDICT")
    P(f"{'='*80}")

    auc_drop = res_leak['auc_test'] - res_clean['auc_test']
    P(f"\n   AUC drop from leakage removal: {res_leak['auc_test']:.4f} -> {res_clean['auc_test']:.4f} (delta = {auc_drop:.4f})")

    if res_clean['auc_test'] >= 0.65:
        P(f"\n   PASS: Clean model AUC ({res_clean['auc_test']:.4f}) >= 0.65 threshold.")
        P(f"   RECOMMENDATION: Fix the leaky code in featureEngineering.py, retrain,")
        P(f"   and deploy the clean model. The behavioural signal is real.")
    else:
        P(f"\n   FAIL: Clean model AUC ({res_clean['auc_test']:.4f}) < 0.65.")
        P(f"   The model's predictive power was primarily due to leakage.")
        P(f"   RECOMMENDATION: DO NOT deploy. Re-examine features.")

    P(f"\n   Files produced:")
    P(f"   - validation/calibration_with_leakage.png")
    P(f"   - validation/calibration_without_leakage.png")
    P(f"   - validation/shap_with_leakage.png")
    P(f"   - validation/shap_without_leakage.png")
    P(f"   - validation/iv_with_leakage.png")
    P(f"   - validation/iv_without_leakage.png")
    P(f"   - validation/confusion_with_leakage.png")
    P(f"   - validation/confusion_without_leakage.png")
    P(f"   - validation/validation_report.txt")
    P(f"   - validation/validation_results.json")

    # Save text report
    with open(OUT_DIR / "validation_report.txt", 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))

    # Save JSON results
    json_results = {
        "with_leakage": {
            "auc_train": res_leak['auc_train'],
            "auc_val": res_leak['auc_val'],
            "auc_test": res_leak['auc_test'],
            "confusion_matrix": res_leak['confusion_matrix'],
            "precision_bad": res_leak['precision_bad'],
            "recall_bad": res_leak['recall_bad'],
            "f1_bad": res_leak['f1_bad'],
            "pr_auc": res_leak['pr_auc'],
            "brier_score": res_leak['brier_score'],
            "iv_report": {k: float(v) for k, v in res_leak['iv_report'].items()},
            "shap_importance": res_leak['shap_importance'],
            "coefficients": res_leak['coefficients'],
        },
        "without_leakage": {
            "auc_train": res_clean['auc_train'],
            "auc_val": res_clean['auc_val'],
            "auc_test": res_clean['auc_test'],
            "confusion_matrix": res_clean['confusion_matrix'],
            "precision_bad": res_clean['precision_bad'],
            "recall_bad": res_clean['recall_bad'],
            "f1_bad": res_clean['f1_bad'],
            "pr_auc": res_clean['pr_auc'],
            "brier_score": res_clean['brier_score'],
            "iv_report": {k: float(v) for k, v in res_clean['iv_report'].items()},
            "shap_importance": res_clean['shap_importance'],
            "coefficients": res_clean['coefficients'],
        },
        "leakage_findings": leakage_findings,
        "dataset": {
            "name": "Berka PKDD 1999",
            "total_loans": int(len(loan)),
            "usable_samples": int(len(df)),
            "non_default": int(n_good),
            "default": int(n_bad),
            "train_size": int(len(df_train)),
            "val_size": int(len(df_val)),
            "test_size": int(len(df_test)),
            "split_method": "customer-level stratified (account_id)",
        },
        "features": FEATURE_NAMES,
        "clean_features": CLEAN_FEATURES,
    }
    with open(OUT_DIR / "validation_results.json", 'w', encoding='utf-8') as f:
        json.dump(json_results, f, indent=2, default=str)

    P(f"\n{'='*80}")
    P(f"VALIDATION COMPLETE")
    P(f"{'='*80}")


if __name__ == "__main__":
    main()
