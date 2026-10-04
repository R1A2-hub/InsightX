from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel

CapabilityStatus = Literal["Directly Available", "Derived", "Unavailable"]

class ColumnMapping(BaseModel):
    originalName: str
    canonicalName: Optional[str] = None
    dataType: str
    missingCount: int
    invalidCount: int
    sampleValues: List[str]
    usedForAnalytics: bool

class CleaningAction(BaseModel):
    step: str
    column: Optional[str] = None
    description: str
    affectedRows: int

class KPISummary(BaseModel):
    totalRevenue: Optional[float] = None
    totalProfit: Optional[float] = None
    profitMargin: Optional[float] = None
    totalQuantity: Optional[float] = None
    totalCost: Optional[float] = None
    revenueGrowth: Optional[float] = None
    previousMonthRevenue: Optional[float] = None
    currentMonthRevenue: Optional[float] = None
    profitUnavailableReason: Optional[str] = None
    currencySymbol: str = "₹"

class DimensionAnalysisRow(BaseModel):
    name: str
    revenue: float
    quantity: float
    cost: Optional[float] = None
    profit: Optional[float] = None
    profitMargin: Optional[float] = None
    contributionPct: float
    rank: int

class EvidenceObject(BaseModel):
    id: str
    evidence_type: str
    title: str
    finding: str
    value: Optional[Any] = None
    secondary_values: Optional[Dict[str, Any]] = None
    unit: str
    source_columns: List[str]
    formula: str
    confidence: str = "High"

class AIInsightItem(BaseModel):
    id: str
    category: str
    title: str
    explanation: str
    evidence: EvidenceObject
    confidence: str = "High"
    sourceMetric: str
    aiGenerated: bool = False

class ChatQuestionRequest(BaseModel):
    question: str
    datasetId: Optional[str] = None

class ComparisonRequest(BaseModel):
    dimension: str = "region"
    metric: str = "revenue"
    itemA: str
    itemB: str
    datasetId: Optional[str] = None
