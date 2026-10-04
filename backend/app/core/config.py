import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "InsightX — AI Data Analyst API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

settings = Settings()
