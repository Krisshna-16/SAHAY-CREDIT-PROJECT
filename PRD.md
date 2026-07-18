# Product Requirements Document (PRD)

## Project: SahayCredit (Alternate Credit Scoring for India's Unbanked)
**Author**: Product Management Team
**Status**: Approved (Phase 3 Complete)
**Date**: July 2026

---

## 1. Vision & Strategy
Traditional credit scoring in India (e.g., CIBIL) relies heavily on formal repayment history. This excludes over 60% of the population, including micro-merchants (MSMEs), gig workers, and rural entrepreneurs who operate in a cash-heavy or informal digital economy. 

**SahayCredit** bridges this credit gap by utilizing **alternative data footprints**—including mobile data usage, UPI transaction stability, e-commerce purchases, geolocation consistency, psychometric assessment, and GST ratings—to build a comprehensive, machine-learning-driven creditworthiness profile.

---

## 2. Target Audience
* **Thin-File / No-File Borrowers**: Individuals with no formal credit history (CIBIL score is 0 or -1).
* **MSMEs & Gig Workers**: Micro-merchants needing small, quick working capital.
* **Lending Institutions (NBFCs & Banks)**: Underwriters looking to expand their loan portfolio to the unbanked sector safely without increasing default rates.

---

## 3. Platform Architecture
SahayCredit is built as a highly performant, client-side first platform integrated with the **RBI Account Aggregator (AA)** consent framework.

```
+-------------------------------------------------------------------------------+
|                             SahayCredit System                                |
+------------------------------------+------------------------------------------+
|  Borrower Mobile App               | Lender Dashboard / Regulatory Console    |
|  - eKYC Verification               | - Real-time Portfolio Analytics          |
|  - Account Aggregator Consent UI   | - SHAP Explainability Engine             |
|  - Live Credit Score Dial (300-900)| - Regulator Audit Log                    |
|  - Loan Comparison & EMI Planner   | - Live Sandbox API Docs                  |
+------------------------------------+------------------------------------------+
                                     |
                         Node.js / Express Backend
                         - Pure JS XGBoost Inference
                         - Platt / PDO Score Calibration
```

---

## 4. Key Product Features

### 4.1. Borrower App
1. **Consent-Driven Onboarding**: Standard WhatsApp-style conversational UI to request permission to access alternative data sources via RBI Account Aggregator flow.
2. **eKYC Integration**: Secure Aadhaar-based OTP verification to establish identity.
3. **Animated Score Dial**: High-fidelity UI showing credit scores ranging from $300$ to $900$, dynamically calibrated using machine learning output.
4. **SHAP Factor Breakdown**: Plain-language explanations showing borrowers exactly why their score is what it is (e.g., "+35 points for consistent monthly utility payments").
5. **EMI Planner**: Affordability-check sliders allowing borrowers to choose loan amounts and durations while visualizing their amortization schedules in real time.
6. **Bilingual Support**: Toggle between English and Hindi for high accessibility.

### 4.2. Lender & Regulator Dashboard
1. **Real-time Scoring Analytics**: Charts showing overall portfolio score distributions, approval rate trends, and average time-to-score.
2. **Decision Audit Log**: Immutably logs every prediction with feature contributions, calibration factors, timestamps, and model versions.
3. **API Sandbox**: Live interactive sandbox letting NBFC developers test mock payloads against the `/api/score` endpoint.

---

## 5. Machine Learning & Scoring Methodology

### 5.1. Core Model Specification
* **Algorithm**: XGBoost Classifier.
* **Target Variable**: Probability of default ($1$ = default, $0$ = repayment).
* **Feature Count**: 31 engineered variables derived from the raw Kaggle Home Credit dataset (`application_train.csv`).

### 5.2. Core Input Features
1. **Demographics**: Age (derived from `DAYS_BIRTH`), Family Size.
2. **Income & Stability**: Monthly Income (outlier-capped), Income Stability (employment duration vs. working-age years), and Salary Consistency.
3. **Financial Ratios**: Spending Ratio (annuity vs. income), Savings Ratio, Credit-to-Income Ratio, and Goods Price Ratio.
4. **Behavioral Footprint**: Location phone stability (days since last phone change) and credit bureau enquiry frequencies.
5. **Categorical Features**: Target-encoded with Bayesian smoothing to prevent data leakage (Occupation Type, Income Type, Organization Type, Education, Housing, and Family Status).

### 5.3. Score Calibration (Platt Scaling & PDO)
To translate the raw machine learning output $P(default)$ into a standard credit score on the $300 - 900$ range:
1. **Platt Scaling**: Fitted on the validation subset to obtain calibrated repayment probabilities ($P_{repay} = 1 - P_{default}$).
2. **Points to Double Odds (PDO)**: Maps the repayment probability monotonically to the $300 - 900$ credit score range to align with industry expectations.

### 5.4. Consent-Based Composite Score Weighting
Alternative data inputs are merged with the core score according to user consent:

| Active Sources | Core Weight | Alt Source 1 Weight | Alt Source 2 Weight | Confidence Score |
|---|---|---|---|---|
| **Core Only** | 100% | - | - | 55% (Moderate) |
| **Core + E-Commerce** | 75% | 25% (E-Commerce) | - | 72% (Good) |
| **Core + Merchant** | 75% | - | 25% (Merchant) | 72% (Good) |
| **Core + E-Com + Merchant** | 60% | 20% (E-Commerce) | 20% (Merchant) | 85% (High) |

---

## 6. Security & Fraud Constraints
1. **Multi-device Aadhaar Fraud Check**: Restricts multiple distinct borrower accounts from sharing the same device fingerprint. 
2. **KYC Verification Gate**: Locks the score generation API until a valid Aadhaar/eKYC signature is successfully posted.
3. **Data Localization**: Features are engineered and prepared in the browser; raw telemetry is never stored on backend databases without explicit user consent.
