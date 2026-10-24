-- V5: Lịch sử xem tài liệu, dedup theo (user, document, ngày) để chống bơm view.
CREATE TABLE IF NOT EXISTS document_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_view_per_day UNIQUE (user_id, document_id, view_date)
);

CREATE INDEX IF NOT EXISTS idx_document_views_user_time ON document_views(user_id, viewed_at DESC);
