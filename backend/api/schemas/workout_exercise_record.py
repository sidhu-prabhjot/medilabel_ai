from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


class WorkoutExerciseRecordCreate(BaseModel):
    exercise_id: Annotated[int, Field(gt=0)]

    sets: Optional[Annotated[int, Field(gt=0)]] = None
    reps: Optional[Annotated[int, Field(gt=0)]] = None
    weight: Optional[Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]] = None
    order_index: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = None


class WorkoutExerciseRecordUpdate(BaseModel):
    exercise_id: Optional[Annotated[int, Field(gt=0)]] = None

    sets: Optional[Annotated[int, Field(gt=0)]] = None
    reps: Optional[Annotated[int, Field(gt=0)]] = None
    weight: Optional[Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]] = None
    order_index: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = None

