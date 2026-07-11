"""
SahayCredit Model Export
=========================
Exports the trained XGBoost model into a single JSON bundle that the
Node.js backend can load for pure-JavaScript tree traversal inference.

Includes:
- XGBoost tree structure (parsed from model JSON)
- Score calibration mapping (percentile → 300-900)
- Feature name list
- Target encoding maps for categorical features
- SHAP base values and feature name → display name mapping

Usage:
    python ml/export_model.py
"""
import json
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent
PROC_DIR = ROOT / "data" / "processed"
MODEL_DIR = ROOT / "models"


# ── Feature Display Name Mapping ─────────────────────────────────────────────
# Maps internal feature names to human-readable names for SHAP display.
# Both English and Hindi versions for the bilingual frontend.
FEATURE_DISPLAY_NAMES = {
    "age_years":                {"en": "Age",                          "hi": "आयु"},
    "monthly_income":           {"en": "Monthly Income",               "hi": "मासिक आय"},
    "income_stability":         {"en": "Income Stability",             "hi": "आय स्थिरता"},
    "salary_consistency":       {"en": "Salary Consistency",           "hi": "वेतन नियमितता"},
    "spending_ratio":           {"en": "Spending Ratio",               "hi": "खर्च अनुपात"},
    "savings_ratio":            {"en": "Savings Ratio",                "hi": "बचत अनुपात"},
    "credit_income_ratio":      {"en": "Credit-to-Income Ratio",      "hi": "ऋण-आय अनुपात"},
    "goods_price_ratio":        {"en": "Goods Price Ratio",            "hi": "वस्तु मूल्य अनुपात"},
    "cash_flow_stability":      {"en": "Cash Flow Stability",         "hi": "नकदी प्रवाह स्थिरता"},
    "ext_source_1":             {"en": "External Score 1",             "hi": "बाहरी स्कोर 1"},
    "ext_source_2":             {"en": "External Score 2",             "hi": "बाहरी स्कोर 2"},
    "ext_source_3":             {"en": "External Score 3",             "hi": "बाहरी स्कोर 3"},
    "family_size":              {"en": "Family Size",                  "hi": "परिवार का आकार"},
    "has_children":             {"en": "Has Children",                 "hi": "बच्चे हैं"},
    "documents_provided":       {"en": "Documents Provided",           "hi": "प्रदान किए गए दस्तावेज़"},
    "region_population_relative":{"en": "Region Population",           "hi": "क्षेत्र जनसंख्या"},
    "region_rating":            {"en": "Region Rating",                "hi": "क्षेत्र रेटिंग"},
    "days_last_phone_change":   {"en": "Phone Stability",              "hi": "फ़ोन स्थिरता"},
    "occupation_type":          {"en": "Occupation",                   "hi": "व्यवसाय"},
    "income_type":              {"en": "Employment Type",              "hi": "रोजगार प्रकार"},
    "organization_type":        {"en": "Organization Type",            "hi": "संगठन प्रकार"},
    "education_type":           {"en": "Education Level",              "hi": "शिक्षा स्तर"},
    "family_status":            {"en": "Family Status",                "hi": "पारिवारिक स्थिति"},
    "housing_type":             {"en": "Housing Type",                 "hi": "आवास प्रकार"},
    "contract_type":            {"en": "Contract Type",                "hi": "अनुबंध प्रकार"},
    # NOTE: Bureau/prev_app features below are kept for forward-compatibility.
    # They are NOT in the current model (source data unavailable — see known_limitations.md).
    # The export logic only emits display names for features that exist in the model.
    "bureau_loan_count":        {"en": "Previous Loans Count",         "hi": "पिछले ऋणों की संख्या"},
    "bureau_active_count":      {"en": "Active Loans",                 "hi": "सक्रिय ऋण"},
    "bureau_avg_days_credit":   {"en": "Avg Loan Duration",            "hi": "औसत ऋण अवधि"},
    "bureau_credit_sum":        {"en": "Total Bureau Credit",          "hi": "कुल ब्यूरो क्रेडिट"},
    "bureau_debt_sum":          {"en": "Total Bureau Debt",            "hi": "कुल ब्यूरो ऋण"},
    "bureau_overdue_sum":       {"en": "Total Overdue Amount",         "hi": "कुल अतिदेय राशि"},
    "bureau_max_overdue":       {"en": "Max Overdue Days",             "hi": "अधिकतम अतिदेय दिन"},
    "bureau_overdue_ratio":     {"en": "Overdue Ratio",                "hi": "अतिदेय अनुपात"},
    "bill_payment_consistency": {"en": "Bill Payment Consistency",     "hi": "बिल भुगतान नियमितता"},
    "prev_app_count":           {"en": "Previous Applications",        "hi": "पिछले आवेदन"},
    "prev_refused":             {"en": "Previously Refused",           "hi": "पूर्व में अस्वीकृत"},
    "prev_cancelled":           {"en": "Previously Cancelled",         "hi": "पूर्व में रद्द"},
    "prev_approved":            {"en": "Previously Approved",          "hi": "पूर्व में स्वीकृत"},
    "prev_avg_annuity":         {"en": "Avg Previous Annuity",         "hi": "औसत पिछली किस्त"},
    "merchant_diversity":       {"en": "Merchant Diversity",           "hi": "व्यापारी विविधता"},
    "failed_tx_ratio":          {"en": "Failed Transaction Ratio",     "hi": "विफल लेनदेन अनुपात"},
}

