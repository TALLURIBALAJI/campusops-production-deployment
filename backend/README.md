# CampusOps — Production Deployment (Python Stack)
## Backend Service (FastAPI + SQLAlchemy + PostgreSQL)

Welcome to the backend service for **CampusOps**, a student management system designed for production deployment in an AWS DevOps environment.

---

## 📁 Project Structure

```text
backend/
├── app/
│   ├── __init__.py           # Package marker
│   ├── config.py             # Environment configuration (.env loader, settings)
│   ├── database.py           # SQLAlchemy engine, session maker, get_db dependency
│   ├── models.py             # SQLAlchemy ORM models (Student)
│   ├── schemas.py            # Pydantic validation schemas (StudentCreate, StudentUpdate, etc.)
│   ├── crud.py               # Reusable database CRUD operations
│   └── routers/
│       ├── __init__.py       # Routers package marker
│       └── students.py       # REST API endpoints for student management
├── tests/
│   ├── __init__.py           # Tests package marker
│   └── test_api.py           # Automated test suite (Pytest + TestClient)
├── .env.example              # Template for environment variables (placeholders only)
├── main.py                   # FastAPI application entrypoint, CORS, root & health routes
├── requirements.txt          # Python project dependencies
└── README.md                 # Setup and run instructions
```

---

## 🚀 Getting Started (Step-by-Step for Beginners)

### 1. Prerequisites
Ensure you have Python 3.10+ installed on your machine:
```bash
python --version
```

---

### 2. Set Up a Virtual Environment

A virtual environment isolates this project's dependencies from your global Python installation.

#### On Windows (PowerShell or Command Prompt):
```powershell
# Navigate into the backend directory
cd backend

# Create a virtual environment named .venv
python -m venv .venv

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1
# (Or in Command Prompt: .\.venv\Scripts\activate.bat)
```

#### On Linux / macOS:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

---

### 3. Install Dependencies

With the virtual environment activated, install the required packages:
```bash
pip install -r requirements.txt
```

---

### 4. Configure Environment Variables

1. Copy the provided `.env.example` file to create your local `.env` file:
   - **Windows PowerShell**: `Copy-Item .env.example .env`
   - **Linux / macOS**: `cp .env.example .env`

2. Open `.env` and set your PostgreSQL database credentials:
   ```env
   # Application Settings
   APP_NAME=CampusOps — Production Deployment (Python Stack)
   APP_ENV=development
   APP_HOST=0.0.0.0
   APP_PORT=8000
   DEBUG=True

   # Database Configuration (PostgreSQL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=campusops_db
   DB_USER=postgres
   DB_PASSWORD=your_actual_password_here
   ```
   > ⚠️ **Important Security Rule**: Never commit the `.env` file or hardcode credentials into Git repositories.

---

### 5. Run the Backend Server

Start the development server with live reload enabled:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Or simply run:
```bash
python main.py
```

You should see output similar to:
```text
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Starting up CampusOps — Production Deployment (Python Stack)...
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## 🧪 Testing the API

### 1. Interactive Documentation (Swagger UI)
Open your browser and navigate to:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

You can test all endpoints interactively directly from the Swagger UI.

### 2. Run Automated Tests
To run the automated test suite:
```bash
pytest -v
```

All tests execute against an isolated in-memory database, so they run fast and do not affect your production database.

---

## 📌 API Endpoints Reference

### General Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns project name, welcome message, and documentation links. |
| `GET` | `/health` | Returns application health status and database connectivity. |

### Student Management Endpoints (`/api/v1/students`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/v1/students/` | Register a new student | `201 Created` |
| `GET` | `/api/v1/students/` | List students with pagination & search | `200 OK` |
| `GET` | `/api/v1/students/{identifier}` | Get student by DB ID or campus student ID | `200 OK` |
| `PUT` | `/api/v1/students/{identifier}` | Update student details | `200 OK` |
| `DELETE` | `/api/v1/students/{identifier}` | Delete student | `200 OK` |

#### Example: Create Student Payload (`POST /api/v1/students/`)
```json
{
  "student_id": "STU-2024-001",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@university.edu",
  "course": "Cloud DevOps Engineering",
  "year_of_study": 3,
  "gpa": 3.85,
  "enrollment_status": "active"
}
```

#### Example: Successful Response (`201 Created`)
```json
{
  "id": 1,
  "student_id": "STU-2024-001",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@university.edu",
  "course": "Cloud DevOps Engineering",
  "year_of_study": 3,
  "gpa": 3.85,
  "enrollment_status": "active",
  "created_at": "2026-10-12T11:00:00Z",
  "updated_at": "2026-10-12T11:00:00Z"
}
```
