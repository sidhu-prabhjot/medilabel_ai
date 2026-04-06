import html
from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone


class BodyMetricResponse(BaseModel):
    id: int
    user_id: str
    weight_kg: float
    body_fat_percent: Optional[float] = None
    recorded_at: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class BodyMetricRecordCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    weight_kg: Annotated[
        Decimal,
        Field(gt=0, max_digits=5, decimal_places=2)
    ]

    body_fat_percent: Optional[
        Annotated[
            Decimal,
            Field(ge=0, le=100, max_digits=5, decimal_places=2)
        ]
    ] = None

    recorded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)


class BodyMetricRecordUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    weight_kg: Optional[
        Annotated[
            Decimal,
            Field(gt=0, max_digits=5, decimal_places=2)
        ]
    ] = None

    body_fat_percent: Optional[
        Annotated[
            Decimal,
            Field(ge=0, le=100, max_digits=5, decimal_places=2)
        ]
    ] = None

    recorded_at: Optional[datetime] = None

    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)