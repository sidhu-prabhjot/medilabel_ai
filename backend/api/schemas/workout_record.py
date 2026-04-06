import html
from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime


class WorkoutResponse(BaseModel):
    id: int
    user_id: str
    workout_name: str
    workout_date: date
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime


class WorkoutRecordCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    workout_name: Annotated[
        str,
        Field(min_length=1)
    ]

    workout_date: date

    duration_minutes: Optional[
        Annotated[int, Field(gt=0)]
    ] = None

    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)


class WorkoutRecordUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    workout_name: Optional[
        Annotated[
            str,
            Field(min_length=1)
        ]
    ] = None

    workout_date: Optional[date] = None

    duration_minutes: Optional[
        Annotated[int, Field(gt=0)]
    ] = None

    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)
