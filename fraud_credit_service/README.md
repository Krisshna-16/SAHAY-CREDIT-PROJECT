# SahayCredit Scoring Service — Setup

This is a **standalone** service. It does not touch your existing Node.js
backend or any other project files — it's a new folder that runs on its own
port and gets called over HTTP.

## 1. Files you must add to this folder before running

- `sahaycredit_xgb.json` — the credit model file (already have this, from your teammate)
- `fraud_model_ieee.txt` — export this from Colab:
  ```python
  ieee_model.booster_.save_model('/content/drive/MyDrive/sahaycredit_data/saved_models/fraud_model_ieee.txt')
  ```
  (if you used the `lgb.Booster` reload path instead, it's already at that Drive path — just download it)
- `target_encoding_maps.json` — the file you already have from your teammate (full JSON, all 7 categorical maps)
- `fraud_reference_probs.npy` — **required**, see next section

## 2. IMPORTANT: generate fraud_reference_probs.npy

The fraud model's raw probability output is compressed (not spread across 0-1)
because of `scale_pos_weight`. We fixed this in Colab by scoring against a
percentile of a reference distribution rather than a fixed threshold. The
service needs that same reference distribution saved to a file.

Run this once in Colab (same session where `ieee_model`/`fraud_probs_all` exist):
```python
import numpy as np
np.save('/content/drive/MyDrive/sahaycredit_data/saved_models/fraud_reference_probs.npy', fraud_probs_all)
```
Then download that `.npy` file and place it in this folder.

Without this file, `/fraud/score` and `/decision` will return a clear error
rather than silently giving you a wrong/uncalibrated score.

## 3. Install and run

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 4. Test it

```bash
curl http://localhost:8000/health
```

```bash
curl -X POST http://localhost:8000/decision \
  -H "Content-Type: application/json" \
  -d '{"credit_default_prob": 0.558282, "fraud_prob": 0.06}'
```

## 5. Calling it from your existing Node.js backend

No changes needed to existing files — just add a new outgoing HTTP call
wherever your app currently needs a score, e.g.:

```javascript
const response = await fetch("http://localhost:8000/decision", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ credit_default_prob, fraud_prob })
});
const result = await response.json();
```

This service can run locally on your laptop during the demo — no deployment
or cloud costs required.
