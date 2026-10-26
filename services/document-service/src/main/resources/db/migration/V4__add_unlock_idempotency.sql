-- V4: Lưu idempotencyKey của giao dịch mở khóa để chống trừ điểm trùng khi retry.
ALTER TABLE user_unlocked_documents
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
