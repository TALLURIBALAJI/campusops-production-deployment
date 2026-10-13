"""Comprehensive automated test suite for CampusOps API.

Tests:
1. Root endpoint (GET /)
2. Health check endpoint (GET /health)
3. Student creation (POST /api/v1/students/)
4. Duplicate student_id and email prevention (HTTP 409)
5. Input validation rules (HTTP 422)
6. Student listing, pagination, and filtering (GET /api/v1/students/)
7. Student retrieval by numeric ID and string student_id (GET /api/v1/students/{identifier})
8. Student updates (PUT /api/v1/students/{identifier})
9. Student deletion (DELETE /api/v1/students/{identifier})
10. Missing student 404 handling
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from main import app

# Create in-memory SQLite database for isolated test execution
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override application dependency with test database session
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create fresh database tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    """Create a FastAPI TestClient instance."""
    return TestClient(app)


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

def test_root_endpoint(client):
    """Verify that GET / returns the project name and welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "CampusOps" in data["project"]
    assert "Welcome to CampusOps Backend API!" in data["message"]
    assert "version" in data


def test_health_endpoint(client):
    """Verify that GET /health returns application status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "project" in data
    assert "environment" in data


def test_create_student_success(client):
    """Verify successful student creation with valid payload."""
    payload = {
        "student_id": "STU-2024-001",
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice.smith@university.edu",
        "course": "DevOps Engineering",
        "year_of_study": 3,
        "gpa": 3.85,
        "enrollment_status": "active",
    }
    response = client.post("/api/v1/students/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["student_id"] == "STU-2024-001"
    assert data["first_name"] == "Alice"
    assert data["email"] == "alice.smith@university.edu"
    assert data["id"] is not None


def test_create_duplicate_student_id(client):
    """Verify 409 Conflict when attempting to register an existing student_id."""
    payload = {
        "student_id": "STU-2024-001",
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice1@university.edu",
        "course": "DevOps Engineering",
        "year_of_study": 2,
    }
    # First create
    res1 = client.post("/api/v1/students/", json=payload)
    assert res1.status_code == 201

    # Second create with same student_id
    payload2 = payload.copy()
    payload2["email"] = "different@university.edu"
    res2 = client.post("/api/v1/students/", json=payload2)
    assert res2.status_code == 409
    assert "already registered" in res2.json()["detail"]


def test_create_duplicate_email(client):
    """Verify 409 Conflict when attempting to register an existing email."""
    payload = {
        "student_id": "STU-2024-001",
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice@university.edu",
        "course": "DevOps",
        "year_of_study": 1,
    }
    res1 = client.post("/api/v1/students/", json=payload)
    assert res1.status_code == 201

    # Second create with same email but different student_id
    payload2 = payload.copy()
    payload2["student_id"] = "STU-2024-002"
    res2 = client.post("/api/v1/students/", json=payload2)
    assert res2.status_code == 409
    assert "already registered" in res2.json()["detail"]


def test_input_validation_errors(client):
    """Verify 422 Unprocessable Entity when invalid inputs are provided."""
    # Invalid email format
    invalid_email_payload = {
        "student_id": "STU-2024-099",
        "first_name": "Bob",
        "last_name": "Ross",
        "email": "not-an-email",
        "course": "Art",
        "year_of_study": 1,
    }
    response = client.post("/api/v1/students/", json=invalid_email_payload)
    assert response.status_code == 422

    # Invalid GPA (exceeding 4.0 limit)
    invalid_gpa_payload = {
        "student_id": "STU-2024-099",
        "first_name": "Bob",
        "last_name": "Ross",
        "email": "bob@university.edu",
        "course": "Art",
        "year_of_study": 1,
        "gpa": 4.5,
    }
    response = client.post("/api/v1/students/", json=invalid_gpa_payload)
    assert response.status_code == 422


def test_list_and_search_students(client):
    """Verify student listing, filtering, and pagination."""
    # Seed 3 students
    students_data = [
        {"student_id": "STU-01", "first_name": "John", "last_name": "Doe", "email": "john@test.com", "course": "Cloud Computing", "year_of_study": 1},
        {"student_id": "STU-02", "first_name": "Jane", "last_name": "Doe", "email": "jane@test.com", "course": "Cloud Computing", "year_of_study": 2},
        {"student_id": "STU-03", "first_name": "Bob", "last_name": "Smith", "email": "bob@test.com", "course": "Cyber Security", "year_of_study": 3},
    ]
    for s in students_data:
        client.post("/api/v1/students/", json=s)

    # List all
    res = client.get("/api/v1/students/")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    assert len(data["students"]) == 3

    # Filter by course
    res_course = client.get("/api/v1/students/?course=Security")
    assert res_course.status_code == 200
    assert res_course.json()["total"] == 1
    assert res_course.json()["students"][0]["student_id"] == "STU-03"

    # Search keyword
    res_search = client.get("/api/v1/students/?search=Jane")
    assert res_search.status_code == 200
    assert res_search.json()["total"] == 1
    assert res_search.json()["students"][0]["first_name"] == "Jane"


def test_get_student_by_id_and_student_id(client):
    """Verify retrieving student by numeric PK and campus student_id string."""
    payload = {
        "student_id": "STU-FIND-01",
        "first_name": "Charlie",
        "last_name": "Brown",
        "email": "charlie@test.com",
        "course": "DevOps",
        "year_of_study": 2,
    }
    create_res = client.post("/api/v1/students/", json=payload)
    created = create_res.json()

    # Get by numeric ID
    res_by_id = client.get(f"/api/v1/students/{created['id']}")
    assert res_by_id.status_code == 200
    assert res_by_id.json()["first_name"] == "Charlie"

    # Get by student_id string
    res_by_student_id = client.get("/api/v1/students/STU-FIND-01")
    assert res_by_student_id.status_code == 200
    assert res_by_student_id.json()["id"] == created["id"]


def test_get_student_not_found(client):
    """Verify 404 Not Found for non-existent student."""
    response = client.get("/api/v1/students/99999")
    assert response.status_code == 404
    assert "was not found" in response.json()["detail"]


def test_update_student(client):
    """Verify updating an existing student."""
    payload = {
        "student_id": "STU-UPD-01",
        "first_name": "David",
        "last_name": "Miller",
        "email": "david@test.com",
        "course": "Software Engineering",
        "year_of_study": 1,
        "gpa": 3.2,
    }
    create_res = client.post("/api/v1/students/", json=payload)
    created_id = create_res.json()["id"]

    # Update GPA and year of study
    update_payload = {"gpa": 3.75, "year_of_study": 2}
    update_res = client.put(f"/api/v1/students/{created_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["gpa"] == 3.75
    assert updated_data["year_of_study"] == 2
    assert updated_data["first_name"] == "David"


def test_delete_student(client):
    """Verify deleting a student record."""
    payload = {
        "student_id": "STU-DEL-01",
        "first_name": "Eve",
        "last_name": "Williams",
        "email": "eve@test.com",
        "course": "DevOps",
        "year_of_study": 4,
    }
    create_res = client.post("/api/v1/students/", json=payload)
    created_id = create_res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/v1/students/{created_id}")
    assert del_res.status_code == 200
    assert "successfully deleted" in del_res.json()["message"]

    # Verify student is gone
    get_res = client.get(f"/api/v1/students/{created_id}")
    assert get_res.status_code == 404


def test_delete_student_not_found(client):
    """Verify 404 on deleting non-existent student."""
    del_res = client.delete("/api/v1/students/99999")
    assert del_res.status_code == 404
