# schemas/plan_record.py
from typing import Optional
from pydantic import BaseModel, Field
from typing_extensions import Annotated


# ------------------------------------------------------------------
# Shared field definitions
# ------------------------------------------------------------------

WeekDay     = Annotated[int,  Field(ge=0, le=6)]
OrderIndex  = Annotated[int,  Field(ge=0)]


# ------------------------------------------------------------------
# Workout Plan schemas
# ------------------------------------------------------------------

class WorkoutPlanCreate(BaseModel):
    name:        str
    description: Optional[str] = None


class WorkoutPlanUpdate(BaseModel):
    name:        Optional[str] = None
    description: Optional[str] = None


# ------------------------------------------------------------------
# Plan Routine Day schemas
# ------------------------------------------------------------------

class PlanRoutineDayCreate(BaseModel):
    routine_id: int
    weekday:    WeekDay
    notes:      Optional[str] = None


class PlanRoutineDayUpdate(BaseModel):
    routine_id: Optional[int]     = None
    weekday:    Optional[WeekDay] = None
    notes:      Optional[str]     = None