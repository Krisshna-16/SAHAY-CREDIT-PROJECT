import json
import numpy as np
import pandas as pd
import xgboost as xgb
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, roc_auc_score, average_precision_score,
    precision_score, recall_score, f1_score, log_loss,
    brier_score_loss, matthews_corrcoef, balanced_accuracy_score,
    cohen_kappa_score, confusion_matrix
)
from scipy.stats import ks_2samp

# Paths
ROOT = Path(__file__).resolve().parent
PROC_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"

def main():
    # Load model
    model = xgb.XGBClassifier()
    model.load_model(str(MODEL_DIR / "sahaycredit_xgb.json"))
    
    # Load data
    X_train = pd.read_parquet(PROC_DIR / "features_train.parquet") # training set proxy (or full train+val)
    y_train = pd.read_parquet(PROC_DIR / "target_train.parquet")["TARGET"]
    
    X_test = pd.read_parquet(PROC_DIR / "X_test.parquet")
    y_test = pd.read_parquet(PROC_DIR / "y_test.parquet")["TARGET"]
    
    # Predictions
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    y_test_proba = model.predict_proba(X_test)[:, 1]
    
    # Accuracy
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_test_pred)
    
    # Standard metrics
    roc_auc = roc_auc_score(y_test, y_test_proba)
    pr_auc = average_precision_score(y_test, y_test_proba)
    precision = precision_score(y_test, y_test_pred)
    recall = recall_score(y_test, y_test_pred)
    f1 = f1_score(y_test, y_test_pred)
    
    # Extra metrics requested
    loss = log_loss(y_test, y_test_proba)
    brier = brier_score_loss(y_test, y_test_proba)
    
    # KS Statistic
    pos_proba = y_test_proba[y_test == 1]
    neg_proba = y_test_proba[y_test == 0]
    ks_stat, _ = ks_2samp(pos_proba, neg_proba)
    
    mcc = matthews_corrcoef(y_test, y_test_pred)
    bal_acc = balanced_accuracy_score(y_test, y_test_pred)
    kappa = cohen_kappa_score(y_test, y_test_pred)
    
    cm = confusion_matrix(y_test, y_test_pred)
    
    # SHAP expected value and importance
    # Let's compute SHAP values using Python shap library
    import shap
    explainer = shap.TreeExplainer(model)
    
    # Sample 1000 rows to calculate SHAP values quickly
    sample_size = min(1000, len(X_test))
    X_sample = X_test.sample(sample_size, random_state=42)
    shap_values = explainer(X_sample)
    
    expected_value = explainer.expected_value
    if isinstance(expected_value, np.ndarray):
        expected_value = expected_value[0]
        
    global_shap_imp = np.abs(shap_values.values).mean(axis=0)
    shap_df = pd.DataFrame({
        "feature": X_test.columns,
        "mean_abs_shap": global_shap_imp
    }).sort_values(by="mean_abs_shap", ascending=False)
    
    # Print results
    print("--- EXTRA METRICS ---")
    print(f"Training Accuracy: {train_acc:.6f}")
    print(f"Test Accuracy:     {test_acc:.6f}")
    print(f"ROC-AUC:           {roc_auc:.6f}")
    print(f"PR-AUC:            {pr_auc:.6f}")
    print(f"Precision:         {precision:.6f}")
    print(f"Recall:            {recall:.6f}")
    print(f"F1 Score:          {f1:.6f}")
    print(f"Log Loss:          {loss:.6f}")
    print(f"Brier Score:       {brier:.6f}")
    print(f"KS Statistic:      {ks_stat:.6f}")
    print(f"MCC:               {mcc:.6f}")
    print(f"Balanced Accuracy: {bal_acc:.6f}")
    print(f"Cohen's Kappa:     {kappa:.6f}")
    
    print("\n--- CONFUSION MATRIX ---")
    print(f"TN: {cm[0][0]}, FP: {cm[0][1]}, FN: {cm[1][0]}, TP: {cm[1][1]}")
    
    print("\n--- SHAP EXPECTED VALUE ---")
    print(f"Expected Value (margin space): {expected_value:.6f}")
    print(f"Expected Probability:          {1 / (1 + np.exp(-expected_value)):.6f}")
    
    print("\n--- TOP 20 SHAP FEATURES ---")
    for i, row in enumerate(shap_df.head(20).itertuples(), 1):
        print(f"{i:2d}. {row.feature:<30s} {row.mean_abs_shap:.6f}")

if __name__ == "__main__":
    main()
