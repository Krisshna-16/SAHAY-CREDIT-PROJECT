# SahayCredit — Known Limitations (Phase 1.5 Audit)

> Generated as part of the Phase 1.5 Hardening Pass

---

## 1. Bureau & Previous Application Data Unavailable

### Blocker
The `bureau.csv`, `bureau_balance.csv`, and `previous_application.csv` files from the Home Credit Default Risk dataset could not be downloaded from any accessible source:

| Source | Result |
|---|---|
| `jlh/home-credit` (HuggingFace) | Only `application_train.csv` available; no bureau/prev_app configs |
| `elyza/home-credit-default-risk` (HuggingFace) | HTTP 401 Unauthorized (gated dataset) |
| Direct Kaggle download | Requires Kaggle CLI + API token (not available in this environment) |

### Affected Features
The following features from the original spec are **NOT in the trained model** because their source data is unavailable:

| Feature | Source File | Description | Status |
|---|---|---|---|
| `bureau_loan_count` | bureau.csv | Number of previous bureau loans | ❌ Not available |
| `bureau_active_count` | bureau.csv | Active bureau loans | ❌ Not available |
| `bureau_avg_days_credit` | bureau.csv | Average loan duration | ❌ Not available |
| `bureau_credit_sum` | bureau.csv | Total bureau credit | ❌ Not available |
| `bureau_debt_sum` | bureau.csv | Total bureau debt | ❌ Not available |
| `bureau_overdue_sum` | bureau.csv | Total overdue amount | ❌ Not available |
| `bureau_max_overdue` | bureau.csv | Max overdue days | ❌ Not available |
| `bureau_overdue_ratio` | bureau.csv | Overdue-to-credit ratio | ❌ Not available |
| `bill_payment_consistency` | bureau_balance.csv | On-time payment ratio from bureau history | ❌ Not available |
| `prev_app_count` | previous_application.csv | Total previous applications | ❌ Not available |
| `failed_tx_ratio` | previous_application.csv | Refused+Cancelled ratio | ❌ Not available |
| `merchant_diversity` | previous_application.csv | Distinct goods categories | ❌ Not available |
| `prev_refused` | previous_application.csv | Count of refused applications | ❌ Not available |
| `prev_cancelled` | previous_application.csv | Count of cancelled applications | ❌ Not available |
| `prev_approved` | previous_application.csv | Count of approved applications | ❌ Not available |
| `prev_avg_annuity` | previous_application.csv | Average previous annuity | ❌ Not available |

### What the Model Does Instead
- The model relies **exclusively on `application_train.csv` fields** (31 features after engineering)
- All-NaN placeholder columns are **not included** in the feature matrix — they are explicitly dropped to avoid misleading SHAP/feature importance reports
- The feature engineering pipeline (`ml/features.py`) logs the blocker clearly at runtime

### Impact Assessment
- The model achieves competitive ROC-AUC on `application_train.csv` features alone
- The external source scores (`EXT_SOURCE_1/2/3`) compensate partially for the missing bureau data since they encode similar information
- If bureau data becomes available (e.g., via Kaggle API token), simply placing the CSV files in `ml/data/raw/` and re-running the pipeline will automatically incorporate them — no code changes needed

---

## 2. Fraud Module Data Sources

### Rules Running on Real Data
Currently: **None**. All fraud rules evaluate against dashboard slider values (simulated inputs).

### Why
- SahayCredit does not have live connectors to:
  - Bank transaction ledgers (for circular transaction detection)
  - Telecom records (for mobile payment history)
  - Real-time UPI feeds (for transaction velocity)
  - Multi-channel identity verification services
- The `bureau.csv` / `previous_application.csv` data that would have enabled `failed_tx_ratio` and `merchant_diversity` as real inputs is unavailable (see §1)

### Mitigation
- Every fraud flag now includes a `dataSource: "real" | "simulated"` field
- The frontend shows this badge on each flag
- When real model features become available (income_stability, cash_flow_stability), the `MISMATCH_004` rule will automatically run on real data
- This is documented honestly in the demo narration — no claim is made that fraud detection runs on live data

---

## 3. Telecom, Geolocation, and Psychometric Modules

These are **explicitly out of scope** for Phase 1 and Phase 1.5. They are roadmapped for Phase 3.

---

## Resolution Path

| Gap | Resolution | Effort |
|---|---|---|
| Bureau data | Obtain Kaggle API key or use `kaggle datasets download` | ~1 hour setup |
| Fraud real signals | Connect UPI/bank APIs (Account Aggregator sandbox) | ~2 weeks |
| Telecom/geo modules | Full Phase 3 implementation | ~4 weeks |
