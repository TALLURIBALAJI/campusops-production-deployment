"""Database operations (CRUD) for Student records.

Encapsulates SQLAlchemy database queries for reusability, testability,
and separation of business logic from routing.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import Student
from app.schemas import StudentCreate, StudentUpdate


def get_student_by_id(db: Session, student_pk: int) -> Optional[Student]:
    """Retrieve a student by primary key ID."""
    return db.query(Student).filter(Student.id == student_pk).first()


def get_student_by_student_id(db: Session, student_id: str) -> Optional[Student]:
    """Retrieve a student by their unique campus student_id string."""
    return db.query(Student).filter(Student.student_id == student_id).first()


def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    """Retrieve a student by their email address."""
    return db.query(Student).filter(Student.email == email.lower()).first()


def get_students(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    course: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Student]:
    """Retrieve a list of students with optional filtering, search, and pagination."""
    query = db.query(Student)

    if course:
        query = query.filter(Student.course.ilike(f"%{course}%"))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(search_filter),
                Student.first_name.ilike(search_filter),
                Student.last_name.ilike(search_filter),
                Student.email.ilike(search_filter),
            )
        )

    return query.order_by(Student.id.asc()).offset(skip).limit(limit).all()


def count_students(
    db: Session,
    course: Optional[str] = None,
    search: Optional[str] = None,
) -> int:
    """Count the total number of students matching the given filter criteria."""
    query = db.query(Student)

    if course:
        query = query.filter(Student.course.ilike(f"%{course}%"))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(search_filter),
                Student.first_name.ilike(search_filter),
                Student.last_name.ilike(search_filter),
                Student.email.ilike(search_filter),
            )
        )

    return query.count()


def create_student(db: Session, student_in: StudentCreate) -> Student:
    """Create a new student record in the database."""
    student_data = student_in.model_dump()
    # Normalize email to lower case
    student_data["email"] = student_data["email"].lower()

    db_student = Student(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


def update_student(
    db: Session, db_student: Student, student_in: StudentUpdate
) -> Student:
    """Update existing student attributes based on provided fields."""
    update_data = student_in.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] is not None:
        update_data["email"] = update_data["email"].lower()

    for field, value in update_data.items():
        setattr(db_student, field, value)

    db.commit()
    db.refresh(db_student)
    return db_student


def delete_student(db: Session, db_student: Student) -> None:
    """Delete a student record from the database."""
    db.delete(db_student)
    db.commit()
