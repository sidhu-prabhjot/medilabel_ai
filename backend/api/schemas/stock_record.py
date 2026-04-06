import html
from datetime import datetime, timezone, date
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class StockRecordResponse(BaseModel):
    stock_id: int
    user_id: str
    medication_id: int
    quantity: Optional[int] = None
    unit: Optional[str] = None
    expiration_date: Optional[date] = None
    opened_at: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime


class StockRecordCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    quantity: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    expiration_date: Optional[date] = Field(
        None,
        description="Medication expiration date (YYYY-MM-DD)"
    )
    opened_at: Optional[date] = Field(
        None,
        description="Date medication was opened (YYYY-MM-DD)"
    )
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)
