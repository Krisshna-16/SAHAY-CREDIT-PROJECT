"""
SahayCredit Model Training Pipeline
====================================
Trains an XGBoost classifier on the engineered features with Optuna
hyperparameter tuning and stratified k-fold cross-validation.

Usage:
    python ml/train.py           # Full pipeline: tune + train + save
    python ml/train.py --quick   # Quick training with default hyperparams (for testing)
"""
import os
import sys
import json
import time
import argparse
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

warnings.filterwarnings("ignore", category=FutureWarning)

ROOT = Path(__file__).resolve().parent
PROC_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"


def load_data():
    """Load processed features and target."""
    X = pd.read_parquet(PROC_DIR / "features_train.parquet")
    y = pd.read_parquet(PROC_DIR / "target_train.parquet")["TARGET"]
    print(f"Loaded data: X={X.shape}, y={y.shape}")
    print(f"Target distribution: 0={((y==0).sum()):,} ({(y==0).mean():.1%}), 1={((y==1).sum()):,} ({(y==1).mean():.1%})")
    return X, y


def tune_hyperparameters(X_train, y_train, n_trials=50):
    """
    Use Optuna to find optimal XGBoost hyperparameters.
    Optimizes ROC-AUC via 5-fold stratified CV.
    """
    import optuna
    import xgboost as xgb
    from sklearn.model_selection import StratifiedKFold, cross_val_score

    optuna.logging.set_verbosity(optuna.logging.WARNING)

    # Compute scale_pos_weight for imbalanced classes
    n_pos = y_train.sum()
    n_neg = len(y_train) - n_pos
    base_scale_pos_weight = n_neg / n_pos

    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 500, step=50),
            "max_depth": trial.suggest_int("max_depth", 3, 8),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
            "subsample": trial.suggest_float("subsample", 0.6, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "reg_alpha": trial.suggest_float("reg_alpha", 1e-8, 10.0, log=True),
            "reg_lambda": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
            "scale_pos_weight": trial.suggest_float(
                "scale_pos_weight",
                base_scale_pos_weight * 0.5,
                base_scale_pos_weight * 1.5
            ),
            "use_label_encoder": False,
            "eval_metric": "auc",
            "tree_method": "hist",
            "random_state": 42,
            "n_jobs": -1,
            "verbosity": 0,
            "enable_categorical": False,
        }

        model = xgb.XGBClassifier(**params)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=1)
        return scores.mean()

    print(f"\nStarting Optuna tuning ({n_trials} trials, 5-fold CV) ...")
    study = optuna.create_study(direction="maximize", study_name="sahaycredit_xgb")
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    print(f"\nBest ROC-AUC: {study.best_value:.6f}")
    print(f"Best params: {json.dumps(study.best_params, indent=2)}")

    return study.best_params


def train_model(X_train, y_train, X_val=None, y_val=None, params=None, quick=False):
    """
    Train the final XGBoost model.
    If quick=True, uses sensible defaults without Optuna.
    When X_val/y_val are provided AND quick=False, early stopping is enabled.
    """
    import xgboost as xgb

    n_pos = y_train.sum()
    n_neg = len(y_train) - n_pos
    base_scale_pos_weight = n_neg / n_pos

    if quick or params is None:
        params = {
            "n_estimators": 200,
            "max_depth": 5,
            "learning_rate": 0.05,
            "min_child_weight": 5,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "reg_alpha": 0.1,
            "reg_lambda": 1.0,
            "scale_pos_weight": base_scale_pos_weight,
        }

    # For full training, use more estimators with early stopping to find optimal count
    use_early_stopping = (not quick) and (X_val is not None) and (y_val is not None)
    if use_early_stopping:
        # Increase n_estimators ceiling to allow early stopping to find the optimum
        params = {**params, "n_estimators": max(params.get("n_estimators", 500), 1000),
                  "early_stopping_rounds": 50}

    model = xgb.XGBClassifier(
        **params,
        use_label_encoder=False,
        eval_metric="auc",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
        verbosity=1,
        enable_categorical=False,
    )

    mode_str = "QUICK" if quick else ("FULL + early stopping" if use_early_stopping else "FULL")
    print(f"\nTraining XGBoost [{mode_str}] ({params.get('n_estimators', 200)} max trees, depth={params.get('max_depth', 5)}) ...")
    start = time.time()

    fit_kwargs = {}
    if use_early_stopping:
        fit_kwargs["eval_set"] = [(X_val, y_val)]
        fit_kwargs["verbose"] = 50  # Print eval every 50 rounds
        print(f"  Early stopping: patience=50 rounds, monitoring val AUC")

    model.fit(X_train, y_train, **fit_kwargs)
    elapsed = time.time() - start

    if use_early_stopping and hasattr(model, "best_iteration"):
        print(f"  Best iteration: {model.best_iteration} (of {params.get('n_estimators', 1000)} max)")
        print(f"  Best validation AUC: {model.best_score:.6f}")

    print(f"Training completed in {elapsed:.1f}s")

    return model, elapsed