# Add enquiry features dynamically
for period in ["hour", "day", "week", "mon", "qrt", "year"]:
    key = f"enquiries_{period}"
    FEATURE_DISPLAY_NAMES[key] = {
        "en": f"Credit Enquiries ({period})",
        "hi": f"क्रेडिट पूछताछ ({period})"
    }


def build_calibration_map():
    """
    Build a calibrated percentile mapping from P(default) to 300-900 score.

    Method:
    1. Load validation set predictions (P(default))
    2. Convert to P(repayment) = 1 - P(default)
    3. Compute percentile ranks
    4. Map percentile → score using monotonic interpolation:
       score = 300 + 600 * percentile_rank

    The mapping is stored as sorted [probability, score] pairs for
    binary search lookup in JavaScript.
    """
    cal_path = PROC_DIR / "calibration_data.parquet"
    if not cal_path.exists():
        print("WARNING: calibration_data.parquet not found. Using linear fallback.")
        # Linear fallback: p_repay in [0,1] → score in [300,900]
        return [
            [0.0, 300], [0.1, 360], [0.2, 420], [0.3, 480],
            [0.4, 540], [0.5, 600], [0.6, 660], [0.7, 720],
            [0.8, 780], [0.9, 840], [1.0, 900]
        ]

    cal_df = pd.read_parquet(cal_path)
    p_repay = 1 - cal_df["p_default"].values

    # Compute percentile mapping at 100 evenly spaced probability thresholds
    p_sorted = np.sort(p_repay)
    n = len(p_sorted)

    mapping = []
    # Sample 101 points from the empirical CDF
    for i in range(101):
        idx = min(int(i / 100.0 * (n - 1)), n - 1)
        prob = float(p_sorted[idx])
        percentile = i / 100.0
        score = int(round(300 + 600 * percentile))
        mapping.append([round(prob, 6), score])

    # Ensure monotonicity
    for i in range(1, len(mapping)):
        if mapping[i][1] < mapping[i-1][1]:
            mapping[i][1] = mapping[i-1][1]

    print(f"  Calibration map: {len(mapping)} points")
    print(f"  P(repay) range: [{mapping[0][0]:.4f}, {mapping[-1][0]:.4f}]")
    print(f"  Score range: [{mapping[0][1]}, {mapping[-1][1]}]")

    return mapping


