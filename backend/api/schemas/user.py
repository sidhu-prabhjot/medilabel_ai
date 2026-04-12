# backend/schemas/user.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        special_characters = "!@#$%^&*()-_=+[]{}|;:',.<>?/`~"
        errors = []

        if len(v) < 12:
            errors.append("at least 12 characters")
        if not any(c.islower() for c in v):
            errors.append("at least one lowercase letter")
        if not any(c.isupper() for c in v):
            errors.append("at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            errors.append("at least one number")
        if not any(c in special_characters for c in v):
            errors.append("at least one special character (!@#$%^&* etc.)")

        if errors:
            raise ValueError("Password must contain " + ", ".join(errors))

        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

class RefreshRequest(BaseModel):
    refresh_token: str

class MeResponse(BaseModel):
    email: str
