from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime


class SetRecordCreate(BaseModel):
    reps: Annotated[int, Field(gt=0)]

    weight_kg: Optional[Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]] = None
    rest_seconds: Optional[Annotated[int, Field(ge=0)]] = None
    rpe: Optional[Annotated[Decimal, Field(ge=0, le=10, max_digits=3, decimal_places=1)]] = None


class SetRecordUpdate(BaseModel):
    reps: Optional[Annotated[int, Field(gt=0)]] = None

    weight_kg: Optional[Annotated[Decimal, Field(gt=0, max_digits=6, decimal_places=2)]] = None
    rest_seconds: Optional[Annotated[int, Field(ge=0)]] = None
    rpe: Optional[Annotated[Decimal, Field(ge=0, le=10, max_digits=3, decimal_places=1)]] = None

