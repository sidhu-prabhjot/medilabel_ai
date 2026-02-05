from datetime import datetime, timezone, date
from pydantic import BaseModel, Field
from typing import Optional

class StockRecordCreate(BaseModel):
    quantity: Optional[int] = Field(None)
    unit: Optional[str] = Field(None)
    expiration_date: Optional[date] = Field(
        None,
        description="Medication expiration date (YYYY-MM-DD)"
    )
    opened_at: Optional[date] = Field(
        None,
        description="Date medication was opened (YYYY-MM-DD)"
    )
    notes: Optional[str] = Field(None)
