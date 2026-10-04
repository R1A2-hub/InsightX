from typing import List, Dict, Any

def build_evidence(kpis: Dict[str, Any], top_product: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    evidence: List[Dict[str, Any]] = []

    evidence.append({
        "id": "ev-kpi-revenue",
        "evidence_type": "kpi_summary",
        "title": "Total Revenue Performance",
        "finding": f"Total revenue is {kpis.get('currencySymbol', '₹')}{kpis.get('totalRevenue', 0):,.2f}.",
        "value": kpis.get("totalRevenue"),
        "unit": "currency",
        "source_columns": ["Revenue"],
        "formula": "sum(Revenue)",
        "confidence": "High",
    })

    if top_product:
        evidence.append({
            "id": "ev-top-product",
            "evidence_type": "product_ranking",
            "title": f"Top Product: {top_product['name']}",
            "finding": f"{top_product['name']} generated {kpis.get('currencySymbol', '₹')}{top_product['revenue']:,.2f}.",
            "value": top_product["revenue"],
            "unit": "currency",
            "source_columns": ["Product", "Revenue"],
            "formula": "sum(Revenue) grouped by Product DESC LIMIT 1",
            "confidence": "High",
        })

    return evidence