def export():
    """Export model bundle for JS backend."""
    import xgboost as xgb

    print("=" * 60)
    print("SahayCredit Model Export")
    print("=" * 60)

    # Load model
    model_path = MODEL_DIR / "sahaycredit_xgb.json"
    model = xgb.XGBClassifier()
    model.load_model(str(model_path))
    print(f"Model loaded: {model_path}")

    # Load metadata
    with open(MODEL_DIR / "model_metadata.json") as f:
        metadata = json.load(f)

    # Parse tree structure from XGBoost JSON
    print("\nParsing tree structure ...")
    with open(model_path) as f:
        model_json = json.load(f)

    # The XGBoost JSON format contains learner.gradient_booster.model.trees
    trees = model_json["learner"]["gradient_booster"]["model"]["trees"]
    tree_info = model_json["learner"]["gradient_booster"]["model"]["tree_info"]

    # Parse into simplified tree format for JS traversal
    parsed_trees = []
    for tree_idx, tree in enumerate(trees):
        # XGBoost tree format:
        # - split_indices: feature index for each node
        # - split_conditions: threshold for each node
        # - left_children: left child node index
        # - right_children: right child node index
        # - default_left: whether default (missing) goes left
        # XGBoost JSON trees already have all we need
        parsed_trees.append({
            "id": tree.get("id", tree_idx),
            "split_indices": tree.get("split_indices", []),
            "split_conditions": tree.get("split_conditions", []),
            "left_children": tree.get("left_children", []),
            "right_children": tree.get("right_children", []),
            "default_left": tree.get("default_left", []),
            "base_weights": tree.get("base_weights", []),
            "split_type": tree.get("split_type", []),
        })

    print(f"  Parsed {len(parsed_trees)} trees")

    # Build calibration map
    print("\nBuilding score calibration map ...")
    calibration_map = build_calibration_map()

    # Compute SHAP base value
    # For binary classification, base_score is the global bias (logit of mean target)
    base_score_raw = model_json["learner"]["learner_model_param"].get("base_score", "0.5")
    # XGBoost 3.x may store base_score as "[5E-1]" or "0.5" or a list
    if isinstance(base_score_raw, (list, tuple)):
        base_score = float(base_score_raw[0])
    elif isinstance(base_score_raw, str):
        cleaned = base_score_raw.strip("[] ")
        base_score = float(cleaned)
    else:
        base_score = float(base_score_raw)
    print(f"  Base score (bias): {base_score}")

    # Feature names
    feature_names = metadata["feature_names"]

    # Build display name map (only for features that exist in the model)
    display_names = {}
    for fname in feature_names:
        if fname in FEATURE_DISPLAY_NAMES:
            display_names[fname] = FEATURE_DISPLAY_NAMES[fname]
        else:
            # Fallback: clean up the name
            clean = fname.replace("_", " ").title()
            display_names[fname] = {"en": clean, "hi": clean}

    # ── Assemble JS bundle ────────────────────────────────────────────────
    bundle = {
        "version": metadata["version"],
        "created_at": datetime.now().isoformat(),
        "algorithm": "XGBClassifier",
        "objective": "binary:logistic",
        "base_score": base_score,
        "n_trees": len(parsed_trees),
        "n_features": len(feature_names),
        "feature_names": feature_names,
        "display_names": display_names,
        "trees": parsed_trees,
        "calibration_map": calibration_map,
        "hyperparameters": metadata.get("hyperparameters", {}),
    }

    # Save bundle
    bundle_path = MODEL_DIR / "sahaycredit_model_bundle.json"
    with open(bundle_path, "w") as f:
        json.dump(bundle, f, separators=(",", ":"))  # compact JSON

    size_mb = bundle_path.stat().st_size / (1024 * 1024)
    print(f"\nModel bundle saved: {bundle_path} ({size_mb:.1f} MB)")

    # Also save a human-readable version
    readable_path = MODEL_DIR / "model_bundle_readable.json"
    with open(readable_path, "w") as f:
        # Save only metadata (trees are too large for readable format)
        readable = {k: v for k, v in bundle.items() if k != "trees"}
        readable["trees"] = f"[{len(parsed_trees)} trees omitted for readability]"
        json.dump(readable, f, indent=2, default=str)

    print(f"\n{'=' * 60}")
    print("Export complete.")
    print(f"  Bundle: {bundle_path}")
    print(f"  Size:   {size_mb:.1f} MB")
    print(f"  Trees:  {len(parsed_trees)}")
    print(f"  Features: {len(feature_names)}")
    print(f"\nNext step: Update backend/scoring.js to load this bundle.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    export()
