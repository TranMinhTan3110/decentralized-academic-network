from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db

__all__ = ["get_db"]
