"""End-to-end API tests for SahayCredit Phase 2 composite scoring."""
import json
import urllib.request

BASE = "http://localhost:3000"

def post_json(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=10).read())

def get_json(path):
    req = urllib.request.Request(BASE + path)
    return json.loads(urllib.request.urlopen(req, timeout=10).read())

answers = ["0","1","0","1","0","1","0","1","0","1","0","1","0","1","0"]
ecom_data = [
    {"date": "2025-06-01", "amount": 1500, "category": "electronics", "reviewScore": 5, "wasLate": False},
    {"date": "2025-07-10", "amount": 850, "category": "clothing", "reviewScore": 4, "wasLate": False},
    {"date": "2025-08-15", "amount": 2200, "category": "groceries", "reviewScore": 5, "wasLate": False},
    {"date": "2025-09-05", "amount": 680, "category": "home", "reviewScore": 3, "wasLate": True},
    {"date": "2025-10-20", "amount": 1100, "category": "electronics", "reviewScore": 4, "wasLate": False},
]
merchant_data = [
    {"date": "2025-04-01", "rating": 4, "text": "Good service and quality products."},
    {"date": "2025-05-15", "rating": 5, "text": "Excellent experience, very professional."},
    {"date": "2025-06-20", "rating": 3, "text": "Average quality."},
    {"date": "2025-07-10", "rating": 5, "text": "Amazing! Best in the area."},
    {"date": "2025-08-25", "rating": 4, "text": "Reliable and consistent quality."},
]

# ── Test 1: Core-only ──
print("=== TEST 1: Core-only (no alt-data) ===")
r1 = post_json("/api/score", {"answers": answers, "borrowerId": "test-core-only"})
d1 = r1["data"]
print("  Score:", d1["score"])
print("  Composite confidence:", d1.get("compositeConfidence", "N/A"))
print("  Source count:", d1.get("sourceCount", "N/A"))
bd1 = d1.get("compositeBreakdown", {})
for k, v in bd1.items():
    print("    %s: weight=%.2f score=%s" % (k, v["weight"], v.get("score", v.get("subScore", "?"))))
print()

# ── Test 2: Core + e-commerce ──
print("=== TEST 2: Core + e-commerce ===")
post_json("/api/consent/grant", {"borrowerId": "test-ecom", "sourceId": "ecommerce"})
r2 = post_json("/api/score", {"answers": answers, "borrowerId": "test-ecom", "ecommerceData": ecom_data})
d2 = r2["data"]
print("  Score:", d2["score"])
print("  Composite confidence:", d2.get("compositeConfidence", "N/A"))
print("  Source count:", d2.get("sourceCount", "N/A"))
bd2 = d2.get("compositeBreakdown", {})
for k, v in bd2.items():
    print("    %s: weight=%.2f score=%s subScore=%s" % (k, v["weight"], v.get("score", "?"), v.get("subScore", "N/A")))
core_w2 = bd2.get("core", {}).get("weight", 0)
print("  Core weight >= 0.60:", "PASS" if core_w2 >= 0.60 else "FAIL")
print()

# ── Test 3: MSME with all 3 ──
print("=== TEST 3: MSME (core + ecom + merchant) ===")
post_json("/api/consent/grant", {"borrowerId": "test-msme", "sourceId": "ecommerce"})
post_json("/api/consent/grant", {"borrowerId": "test-msme", "sourceId": "merchantRatings"})
r3 = post_json("/api/score", {
    "answers": answers, "borrowerId": "test-msme", "isMSME": True,
    "ecommerceData": ecom_data, "merchantData": merchant_data
})
d3 = r3["data"]
print("  Score:", d3["score"])
print("  Composite confidence:", d3.get("compositeConfidence", "N/A"))
print("  Source count:", d3.get("sourceCount", "N/A"))
bd3 = d3.get("compositeBreakdown", {})
for k, v in bd3.items():
    print("    %s: weight=%.2f score=%s subScore=%s" % (k, v["weight"], v.get("score", "?"), v.get("subScore", "N/A")))
core_w3 = bd3.get("core", {}).get("weight", 0)
print("  Core weight >= 0.60:", "PASS" if core_w3 >= 0.60 else "FAIL")
print()

# ── Test 4: Consent revocation ──
print("=== TEST 4: Consent revocation ===")
rev = post_json("/api/consent/revoke", {"borrowerId": "test-ecom", "sourceId": "ecommerce"})
print("  Revoke success:", rev["success"])
print("  Revoked at:", rev.get("data", {}).get("revokedAt", "?"))
print()

# ── Test 5: Applications endpoint ──
print("=== TEST 5: /api/applications composite breakdown ===")
apps = get_json("/api/applications")
for app in apps["data"][:4]:
    bd = app.get("compositeBreakdown", {})
    print("  %s: sources=%s sourceCount=%s" % (app["name"], list(bd.keys()), app.get("sourceCount", "?")))
print()

# ── Test 6: Consent audit log ──
print("=== TEST 6: Consent audit log ===")
audit = get_json("/api/consent-audit")
print("  Audit entries:", len(audit.get("data", [])))
for entry in audit.get("data", [])[:5]:
    print("    [%s] %s" % (entry.get("action", "?"), entry.get("sourceId", "?")))

print()
print("=== ALL TESTS COMPLETE ===")
