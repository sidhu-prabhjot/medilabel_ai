from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MedicationResponse(BaseModel):
    medication_id: int
    rxcui: str
    name: str
    generic_rxcui: Optional[str]
    is_brand: bool
    created_at: datetime
    updated_at: Optional[datetime]


class MedicationRecordCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    rxcui: str = Field(..., max_length=25)
    name: str = Field(..., max_length=255, description="Canonical RxNorm display name")
    tty: str = Field(..., max_length=10)

class MedicationRecordUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    rxcui: Optional[str] = Field(None, max_length=25)
    name: Optional[str] = Field(None, max_length=255, description="Canonical RxNorm display name")
    generic_rxcui: Optional[str] = Field(None)
    is_brand: Optional[bool] = Field(None)