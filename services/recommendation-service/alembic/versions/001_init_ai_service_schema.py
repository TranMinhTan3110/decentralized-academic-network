"""init ai service schema

Revision ID: 001_init_ai_service
Revises: 
Create Date: 2026-10-10 17:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_init_ai_service'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. document_chunks
    op.create_table(
        'document_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('heading', sa.String(length=255), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('formula', sa.Text(), nullable=True),
        sa.Column('token_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.UniqueConstraint('document_id', 'chunk_index', name='uq_doc_chunk')
    )
    op.create_index('idx_chunks_doc', 'document_chunks', ['document_id'])

    # 2. ai_quizzes
    op.create_table(
        'ai_quizzes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('creator_user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('difficulty', sa.String(length=30), server_default='ADVANCED', nullable=True),
        sa.Column('format_mode', sa.String(length=30), server_default='MULTIPLE_CHOICE', nullable=True),
        sa.Column('total_questions', sa.Integer(), server_default='5', nullable=False),
        sa.Column('coverage_percent', sa.Float(), server_default='95.0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True)
    )
    op.create_index('idx_quiz_doc', 'ai_quizzes', ['document_id'])

    # 3. ai_quiz_questions
    op.create_table(
        'ai_quiz_questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('quiz_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ai_quizzes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_index', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('options_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('correct_answer', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('source_heading', sa.String(length=255), nullable=True),
        sa.Column('source_page', sa.Integer(), nullable=True),
        sa.Column('source_snippet', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True)
    )

    # 4. user_quiz_attempts
    op.create_table(
        'user_quiz_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quiz_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ai_quizzes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('percentage', sa.Float(), nullable=False),
        sa.Column('time_spent_seconds', sa.Integer(), server_default='0', nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True)
    )

    # 5. user_document_interactions
    op.create_table(
        'user_document_interactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('interaction_type', sa.String(length=50), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), server_default='0', nullable=True),
        sa.Column('pages_viewed', sa.Integer(), server_default='1', nullable=True),
        sa.Column('reward_score', sa.Float(), server_default='0.0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True)
    )
    op.create_index('idx_interactions_user', 'user_document_interactions', ['user_id'])
    op.create_index('idx_interactions_doc', 'user_document_interactions', ['document_id'])

    # 6. ai_chat_sessions
    op.create_table(
        'ai_chat_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), server_default='Hỏi đáp bài giảng AI', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True)
    )

    # 7. ai_chat_messages
    op.create_table(
        'ai_chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('ai_chat_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sources_found_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True)
    )


def downgrade() -> None:
    op.drop_table('ai_chat_messages')
    op.drop_table('ai_chat_sessions')
    op.drop_table('user_document_interactions')
    op.drop_table('user_quiz_attempts')
    op.drop_table('ai_quiz_questions')
    op.drop_table('ai_quizzes')
    op.drop_table('document_chunks')
