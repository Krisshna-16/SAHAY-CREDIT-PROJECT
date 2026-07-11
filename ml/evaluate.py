"""
SahayCredit Model Evaluation
==============================
Generates a comprehensive validation report with real metrics from the
trained XGBoost model on the held-out test set.

Usage:
    python ml/evaluate.py
"""
import json
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
from pathlib import Path
from datetime import datetime

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent
PROC_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"


def evaluate():
    import xgboost as xgb
    from sklearn.metrics import (
        roc_auc_score, precision_recall_fscore_support,
        confusion_matrix, classification_report,
        roc_curve, precision_recall_curve, average_precision_score
    )

    print("=" * 60)
    print("SahayCredit Model Evaluation")
    print("=" * 60)

    # Load model
    model_path = MODEL_DIR / "sahaycredit_xgb.json"
    model = xgb.XGBClassifier()
    model.load_model(str(model_path))
    print(f"Model loaded: {model_path}")

    # Load metadata
    with open(MODEL_DIR / "model_metadata.json") as f:
        metadata = json.load(f)
    print(f"Model version: {metadata['version']}")

    # Load test data
    X_test = pd.read_parquet(PROC_DIR / "X_test.parquet")
    y_test = pd.read_parquet(PROC_DIR / "y_test.parquet")["TARGET"]
    print(f"Test set: {len(X_test):,} samples")

    # Predictions
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= 0.5).astype(int)

    # ── Metrics ───────────────────────────────────────────────────────────
    from sklearn.metrics import (
        log_loss, brier_score_loss, matthews_corrcoef,
        balanced_accuracy_score, cohen_kappa_score
    )

    roc_auc = roc_auc_score(y_test, y_proba)
    avg_precision = average_precision_score(y_test, y_proba)
    precision, recall, f1, support = precision_recall_fscore_support(
        y_test, y_pred, average="binary"
    )
    cm = confusion_matrix(y_test, y_pred)
    class_report = classification_report(y_test, y_pred, output_dict=True)

    # Extended metrics for hardening report
    logloss = log_loss(y_test, y_proba)
    brier = brier_score_loss(y_test, y_proba)
    mcc = matthews_corrcoef(y_test, y_pred)
    bal_acc = balanced_accuracy_score(y_test, y_pred)
    kappa = cohen_kappa_score(y_test, y_pred)

    # KS statistic (Kolmogorov-Smirnov)
    fpr_ks, tpr_ks, _ = roc_curve(y_test, y_proba)
    ks_stat = float(np.max(tpr_ks - fpr_ks))

    # Load baseline ROC-AUC from quick-mode archive if available
    baseline_roc_auc = None
    baseline_path = REPORT_DIR / "validation_report.json"
    archive_report = REPORT_DIR.parent / "models" / "archive" / "quickmode_report.json"
    # Try to load from training metadata
    train_meta_path = REPORT_DIR / "training_metadata.json"
    if train_meta_path.exists():
        with open(train_meta_path) as f:
            train_meta = json.load(f)
    else:
        train_meta = {}

    print(f"\n{'─' * 40}")
    print(f"ROC-AUC:           {roc_auc:.6f}")
    print(f"Avg Precision:     {avg_precision:.6f}")
    print(f"Precision:         {precision:.6f}")
    print(f"Recall:            {recall:.6f}")
    print(f"F1 Score:          {f1:.6f}")
    print(f"Log Loss:          {logloss:.6f}")
    print(f"Brier Score:       {brier:.6f}")
    print(f"KS Statistic:      {ks_stat:.6f}")
    print(f"MCC:               {mcc:.6f}")
    print(f"Balanced Accuracy: {bal_acc:.6f}")
    print(f"Cohen's Kappa:     {kappa:.6f}")
    print(f"Confusion Matrix:")
    print(f"  TN={cm[0][0]:,}  FP={cm[0][1]:,}")
    print(f"  FN={cm[1][0]:,}  TP={cm[1][1]:,}")
    print(f"{'─' * 40}")

    # ── ROC Curve ─────────────────────────────────────────────────────────
    fpr, tpr, thresholds_roc = roc_curve(y_test, y_proba)

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(fpr, tpr, color="#6366F1", linewidth=2.5, label=f"XGBoost (AUC = {roc_auc:.4f})")
    ax.plot([0, 1], [0, 1], color="#94A3B8", linestyle="--", linewidth=1, label="Random")
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("SahayCredit — ROC Curve", fontsize=14, fontweight="bold")
    ax.legend(loc="lower right", fontsize=11)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    roc_path = REPORT_DIR / "roc_curve.png"
    fig.savefig(roc_path, dpi=150)
    plt.close(fig)
    print(f"\nROC curve saved: {roc_path}")

    # ── Precision-Recall Curve ────────────────────────────────────────────
    prec_arr, rec_arr, thresholds_pr = precision_recall_curve(y_test, y_proba)

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.plot(rec_arr, prec_arr, color="#10B981", linewidth=2.5,
            label=f"XGBoost (AP = {avg_precision:.4f})")
    ax.set_xlabel("Recall", fontsize=12)
    ax.set_ylabel("Precision", fontsize=12)
    ax.set_title("SahayCredit — Precision-Recall Curve", fontsize=14, fontweight="bold")
    ax.legend(loc="upper right", fontsize=11)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    pr_path = REPORT_DIR / "pr_curve.png"
    fig.savefig(pr_path, dpi=150)
    plt.close(fig)
    print(f"PR curve saved: {pr_path}")

    # ── Feature Importance ────────────────────────────────────────────────
    importance = model.feature_importances_
    feature_names = metadata["feature_names"]
    fi_sorted = sorted(zip(feature_names, importance), key=lambda x: x[1], reverse=True)

    fig, ax = plt.subplots(figsize=(10, 8))
    top_n = min(20, len(fi_sorted))
    names = [f[0] for f in fi_sorted[:top_n]][::-1]
    values = [f[1] for f in fi_sorted[:top_n]][::-1]
    bars = ax.barh(names, values, color="#6366F1", alpha=0.85)
    ax.set_xlabel("Feature Importance (Gain)", fontsize=12)
    ax.set_title("SahayCredit — Top Feature Importances", fontsize=14, fontweight="bold")
    ax.grid(True, axis="x", alpha=0.3)
    fig.tight_layout()
    fi_path = REPORT_DIR / "feature_importance.png"
    fig.savefig(fi_path, dpi=150)
    plt.close(fig)
    print(f"Feature importance saved: {fi_path}")

    # ── Save JSON Report ─────────────────────────────────────────────────
    report = {
        "model_version": metadata["version"],
        "evaluation_date": datetime.now().isoformat(),
        "test_set_size": len(X_test),
        "training_metadata": train_meta,
        "metrics": {
            "roc_auc": round(roc_auc, 6),
            "average_precision": round(avg_precision, 6),
            "precision": round(precision, 6),
            "recall": round(recall, 6),
            "f1_score": round(f1, 6),
            "log_loss": round(logloss, 6),
            "brier_score": round(brier, 6),
            "ks_statistic": round(ks_stat, 6),
            "mcc": round(mcc, 6),
            "balanced_accuracy": round(bal_acc, 6),
            "cohens_kappa": round(kappa, 6),
        },
        "confusion_matrix": {
            "true_negatives": int(cm[0][0]),
            "false_positives": int(cm[0][1]),
            "false_negatives": int(cm[1][0]),
            "true_positives": int(cm[1][1]),
        },
        "classification_report": class_report,
        "feature_importance_top10": [
            {"feature": name, "importance": round(float(imp), 6)}
            for name, imp in fi_sorted[:10]
        ],
    }

    json_path = REPORT_DIR / "validation_report.json"
    with open(json_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\nJSON report saved: {json_path}")

    # ── Save Markdown Report ─────────────────────────────────────────────
    md = f"""# SahayCredit — Model Validation Report

**Model Version**: {metadata['version']}
**Evaluation Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
**Test Set Size**: {len(X_test):,} samples
**Training Mode**: {train_meta.get('training_mode', 'unknown')}
**Optuna Trials**: {train_meta.get('optuna_trials', 'N/A')}
**Early Stopping**: {train_meta.get('early_stopping_enabled', 'N/A')}
**Training Time**: {train_meta.get('training_time_seconds', 'N/A')}s

---

## Performance Metrics

| Metric | Value |
|---|---|
| **ROC-AUC** | {roc_auc:.6f} |
| **Average Precision (PR-AUC)** | {avg_precision:.6f} |
| **Precision** | {precision:.6f} |
| **Recall** | {recall:.6f} |
| **F1 Score** | {f1:.6f} |
| **Log Loss** | {logloss:.6f} |
| **Brier Score** | {brier:.6f} |
| **KS Statistic** | {ks_stat:.6f} |
| **MCC** | {mcc:.6f} |
| **Balanced Accuracy** | {bal_acc:.6f} |
| **Cohen's Kappa** | {kappa:.6f} |

## Confusion Matrix

|  | Predicted Repaid | Predicted Default |
|---|---|---|
| **Actual Repaid** | {cm[0][0]:,} (TN) | {cm[0][1]:,} (FP) |
| **Actual Default** | {cm[1][0]:,} (FN) | {cm[1][1]:,} (TP) |

## Top 10 Features

| Rank | Feature | Importance |
|---|---|---|
"""
    for i, (name, imp) in enumerate(fi_sorted[:10], 1):
        md += f"| {i} | {name} | {imp:.6f} |\n"

    md += f"""
## Charts

- ROC Curve: `roc_curve.png`
- Precision-Recall Curve: `pr_curve.png`
- Feature Importance: `feature_importance.png`

## Classification Report (Full)

```
{classification_report(y_test, y_pred)}
```
"""

    md_path = REPORT_DIR / "validation_report.md"
    with open(md_path, "w") as f:
        f.write(md)
    print(f"Markdown report saved: {md_path}")

    print(f"\n{'=' * 60}")
    print("Evaluation complete.")
    print(f"{'=' * 60}")

    return report


if __name__ == "__main__":
    evaluate()
