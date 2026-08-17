import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import Role

PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$")


def validate_strong_password(value: str) -> str:
    if not PASSWORD_PATTERN.match(value):
        raise ValueError(
            "Password must be at least 8 characters and contain uppercase, lowercase and a digit"
        )
    return value


class DepartmentOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: Role
    department_id: int | None = None
    department_name: str | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=100)
    password: str
    role: Role
    department_id: int | None = None

    _strong_password = field_validator("password")(lambda v: validate_strong_password(v))


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    role: Role | None = None
    department_id: int | None = None
    is_active: bool | None = None


class PasswordReset(BaseModel):
    new_password: str

    _strong_password = field_validator("new_password")(lambda v: validate_strong_password(v))
