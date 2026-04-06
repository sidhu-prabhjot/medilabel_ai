import html
from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class WorkoutExerciseResponse(BaseModel):
    id: int
    workout_id: int
    exercise_id: int
    order_index: Optional[int] = None
    created_at: datetime


class WorkoutExerciseRecordCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    exercise_id: Annotated[int, Field(gt=0)]

    sets: Optional[Annotated[int, Field(gt=0)]] = None
    reps: Optional[Annotated[int, Field(gt=0)]] = None
    weight: Optional[Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]] = None
    order_index: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)


class WorkoutExerciseRecordUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    exercise_id: Optional[Annotated[int, Field(gt=0)]] = None

    sets: Optional[Annotated[int, Field(gt=0)]] = None
    reps: Optional[Annotated[int, Field(gt=0)]] = None
    weight: Optional[Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]] = None
    order_index: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)

