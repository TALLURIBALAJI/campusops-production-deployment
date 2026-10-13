"""Database setup and session management using SQLAlchemy.

Configures connection pooling, declarative base, session dependency,
and database health check utilities.
"""

import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("campusops.database")

# Build engine arguments based on database dialect
db_url = settings.DATABASE_URL
engine_kwargs = {"pool_pre_ping": True}

# Handle SQLite-specific configuration when used in tests or local fallback
if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL production pool settings
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields an independent database session per request.

    Guarantees session cleanup even if unhandled exceptions occur.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> tuple[bool, str]:
    """Execute a lightweight probe ('SELECT 1') to check database connectivity.

    Returns:
        tuple[bool, str]: (is_connected, message_or_error_detail)
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "Database connection is operational"
    except Exception as exc:
        logger.warning("Database connectivity check failed: %s", exc)
        return False, str(exc)


def init_db() -> bool:
    """Create all database tables defined in SQLAlchemy models if they do not exist.

    Returns:
        bool: True if tables were created or verified, False if database is unreachable.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        return True
    except Exception as exc:
        logger.error("Failed to initialize database tables on startup: %s", exc)
        return False
