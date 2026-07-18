"""
Download the Berka (PKDD'99) Financial Dataset from CTU Relational Repository.
Extracts SQL dump → CSV tables for the behaviour module.

Usage:
    python ml/behaviour/downloadBerka.py
"""
import os
import io
import gzip
import re
import csv
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

CTU_URL = "https://relational-data.org/download/Financial.sql.gz"

REQUIRED_TABLES = ["account", "trans", "loan", "order"]
ALL_TABLES = ["account", "card", "client", "disp", "district", "loan", "order", "trans"]


def download_sql_gz():
    """Download the compressed SQL dump from CTU."""
    gz_path = RAW_DIR / "Financial.sql.gz"
    if gz_path.exists():
        print(f"  Financial.sql.gz already exists ({gz_path.stat().st_size:,} bytes), skipping download.")
        return gz_path

    print(f"  Downloading from: {CTU_URL}")
    req = urllib.request.Request(CTU_URL, headers={"User-Agent": "SahayCredit/1.0"})
    with urllib.request.urlopen(req, timeout=120) as response:
        data = response.read()
    gz_path.write_bytes(data)
    print(f"  Saved: {gz_path.name} ({len(data):,} bytes)")
    return gz_path


def parse_sql_to_csv(gz_path):
    """Parse the SQL dump and extract INSERT statements into CSV files."""
    print("\n  Parsing SQL dump ...")

    # Read and decompress
    with gzip.open(gz_path, "rt", encoding="utf-8", errors="replace") as f:
        sql_content = f.read()

    print(f"  SQL dump size: {len(sql_content):,} characters")

    # Extract CREATE TABLE statements to get column names
    table_columns = {}
    create_pattern = re.compile(
        r"CREATE\s+TABLE\s+[`\"]?(\w+)[`\"]?\s*\((.*?)\)\s*(?:ENGINE|;)",
        re.IGNORECASE | re.DOTALL
    )
    for match in create_pattern.finditer(sql_content):
        table_name = match.group(1).lower()
        cols_block = match.group(2)
        # Extract column names (skip constraints like PRIMARY KEY, KEY, etc.)
        columns = []
        for line in cols_block.split("\n"):
            line = line.strip().rstrip(",")
            if not line:
                continue
            # Skip constraint lines
            if re.match(r"^\s*(PRIMARY|KEY|INDEX|UNIQUE|CONSTRAINT|FOREIGN)", line, re.IGNORECASE):
                continue
            # Extract column name
            col_match = re.match(r"[`\"]?(\w+)[`\"]?\s+", line)
            if col_match:
                columns.append(col_match.group(1))
        if columns:
            table_columns[table_name] = columns
            print(f"    Table '{table_name}': {len(columns)} columns: {columns}")

    # Extract INSERT statements
    insert_pattern = re.compile(
        r"INSERT\s+INTO\s+[`\"]?(\w+)[`\"]?\s+(?:\([^)]+\)\s+)?VALUES\s*(.*?);",
        re.IGNORECASE | re.DOTALL
    )

    table_rows = {t: [] for t in ALL_TABLES}

    for match in insert_pattern.finditer(sql_content):
        table_name = match.group(1).lower()
        values_str = match.group(2)

        if table_name not in table_rows:
            table_rows[table_name] = []

        # Parse value tuples: (val1, val2, ...), (val1, val2, ...), ...
        # Handle quoted strings with commas inside
        tuple_pattern = re.compile(r"\(([^)]*?)\)")
        for tuple_match in tuple_pattern.finditer(values_str):
            raw_tuple = tuple_match.group(1)
            # Parse values respecting quotes
            values = []
            current = ""
            in_quote = False
            quote_char = None
            for ch in raw_tuple:
                if ch in ("'", '"') and not in_quote:
                    in_quote = True
                    quote_char = ch
                elif ch == quote_char and in_quote:
                    in_quote = False
                    quote_char = None
                elif ch == "," and not in_quote:
                    values.append(current.strip().strip("'\""))
                    current = ""
                    continue
                else:
                    current += ch
            values.append(current.strip().strip("'\""))
            table_rows[table_name].append(values)

    # Write CSVs
    for table_name in ALL_TABLES:
        rows = table_rows.get(table_name, [])
        if not rows:
            print(f"    {table_name}: no data found in SQL dump")
            continue

        csv_path = RAW_DIR / f"{table_name}.csv"
        columns = table_columns.get(table_name, [f"col{i}" for i in range(len(rows[0]))])

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            writer.writerows(rows)

        print(f"    {table_name}.csv: {len(rows):,} rows, {len(columns)} columns")

    return table_rows


def verify():
    """Verify all required tables are present and loadable."""
    import pandas as pd

    print("\n" + "=" * 60)
    print("Berka Dataset Verification")
    print("=" * 60)

    all_ok = True
    for table in ALL_TABLES:
        fpath = RAW_DIR / f"{table}.csv"
        if fpath.exists():
            try:
                df = pd.read_csv(fpath)
                required = table in REQUIRED_TABLES
                marker = "✓" if required else "○"
                print(f"  {marker} {table}.csv: {len(df):,} rows, {len(df.columns)} columns")
                if table == "trans":
                    print(f"      Columns: {list(df.columns)}")
                if table == "loan":
                    print(f"      Columns: {list(df.columns)}")
                    if "status" in df.columns:
                        print(f"      Status distribution: {dict(df['status'].value_counts())}")
            except Exception as e:
                print(f"  ✗ {table}.csv: ERROR reading ({e})")
                if table in REQUIRED_TABLES:
                    all_ok = False
        else:
            if table in REQUIRED_TABLES:
                print(f"  ✗ {table}.csv: MISSING (required)")
                all_ok = False
            else:
                print(f"  - {table}.csv: not found (optional)")

    print("=" * 60)
    if all_ok:
        print("All required tables present. Ready for feature engineering.")
    else:
        print("ERROR: Some required tables are missing!")
    return all_ok


if __name__ == "__main__":
    print("=" * 60)
    print("SahayCredit — Berka (PKDD'99) Dataset Download")
    print("=" * 60)

    # Check if already downloaded and parsed
    existing = [t for t in REQUIRED_TABLES if (RAW_DIR / f"{t}.csv").exists()]
    if len(existing) == len(REQUIRED_TABLES):
        print("All required tables already exist. Skipping download.")
        verify()
        exit(0)

    # Download SQL dump
    print("\nStep 1: Download SQL dump from CTU Relational Repository")
    gz_path = download_sql_gz()

    # Parse SQL to CSVs
    print("\nStep 2: Parse SQL dump into CSV tables")
    parse_sql_to_csv(gz_path)

    # Verify
    verify()
