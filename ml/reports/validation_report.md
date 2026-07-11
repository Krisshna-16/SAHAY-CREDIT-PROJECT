# SahayCredit — Model Validation Report

**Model Version**: v2_20260711
**Evaluation Date**: 2026-07-11 16:45
**Test Set Size**: 46,127 samples
**Training Mode**: full_optuna
**Optuna Trials**: 50
**Early Stopping**: True
**Training Time**: 7.7s

---

## Performance Metrics

| Metric | Value |
|---|---|
| **ROC-AUC** | 0.756338 |
| **Average Precision (PR-AUC)** | 0.241285 |
| **Precision** | 0.209118 |
| **Recall** | 0.524705 |
| **F1 Score** | 0.299051 |
| **Log Loss** | 0.458449 |
| **Brier Score** | 0.146375 |
| **KS Statistic** | 0.381651 |
| **MCC** | 0.237524 |
| **Balanced Accuracy** | 0.675212 |
| **Cohen's Kappa** | 0.207561 |

## Confusion Matrix

|  | Predicted Repaid | Predicted Default |
|---|---|---|
| **Actual Repaid** | 35,013 (TN) | 7,390 (FP) |
| **Actual Default** | 1,770 (FN) | 1,954 (TP) |

## Top 10 Features

| Rank | Feature | Importance |
|---|---|---|
| 1 | ext_source_3 | 0.169318 |
| 2 | ext_source_2 | 0.160760 |
| 3 | ext_source_1 | 0.057770 |
| 4 | goods_price_ratio | 0.057373 |
| 5 | education_type | 0.045140 |
| 6 | organization_type | 0.039409 |
| 7 | occupation_type | 0.039307 |
| 8 | age_years | 0.032885 |
| 9 | documents_provided | 0.032344 |
| 10 | cash_flow_stability | 0.030954 |

## Charts

- ROC Curve: `roc_curve.png`
- Precision-Recall Curve: `pr_curve.png`
- Feature Importance: `feature_importance.png`

## Classification Report (Full)

```
              precision    recall  f1-score   support

           0       0.95      0.83      0.88     42403
           1       0.21      0.52      0.30      3724

    accuracy                           0.80     46127
   macro avg       0.58      0.68      0.59     46127
weighted avg       0.89      0.80      0.84     46127

```
