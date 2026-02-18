from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field
from datetime import datetime


class RoutineExerciseRecordCreate(BaseModel):
    exercise_id: Annotated[int, Field(gt=0)]
    order_index: Annotated[int, Field(ge=0)]
    notes: Optional[str] = None


class RoutineExerciseRecordUpdate(BaseModel):
    order_index: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = None

