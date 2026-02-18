from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field
from datetime import date


class WorkoutRecordCreate(BaseModel):
    workout_name: Annotated[
        str,
        Field(min_length=1)
    ]

    workout_date: date

    duration_minutes: Optional[
        Annotated[int, Field(gt=0)]
    ] = None

    notes: Optional[str] = None


class WorkoutRecordUpdate(BaseModel):
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

    notes: Optional[str] = None
