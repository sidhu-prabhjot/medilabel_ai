import html
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class SymptomLogResponse(BaseModel):
    symptom_id: str
    user_id: str
    symptom: str
    severity: int
    notes: Optional[str]
    is_resolved: bool
    created_at: datetime
    updated_at: Optional[datetime]

#only need sanitization when creating and updating, response is just reading
class SymptomLogCreate(BaseModel):
    model_config={"str_strip_whitespace": True}

    symptom: str = Field(..., max_length=50)
    severity: int = Field(5, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=500)
    is_resolved: bool = Field(False)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)


class SymptomLogUpdate(BaseModel):
    model_config={"str_strip_whitespace": True}

    symptom: Optional[str] = Field(None, max_length=50)
    severity: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=500)
    is_resolved: Optional[bool] = None
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)