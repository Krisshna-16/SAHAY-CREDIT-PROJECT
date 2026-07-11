"""
SahayCredit — Download Bureau & Previous Application Data
============================================================
Attempts to download bureau.csv, bureau_balance.csv, and previous_application.csv
from the Home Credit Default Risk dataset via HuggingFace.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"

NEEDED_FILES = [
    "bureau.csv",
    "bureau_balance.csv",
    "previous_application.csv",
]

def main():
    print("=" * 60)
    print("Attempting to download bureau + previous_application data")
    print("=" * 60)
    
    # Check what already exists
    for f in NEEDED_FILES:
        path = RAW_DIR / f
        if path.exists():
            size_mb = path.stat().st_size / (1024*1024)
            print(f"  FOUND: {f} ({size_mb:.1f} MB)")
        else:
            print(f"  MISSING: {f}")
    
    missing = [f for f in NEEDED_FILES if not (RAW_DIR / f).exists()]
    if not missing:
        print("\nAll files present. Nothing to download.")
        return True
    
    # Approach 1: Try HuggingFace datasets library with the known repo
    print(f"\nAttempt 1: HuggingFace datasets library ...")
    try:
        from datasets import load_dataset
        
        # The jlh/home-credit repo was used for application_train
        # Try loading additional splits/configs
        for fname in missing:
            config_name = fname.replace(".csv", "")
            try:
                print(f"  Trying config '{config_name}' ...")
                ds = load_dataset("jlh/home-credit", config_name, split="train")
                df = ds.to_pandas()
                out_path = RAW_DIR / fname
                df.to_csv(out_path, index=False, encoding="utf-8")
                print(f"  SUCCESS: {fname} — {len(df):,} rows, {len(df.columns)} cols")
            except Exception as e:
                print(f"  FAILED: {config_name} — {e}")
    except ImportError:
        print("  datasets library not available")
    except Exception as e:
        print(f"  HuggingFace approach failed: {e}")
    
    # Check what we got
    still_missing = [f for f in NEEDED_FILES if not (RAW_DIR / f).exists()]
    
    if still_missing:
        # Approach 2: Try direct URL from other HF repos
        print(f"\nAttempt 2: Direct HTTP download from HuggingFace mirrors ...")
        import urllib.request
        
        mirrors = [
            "https://huggingface.co/datasets/jlh/home-credit/resolve/main/",
            "https://huggingface.co/datasets/elyza/home-credit-default-risk/resolve/main/",
        ]
        
        for fname in still_missing:
            downloaded = False
            for base_url in mirrors:
                url = base_url + fname
                try:
                    print(f"  Trying {url} ...")
                    urllib.request.urlretrieve(url, str(RAW_DIR / fname))
                    size_mb = (RAW_DIR / fname).stat().st_size / (1024*1024)
                    print(f"  SUCCESS: {fname} ({size_mb:.1f} MB)")
                    downloaded = True
                    break
                except Exception as e:
                    print(f"  FAILED: {e}")
            
            if not downloaded:
                print(f"  BLOCKER: Cannot download {fname}")
    
    # Final check
    final_missing = [f for f in NEEDED_FILES if not (RAW_DIR / f).exists()]
    
    if final_missing:
        print(f"\n{'='*60}")
        print(f"BLOCKER: Could not source {len(final_missing)} file(s):")
        for f in final_missing:
            print(f"  - {f}")
        print(f"\nThe feature engineering pipeline will use NaN fallback for")
        print(f"bureau/previous-application features. These features will")
        print(f"be documented as non-contributing in the hardening report.")
        print(f"{'='*60}")
        return False
    else:
        print(f"\nAll files successfully downloaded!")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
