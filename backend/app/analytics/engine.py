from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

def calculate_kpis(df: pd.DataFrame) -> Dict[str, Any]:
    total_revenue = float(df["Revenue"].sum()) if "Revenue" in df.columns else 0.0
    has_cost = "Cost" in df.columns and "Profit" in df.columns
    total_profit = float(df["Profit"].sum()) if has_cost else None
    profit_margin = round((total_profit / total_revenue) * 100, 2) if (has_cost and total_revenue > 0 and total_profit is not None) else None
    total_quantity = float(df["Quantity"].sum()) if "Quantity" in df.columns else None

    growth_pct = None
    if "Month" in df.columns and df["Month"].notna().any():
        monthly = df.groupby("Month")["Revenue"].sum().sort_index()
        if len(monthly) >= 2 and monthly.iloc[-2] > 0:
            growth_pct = round(float(((monthly.iloc[-1] - monthly.iloc[-2]) / monthly.iloc[-2]) * 100), 2)

    return {
        "totalRevenue": round(total_revenue, 2),
        "totalProfit": round(total_profit, 2) if total_profit is not None else None,
        "profitMargin": profit_margin,
        "totalQuantity": round(total_quantity, 2) if total_quantity is not None else None,
        "revenueGrowth": growth_pct,
        "profitUnavailableReason": None if has_cost else "Profit unavailable because Cost data is missing.",
        "currencySymbol": "₹",
    }

def analyze_dimension(df: pd.DataFrame, dimension: str) -> List[Dict[str, Any]]:
    if dimension not in df.columns or "Revenue" not in df.columns:
        return []
    total_rev = float(df["Revenue"].sum())
    has_cost = "Profit" in df.columns
    agg_spec: Dict[str, str] = {"Revenue": "sum"}
    if "Quantity" in df.columns:
        agg_spec["Quantity"] = "sum"
    if has_cost:
        agg_spec["Profit"] = "sum"

    grouped = df.groupby(dimension, as_index=False).agg(agg_spec).sort_values("Revenue", ascending=False)
    results: List[Dict[str, Any]] = []
    for idx, row in enumerate(grouped.to_dict(orient="records")):
        rev = round(float(row["Revenue"]), 2)
        contrib = round((rev / total_rev) * 100, 2) if total_rev > 0 else 0.0
        results.append({
            "name": row[dimension],
            "revenue": rev,
            "quantity": round(float(row.get("Quantity", 0.0)), 2),
            "profit": round(float(row["Profit"]), 2) if has_cost else None,
            "contributionPct": contrib,
            "rank": idx + 1,
        })
    return results

def detect_anomalies_iqr(monthly_series: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if len(monthly_series) < 4:
        return []
    revs = np.array([m["revenue"] for m in monthly_series], dtype=float)
    q1 = float(np.percentile(revs, 25))
    median = float(np.percentile(revs, 50))
    q3 = float(np.percentile(revs, 75))
    iqr = q3 - q1
    lower = max(0.0, round(q1 - 1.5 * iqr, 2))
    upper = round(q3 + 1.5 * iqr, 2)

    anomalies = []
    for m in monthly_series:
        val = float(m["revenue"])
        if val > upper or val < lower:
            anomalies.append({
                "date": m["month"],
                "revenue": val,
                "expectedRange": {"lower": lower, "upper": upper, "median": round(median, 2), "iqr": round(iqr, 2)},
                "reason": f"Revenue {val:,.2f} is outside expected IQR range [{lower:,.2f}, {upper:,.2f}].",
            })
    return anomalies

def forecast_next_month(monthly_series: List[Dict[str, Any]]) -> Dict[str, Any]:
    n = len(monthly_series)
    if n < 3:
        return {
            "available": False,
            "unavailableReason": "Minimum 3 monthly observations required for forecasting.",
            "disclaimer": "Estimate — not a guarantee.",
        }
    X = np.arange(n).reshape(-1, 1)
    y = np.array([m["revenue"] for m in monthly_series], dtype=float)
    model = LinearRegression()
    model.fit(X, y)
    y_pred_hist = model.predict(X)
    mae = float(mean_absolute_error(y, y_pred_hist))
    rmse = float(root_mean_squared_error(y, y_pred_hist))
    next_pred = max(0.0, float(model.predict(np.array([[n]]))[0]))
    margin = max(rmse * 1.28, mae * 1.25)

    return {
        "available": True,
        "prediction": round(next_pred, 2),
        "lowerBound": round(max(0.0, next_pred - margin), 2),
        "upperBound": round(next_pred + margin, 2),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "disclaimer": "Estimate — not a guarantee.",
    }
