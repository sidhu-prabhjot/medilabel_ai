from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional


class ScheduleCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    medication_id: int = Field(...)
    stock_id: int = Field(...)
    dose_amount: float = Field(..., gt=0)
    dose_unit: Optional[str] = Field("tablet", max_length=50)
    frequency_per_day: int = Field(..., ge=1, le=24)
    interval_hours: Optional[int] = Field(None, ge=1)
    start_date: date = Field(...)
    end_date: Optional[date] = Field(None)
    next_dose_at: Optional[datetime] = Field(None)


class ScheduleUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    stock_id: Optional[int] = Field(None)
    dose_amount: Optional[float] = Field(None, gt=0)
    dose_unit: Optional[str] = Field(None, max_length=50)
    frequency_per_day: Optional[int] = Field(None, ge=1, le=24)
    interval_hours: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = Field(None)
    end_date: Optional[date] = Field(None)
    next_dose_at: Optional[datetime] = Field(None)


class ScheduleResponse(BaseModel):
    schedule_id: int
    user_id: str
    medication_id: int
    stock_id: int
    dose_amount: float
    dose_unit: Optional[str] = None
    frequency_per_day: int
    interval_hours: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None
    next_dose_at: Optional[datetime] = None
    created_at: datetime
    deleted_at: Optional[datetime] = None
    medication_name: Optional[str] = None
    stock_unit: Optional[str] = None


class IntakeLogCreate(BaseModel):
    schedule_id: int = Field(...)
    dose_amount: float = Field(..., gt=0)
    was_missed: bool = Field(...)
    taken_at: Optional[datetime] = Field(None)
    notes: Optional[str] = Field(None, max_length=500)


class IntakeLogResponse(BaseModel):
    intake_id: int
    schedule_id: int
    user_id: str
    dose_amount: float
    was_missed: bool
    taken_at: datetime
    notes: Optional[str] = None
    created_at: datetime


class TodayDoseItem(BaseModel):
    schedule_id: int
    medication_id: int
    medication_name: str
    frequency_per_day: int
    dose_amount: float
    dose_unit: Optional[str] = None
    next_dose_at: Optional[datetime] = None
    stock_unit: Optional[str] = None
    intake_id: Optional[int] = None
    status: str = "pending"
    taken_at: Optional[datetime] = None
    is_overdue: bool = False
