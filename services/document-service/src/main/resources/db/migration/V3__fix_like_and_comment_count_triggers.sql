-- Flyway Migration: V3__fix_like_and_comment_count_triggers.sql
-- Loại bỏ cập nhật like_count và comment_count trong DB trigger để tránh double-increment/decrement với Spring Boot service,
-- đồng thời đồng bộ lại số lượng like_count và comment_count thực tế.

CREATE OR REPLACE FUNCTION func_handle_document_like()
RETURNS TRIGGER AS $$
DECLARE
    doc_author_id UUID;
    doc_title VARCHAR(255);
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT user_id, title INTO doc_author_id, doc_title 
        FROM documents 
        WHERE id = NEW.document_id;
        
        IF (doc_author_id IS NOT NULL AND NEW.user_id <> doc_author_id) THEN
            INSERT INTO notifications (recipient_user_id, actor_user_id, document_id, notification_type, title, content)
            VALUES (doc_author_id, NEW.user_id, NEW.document_id, 'LIKE', 'Lượt thích mới', 'Có người vừa thích tài liệu "' || SUBSTRING(COALESCE(doc_title, '') FROM 1 FOR 50) || '" của bạn.');
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION func_handle_document_comment()
RETURNS TRIGGER AS $$
DECLARE
    doc_author_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT user_id INTO doc_author_id 
        FROM documents 
        WHERE id = NEW.document_id;
        
        IF (doc_author_id IS NOT NULL AND NEW.user_id <> doc_author_id) THEN
            INSERT INTO notifications (recipient_user_id, actor_user_id, document_id, notification_type, title, content)
            VALUES (doc_author_id, NEW.user_id, NEW.document_id, 'COMMENT', 'Bình luận mới', SUBSTRING(NEW.content FROM 1 FOR 120));
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Đồng bộ lại like_count thực tế từ bảng document_likes
UPDATE documents d
SET like_count = COALESCE((
    SELECT COUNT(*)
    FROM document_likes dl
    WHERE dl.document_id = d.id
), 0);

-- Đồng bộ lại comment_count thực tế từ bảng document_comments
UPDATE documents d
SET comment_count = COALESCE((
    SELECT COUNT(*)
    FROM document_comments dc
    WHERE dc.document_id = d.id
), 0);
