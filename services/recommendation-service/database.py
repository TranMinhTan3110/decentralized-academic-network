# Re-export from app.core.database for backward compatibility and Alembic
from app.core.database import Base, DATABASE_URL, engine, SessionLocal, get_db

__all__ = ["Base", "DATABASE_URL", "engine", "SessionLocal", "get_db"]
