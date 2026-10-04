from typing import Dict, Any, Optional
import pandas as pd
import io
from ..data.processor import clean_and_derive_dataset
from ..analytics.engine import calculate_kpis, analyze_dimension, detect_anomalies_iqr, forecast_next_month
from ..analytics.evidence_builder import build_evidence

class DatasetService:
    def __init__(self):
        self.active_df: Optional[pd.DataFrame] = None
        self.active_meta: Dict[str, Any] = {}

    def process_file_bytes(self, content: bytes, filename: str) -> Dict[str, Any]:
        df = pd.read_csv(io.BytesIO(content)) if filename.endswith(".csv") else pd.read_excel(io.BytesIO(content))
        cleaned_df, quality = clean_and_derive_dataset(df)
        self.active_df = cleaned_df
        self.active_meta = {"filename": filename, "quality": quality}
        return self.get_full_bundle()

    def get_full_bundle(self) -> Dict[str, Any]:
        if self.active_df is None:
            return {"bundle": None}

        kpis = calculate_kpis(self.active_df)
        products = analyze_dimension(self.active_df, "Product")
        categories = analyze_dimension(self.active_df, "Category")
        regions = analyze_dimension(self.active_df, "Region")
        top_prod = products[0] if products else None
        evidence = build_evidence(kpis, top_prod)

        return {
            "bundle": {
                "quality": self.active_meta.get("quality", {}),
                "kpis": kpis,
                "productAnalysis": products,
                "categoryAnalysis": categories,
                "regionalAnalysis": regions,
                "evidenceList": evidence,
            }
        }

dataset_service = DatasetService()
