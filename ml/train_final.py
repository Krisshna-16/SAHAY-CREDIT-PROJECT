"""
Quick final training with the Optuna-selected best params.
Skips re-running Optuna (already done: 50 trials, best AUC 0.750362).
"""
import json, time, sys
import numpy as np, pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROC_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"

# Best params from Optuna (50 trials completed)
BEST_PARAMS = {
    "n_estimators": 1000,  # High ceiling for early stopping
    "max_depth": 3,
    "learning_rate": 0.08813598475052263,
    "min_child_weight": 7,
    "subsample": 0.6945628013258798,
    "colsample_bytree": 0.6999882177768999,
    "reg_alpha": 6.92274582630245,
    "reg_lambda": 0.000378795185914426,
    "scale_pos_weight": 7.519112620838951,
    "early_stopping_rounds": 50,
}

def main():
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from datetime import datetime

    print("=" * 60)
    print("SahayCredit — Final Training (Optuna params, early stopping)")
    print("=" * 60)

    # Load data
    X = pd.read_parquet(PROC_DIR / "features_train.parquet")
    y = pd.read_parquet(PROC_DIR / "target_train.parquet")["TARGET"]
    print(f"Loaded: X={X.shape}, y={y.shape}")

    feature_names = list(X.columns)

    # Same split as train.py
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval, test_size=0.176, random_state=42, stratify=y_trainval
    )

    print(f"Train: {X_train.shape[0]:,}, Val: {X_val.shape[0]:,}, Test: {X_test.shape[0]:,}")

    # Train with early stopping
    model = xgb.XGBClassifier(
        **BEST_PARAMS,
        use_label_encoder=False,
        eval_metric="auc",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
        verbosity=1,
        enable_categorical=False,
    )

    print(f"\nTraining with early stopping (patience=50, monitoring val AUC) ...")
    start = time.time()
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=50)
    elapsed = time.time() - start

    best_iter = getattr(model, "best_iteration", None)
    best_score = getattr(model, "best_score", None)
    print(f"\nTraining completed in {elapsed:.1f}s")
    if best_iter is not None:
        print(f"  Best iteration: {best_iter}")
        print(f"  Best val AUC: {best_score:.6f}")

    # Save model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    version = f"v2_{datetime.now().strftime('%Y%m%d')}"
    
    model_json_path = MODEL_DIR / "sahaycredit_xgb.json"
    model.save_model(str(model_json_path))
    print(f"\nModel saved: {model_json_path}")

    # Save metadata
    metadata = {
        "version": version,
        "created_at": datetime.now().isoformat(),
        "algorithm": "XGBClassifier",
        "hyperparameters": {k: v for k, v in BEST_PARAMS.items() if k != "early_stopping_rounds"},
        "feature_names": feature_names,
        "n_features": len(feature_names),
        "objective": "binary:logistic",
        "best_iteration": best_iter,
        "optuna_best_cv_auc": 0.750362,
    }
    with open(MODEL_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    # Save test set
    X_test.to_parquet(PROC_DIR / "X_test.parquet", index=False)
    y_test.to_frame("TARGET").to_parquet(PROC_DIR / "y_test.parquet", index=False)
    print(f"Test set saved ({X_test.shape[0]:,} samples)")

    # Save calibration data
    y_val_proba = model.predict_proba(X_val)[:, 1]
    cal_df = pd.DataFrame({"p_default": y_val_proba, "target": y_val.values})
    cal_df.to_parquet(PROC_DIR / "calibration_data.parquet", index=False)
    print(f"Calibration data saved ({len(cal_df):,} samples)")

    # Save training metadata
    train_meta = {
        "training_mode": "full_optuna",
        "optuna_trials": 50,
        "early_stopping_enabled": True,
        "training_time_seconds": round(elapsed, 1),
        "optuna_time_seconds": 1536,  # 25m36s from the Optuna run
        "total_pipeline_time_seconds": round(1536 + elapsed, 1),
        "best_params": {k: v for k, v in BEST_PARAMS.items() if k != "early_stopping_rounds"},
        "best_iteration": best_iter,
        "best_validation_score": best_score,
        "optuna_best_cv_auc": 0.750362,
        "previous_quickmode_auc": 0.754775,
    }
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_DIR / "training_metadata.json", "w") as f:
        json.dump(train_meta, f, indent=2, default=str)

    print(f"\n{'=' * 60}")
    print(f"Model version: {version}")
    print(f"Training: FULL (Optuna + early stopping)")
    print(f"Training time: {elapsed:.1f}s (+ 25m36s Optuna)")
    print(f"Best iteration: {best_iter}")
    print(f"Next: python ml/evaluate.py && python ml/export_model.py")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
