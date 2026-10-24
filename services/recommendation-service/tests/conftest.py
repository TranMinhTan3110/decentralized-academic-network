import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_user_id():
    return uuid.uuid4()

@pytest.fixture
def sample_student_token(sample_user_id):
    return create_access_token(
        user_id=str(sample_user_id),
        email="sinhvien@academic.edu.vn",
        role="ROLE_STUDENT"
    )

@pytest.fixture
def sample_admin_token():
    return create_access_token(
        user_id=str(uuid.uuid4()),
        email="admin@academic.edu.vn",
        role="ROLE_ADMIN"
    )

@pytest.fixture
def auth_headers(sample_student_token):
    return {"Authorization": f"Bearer {sample_student_token}"}

@pytest.fixture
def admin_headers(sample_admin_token):
    return {"Authorization": f"Bearer {sample_admin_token}"}
