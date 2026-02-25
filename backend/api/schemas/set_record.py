from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field


# ------------------------------------------------------------------
# Shared field definitions
# ------------------------------------------------------------------

Reps        = Annotated[int,     Field(gt=0)]
WeightKg    = Annotated[Decimal, Field(gt=0,  max_digits=6, decimal_places=2)]
RestSeconds = Annotated[int,     Field(ge=0)]
Rpe         = Annotated[Decimal, Field(ge=0,  le=10, max_digits=3, decimal_places=1)]


# ------------------------------------------------------------------
# Schemas
# ------------------------------------------------------------------

class SetRecordCreate(BaseModel):
    reps:         Reps
    weight_kg:    Optional[WeightKg]    = None
    rest_seconds: Optional[RestSeconds] = None
    rpe:          Optional[Rpe]         = None


class SetRecordUpdate(BaseModel):
    reps:         Optional[Reps]        = None
    weight_kg:    Optional[WeightKg]    = None
    rest_seconds: Optional[RestSeconds] = None
    rpe:          Optional[Rpe]         = None