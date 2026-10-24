"""remove fake seed document data (77777777-* placeholders)

Xóa dữ liệu trong ai_service_db tham chiếu tới các document placeholder
(77777777-7777-7777-7777-*) đã bị xóa ở document-service (Flyway V6).
Chạy tự động khi FastAPI lifespan gọi `alembic upgrade head` lúc khởi động.

Revision ID: 002_remove_fake_docs
Revises: 001_init_ai_service
Create Date: 2026-10-24 17:20:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = '002_remove_fake_docs'
down_revision: Union[str, None] = '001_init_ai_service'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FAKE_DOC_LIKE = '77777777-7777-7777-7777-%'


def upgrade() -> None:
    op.execute(f"DELETE FROM ai_quiz_questions WHERE quiz_id IN "
               f"(SELECT id FROM ai_quizzes WHERE document_id::text LIKE '{FAKE_DOC_LIKE}')")
    op.execute(f"DELETE FROM ai_quizzes WHERE document_id::text LIKE '{FAKE_DOC_LIKE}'")
    op.execute(f"DELETE FROM ai_chat_messages WHERE session_id IN "
               f"(SELECT id FROM ai_chat_sessions WHERE document_id::text LIKE '{FAKE_DOC_LIKE}')")
    op.execute(f"DELETE FROM ai_chat_sessions WHERE document_id::text LIKE '{FAKE_DOC_LIKE}'")
    op.execute(f"DELETE FROM user_document_interactions WHERE document_id::text LIKE '{FAKE_DOC_LIKE}'")
    op.execute(f"DELETE FROM document_chunks WHERE document_id::text LIKE '{FAKE_DOC_LIKE}'")


def downgrade() -> None:
    # Dữ liệu seed giả không cần khôi phục
    pass
