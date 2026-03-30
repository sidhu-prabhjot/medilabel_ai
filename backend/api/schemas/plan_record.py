# schemas/plan_record.py
import html
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from typing_extensions import Annotated
from datetime import datetime


class WorkoutPlanResponse(BaseModel):
    id: int
    user_id: str
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class PlanRoutineDayResponse(BaseModel):
    id: int
    plan_id: int
    routine_id: int
    weekday: int
    notes: Optional[str]
    created_at: datetime


# ------------------------------------------------------------------
# Shared field definitions
# ------------------------------------------------------------------

WeekDay     = Annotated[int,  Field(ge=0, le=6)]
OrderIndex  = Annotated[int,  Field(ge=0)]


# ------------------------------------------------------------------
# Workout Plan schemas
# ------------------------------------------------------------------

class WorkoutPlanCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    name:        Annotated[str, Field(min_length=1, max_length=100)]
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("description", mode="before")
    @classmethod
    def escape_description(cls, v):
        if v is None:
            return v
        return html.escape(v)


class WorkoutPlanUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    name:        Optional[Annotated[str, Field(min_length=1, max_length=100)]] = None
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("description", mode="before")
    @classmethod
    def escape_description(cls, v):
        if v is None:
            return v
        return html.escape(v)


# ------------------------------------------------------------------
# Plan Routine Day schemas
# ------------------------------------------------------------------

class PlanRoutineDayCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    routine_id: Annotated[int, Field(gt=0)]
    weekday:    WeekDay
    notes:      Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)


class PlanRoutineDayUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    routine_id: Optional[Annotated[int, Field(gt=0)]] = None
    weekday:    Optional[WeekDay] = None
    notes:      Optional[str] = Field(None, max_length=500)

    @field_validator("notes", mode="before")
    @classmethod
    def escape_notes(cls, v):
        if v is None:
            return v
        return html.escape(v)