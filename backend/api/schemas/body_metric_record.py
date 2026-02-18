from typing import Optional
from typing_extensions import Annotated
from decimal import Decimal
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class BodyMetricRecordCreate(BaseModel):
    weight_kg: Annotated[
        Decimal,
        Field(gt=0, max_digits=5, decimal_places=2)
    ]

    body_fat_percent: Optional[
        Annotated[
            Decimal,
            Field(ge=0, le=100, max_digits=5, decimal_places=2)
        ]
    ] = None

    recorded_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    notes: Optional[str] = None


class BodyMetricRecordUpdate(BaseModel):
    weight_kg: Optional[
        Annotated[
            Decimal,
            Field(gt=0, max_digits=5, decimal_places=2)
        ]
    ] = None

    body_fat_percent: Optional[
        Annotated[
            Decimal,
            Field(ge=0, le=100, max_digits=5, decimal_places=2)
        ]
    ] = None

    recorded_at: Optional[datetime] = None

    notes: Optional[str] = None