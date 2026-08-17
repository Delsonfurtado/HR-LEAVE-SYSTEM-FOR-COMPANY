from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.leave import LeaveType, RequestStatus


class LeaveTypeOut(BaseModel):
    id: int
    code: str
    name: str
    default_days: int
    requires_document: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class LeaveTypeCreate(BaseModel):
    code: str = Field(min_length=2, max_length=30, pattern=r"^[a-z_]+$")
    name: str = Field(min_length=2, max_length=100)
    default_days: int = Field(ge=0, le=365)
    requires_document: bool = False


class LeaveTypeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    default_days: int | None = Field(default=None, ge=0, le=365)
    requires_document: bool | None = None
    is_active: bool | None = None


class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str = Field(min_length=5, max_length=500)


class LeaveRequestOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    leave_type_id: int
    leave_type_name: str
    start_date: date
    end_date: date
    days: int
    reason: str
    status: RequestStatus
    decision_comment: str | None = None
    decided_by_name: str | None = None
    decided_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DecisionRequest(BaseModel):
    action: Literal["approve", "reject"]
    comment: str | None = Field(default=None, max_length=500)


class BalanceOut(BaseModel):
    leave_type_id: int
    leave_type_name: str
    year: int
    total_days: int
    used_days: int
    remaining_days: int

    model_config = ConfigDict(from_attributes=True)


class BalanceAdjustRequest(BaseModel):
    employee_id: int
    leave_type_id: int
    year: int = Field(ge=2000, le=2100)
    total_days: int = Field(ge=0, le=365)


class LeaveReportItem(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    employee_email: str
    department: str | None
    leave_type_name: str
    start_date: date
    end_date: date
    days: int
    status: RequestStatus
    created_at: datetime


class LeaveReportSummary(BaseModel):
    total_requests: int
    pending_count: int
    approved_count: int
    rejected_count: int
    approved_days: int
    by_type: dict[str, int]


class LeaveReport(BaseModel):
    items: list[LeaveReportItem]
    summary: LeaveReportSummary
