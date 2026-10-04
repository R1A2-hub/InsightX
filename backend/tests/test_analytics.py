import pandas as pd
from app.data.processor import clean_and_derive_dataset
from app.analytics.engine import calculate_kpis, analyze_dimension, detect_anomalies_iqr, forecast_next_month

def test_derived_revenue_and_profit():
    df = pd.DataFrame([
        {"order_date": "2025-01-10", "product_name": "Laptop", "category": "Tech", "region": "North", "qty": 4, "unit_price": 50000, "cost": 150000},
        {"order_date": "2025-02-10", "product_name": "Mouse", "category": "Tech", "region": "South", "qty": 20, "unit_price": 1000, "cost": 12000},
    ])
    cleaned, meta = clean_and_derive_dataset(df)
    kpis = calculate_kpis(cleaned)
    assert kpis["totalRevenue"] == 220000.0
    assert kpis["totalProfit"] == 58000.0
    assert kpis["profitUnavailableReason"] is None

def test_unavailable_profit_when_cost_missing():
    df = pd.DataFrame([
        {"date": "2025-01-10", "product": "Laptop", "revenue": 100000, "qty": 2},
    ])
    cleaned, _ = clean_and_derive_dataset(df)
    kpis = calculate_kpis(cleaned)
    assert kpis["totalProfit"] is None
    assert kpis["profitUnavailableReason"] == "Profit unavailable because Cost data is missing."

def test_forecast_and_iqr_anomaly():
    series = [
        {"month": "2025-01", "revenue": 100000},
        {"month": "2025-02", "revenue": 120000},
        {"month": "2025-03", "revenue": 140000},
        {"month": "2025-04", "revenue": 160000},
    ]
    fc = forecast_next_month(series)
    assert fc["available"] is True
    assert fc["prediction"] == 180000.0
    assert fc["disclaimer"] == "Estimate — not a guarantee."
