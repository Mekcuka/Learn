import re
from uuid import UUID

from pydantic import BaseModel, field_validator

_TRAINING_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip()
        if not _TRAINING_EMAIL_RE.match(normalized):
            raise ValueError("invalid_email_format")
        return normalized


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    role: str = "student"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
