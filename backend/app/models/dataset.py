from typing import Dict, Optional, Any, List
from pydantic import BaseModel

class DatasetRecord(BaseModel):
    dataset_id: str
    filename: str
    raw_data: List[Dict[str, Any]]
    metadata: Dict[str, Any] = {}
