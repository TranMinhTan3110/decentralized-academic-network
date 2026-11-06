-- ==============================================================================
-- V9: ADD DOCUMENT RATINGS (1-5 STARS) & AVERAGE RATING METRICS
-- ==============================================================================

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS rating_avg DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS document_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_rating_user UNIQUE (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_document_ratings_doc_id ON document_ratings(document_id);
CREATE INDEX IF NOT EXISTS idx_document_ratings_user_id ON document_ratings(user_id);

