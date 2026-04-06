import html
from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class RoutineSetResponse(BaseModel):
    id: int
    routine_exercise_id: int
    set_order: int
    target_reps: int
    target_weight: Optional[float] = None
    target_rpe: Optional[float] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime


class RoutineSetRecordCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    set_order: Annotated[int, Field(ge=0)]
    target_reps: Annotated[int, Field(gt=0)]

    target_weight: Optional[
        Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]
    ] = None

    target_rpe: Optional[
        Annotated[Decimal, Field(ge=0, le=10, max_digits=3, decimal_places=1)]
    ] = None

    rest_seconds: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)


class RoutineSetRecordUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    set_order: Optional[Annotated[int, Field(ge=0)]] = None
    target_reps: Optional[Annotated[int, Field(gt=0)]] = None

    target_weight: Optional[
        Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]
    ] = None

    target_rpe: Optional[
        Annotated[Decimal, Field(ge=0, le=10, max_digits=3, decimal_places=1)]
    ] = None

    rest_seconds: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)