import io
from typing import Dict, Any, Tuple, List, Optional
import pandas as pd
import numpy as np

COLUMN_ALIASES: Dict[str, List[str]] = {
    "Quantity": ["quantity", "qty", "units", "units_sold", "order_qty", "item_qty"],
    "Selling_Price": ["selling_price", "price", "unit_price", "rate", "mrp", "sale_price"],
    "Revenue": ["revenue", "sales", "total_sales", "gross_sales", "amount", "turnover"],
    "Cost": ["cost", "total_cost", "expense", "cogs", "cost_price", "total_expense"],
    "Product": ["product", "product_name", "item", "item_name", "sku"],
    "Category": ["category", "product_category", "cat", "department"],
    "Region": ["region", "area", "zone", "territory", "state", "location"],
    "Date": ["date", "order_date", "sale_date", "transaction_date", "invoice_date"],
}

def normalize_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    mapping: Dict[str, str] = {}
    used_canonical = set()
    for col in df.columns:
        clean_col = str(col).strip().lower().replace(" ", "_").replace("-", "_")
        for canonical, aliases in COLUMN_ALIASES.items():
            if clean_col in aliases and canonical not in used_canonical:
                mapping[col] = canonical
                used_canonical.add(canonical)
                break
    return df.rename(columns=mapping), mapping

def clean_and_derive_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    raw_rows = len(df)
    df, mapping = normalize_columns(df)

    # 1. Deduplicate
    df = df.drop_duplicates().copy()
    duplicates_removed = raw_rows - len(df)

    # 2. Categorical missing -> "Unknown"
    for cat_col in ["Product", "Category", "Region"]:
        if cat_col in df.columns:
            df[cat_col] = df[cat_col].fillna("Unknown").replace("", "Unknown").astype(str)
        else:
            df[cat_col] = "Unknown"

    # 3. Numeric safe parsing & median imputation
    for num_col in ["Quantity", "Selling_Price", "Revenue", "Cost"]:
        if num_col in df.columns:
            df[num_col] = (
                df[num_col]
                .astype(str)
                .str.replace(r"[₹$,\s]", "", regex=True)
            )
            df[num_col] = pd.to_numeric(df[num_col], errors="coerce")
            med = float(df[num_col].median()) if not df[num_col].dropna().empty else 0.0
            df[num_col] = df[num_col].fillna(med)

    # 4. Derived Revenue = Quantity * Selling_Price if Revenue missing
    if "Revenue" not in df.columns and "Quantity" in df.columns and "Selling_Price" in df.columns:
        df["Revenue"] = (df["Quantity"] * df["Selling_Price"]).round(2)

    # 5. Derived Profit = Revenue - Cost if Cost exists
    if "Cost" in df.columns and "Revenue" in df.columns:
        df["Profit"] = (df["Revenue"] - df["Cost"]).round(2)

    # 6. Normalize Date
    if "Date" in df.columns:
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        df["Month"] = df["Date"].dt.strftime("%Y-%m")
    else:
        df["Month"] = None

    return df, {
        "raw_rows": raw_rows,
        "cleaned_rows": len(df),
        "duplicates_removed": duplicates_removed,
        "column_mapping": mapping,
        "has_cost": "Cost" in df.columns,
    }
