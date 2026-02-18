from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field
from datetime import datetime


class ExerciseRecordCreate(BaseModel):
    exercise_name: Annotated[
        str,
        Field(min_length=1, max_length=100)
    ]

    muscle_group: Annotated[
        str,
        Field(min_length=1, max_length=100)
    ]

    equipment: Optional[
        Annotated[
            str,
            Field(max_length=100)
        ]
    ] = None


class ExerciseRecordUpdate(BaseModel):
    exercise_name: Optional[
        Annotated[
            str,
            Field(min_length=1, max_length=100)
        ]
    ] = None

    muscle_group: Optional[
        Annotated[
            str,
            Field(min_length=1, max_length=100)
        ]
    ] = None

    equipment: Optional[
        Annotated[
            str,
            Field(max_length=100)
        ]
    ] = None

