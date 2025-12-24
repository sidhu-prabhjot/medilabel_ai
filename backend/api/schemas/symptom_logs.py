from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional

class SymptomLogCreate(BaseModel):
    symptom: str = Field(..., max_length=50)
    severity: int = Field(5, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=500)
    is_resolved: bool = Field(False)

class SymptomLogUpdate(BaseModel):
    symptom: Optional[str] = Field(None, max_length=50)
    severity: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=500)
    is_resolved: Optional[bool] = None
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())