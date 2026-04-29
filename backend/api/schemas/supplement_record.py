import html
from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class SupplementCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    name: str = Field(..., max_length=150)
    brand: Optional[str] = Field(None, max_length=150)
    form: Optional[str] = Field(None, max_length=50)
    dosage_amount: Optional[float] = Field(None, ge=0)
    dosage_unit: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, value):
        if value is None:
            return value
        return html.escape(value)

class SupplementUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    name: Optional[str] = Field(None, max_length=150)
    brand: Optional[str] = Field(None, max_length=150)
    form: Optional[str] = Field(None, max_length=50)
    dosage_amount: Optional[float] = Field(None, ge=0)
    dosage_unit: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, value):
        if value is None:
            return value
        return html.escape(value)

class SupplementResponse(BaseModel):
    supplement_id: int
    user_id: str
    name: str
    brand: Optional[str] = None
    form: Optional[str] = None
    dosage_amount: Optional[float] = None
    dosage_unit: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class SupplementLogResponse(BaseModel):
    log_id: int
    supplement_id: int
    user_id: str
    log_date: date
    status: str 
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None

class SupplementTodayItem(BaseModel):
    supplement_id: int
    name: str
    brand: Optional[str] = None
    form: Optional[str] = None
    dosage_amount: Optional[float] = None
    dosage_unit: Optional[str] = None
    log_date: date
    status: str
    taken_at: Optional[datetime] = None
    log_id: Optional[int] = None