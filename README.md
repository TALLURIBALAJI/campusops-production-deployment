# CampusOps — Production Deployment (Python Stack)

A production-grade, containerized student management platform architected for scalable cloud deployments (AWS EC2 / DevOps pipelines). Built with a decoupled microservice-ready topology using **Docker**, **Nginx**, **FastAPI**, **React**, and **PostgreSQL**.

---

## 🏗️ Architecture Overview

The application is decomposed into four isolated, cooperative containers connected via a private Docker bridge network (`campusops_bridge_network`):

```
                          Internet / Browser (Port 80)
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │         campusops_nginx       │
                       │     (Reverse Proxy Gateway)   │
                       └───────────────┬───────────────┘
                                       │
             ┌─────────────────────────┴─────────────────────────┐
             │                                                   │
  Path: / , /* (SPA Routes)                         Path: /api/* , /health , /docs
             │                                                   │
             ▼                                                   ▼
┌─────────────────────────┐                         ┌─────────────────────────┐
│   campusops_frontend    │                         │    campusops_backend    │
│  (Nginx Alpine: Port 80)│                         │ (FastAPI: Port 8000)    │
│  [React Static Bundle]  │                         │ Non-Root User: appuser  │
└─────────────────────────┘                         └────────────┬────────────┘
                                                                 │
                                                   SQLAlchemy Connection
                                                   Host: "db" | Port: 5432
                                                                 ▼
                                                    ┌─────────────────────────┐
                                                    │       campusops_db      │
                                                    │  (Official Postgres 16) │
                                                    │ Volume: postgres_data   │
                                                    └─────────────────────────┘
```

### Component Breakdown

1. **`nginx` (Reverse Proxy Gateway)**:
   * External entry point listening on host port `80`.
   * Routes `/api/*`, `/health`, `/docs`, `/redoc`, and `/openapi.json` to the FastAPI backend.
   * Routes `/` and all other single-page application routes to the React frontend.
   * Enforces security headers, buffer sizes, and gzip compression.

2. **`frontend` (React + TypeScript + Vite)**:
   * Multi-stage Docker build (`node:20-alpine` builder $\rightarrow$ `nginx:alpine` server).
   * Bundled with `VITE_API_BASE_URL=""` for relative API dispatching behind the reverse proxy.
   * Internal Nginx server handles client-side routing fallback (`try_files $uri $uri/ /index.html`).

3. **`backend` (FastAPI + SQLAlchemy)**:
   * Runs on Python 3.11-slim as an unprivileged non-root system user (`appuser`).
   * RESTful CRUD APIs with automatic validation via Pydantic schemas.
   * SQLAlchemy engine with connection pooling and pre-ping health probes.
   * Auto-initializes database tables on startup.

4. **`db` (PostgreSQL 16 Alpine)**:
   * Official `postgres:16-alpine` image.
   * Port 5432 is kept internal to the Docker network, preventing host port collisions with existing local databases.
   * Persistent data stored in the Docker named volume `campusops_postgres_data`.
   * Integrated health check using `pg_isready`.

---

## 📁 Repository Structure

```text
CampusOps/
├── .env.example              # Template for Docker environment variables
├── .gitignore                # Root Git ignore (excludes .env, node_modules, .venv)
├── docker-compose.yml        # Multi-container Compose specification
├── README.md                 # Project documentation
├── backend/
│   ├── app/
│   │   ├── config.py         # Environment configuration (Pydantic / Settings)
│   │   ├── crud.py           # Database CRUD queries
│   │   ├── database.py       # SQLAlchemy engine, session maker, get_db
│   │   ├── models.py         # SQLAlchemy ORM models (Student)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   └── routers/
│   │       └── students.py   # REST API route handlers
│   ├── tests/                # Automated pytest suite
│   ├── .dockerignore         # Backend Docker ignore rules
│   ├── Dockerfile            # Production Python 3.11 Dockerfile
│   ├── main.py               # FastAPI application entry point
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/                  # React TypeScript source code
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # View pages (Students, Dashboard, Settings)
│   │   └── services/api.ts   # Centralized API client
│   ├── .dockerignore         # Frontend Docker ignore rules
│   ├── .gitignore            # Frontend Git ignore rules
│   ├── Dockerfile            # Multi-stage build Dockerfile
│   ├── nginx.conf            # Internal Nginx server config for SPA
│   ├── package.json          # Node dependencies and build scripts
│   └── vite.config.ts        # Vite configuration
└── nginx/
    ├── Dockerfile            # Reverse proxy Dockerfile
    └── nginx.conf            # Ingress reverse proxy configuration
```

---

## ⚙️ Environment Configuration

