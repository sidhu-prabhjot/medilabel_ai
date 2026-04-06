import html
from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class RoutineExerciseResponse(BaseModel):
    id: int
    routine_id: int
    exercise_id: int
    order_index: int
    notes: Optional[str] = None
    created_at: datetime


class RoutineExerciseRecordCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    exercise_id: Annotated[int, Field(gt=0)]
    order_index: Annotated[int, Field(ge=0)]
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)


class RoutineExerciseRecordUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    order_index: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)