def save_model(model, params, feature_names):
    """Save the trained model and metadata."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    version = f"v1_{datetime.now().strftime('%Y%m%d')}"

    # Save as XGBoost JSON (for JS tree traversal)
    model_json_path = MODEL_DIR / "sahaycredit_xgb.json"
    model.save_model(str(model_json_path))
    print(f"\nModel saved: {model_json_path}")

    # Save metadata
    metadata = {
        "version": version,
        "created_at": datetime.now().isoformat(),
        "algorithm": "XGBClassifier",
        "hyperparameters": params,
        "feature_names": feature_names,
        "n_features": len(feature_names),
        "objective": "binary:logistic",
    }
    meta_path = MODEL_DIR / "model_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"Metadata saved: {meta_path}")

    return version


def main():
    parser = argparse.ArgumentParser(description="SahayCredit Model Training")
    parser.add_argument("--quick", action="store_true", help="Quick training without Optuna")
    parser.add_argument("--trials", type=int, default=50, help="Number of Optuna trials")
    args = parser.parse_args()

    print("=" * 60)
    print("SahayCredit Model Training Pipeline")
    print("=" * 60)

    # Load data
    X, y = load_data()
    feature_names = list(X.columns)

    # Split: 70% train, 15% val, 15% test (stratified)
    from sklearn.model_selection import train_test_split

    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval, test_size=0.176,  # 0.176 of 0.85 ≈ 0.15 of total
        random_state=42, stratify=y_trainval
    )

    print(f"\nData splits:")
    print(f"  Train: {X_train.shape[0]:,} ({X_train.shape[0]/len(X):.1%})")
    print(f"  Val:   {X_val.shape[0]:,} ({X_val.shape[0]/len(X):.1%})")
    print(f"  Test:  {X_test.shape[0]:,} ({X_test.shape[0]/len(X):.1%})")

    # Hyperparameter tuning
    n_trials_completed = 0
    if args.quick:
        print("\n[QUICK MODE] Skipping Optuna, using default hyperparameters")
        best_params = None
    else:
        print(f"\n[FULL MODE] Running Optuna ({args.trials} trials) + Early Stopping")
        best_params = tune_hyperparameters(X_train, y_train, n_trials=args.trials)
        n_trials_completed = args.trials

    # Train final model on train set, with val set for early stopping
    # In full mode, use early stopping against validation AUC
    # In quick mode, train on train+val combined (no early stopping)
    if args.quick:
        X_final = pd.concat([X_train, X_val], ignore_index=True)
        y_final = pd.concat([y_train, y_val], ignore_index=True)
        model, training_time = train_model(X_final, y_final, params=best_params, quick=True)
    else:
        model, training_time = train_model(X_train, y_train, X_val=X_val, y_val=y_val,
                                           params=best_params, quick=False)

    # Save model
    final_params = best_params or {
        "n_estimators": 200, "max_depth": 5, "learning_rate": 0.05,
        "min_child_weight": 5, "subsample": 0.8, "colsample_bytree": 0.8,
    }
    version = save_model(model, final_params, feature_names)

    # Save test set for evaluation
    X_test.to_parquet(PROC_DIR / "X_test.parquet", index=False)
    y_test.to_frame("TARGET").to_parquet(PROC_DIR / "y_test.parquet", index=False)
    print(f"\nTest set saved for evaluation ({X_test.shape[0]:,} samples)")

    # Save calibration data (val set predictions for score mapping)
    y_val_proba = model.predict_proba(X_val)[:, 1]
    cal_df = pd.DataFrame({"p_default": y_val_proba, "target": y_val.values})
    cal_df.to_parquet(PROC_DIR / "calibration_data.parquet", index=False)
    print(f"Calibration data saved ({len(cal_df):,} samples)")

    # Save training metadata for hardening report
    train_meta = {
        "training_mode": "quick" if args.quick else "full_optuna",
        "optuna_trials": n_trials_completed,
        "early_stopping_enabled": not args.quick,
        "training_time_seconds": round(training_time, 1),
        "best_params": final_params,
        "best_iteration": getattr(model, "best_iteration", None),
        "best_validation_score": getattr(model, "best_score", None),
    }
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_DIR / "training_metadata.json", "w") as f:
        json.dump(train_meta, f, indent=2, default=str)

    print(f"\n{'=' * 60}")
    print(f"Model version: {version}")
    print(f"Training mode: {'QUICK' if args.quick else 'FULL (Optuna + early stopping)'}")
    print(f"Training time: {training_time:.1f}s")
    if n_trials_completed > 0:
        print(f"Optuna trials: {n_trials_completed}")
    print(f"Next step: python ml/evaluate.py")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
