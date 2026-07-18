"""
SahayCredit — Weight of Evidence (WOE) Binning Utility
========================================================
Standalone WOE implementation for Behaviour Scorecard.
No external WOE library dependency — keeps it portable.

Usage:
    from ml.behaviour.woe import compute_woe_bins, apply_woe
"""
import numpy as np
import pandas as pd


def compute_woe_bins(series: pd.Series, target: pd.Series, n_bins: int = 5, min_pct: float = 0.05) -> list:
    """
    Compute Weight of Evidence bins for a continuous feature.
    
    WOE = ln(% of events / % of non-events) per bin.
    
    Args:
        series: Feature values (continuous).
        target: Binary target (0/1).
        n_bins: Number of bins to create.
        min_pct: Minimum fraction of observations per bin.
    
    Returns:
        List of dicts: [{"lower": float, "upper": float, "woe": float, "iv": float, "count": int}]
    """
    df = pd.DataFrame({"feature": series.values, "target": target.values}).dropna()
    
    if len(df) < n_bins * 2:
        n_bins = max(2, len(df) // 2)
    
    # Create quantile-based bins
    try:
        df['bin'], bin_edges = pd.qcut(df['feature'], q=n_bins, retbins=True, duplicates='drop')
    except ValueError:
        # Fallback if too few unique values
        df['bin'], bin_edges = pd.cut(df['feature'], bins=n_bins, retbins=True, duplicates='drop')
    
    total_events = df['target'].sum()
    total_non_events = len(df) - total_events
    
    # Prevent division by zero
    if total_events == 0 or total_non_events == 0:
        return [{"lower": float('-inf'), "upper": float('inf'), "woe": 0.0, "iv": 0.0, "count": len(df)}]
    
    bins_result = []
    for bin_label in sorted(df['bin'].unique()):
        bin_data = df[df['bin'] == bin_label]
        events = bin_data['target'].sum()
        non_events = len(bin_data) - events
        count = len(bin_data)
        
        # Add Laplace smoothing (0.5) to avoid ln(0)
        pct_events = (events + 0.5) / (total_events + 1.0)
        pct_non_events = (non_events + 0.5) / (total_non_events + 1.0)
        
        woe = np.log(pct_non_events / pct_events)
        iv = (pct_non_events - pct_events) * woe
        
        bins_result.append({
            "lower": float(bin_label.left),
            "upper": float(bin_label.right),
            "woe": float(woe),
            "iv": float(iv),
            "count": int(count),
            "events": int(events),
            "non_events": int(non_events)
        })
    
    # Set first bin lower to -inf, last bin upper to +inf
    if bins_result:
        bins_result[0]["lower"] = float('-inf')
        bins_result[-1]["upper"] = float('inf')
    
    return bins_result


def apply_woe(value: float, bins: list) -> float:
    """
    Apply WOE transformation to a single value using precomputed bins.
    
    Args:
        value: The raw feature value.
        bins: List of bin dicts from compute_woe_bins().
    
    Returns:
        The WOE value for the bin this value falls into.
    """
    if np.isnan(value) or np.isinf(value):
        # Return the WOE of the bin with the most observations (most common bin)
        best = max(bins, key=lambda b: b["count"])
        return best["woe"]
    
    for b in bins:
        if b["lower"] < value <= b["upper"]:
            return b["woe"]
    
    # Edge case: value <= first bin lower bound
    if value <= bins[0]["upper"]:
        return bins[0]["woe"]
    # Edge case: value > last bin upper bound
    return bins[-1]["woe"]


def apply_woe_series(series: pd.Series, bins: list) -> pd.Series:
    """Apply WOE transformation to an entire pandas Series."""
    return series.apply(lambda v: apply_woe(v, bins))


def compute_iv(bins: list) -> float:
    """Compute total Information Value from a set of WOE bins."""
    return sum(b["iv"] for b in bins)


if __name__ == "__main__":
    # Quick self-test
    np.random.seed(42)
    X = pd.Series(np.random.randn(200))
    y = pd.Series((X > 0.3).astype(int))
    
    bins = compute_woe_bins(X, y, n_bins=5)
    print("WOE Bins:")
    for b in bins:
        print(f"  ({b['lower']:.2f}, {b['upper']:.2f}]: WOE={b['woe']:.4f}, IV={b['iv']:.4f}, count={b['count']}")
    
    print(f"\nTotal IV: {compute_iv(bins):.4f}")
    
    # Test apply
    test_vals = [-2.0, 0.0, 0.5, 1.5, float('nan')]
    for v in test_vals:
        print(f"  apply_woe({v}) = {apply_woe(v, bins):.4f}")
