"""
SahayCredit Scoring Service
=============================
Standalone Python service exposing the trained credit-risk and fraud models
as HTTP endpoints. Does NOT modify or replace any part of the existing
Node.js backend — it's called over HTTP, same as any external API.

Endpoints:
  POST /credit/score   -> credit risk score for a Home Credit-style applicant
  POST /fraud/score     -> fraud risk score for a transaction (IEEE-CIS style)
  POST /decision        -> combines both into a final Approve/Review/Reject
  GET  /health           -> basic healthcheck

Run locally:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000

Model files (put these in the same folder as this script):
  sahaycredit_xgb.json        <- credit model (from teammate)
  fraud_model_ieee.txt         <- fraud model (from Colab training)
  target_encoding_maps.json    <- categorical encoding maps (from teammate)
"""

import json
import os
from typing import Optional

import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="SahayCredit Scoring Service")

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# ============================================================
# Load models + encoding maps once, at startup
# ============================================================

credit_model = xgb.XGBClassifier()
credit_model.load_model(os.path.join(MODEL_DIR, "sahaycredit_xgb.json"))
CREDIT_FEATURES = credit_model.get_booster().feature_names

fraud_model = lgb.Booster(model_file=os.path.join(MODEL_DIR, "fraud_model_ieee.txt"))

with open(os.path.join(MODEL_DIR, "target_encoding_maps.json")) as f:
    ENC_MAPS = json.load(f)

# Reference distribution for fraud percentile scoring.
# Ideally load the real saved ieee_Xtest predictions; falls back to a
# reasonable synthetic-free default if not present (see note below).
FRAUD_REFERENCE_PATH = os.path.join(MODEL_DIR, "fraud_reference_probs.npy")
if os.path.exists(FRAUD_REFERENCE_PATH):
    REFERENCE_PROBS = np.load(FRAUD_REFERENCE_PATH)
else:
    REFERENCE_PROBS = None  # /fraud/score will error clearly if this is missing

FRAUD_BASE_RATE = 0.035  # real IEEE-CIS fraud rate, confirmed during training


# ============================================================
# Request/response schemas
# ============================================================

class CreditApplicant(BaseModel):
    DAYS_BIRTH: float
    DAYS_EMPLOYED: float
    AMT_INCOME_TOTAL: float
    AMT_ANNUITY: float
    AMT_CREDIT: float
    AMT_GOODS_PRICE: float
    EXT_SOURCE_1: Optional[float] = None
    EXT_SOURCE_2: Optional[float] = None
    EXT_SOURCE_3: Optional[float] = None
    CNT_FAM_MEMBERS: float
    CNT_CHILDREN: int
    FLAG_DOCUMENT_SUM: int  # pre-summed count of FLAG_DOCUMENT_* columns
    REGION_POPULATION_RELATIVE: float
    REGION_RATING_CLIENT: int
    DAYS_LAST_PHONE_CHANGE: float
    AMT_REQ_CREDIT_BUREAU_HOUR: float = 0
    AMT_REQ_CREDIT_BUREAU_DAY: float = 0
    AMT_REQ_CREDIT_BUREAU_WEEK: float = 0
    AMT_REQ_CREDIT_BUREAU_MON: float = 0
    AMT_REQ_CREDIT_BUREAU_QRT: float = 0
    AMT_REQ_CREDIT_BUREAU_YEAR: float = 0
    OCCUPATION_TYPE: str = "Unknown"
    NAME_INCOME_TYPE: str
    ORGANIZATION_TYPE: str
    NAME_EDUCATION_TYPE: str
    NAME_FAMILY_STATUS: str
    NAME_HOUSING_TYPE: str
    NAME_CONTRACT_TYPE: str


class FraudTransaction(BaseModel):
    # Accepts a dict of raw IEEE-CIS-style columns already engineered
    # upstream (matching what build_ieee_model's feature_cols expects).
    # Kept generic since IEEE-CIS has 434 columns after merge.
    features: dict


class DecisionRequest(BaseModel):
    credit_default_prob: float
    fraud_prob: float


# ============================================================
# Feature engineering — mirrors the validated Colab pipeline exactly
# ============================================================

def _encode_cat(value: str, col_map: dict) -> float:
    return col_map.get(value, col_map["_fallback"])


