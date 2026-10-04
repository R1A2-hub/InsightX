from fastapi import APIRouter, UploadFile, File, HTTPException
from ..schemas.analytics import ChatQuestionRequest, ComparisonRequest
from ..services.dataset_service import dataset_service
from ..ai.gemini_service import explain_evidence_with_gemini
from ..analytics.intent_engine import detect_intent

router = APIRouter()

@router.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename or not (file.filename.endswith(".csv") or file.filename.endswith(".xlsx")):
        raise HTTPException(status_code=400, detail="Unsupported extension. Upload .csv or .xlsx")
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    return dataset_service.process_file_bytes(content, file.filename)

@router.get("/datasets/active")
def get_active_dataset():
    return dataset_service.get_full_bundle()

@router.post("/chat/ask")
def ask_question(req: ChatQuestionRequest):
    bundle = dataset_service.get_full_bundle().get("bundle")
    if not bundle:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    intent = detect_intent(req.question)
    kpis = bundle.get("kpis", {})
    ans = f"Total revenue is {kpis.get('currencySymbol', '₹')}{kpis.get('totalRevenue', 0):,.2f}."
    explanation = explain_evidence_with_gemini(req.question, ans, bundle.get("evidenceList", []))
    return {
        "question": req.question,
        "parsedIntent": intent,
        "deterministicAnswer": ans,
        "aiExplanation": explanation,
        "evidence": bundle.get("evidenceList", []),
    }
