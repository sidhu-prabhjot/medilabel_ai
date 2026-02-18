from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field
from datetime import datetime


class WorkoutRoutineCreate(BaseModel):
    routine_name: Annotated[str, Field(min_length=1, max_length=100)]
    description: Optional[str] = None


class WorkoutRoutineUpdate(BaseModel):
    routine_name: Optional[Annotated[str, Field(min_length=1, max_length=100)]] = None
    description: Optional[str] = None
