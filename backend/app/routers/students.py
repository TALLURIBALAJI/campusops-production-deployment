"""API routes for student management operations.

Provides REST endpoints to create, list, retrieve, update, and delete students.
Includes comprehensive error handling, duplicate prevention, and validation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentListResponse,
)
from app import crud

router = APIRouter(prefix="/students", tags=["Students"])


def resolve_student(identifier: str, db: Session):
    """Helper to find a student by either numeric ID or unique student_id string."""
    # Attempt numeric primary key lookup first if identifier is digits
    if identifier.isdigit():
        student = crud.get_student_by_id(db, student_pk=int(identifier))
        if student:
            return student

    # Otherwise look up by campus student_id string
    student = crud.get_student_by_student_id(db, student_id=identifier)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with identifier '{identifier}' was not found.",
        )
    return student


@router.post(
    "/",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student",
    description="Creates a new student record. Enforces unique campus student ID and unique email.",
)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
):
    # Check for existing student with the same student_id
    if crud.get_student_by_student_id(db, student_id=student_in.student_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student ID '{student_in.student_id}' is already registered.",
        )

    # Check for existing student with the same email
    if crud.get_student_by_email(db, email=student_in.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{student_in.email}' is already registered.",
        )

    return crud.create_student(db, student_in=student_in)


@router.get(
    "/",
    response_model=StudentListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all students",
    description="Retrieves a paginated list of students with optional course filtering and keyword search.",
)
def list_students(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of items to return"),
    course: Optional[str] = Query(None, description="Filter by course name"),
    search: Optional[str] = Query(
        None, description="Search across student ID, name, or email"
    ),
    db: Session = Depends(get_db),
):
    total = crud.count_students(db, course=course, search=search)
    students = crud.get_students(
        db, skip=skip, limit=limit, course=course, search=search
    )
    return StudentListResponse(total=total, skip=skip, limit=limit, students=students)


@router.get(
    "/{identifier}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a student",
    description="Retrieves student details using either the internal database ID or the campus student ID.",
)
def get_student(
    identifier: str,
    db: Session = Depends(get_db),
):
    return resolve_student(identifier, db)


@router.put(
    "/{identifier}",
    response_model=StudentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a student",
    description="Updates existing student information. Validates email uniqueness if changed.",
)
def update_student(
    identifier: str,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
):
    student = resolve_student(identifier, db)

    # Validate email uniqueness if changing email
    if student_in.email and student_in.email.lower() != student.email.lower():
        existing_email_student = crud.get_student_by_email(db, email=student_in.email)
        if existing_email_student and existing_email_student.id != student.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{student_in.email}' is already in use by another student.",
            )

    return crud.update_student(db, db_student=student, student_in=student_in)


@router.delete(
    "/{identifier}",
    status_code=status.HTTP_200_OK,
    summary="Delete a student",
    description="Deletes a student record permanently by ID or campus student ID.",
)
def delete_student(
    identifier: str,
    db: Session = Depends(get_db),
):
    student = resolve_student(identifier, db)
    deleted_id = student.id
    deleted_student_id = student.student_id
    crud.delete_student(db, db_student=student)

    return {
        "message": "Student successfully deleted.",
        "id": deleted_id,
        "student_id": deleted_student_id,
    }
