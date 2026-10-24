-- Flyway Migration: V2__add_hybrid_ipfs_and_preview_fields.sql
-- Thêm các trường cho cơ chế Hybrid IPFS và Preview PDF

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS is_pinned_local BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_pinned_remote BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preview_ipfs_cid VARCHAR(255);
