from typing import Dict, Any, List

HINGLISH_MARKERS = ["kitna", "kitni", "sabse", "zyada", "bhai", "konsa", "kaunsa", "me se"]

def detect_intent(question: str) -> Dict[str, Any]:
    q = question.strip().lower()
    is_hinglish = any(m in q for m in HINGLISH_MARKERS)

    metric = "revenue"
    if "profit" in q or "munafa" in q:
        metric = "profit"
    elif "cost" in q or "kharcha" in q:
        metric = "cost"
    elif "quantity" in q or "units" in q or "qty" in q:
        metric = "quantity"

    dimension = None
    if "product" in q or "item" in q:
        dimension = "product"
    elif "region" in q or "zone" in q or "area" in q:
        dimension = "region"
    elif "category" in q:
        dimension = "category"

    intent = "metric_value"
    if "compare" in q or " vs " in q or "me se" in q:
        intent = "comparison"
    elif "forecast" in q or "next month" in q or "predict" in q or "agla" in q:
        intent = "forecast"
    elif "trend" in q or "growth" in q or "grow" in q:
        intent = "trend"
    elif dimension is not None and ("which" in q or "top" in q or "best" in q or "sabse" in q):
        intent = "top_dimension"

    return {
        "raw_question": question,
        "intent": intent,
        "metric": metric,
        "dimension": dimension,
        "is_hinglish": is_hinglish,
    }
