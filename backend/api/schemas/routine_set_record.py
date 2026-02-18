from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


class RoutineSetRecordCreate(BaseModel):
    set_order: Annotated[int, Field(ge=0)]
    target_reps: Annotated[int, Field(gt=0)]

    target_weight: Optional[
        Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]
    ] = None

    target_rpe: Optional[
        Annotated[Decimal, Field(ge=0, le=10, max_digits=3, decimal_places=1)]
    ] = None

    rest_seconds: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = None


class RoutineSetRecordUpdate(BaseModel):
    set_order: Optional[Annotated[int, Field(ge=0)]] = None
    target_reps: Optional[Annotated[int, Field(gt=0)]] = None

    target_weight: Optional[
        Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]
    ] = None

    target_rpe: Optional[
        Annotated[Decimal, Field(ge=0, le=10, max_digits=3, decimal_places=1)]
    ] = None

    rest_seconds: Optional[Annotated[int, Field(ge=0)]] = None
    notes: Optional[str] = None