def build_credit_features(a: CreditApplicant) -> pd.DataFrame:
    age_years = abs(a.DAYS_BIRTH) / 365.25
    employment_years = abs(a.DAYS_EMPLOYED) / 365.25 if a.DAYS_EMPLOYED != 365243 else np.nan
    monthly_income = a.AMT_INCOME_TOTAL

    denom = (age_years - 18) or np.nan
    income_stability = np.clip((employment_years / denom) if not np.isnan(employment_years) else 0, 0, 1)

    income_type_score_map = {"State servant": 0.9, "Pensioner": 0.8, "Working": 0.6, "Unemployed": 0.1}
    income_score = income_type_score_map.get(a.NAME_INCOME_TYPE, 0.5)
    salary_consistency = 0.6 * income_stability + 0.4 * income_score

    spending_ratio = np.clip(a.AMT_ANNUITY / a.AMT_INCOME_TOTAL, 0, 1)
    savings_ratio = 1 - spending_ratio
    credit_income_ratio = a.AMT_CREDIT / a.AMT_INCOME_TOTAL
    goods_price_ratio = a.AMT_GOODS_PRICE / a.AMT_CREDIT
    cash_flow_stability = 0.35 * income_stability + 0.35 * savings_ratio + 0.30 * (1 - spending_ratio)

    row = {
        "age_years": age_years,
        "monthly_income": monthly_income,
        "income_stability": income_stability,
        "salary_consistency": salary_consistency,
        "spending_ratio": spending_ratio,
        "savings_ratio": savings_ratio,
        "credit_income_ratio": credit_income_ratio,
        "goods_price_ratio": goods_price_ratio,
        "cash_flow_stability": cash_flow_stability,
        "ext_source_1": a.EXT_SOURCE_1,
        "ext_source_2": a.EXT_SOURCE_2,
        "ext_source_3": a.EXT_SOURCE_3,
        "family_size": a.CNT_FAM_MEMBERS,
        "has_children": float(a.CNT_CHILDREN > 0),
        "documents_provided": a.FLAG_DOCUMENT_SUM,
        "region_population_relative": a.REGION_POPULATION_RELATIVE,
        "region_rating": a.REGION_RATING_CLIENT,
        "days_last_phone_change": abs(a.DAYS_LAST_PHONE_CHANGE),
        "enquiries_hour": a.AMT_REQ_CREDIT_BUREAU_HOUR,
        "enquiries_day": a.AMT_REQ_CREDIT_BUREAU_DAY,
        "enquiries_week": a.AMT_REQ_CREDIT_BUREAU_WEEK,
        "enquiries_mon": a.AMT_REQ_CREDIT_BUREAU_MON,
        "enquiries_qrt": a.AMT_REQ_CREDIT_BUREAU_QRT,
        "enquiries_year": a.AMT_REQ_CREDIT_BUREAU_YEAR,
        "occupation_type": _encode_cat(a.OCCUPATION_TYPE, ENC_MAPS["occupation_type"]),
        "income_type": _encode_cat(a.NAME_INCOME_TYPE, ENC_MAPS["income_type"]),
        "organization_type": _encode_cat(a.ORGANIZATION_TYPE, ENC_MAPS["organization_type"]),
        "education_type": _encode_cat(a.NAME_EDUCATION_TYPE, ENC_MAPS["education_type"]),
        "family_status": _encode_cat(a.NAME_FAMILY_STATUS, ENC_MAPS["family_status"]),
        "housing_type": _encode_cat(a.NAME_HOUSING_TYPE, ENC_MAPS["housing_type"]),
        "contract_type": _encode_cat(a.NAME_CONTRACT_TYPE, ENC_MAPS["contract_type"]),
    }
    return pd.DataFrame([row])[CREDIT_FEATURES]


def prob_to_pdo_score(p_default: float, factor=72.1348, offset=520.7519) -> int:
    p_repay = 1 - p_default
    odds = p_repay / max(1 - p_repay, 1e-9)
    score = offset + factor * np.log(max(odds, 1e-9))
    return int(round(np.clip(score, 300, 900)))


def credit_prob_to_risk_level(p: float) -> str:
    if p < 0.10:
        return "Low"
    elif p < 0.25:
        return "Medium"
    return "High"


def prob_to_percentile_score(prob: float, reference_probs: np.ndarray) -> float:
    return float((reference_probs < prob).mean() * 100)


def fraud_prob_to_result(prob: float) -> dict:
    if REFERENCE_PROBS is None:
        raise HTTPException(
            status_code=500,
            detail="fraud_reference_probs.npy missing — required to correctly calibrate "
                   "fraud scores (raw model probabilities are compressed by scale_pos_weight "
                   "and cannot be thresholded directly). See deployment notes."
        )
    percentile = prob_to_percentile_score(prob, REFERENCE_PROBS)
    high_cutoff = 100 * (1 - FRAUD_BASE_RATE)
    medium_cutoff = 100 * (1 - FRAUD_BASE_RATE * 3)
    if percentile >= high_cutoff:
        risk = "High"
    elif percentile >= medium_cutoff:
        risk = "Medium"
    else:
        risk = "Low"
    return {"fraud_score": round(percentile, 1), "risk_category": risk}


def apply_decision_matrix(credit_risk_level: str, fraud_risk_level: str) -> str:
    matrix = {
        ("Low", "Low"): "Approve",
        ("Low", "High"): "Manual Review",
        ("Medium", "Low"): "Manual Review",
        ("Medium", "High"): "Reject",
        ("High", "Low"): "Reject",
        ("High", "High"): "Reject + Fraud Investigation",
    }
    return matrix.get((credit_risk_level, fraud_risk_level), "Manual Review")


# ============================================================
# Endpoints
# ============================================================

@app.get("/health")
def health():
    return {"status": "ok", "credit_model_loaded": True, "fraud_model_loaded": True}


@app.post("/credit/score")
def credit_score(applicant: CreditApplicant):
    X = build_credit_features(applicant)
    p_default = float(credit_model.predict_proba(X)[:, 1][0])
    score = prob_to_pdo_score(p_default)
    risk_level = credit_prob_to_risk_level(p_default)
    return {
        "predicted_default_prob": round(p_default, 6),
        "credit_score": score,
        "risk_level": risk_level,
    }


@app.post("/fraud/score")
def fraud_score(txn: FraudTransaction):
    X = pd.DataFrame([txn.features])
    prob = float(fraud_model.predict(X)[0])
    return fraud_prob_to_result(prob)


@app.post("/decision")
def decision(req: DecisionRequest):
    credit_risk_level = credit_prob_to_risk_level(req.credit_default_prob)
    fraud_result = fraud_prob_to_result(req.fraud_prob)
    final = apply_decision_matrix(credit_risk_level, fraud_result["risk_category"])
    return {
        "credit_risk_level": credit_risk_level,
        "fraud_risk_level": fraud_result["risk_category"],
        "fraud_score": fraud_result["fraud_score"],
        "final_decision": final,
    }
