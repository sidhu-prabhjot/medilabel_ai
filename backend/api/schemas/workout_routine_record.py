import html
from typing import Optional
from typing_extensions import Annotated
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class WorkoutRoutineResponse(BaseModel):
    id: int
    user_id: str
    routine_name: str
    description: Optional[str]
    created_at: datetime


class WorkoutRoutineCreate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    routine_name: Annotated[str, Field(min_length=1, max_length=100)]
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("description", mode="before")
    @classmethod
    def escape_description(cls, v):
        if v is None:
            return v
        return html.escape(v)


class WorkoutRoutineUpdate(BaseModel):
    model_config = {"str_strip_whitespace": True}

    routine_name: Optional[Annotated[str, Field(min_length=1, max_length=100)]] = None
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("description", mode="before")
    @classmethod
    def escape_description(cls, v):
        if v is None:
            return v
        return html.escape(v)
