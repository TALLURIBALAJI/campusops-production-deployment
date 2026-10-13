"""Configuration management for CampusOps Backend.

Reads application and database configuration from environment variables (.env file).
Ensures database passwords and sensitive settings are never hardcoded.
"""

import os
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Base directory for the backend (where .env typically resides)
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file if it exists
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()  # Fallback to system env or default .env lookup


class Settings:
    """Application settings loaded from environment variables."""

    # Project metadata
    APP_NAME: str = os.getenv("APP_NAME", "CampusOps — Production Deployment (Python Stack)")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    # PostgreSQL individual connection parameters
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "campusops_db")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    # Optional explicit connection string
    DATABASE_URL_OVERRIDE: str | None = os.getenv("DATABASE_URL")

    @property
    def DATABASE_URL(self) -> str:
        """Construct the database connection URL.

        If DATABASE_URL environment variable is provided, use it directly.
        Otherwise, construct PostgreSQL URL safely encoding user and password.
        """
        if self.DATABASE_URL_OVERRIDE:
            return self.DATABASE_URL_OVERRIDE

        # URL-encode credentials to handle special characters safely
        encoded_user = quote_plus(self.DB_USER)
        encoded_pass = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""

        if encoded_pass:
            auth = f"{encoded_user}:{encoded_pass}"
        else:
            auth = encoded_user

        return f"postgresql://{auth}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def MASKED_DATABASE_URL(self) -> str:
        """Return database URL with password masked for safe logging/diagnostics."""
        url = self.DATABASE_URL
        if "@" in url and "://" in url:
            scheme_and_auth, rest = url.split("@", 1)
            scheme, auth = scheme_and_auth.split("://", 1)
            if ":" in auth:
                username, _ = auth.split(":", 1)
                return f"{scheme}://{username}:****@{rest}"
        return url


settings = Settings()