Copy the provided [.env.example](file:///c:/Users/venki/CampusOps/.env.example) to `.env`:

```bash
cp .env.example .env
```

### Configuration Variables

| Variable | Description | Default / Example |
|---|---|---|
| `APP_NAME` | Project title displayed in health check and logs | `CampusOps — Production Deployment (Python Stack)` |
| `APP_ENV` | Application environment (`production` / `development`) | `production` |
| `DEBUG` | Enable/disable FastAPI debug mode | `False` |
| `POSTGRES_DB` | PostgreSQL database name | `campusops_db` |
| `POSTGRES_USER` | PostgreSQL superuser username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL superuser password (use strong password) | *Must be set by administrator* |
| `BACKEND_PORT` | Internal port for FastAPI within Docker network | `8000` |
| `HTTP_PORT` | Host port exposed by Nginx reverse proxy | `80` |

> ⚠️ **Security Notice**: Never commit `.env` to Git. `.env` is excluded by [.gitignore](file:///c:/Users/venki/CampusOps/.gitignore).

---

## 🚀 Quickstart: Running with Docker Compose

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine 24+
* Docker Compose v2.20+

### 1. Build and Launch Containers

```bash
# Build all container images
docker compose build

# Start services in detached mode
docker compose up -d
```

### 2. Verify Service Status

```bash
docker compose ps
```

Expected output:
```text
NAME                 IMAGE                STATUS                    PORTS
campusops_backend    campusops-backend    Up (healthy)              8000/tcp
campusops_db         postgres:16-alpine   Up (healthy)              5432/tcp
campusops_frontend   campusops-frontend   Up                        80/tcp
campusops_nginx      campusops-nginx      Up                        0.0.0.0:80->80/tcp
```

### 3. Access Endpoints

* **Web UI**: [http://localhost](http://localhost)
* **API Health Check**: [http://localhost/health](http://localhost/health)
* **Interactive Swagger UI**: [http://localhost/docs](http://localhost/docs)
* **ReDoc Documentation**: [http://localhost/redoc](http://localhost/redoc)
* **OpenAPI Schema**: [http://localhost/openapi.json](http://localhost/openapi.json)

---

## 🧪 Testing the API

### Health Check Probe
```bash
curl -f http://localhost/health
```

Expected JSON response:
```json
{
  "status": "healthy",
  "project": "CampusOps — Production Deployment (Python Stack)",
  "environment": "production",
  "database": "connected",
  "database_message": "Database connection is operational"
}
```

### Register a Student
```bash
curl -X POST http://localhost/api/v1/students/ \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU-2026-001",
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@university.edu",
    "course": "Cloud DevOps Engineering",
    "year_of_study": 3,
    "gpa": 3.90,
    "enrollment_status": "active"
  }'
```

### List Students
```bash
curl http://localhost/api/v1/students/
```

---

## 🛠️ Operational Commands

```bash
# View live aggregated logs
docker compose logs -f

# View logs for a specific service (e.g. backend)
docker compose logs -f backend

# Restart a specific service
docker compose restart backend

# Stop all services without deleting persistent data
docker compose stop

# Stop and remove containers and network (preserves named volume)
docker compose down

# Check named volume containing database data
docker volume ls | grep campusops
```

---

## ☁️ Production Deployment on AWS EC2

### Recommended Architecture for EC2

1. **Instance Sizing**:
   * Minimum: `t3.medium` (2 vCPU, 4 GiB RAM) for development/staging.
   * Recommended: `t3.large` or `c6i.large` for production workloads.
2. **Security Groups**:
   * Inbound:
     * Port `22` (SSH) — Restricted to your management IP / Bastion host.
     * Port `80` (HTTP) — `0.0.0.0/0` (redirected to HTTPS).
     * Port `443` (HTTPS) — `0.0.0.0/0`.
   * Outbound: All traffic (`0.0.0.0/0`).
3. **Deployment Steps on EC2**:
   ```bash
   # 1. Install Docker & Docker Compose plugin on Ubuntu / Amazon Linux
   sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2
   sudo usermod -aG docker $USER

   # 2. Clone repository
   git clone https://github.com/TALLURIBALAJI/campusops-production-deployment.git
   cd campusops-production-deployment

   # 3. Configure production credentials
   cp .env.example .env
   nano .env # Set strong POSTGRES_PASSWORD

   # 4. Launch with Docker Compose
   docker compose build
   docker compose up -d
   ```
4. **SSL/TLS Setup**:
   * For production, terminate SSL using **AWS Application Load Balancer (ALB)** with an AWS Certificate Manager (ACM) certificate, or install **Certbot / Let's Encrypt** on Nginx with automated renewal.
