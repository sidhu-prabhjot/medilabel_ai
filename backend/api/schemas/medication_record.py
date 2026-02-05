from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional

class MedicationRecordCreate(BaseModel):
    rxcui: str = Field(..., max_length=25)
    name: str = Field(..., description="Canonical RxNorm display name")
    tty: str = Field(...)

class MedicationRecordUpdate(BaseModel):
    rxcui: Optional[str] = Field(None, max_length=25)
    name: Optional[str] = Field(None, description="Canonical RxNorm display name")
    generic_rxcui: Optional[str] = Field(None)
    is_brand: Optional[bool] = Field(None)
    datetime.now(timezone.utc).isoformat()