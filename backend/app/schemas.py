"""Pydantic schemas for data validation and serialization.

Ensures strict input validation and clean API responses.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class StudentBase(BaseModel):
    """Shared attributes across Student schemas."""

    first_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="First name of the student",
        examples=["Jane"],
    )
    last_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Last name of the student",
        examples=["Doe"],
    )
    email: EmailStr = Field(
        ...,
        description="Unique student email address",
        examples=["jane.doe@university.edu"],
    )
    course: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Degree course or department",
        examples=["Cloud DevOps Engineering"],
    )
    year_of_study: int = Field(
        ...,
        ge=1,
        le=8,
        description="Current academic year (1-8)",
        examples=[3],
    )
    gpa: Optional[float] = Field(
        None,
        ge=0.0,
        le=4.0,
        description="Grade point average (0.00 to 4.00)",
        examples=[3.85],
    )
    enrollment_status: Optional[str] = Field(
        "active",
        pattern="^(active|graduated|suspended|inactive)$",
        description="Status: active, graduated, suspended, or inactive",
        examples=["active"],
    )


class StudentCreate(StudentBase):
    """Schema for registering a new student."""

    student_id: str = Field(
        ...,
        min_length=3,
        max_length=30,
        description="Unique campus student identification code",
        examples=["STU-2024-001"],
    )


class StudentUpdate(BaseModel):
    """Schema for updating an existing student (all fields optional)."""

    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    course: Optional[str] = Field(None, min_length=1, max_length=100)
    year_of_study: Optional[int] = Field(None, ge=1, le=8)
    gpa: Optional[float] = Field(None, ge=0.0, le=4.0)
    enrollment_status: Optional[str] = Field(
        None, pattern="^(active|graduated|suspended|inactive)$"
    )


class StudentResponse(StudentBase):
    """Schema for returning student information."""

    id: int = Field(..., description="Database internal primary key", examples=[1])
    student_id: str = Field(..., description="Unique campus student ID", examples=["STU-2024-001"])
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudentListResponse(BaseModel):
    """Schema for paginated student list."""

    total: int = Field(..., description="Total count of matching students")
    skip: int = Field(..., description="Number of skipped records")
    limit: int = Field(..., description="Page limit")
    students: List[StudentResponse]
