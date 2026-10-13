"""CampusOps — Production Deployment (Python Stack)
Backend Application Entrypoint.

Main FastAPI application defining root and health check endpoints,
CORS middleware, error handlers, and router registrations.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.config import settings
from app.database import get_db, init_db, check_db_connection
from app.routers import students

# Configure logging for application lifecycle
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("campusops.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown events."""
    logger.info("Starting up %s...", settings.APP_NAME)
    logger.info("Environment: %s", settings.APP_ENV)
    logger.info("Database URL configured: %s", settings.MASKED_DATABASE_URL)

    # Attempt to initialize database tables on startup
    db_initialized = init_db()
    if db_initialized:
        logger.info("Database tables initialized successfully.")
    else:
        logger.warning(
            "Database table initialization deferred. Will connect once the database is available."
        )

    yield

    logger.info("Shutting down %s...", settings.APP_NAME)


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-ready backend API for CampusOps student management. "
        "Built with FastAPI, SQLAlchemy, and PostgreSQL for AWS DevOps deployment."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS (Cross-Origin Resource Sharing) for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development; tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler for Database Connectivity Errors
@app.exception_handler(OperationalError)
async def db_operational_error_handler(request, exc: OperationalError):
    logger.error("Database connection failure: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "Database Service Unavailable",
            "detail": (
                "Unable to connect to the database. Please verify your PostgreSQL "
                "service is running and credentials in environment variables are correct."
            ),
        },
    )


# ---------------------------------------------------------------------------
# Core Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/",
    tags=["Root"],
    summary="Project welcome endpoint",
    description="Returns the project name and a welcome message.",
)
def root():
    """Root endpoint welcoming users to the CampusOps API."""
    return {
        "project": settings.APP_NAME,
        "message": "Welcome to CampusOps Backend API!",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="Application and database health check",
    description="Returns application status and verifies live database connectivity.",
)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for container orchestrators, load balancers, and monitoring."""
    is_connected, db_message = check_db_connection()

    overall_status = "healthy" if is_connected else "degraded"
    status_code = status.HTTP_200_OK if is_connected else status.HTTP_200_OK

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "project": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "database": "connected" if is_connected else "disconnected",
            "database_message": db_message,
        },
    )


# ---------------------------------------------------------------------------
# Router Registration
# ---------------------------------------------------------------------------
# Register with both /api/v1 (versioned standard) and directly /students for convenience
app.include_router(students.router, prefix="/api/v1")
app.include_router(students.router, prefix="", include_in_schema=False)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG,
    )
