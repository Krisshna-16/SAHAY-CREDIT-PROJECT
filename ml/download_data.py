"""
Download Home Credit Default Risk dataset from Kaggle using requests.
Falls back if Kaggle CLI is not working.
"""
import os
import sys
import json
import zipfile
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

def download_with_kaggle_api():
    """Try using kaggle Python API directly."""
    try:
        os.environ["KAGGLE_CONFIG_DIR"] = str(Path.home() / ".kaggle")
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        print("Kaggle API authenticated successfully.")
        print(f"Downloading to {RAW_DIR} ...")
        api.competition_download_files("home-credit-default-risk", path=str(RAW_DIR), quiet=False)
        print("Download complete.")
        return True
    except Exception as e:
        print(f"Kaggle API method failed: {e}")
        return False

def download_with_requests():
    """Download using requests library with credentials from kaggle.json."""
    import requests

    # Load credentials
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        print(f"ERROR: {kaggle_json} not found.")
        return False

    with open(kaggle_json) as f:
        creds = json.load(f)

    username = creds.get("username", "")
    key = creds.get("key", "")

    if not username or not key:
        print("ERROR: Invalid kaggle.json — missing username or key.")
        return False

    print(f"Using credentials for user: {username}")

    # Try to download the competition data using the v1 API
    files_to_download = [
        "application_train.csv.zip",
        "application_test.csv.zip",
        "bureau.csv.zip",
        "bureau_balance.csv.zip",
        "previous_application.csv.zip",
    ]

    base_url = "https://www.kaggle.com/api/v1/competitions/data/download/home-credit-default-risk"

    session = requests.Session()
    session.auth = (username, key)

    for filename in files_to_download:
        # Strip .zip extension for the API call
        csv_name = filename.replace(".zip", "")
        url = f"{base_url}/{csv_name}"
        print(f"  Downloading {csv_name} ...")

        try:
            resp = session.get(url, stream=True, timeout=300)
            if resp.status_code == 200:
                out_path = RAW_DIR / filename
                total = int(resp.headers.get("content-length", 0))
                downloaded = 0
                with open(out_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total > 0:
                            pct = downloaded / total * 100
                            print(f"\r    {downloaded:,} / {total:,} bytes ({pct:.1f}%)", end="", flush=True)
                print(f"\n    Saved: {out_path} ({out_path.stat().st_size:,} bytes)")

                # Unzip if needed
                if filename.endswith(".zip"):
                    print(f"    Unzipping ...")
                    with zipfile.ZipFile(out_path, "r") as zf:
                        zf.extractall(RAW_DIR)
                    os.remove(out_path)
            elif resp.status_code == 403:
                print(f"    403 Forbidden — you may need to accept competition rules at:")
                print(f"    https://www.kaggle.com/competitions/home-credit-default-risk/rules")
                return False
            elif resp.status_code == 401:
                print(f"    401 Unauthorized — invalid credentials")
                return False
            else:
                print(f"    HTTP {resp.status_code}: {resp.text[:200]}")
                return False
        except Exception as e:
            print(f"    Error: {e}")
            return False

    return True

def unzip_all():
    """Unzip any remaining zip files in RAW_DIR."""
    for zf_path in RAW_DIR.glob("*.zip"):
        print(f"Unzipping {zf_path.name} ...")
        with zipfile.ZipFile(zf_path, "r") as zf:
            zf.extractall(RAW_DIR)
        os.remove(zf_path)
        print(f"  Done.")

def verify():
    """Verify downloaded files."""
    import pandas as pd

    expected_files = ["application_train.csv", "application_test.csv"]
    optional_files = ["bureau.csv", "bureau_balance.csv", "previous_application.csv"]

    print("\n" + "=" * 60)
    print("Dataset Verification")
    print("=" * 60)

    all_good = True
    for fname in expected_files:
        fpath = RAW_DIR / fname
        if fpath.exists():
            df = pd.read_csv(fpath, nrows=5)
            full_count = sum(1 for _ in open(fpath, encoding='utf-8', errors='ignore')) - 1
            print(f"  ✓ {fname}: {full_count:,} rows, {len(df.columns)} columns")
        else:
            print(f"  ✗ {fname}: NOT FOUND")
            all_good = False

    for fname in optional_files:
        fpath = RAW_DIR / fname
        if fpath.exists():
            full_count = sum(1 for _ in open(fpath, encoding='utf-8', errors='ignore')) - 1
            print(f"  ✓ {fname}: {full_count:,} rows (optional)")
        else:
            print(f"  - {fname}: not found (optional)")

    # Target distribution
    train_path = RAW_DIR / "application_train.csv"
    if train_path.exists():
        df = pd.read_csv(train_path, usecols=["TARGET"])
        print(f"\n  TARGET distribution:")
        print(f"    0 (repaid):  {(df['TARGET']==0).sum():,} ({(df['TARGET']==0).mean():.1%})")
        print(f"    1 (default): {(df['TARGET']==1).sum():,} ({(df['TARGET']==1).mean():.1%})")

    print("=" * 60)
    return all_good


if __name__ == "__main__":
    print("=" * 60)
    print("SahayCredit Dataset Downloader")
    print("=" * 60)

    # Try Kaggle API first
    success = download_with_kaggle_api()

    if not success:
        print("\nTrying requests-based download ...")
        success = download_with_requests()

    if success:
        unzip_all()
        verify()
    else:
        print("\n❌ Download failed. Please manually download the dataset from:")
        print("   https://www.kaggle.com/competitions/home-credit-default-risk/data")
        print(f"   Place CSV files in: {RAW_DIR}")
        sys.exit(1)
