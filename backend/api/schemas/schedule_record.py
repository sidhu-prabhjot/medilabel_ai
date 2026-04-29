from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional


class ScheduleCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    medication_id: int = Field(...)
    stock_id: Optional[int] = Field(None)
    frequency: str = Field(..., max_length=50)
    interval_hours: Optional[int] = Field(None, ge=1)
    doses_per_day: Optional[int] = Field(None, ge=1)
    start_date: date = Field(...)
    end_date: Optional[date] = Field(None)
    doses_remaining: Optional[int] = Field(None, ge=0)
    next_dose_at: Optional[datetime] = Field(None)


class ScheduleUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    stock_id: Optional[int] = Field(None)
    frequency: Optional[str] = Field(None, max_length=50)
    interval_hours: Optional[int] = Field(None, ge=1)
    doses_per_day: Optional[int] = Field(None, ge=1)
    start_date: Optional[date] = Field(None)
    end_date: Optional[date] = Field(None)
    doses_remaining: Optional[int] = Field(None, ge=0)
    next_dose_at: Optional[datetime] = Field(None)


class ScheduleResponse(BaseModel):
    schedule_id: int
    user_id: str
    medication_id: int
    stock_id: Optional[int] = None
    frequency: str
    interval_hours: Optional[int] = None
    doses_per_day: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None
    doses_remaining: Optional[int] = None
    next_dose_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    medication_name: Optional[str] = None
    stock_unit: Optional[str] = None


class IntakeLogCreate(BaseModel):
    schedule_id: int = Field(...)
    status: str = Field(...)
    taken_at: Optional[datetime] = Field(None)
    notes: Optional[str] = Field(None, max_length=500)


class IntakeLogResponse(BaseModel):
    log_id: int
    schedule_id: int
    user_id: str
    medication_id: int
    status: str
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime


class TodayDoseItem(BaseModel):
    schedule_id: int
    medication_id: int
    medication_name: str
    frequency: str
    doses_per_day: Optional[int] = None
    next_dose_at: Optional[datetime] = None
    doses_remaining: Optional[int] = None
    stock_unit: Optional[str] = None
    log_id: Optional[int] = None
    status: str = "pending"
    taken_at: Optional[datetime] = None
    is_overdue: bool = False
