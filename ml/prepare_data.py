"""
Convert the HuggingFace parquet dataset to CSV format expected by the ML pipeline.
Also handles downloading from HuggingFace if the data isn't already present.

Usage:
    python ml/prepare_data.py
"""
import os
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)


def download_from_huggingface():
    """Download the Home Credit dataset from HuggingFace."""
    try:
        from huggingface_hub import hf_hub_download
        import pandas as pd

        print("Downloading Home Credit dataset from HuggingFace ...")
        print("  Repository: jlh/home-credit")

        # Download the parquet file
        local_path = hf_hub_download(
            repo_id="jlh/home-credit",
            filename="data/train-00000-of-00001-e68d01965482ae18.parquet",
            repo_type="dataset"
        )
        print(f"  Downloaded parquet to: {local_path}")

        # Convert parquet to CSV
        print("  Converting parquet to CSV ...")
        df = pd.read_parquet(local_path)
        csv_path = RAW_DIR / "application_train.csv"
        df.to_csv(csv_path, index=False)
        print(f"  Saved: {csv_path}")
        print(f"  Rows: {len(df):,}")
        print(f"  Columns: {len(df.columns)}")

        # Check for TARGET column
        if "TARGET" in df.columns:
            print(f"  TARGET distribution:")
            print(f"    0 (repaid):  {(df['TARGET']==0).sum():,} ({(df['TARGET']==0).mean():.1%})")
            print(f"    1 (default): {(df['TARGET']==1).sum():,} ({(df['TARGET']==1).mean():.1%})")
        else:
            print("  WARNING: TARGET column not found! Available columns:")
            print(f"    {list(df.columns[:20])} ...")

        return True

    except ImportError:
        print("ERROR: huggingface_hub not installed. Run: pip install huggingface_hub")
        return False
    except Exception as e:
        print(f"ERROR: HuggingFace download failed: {e}")
        return False


def verify_data():
    """Verify all required files are present."""
    print("\n" + "=" * 60)
    print("Dataset Verification")
    print("=" * 60)

    import pandas as pd

    train_path = RAW_DIR / "application_train.csv"
    if not train_path.exists():
        print("  ERROR: application_train.csv not found!")
        return False

    # Quick verify
    df = pd.read_csv(train_path, nrows=5)
    row_count = sum(1 for _ in open(train_path, encoding="utf-8", errors="ignore")) - 1
    print(f"  application_train.csv: {row_count:,} rows, {len(df.columns)} columns")

    # Check supplementary files
    for fname in ["bureau.csv", "bureau_balance.csv", "previous_application.csv"]:
        fpath = RAW_DIR / fname
        if fpath.exists():
            rc = sum(1 for _ in open(fpath, encoding="utf-8", errors="ignore")) - 1
            print(f"  {fname}: {rc:,} rows (supplementary)")
        else:
            print(f"  {fname}: not found (will be skipped in feature engineering)")

    # TARGET distribution
    df_full = pd.read_csv(train_path, usecols=["TARGET"])
    print(f"\n  TARGET distribution:")
    print(f"    0 (repaid):  {(df_full['TARGET']==0).sum():,} ({(df_full['TARGET']==0).mean():.1%})")
    print(f"    1 (default): {(df_full['TARGET']==1).sum():,} ({(df_full['TARGET']==1).mean():.1%})")

    print("=" * 60)
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("SahayCredit Data Preparation")
    print("=" * 60)

    # Check if CSV already exists
    train_csv = RAW_DIR / "application_train.csv"
    if train_csv.exists():
        print(f"application_train.csv already exists ({train_csv.stat().st_size:,} bytes)")
        print("Skipping download.")
    else:
        # Try HuggingFace
        success = download_from_huggingface()
        if not success:
            print("\nDownload failed. Please manually place the dataset files in:")
            print(f"  {RAW_DIR}")
            sys.exit(1)

    verify_data()
    print("\nData preparation complete. Next step: python ml/features.py")
