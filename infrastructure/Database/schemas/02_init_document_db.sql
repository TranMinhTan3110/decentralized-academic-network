-- ==============================================================================
-- DỰ ÁN: MẠNG XÃ HỘI CHIA SẺ TÀI LIỆU HỌC THUẬT PHI TẬP TRUNG (DeDocu Commons)
-- MICROSERVICE: DOCUMENT SERVICE (Java Spring Boot 3 - Port 8082)
-- DATABASE: document_db
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. DANH MỤC TRƯỜNG, KHOA & MÔN HỌC (ACADEMIC TAXONOMY)
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,            -- NEU, HUST, FTU, UEH
    name VARCHAR(255) NOT NULL,                  -- Đại học Bách khoa Hà Nội
    city VARCHAR(100) DEFAULT 'Hà Nội',
    logo_url VARCHAR(500),
    description TEXT,
    total_documents_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,                   -- KT, ĐS, XS, LT, MK, TC
    name VARCHAR(255) NOT NULL,                  -- Kinh tế vi mô, Lập trình hướng đối tượng
    area VARCHAR(100),                           -- Khối ngành: 'Kinh tế', 'Toán học', 'Công nghệ'
    semester VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_course_code_faculty UNIQUE (faculty_id, code)
);

-- 2. BẢNG BÀI ĐĂNG TÀI LIỆU (DOCUMENTS)
-- LƯU Ý MICROSERVICES: user_id là khóa logic (UUID), không dùng Foreign Key trỏ sang user_db
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,                       -- ID tác giả (Tham chiếu logic sang User Service)
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    caption TEXT,
    doc_type VARCHAR(50) NOT NULL DEFAULT 'SLIDE', -- 'Đề cương', 'Ghi chép', 'Bài tập', 'Tóm tắt'
    academic_year VARCHAR(20) DEFAULT '2025',
    semester VARCHAR(20),
    
    -- Lưu trữ phi tập trung & File PDF
    ipfs_cid VARCHAR(255) NOT NULL,
    storage_node_peer VARCHAR(150),
    file_url VARCHAR(500),
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    file_extension VARCHAR(10) DEFAULT 'pdf',
    thumbnail_url VARCHAR(500),
    total_pages INT NOT NULL DEFAULT 1,
    
    -- Mô hình Freemium
    free_pages INT NOT NULL DEFAULT 3,
    is_blur_locked BOOLEAN NOT NULL DEFAULT TRUE,
    unlock_points_required INT NOT NULL DEFAULT 10,
    status VARCHAR(30) DEFAULT 'PUBLISHED',      -- 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'
    
    -- Bộ đếm tương tác
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    bookmark_count INT DEFAULT 0,
    quiz_generated_count INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TƯƠNG TÁC MẠNG XÃ HỘI (LIKES, COMMENTS, BOOKMARKS)
CREATE TABLE IF NOT EXISTS document_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,                       -- ID người like (Logic ref to User Service)
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reaction_type VARCHAR(30) DEFAULT 'LIKE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_document_like UNIQUE (user_id, document_id)
);

CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,                       -- ID người comment (Logic ref to User Service)
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    page_number INT,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,                       -- ID người lưu (Logic ref to User Service)
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    collection_name VARCHAR(100) DEFAULT 'Mặc định',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_document_bookmark UNIQUE (user_id, document_id, collection_name)
);

-- 4. BẢNG THÔNG BÁO TƯƠNG TÁC (NOTIFICATIONS - Phục vụ trang /recent)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL,             -- ID người nhận thông báo
    actor_user_id UUID,                          -- ID người tạo tương tác
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,       -- 'LIKE', 'COMMENT', 'FOLLOW', 'SYSTEM'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG MỞ KHÓA TÀI LIỆU (FREEMIUM)
CREATE TABLE IF NOT EXISTS user_unlocked_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    unlock_type VARCHAR(50) DEFAULT 'POINTS',
    points_spent INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_unlocked_doc UNIQUE (user_id, document_id)
);

-- 6. BÁO CÁO VI PHẠM & GIÁM SÁT IPFS
CREATE TABLE IF NOT EXISTS document_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    resolved_by_admin_id UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ipfs_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_name VARCHAR(100) NOT NULL,
    peer_multiaddr VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'ONLINE',
    pinned_documents_count INT DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    bandwidth_mbps FLOAT DEFAULT 0.0,
    uptime_percentage FLOAT DEFAULT 99.9,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. INDEX TỐI ƯU HIỆU NĂNG TÌM KIẾM
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_university_id ON documents(university_id);
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id, created_at DESC);

-- 8. TRIGGERS TỰ ĐỘNG CẬP NHẬT COUNTER VÀ THÔNG BÁO
CREATE OR REPLACE FUNCTION func_handle_document_like()
RETURNS TRIGGER AS $$
DECLARE
    doc_author_id UUID;
    doc_title VARCHAR(255);
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE documents 
        SET like_count = like_count + 1 
        WHERE id = NEW.document_id 
        RETURNING user_id, title INTO doc_author_id, doc_title;
        
        IF (NEW.user_id <> doc_author_id) THEN
            INSERT INTO notifications (recipient_user_id, actor_user_id, document_id, notification_type, title, content)
            VALUES (doc_author_id, NEW.user_id, NEW.document_id, 'LIKE', 'Lượt thích mới', 'Có người vừa thích tài liệu "' || SUBSTRING(doc_title FROM 1 FOR 50) || '" của bạn.');
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE documents SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.document_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_like ON document_likes;
CREATE TRIGGER trg_document_like
AFTER INSERT OR DELETE ON document_likes
FOR EACH ROW EXECUTE FUNCTION func_handle_document_like();

CREATE OR REPLACE FUNCTION func_handle_document_comment()
RETURNS TRIGGER AS $$
DECLARE
    doc_author_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE documents 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.document_id 
        RETURNING user_id INTO doc_author_id;
        
        IF (NEW.user_id <> doc_author_id) THEN
            INSERT INTO notifications (recipient_user_id, actor_user_id, document_id, notification_type, title, content)
            VALUES (doc_author_id, NEW.user_id, NEW.document_id, 'COMMENT', 'Bình luận mới', SUBSTRING(NEW.content FROM 1 FOR 120));
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE documents SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.document_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_comment ON document_comments;
CREATE TRIGGER trg_document_comment
AFTER INSERT OR DELETE ON document_comments
FOR EACH ROW EXECUTE FUNCTION func_handle_document_comment();

-- 9. SEED DATA CHO DOCUMENT SERVICE
INSERT INTO universities (id, code, name, city, logo_url) 
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'NEU', 'Đại học Kinh tế Quốc dân', 'Hà Nội', 'https://upload.wikimedia.org/wikipedia/vi/8/8c/Logo_Đại_học_Kinh_tế_Quốc_dân.svg'),
    ('22222222-2222-2222-2222-222222222222', 'HUST', 'Đại học Bách khoa Hà Nội', 'Hà Nội', 'https://upload.wikimedia.org/wikipedia/vi/a/a1/Logo_Hust.png'),
    ('33333333-3333-3333-3333-333333333333', 'FTU', 'Trường Đại học Ngoại thương', 'Hà Nội', 'https://upload.wikimedia.org/wikipedia/vi/6/6c/Logo_FTU.png'),
    ('44444444-4444-4444-4444-444444444444', 'UEH', 'Đại học Kinh tế TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'https://upload.wikimedia.org/wikipedia/commons/2/25/Logo_UEH_xanh.png'),
    ('55555555-5555-5555-5555-111111111111', 'PTIT', 'Học viện Công nghệ Bưu chính Viễn thông', 'Hà Nội', 'https://portal.ptit.edu.vn/wp-content/uploads/2016/04/Logo-PTIT.jpg')
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (id, code, name, area, semester)
VALUES 
    ('55555555-5555-5555-5555-000000000001', 'KT', 'Kinh tế vi mô', 'Kinh tế', 'Học kỳ 1'),
    ('55555555-5555-5555-5555-000000000002', 'ĐS', 'Đại số tuyến tính', 'Toán học', 'Học kỳ 1'),
    ('55555555-5555-5555-5555-000000000003', 'XS', 'Xác suất thống kê', 'Toán học', 'Học kỳ 2'),
    ('55555555-5555-5555-5555-000000000004', 'LT', 'Lập trình hướng đối tượng', 'Công nghệ', 'Học kỳ 2'),
    ('55555555-5555-5555-5555-000000000005', 'MK', 'Marketing căn bản', 'Kinh doanh', 'Học kỳ 1'),
    ('55555555-5555-5555-5555-000000000006', 'TC', 'Tài chính doanh nghiệp', 'Kinh tế', 'Học kỳ 2'),
    ('55555555-5555-5555-5555-000000000007', 'AT', 'An toàn thông tin', 'Công nghệ', 'Học kỳ 1'),
    ('55555555-5555-5555-5555-000000000008', 'GT', 'Giải tích 1', 'Toán học', 'Học kỳ 1'),
    ('55555555-5555-5555-5555-000000000009', 'HDH', 'Hệ điều hành', 'Công nghệ', 'Học kỳ 2')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- DỰ ÁN: MẠNG XÃ HỘI CHIA SẺ TÀI LIỆU HỌC THUẬT PHI TẬP TRUNG (DeDocu Commons)
-- MICROSERVICE: DOCUMENT SERVICE (Java Spring Boot 3 - Port 8082)
-- FLYWAY MIGRATION: V8__seed_vietnam_universities_and_courses.sql
-- Nạp danh mục toàn bộ trường đại học, cao đẳng trọng điểm và kho môn học phổ biến
-- ==============================================================================

-- 1. BỔ SUNG DANH MỤC TRƯỜNG ĐẠI HỌC VÀ CAO ĐẲNG TRÊN TOÀN QUỐC
INSERT INTO universities (code, name, city)
VALUES
    ('HUST', 'Đại học Bách khoa Hà Nội', 'Hà Nội'),
    ('NEU', 'Đại học Kinh tế Quốc dân', 'Hà Nội'),
    ('FTU', 'Trường Đại học Ngoại thương', 'Hà Nội'),
    ('PTIT', 'Học viện Công nghệ Bưu chính Viễn thông', 'Hà Nội'),
    ('VNU-UET', 'Trường Đại học Công nghệ - ĐHQGHN', 'Hà Nội'),
    ('VNU-HUS', 'Trường Đại học Khoa học Tự nhiên - ĐHQGHN', 'Hà Nội'),
    ('VNU-USSH', 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN', 'Hà Nội'),
    ('VNU-ULIS', 'Trường Đại học Ngoại ngữ - ĐHQGHN', 'Hà Nội'),
    ('VNU-UEB', 'Trường Đại học Kinh tế - ĐHQGHN', 'Hà Nội'),
    ('VNU-UED', 'Trường Đại học Giáo dục - ĐHQGHN', 'Hà Nội'),
    ('VNU-LAW', 'Trường Đại học Luật - ĐHQGHN', 'Hà Nội'),
    ('VNU-UMP', 'Trường Đại học Y Dược - ĐHQGHN', 'Hà Nội'),
    ('VNU-VJU', 'Trường Đại học Việt Nhật - ĐHQGHN', 'Hà Nội'),
    ('HNUE', 'Trường Đại học Sư phạm Hà Nội', 'Hà Nội'),
    ('HANU', 'Trường Đại học Hà Nội', 'Hà Nội'),
    ('TMU', 'Trường Đại học Thương mại', 'Hà Nội'),
    ('AOF', 'Học viện Tài chính', 'Hà Nội'),
    ('BA', 'Học viện Ngân hàng', 'Hà Nội'),
    ('AJC', 'Học viện Báo chí và Tuyên truyền', 'Hà Nội'),
    ('DAV', 'Học viện Ngoại giao', 'Hà Nội'),
    ('HLU', 'Trường Đại học Luật Hà Nội', 'Hà Nội'),
    ('HMU', 'Trường Đại học Y Hà Nội', 'Hà Nội'),
    ('HUP', 'Trường Đại học Dược Hà Nội', 'Hà Nội'),
    ('HUCE', 'Trường Đại học Xây dựng Hà Nội', 'Hà Nội'),
    ('HAU', 'Trường Đại học Kiến trúc Hà Nội', 'Hà Nội'),
    ('TLU', 'Trường Đại học Thủy lợi', 'Hà Nội'),
    ('HUMG', 'Trường Đại học Mỏ - Địa chất', 'Hà Nội'),
    ('UTC', 'Trường Đại học Giao thông Vận tải', 'Hà Nội'),
    ('HAUI', 'Trường Đại học Công nghiệp Hà Nội', 'Hà Nội'),
    ('UNETI', 'Trường Đại học Kinh tế - Kỹ thuật Công nghiệp', 'Hà Nội'),
    ('VNUA', 'Học viện Nông nghiệp Việt Nam', 'Hà Nội'),
    ('VNUF', 'Trường Đại học Lâm nghiệp', 'Hà Nội'),
    ('T01', 'Học viện An ninh Nhân dân', 'Hà Nội'),
    ('T02', 'Học viện Cảnh sát Nhân dân', 'Hà Nội'),
    ('MTA', 'Học viện Kỹ thuật Quân sự', 'Hà Nội'),
    ('VMMU', 'Học viện Quân y', 'Hà Nội'),
    ('FPT-HN', 'Trường Đại học FPT Hà Nội', 'Hà Nội'),
    ('VINUNI', 'Trường Đại học VinUni', 'Hà Nội'),
    ('PHENIKAA', 'Trường Đại học Phenikaa', 'Hà Nội'),
    ('TLU-HN', 'Trường Đại học Thăng Long', 'Hà Nội'),
    ('CMC', 'Trường Đại học CMC', 'Hà Nội'),
    ('EPU', 'Trường Đại học Điện lực', 'Hà Nội'),
    ('HUC', 'Trường Đại học Văn hóa Hà Nội', 'Hà Nội'),
    ('NAPA', 'Học viện Hành chính Quốc gia', 'Hà Nội'),
    ('HPMU', 'Trường Đại học Y Dược Hải Phòng', 'Hải Phòng'),
    ('VMU', 'Trường Đại học Hàng hải Việt Nam', 'Hải Phòng'),
    ('HPU', 'Trường Đại học Quản lý và Công nghệ Hải Phòng', 'Hải Phòng'),
    ('TNU-ICT', 'Trường Đại học Công nghệ Thông tin và Truyền thông - ĐH Thái Nguyên', 'Thái Nguyên'),
    ('TNU-TUE', 'Trường Đại học Sư phạm - ĐH Thái Nguyên', 'Thái Nguyên'),
    ('TNU-TUMP', 'Trường Đại học Y Dược - ĐH Thái Nguyên', 'Thái Nguyên'),
    ('TNU-TUEBA', 'Trường Đại học Kinh tế và Quản trị Kinh doanh - ĐH Thái Nguyên', 'Thái Nguyên'),
    ('TNU-TNUT', 'Trường Đại học Kỹ thuật Công nghiệp - ĐH Thái Nguyên', 'Thái Nguyên'),
    ('TBUMP', 'Trường Đại học Y Dược Thái Bình', 'Thái Bình'),
    ('HNUE2', 'Trường Đại học Sư phạm Hà Nội 2', 'Vĩnh Phúc'),
    ('UTEHY', 'Trường Đại học Sư phạm Kỹ thuật Hưng Yên', 'Hưng Yên'),
    ('NUTE', 'Trường Đại học Sư phạm Kỹ thuật Nam Định', 'Nam Định'),
    ('HLU-QN', 'Trường Đại học Hạ Long', 'Quảng Ninh'),
    ('VNUHCM-BK', 'Trường Đại học Bách khoa - ĐHQG TP.HCM', 'TP. Hồ Chí Minh'),
    ('VNUHCM-KHTN', 'Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM', 'TP. Hồ Chí Minh'),
    ('VNUHCM-USSH', 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM', 'TP. Hồ Chí Minh'),
    ('VNUHCM-UIT', 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM', 'TP. Hồ Chí Minh'),
    ('VNUHCM-IU', 'Trường Đại học Quốc tế - ĐHQG TP.HCM', 'TP. Hồ Chí Minh'),
    ('VNUHCM-UEL', 'Trường Đại học Kinh tế - Luật - ĐHQG TP.HCM', 'TP. Hồ Chí Minh'),
    ('VNUHCM-UHS', 'Trường Đại học Khoa học Sức khỏe - ĐHQG TP.HCM', 'TP. Hồ Chí Minh'),
    ('UEH', 'Đại học Kinh tế TP. Hồ Chí Minh', 'TP. Hồ Chí Minh'),
    ('FTU2', 'Trường Đại học Ngoại thương - Cơ sở 2 TP.HCM', 'TP. Hồ Chí Minh'),
    ('PTIT-HCM', 'Học viện Công nghệ Bưu chính Viễn thông - Cơ sở TP.HCM', 'TP. Hồ Chí Minh'),
    ('UTC2', 'Trường Đại học Giao thông Vận tải - Phân hiệu tại TP.HCM', 'TP. Hồ Chí Minh'),
    ('HCMUTE', 'Trường Đại học Sư phạm Kỹ thuật TP.HCM', 'TP. Hồ Chí Minh'),
    ('HCMUE', 'Trường Đại học Sư phạm TP.HCM', 'TP. Hồ Chí Minh'),
    ('UMP-HCM', 'Đại học Y Dược TP.HCM', 'TP. Hồ Chí Minh'),
    ('PNTU', 'Trường Đại học Y khoa Phạm Ngọc Thạch', 'TP. Hồ Chí Minh'),
    ('ULAW', 'Trường Đại học Luật TP.HCM', 'TP. Hồ Chí Minh'),
    ('UAH', 'Trường Đại học Kiến trúc TP.HCM', 'TP. Hồ Chí Minh'),
    ('UFM', 'Trường Đại học Tài chính - Marketing', 'TP. Hồ Chí Minh'),
    ('UTH', 'Trường Đại học Giao thông Vận tải TP.HCM', 'TP. Hồ Chí Minh'),
    ('IUH', 'Trường Đại học Công nghiệp TP.HCM', 'TP. Hồ Chí Minh'),
    ('HUIT', 'Trường Đại học Công Thương TP.HCM', 'TP. Hồ Chí Minh'),
    ('NLU', 'Trường Đại học Nông Lâm TP.HCM', 'TP. Hồ Chí Minh'),
    ('SGU', 'Trường Đại học Sài Gòn', 'TP. Hồ Chí Minh'),
    ('OU', 'Trường Đại học Mở TP.HCM', 'TP. Hồ Chí Minh'),
    ('TDTU', 'Trường Đại học Tôn Đức Thắng', 'TP. Hồ Chí Minh'),
    ('RMIT', 'Trường Đại học RMIT Việt Nam', 'TP. Hồ Chí Minh'),
    ('VLU', 'Trường Đại học Văn Lang', 'TP. Hồ Chí Minh'),
    ('HUTECH', 'Trường Đại học Công nghệ TP.HCM', 'TP. Hồ Chí Minh'),
    ('HSU', 'Trường Đại học Hoa Sen', 'TP. Hồ Chí Minh'),
    ('UEF', 'Trường Đại học Kinh tế - Tài chính TP.HCM', 'TP. Hồ Chí Minh'),
    ('NTTU', 'Trường Đại học Nguyễn Tất Thành', 'TP. Hồ Chí Minh'),
    ('HIU', 'Trường Đại học Quốc tế Hồng Bàng', 'TP. Hồ Chí Minh'),
    ('STU', 'Trường Đại học Công nghệ Sài Gòn', 'TP. Hồ Chí Minh'),
    ('GDU', 'Trường Đại học Gia Định', 'TP. Hồ Chí Minh'),
    ('HUFLIT', 'Trường Đại học Ngoại ngữ - Tin học TP.HCM', 'TP. Hồ Chí Minh'),
    ('T04', 'Trường Đại học An ninh Nhân dân', 'TP. Hồ Chí Minh'),
    ('T05', 'Trường Đại học Cảnh sát Nhân dân', 'TP. Hồ Chí Minh'),
    ('FPT-HCM', 'Trường Đại học FPT TP.HCM', 'TP. Hồ Chí Minh'),
    ('BDU', 'Trường Đại học Bình Dương', 'Bình Dương'),
    ('TDMU', 'Trường Đại học Thủ Dầu Một', 'Bình Dương'),
    ('EIU', 'Trường Đại học Quốc tế Miền Đông', 'Bình Dương'),
    ('VGU', 'Trường Đại học Việt Đức', 'Bình Dương'),
    ('DNU', 'Trường Đại học Đồng Nai', 'Đồng Nai'),
    ('LHU', 'Trường Đại học Lạc Hồng', 'Đồng Nai'),
    ('BRVTU', 'Trường Đại học Bà Rịa - Vũng Tàu', 'Bà Rịa - Vũng Tàu'),
    ('UD-DUT', 'Trường Đại học Bách khoa - ĐH Đà Nẵng', 'Đà Nẵng'),
    ('UD-DUE', 'Trường Đại học Kinh tế - ĐH Đà Nẵng', 'Đà Nẵng'),
    ('UD-UED', 'Trường Đại học Sư phạm - ĐH Đà Nẵng', 'Đà Nẵng'),
    ('UD-UFL', 'Trường Đại học Ngoại ngữ - ĐH Đà Nẵng', 'Đà Nẵng'),
    ('UD-VKU', 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn', 'Đà Nẵng'),
    ('DTU', 'Trường Đại học Duy Tân', 'Đà Nẵng'),
    ('DAU', 'Trường Đại học Kiến trúc Đà Nẵng', 'Đà Nẵng'),
    ('DNC-DN', 'Trường Đại học Đông Á', 'Đà Nẵng'),
    ('FPT-DN', 'Trường Đại học FPT Đà Nẵng', 'Đà Nẵng'),
    ('HUE-HUS', 'Trường Đại học Khoa học - ĐH Huế', 'Thừa Thiên Huế'),
    ('HUE-HUE', 'Trường Đại học Sư phạm - ĐH Huế', 'Thừa Thiên Huế'),
    ('HUE-HCE', 'Trường Đại học Kinh tế - ĐH Huế', 'Thừa Thiên Huế'),
    ('HUE-HUL', 'Trường Đại học Luật - ĐH Huế', 'Thừa Thiên Huế'),
    ('HUE-HUMP', 'Trường Đại học Y Dược - ĐH Huế', 'Thừa Thiên Huế'),
    ('HUE-HUA', 'Trường Đại học Nông Lâm - ĐH Huế', 'Thừa Thiên Huế'),
    ('HUE-HUCFL', 'Trường Đại học Ngoại ngữ - ĐH Huế', 'Thừa Thiên Huế'),
    ('VINHUNI', 'Trường Đại học Vinh', 'Nghệ An'),
    ('NTU', 'Trường Đại học Nha Trang', 'Khánh Hòa'),
    ('QNU', 'Trường Đại học Quy Nhơn', 'Bình Định'),
    ('DLU-DL', 'Trường Đại học Đà Lạt', 'Lâm Đồng'),
    ('TTU', 'Trường Đại học Tây Nguyên', 'Đắk Lắk'),
    ('PYU', 'Trường Đại học Phú Yên', 'Phú Yên'),
    ('PVD', 'Trường Đại học Phạm Văn Đồng', 'Quảng Ngãi'),
    ('CTU', 'Trường Đại học Cần Thơ', 'Cần Thơ'),
    ('CTUMP', 'Trường Đại học Y Dược Cần Thơ', 'Cần Thơ'),
    ('DNC-CT', 'Trường Đại học Nam Cần Thơ', 'Cần Thơ'),
    ('FPT-CT', 'Trường Đại học FPT Cần Thơ', 'Cần Thơ'),
    ('AGU', 'Trường Đại học An Giang - ĐHQG TP.HCM', 'An Giang'),
    ('TVU', 'Trường Đại học Trà Vinh', 'Trà Vinh'),
    ('TGU', 'Trường Đại học Tiền Giang', 'Tiền Giang'),
    ('DLU-DT', 'Trường Đại học Đồng Tháp', 'Đồng Tháp'),
    ('VLUTE', 'Trường Đại học Sư phạm Kỹ thuật Vĩnh Long', 'Vĩnh Long'),
    ('KGU', 'Trường Đại học Kiên Giang', 'Kiên Giang'),
    ('BLU', 'Trường Đại học Bạc Liêu', 'Bạc Liêu'),
    ('CAOTHANG', 'Trường Cao đẳng Kỹ thuật Cao Thắng', 'TP. Hồ Chí Minh'),
    ('FPTPOLY', 'Trường Cao đẳng FPT Polytechnic', 'Toàn quốc'),
    ('HITC', 'Trường Cao đẳng Công thương TP.HCM', 'TP. Hồ Chí Minh'),
    ('COFER', 'Trường Cao đẳng Kinh tế Đối ngoại', 'TP. Hồ Chí Minh'),
    ('VINATEX', 'Trường Cao đẳng Kinh tế - Kỹ thuật Vinatex TP.HCM', 'TP. Hồ Chí Minh'),
    ('HCE', 'Trường Cao đẳng Kinh tế TP.HCM', 'TP. Hồ Chí Minh'),
    ('BACHMAI', 'Trường Cao đẳng Y tế Bạch Mai', 'Hà Nội'),
    ('VOV', 'Trường Cao đẳng Phát thanh - Truyền hình', 'Hà Nội'),
    ('CDXD', 'Trường Cao đẳng Xây dựng TP.HCM', 'TP. Hồ Chí Minh'),
    ('CDCN', 'Trường Cao đẳng Công nghiệp Hà Nội', 'Hà Nội'),
    ('CDDDT', 'Trường Cao đẳng Điện lực TP.HCM', 'TP. Hồ Chí Minh'),
    ('CDVHNT', 'Trường Cao đẳng Văn hóa Nghệ thuật TP.HCM', 'TP. Hồ Chí Minh')
ON CONFLICT (code) DO NOTHING;

-- 2. BỔ SUNG KHO MÔN HỌC PHỔ BIẾN CÁC KHỐI NGÀNH (KÈM TÙY CHỌN 'KHÁC')
INSERT INTO courses (code, name, area)
VALUES
    ('TRIET', 'Triết học Mác - Lênin', 'Lý luận chính trị'),
    ('KTCT', 'Kinh tế chính trị Mác - Lênin', 'Lý luận chính trị'),
    ('CNXHKH', 'Chủ nghĩa xã hội khoa học', 'Lý luận chính trị'),
    ('LSDCSVN', 'Lịch sử Đảng Cộng sản Việt Nam', 'Lý luận chính trị'),
    ('TTHCM', 'Tư tưởng Hồ Chí Minh', 'Lý luận chính trị'),
    ('PLDC', 'Pháp luật đại cương', 'Lý luận chính trị'),
    ('QPAN', 'Giáo dục quốc phòng và an ninh', 'Đại cương'),
    ('GDTC', 'Giáo dục thể chất', 'Đại cương'),
    ('CS_VH_VN', 'Cơ sở văn hóa Việt Nam', 'Đại cương'),
    ('TVTH', 'Tiếng Việt thực hành', 'Đại cương'),
    ('GT1', 'Giải tích 1', 'Toán học'),
    ('GT2', 'Giải tích 2', 'Toán học'),
    ('GT3', 'Giải tích 3', 'Toán học'),
    ('DSTT', 'Đại số tuyến tính', 'Toán học'),
    ('XSTK', 'Xác suất thống kê', 'Toán học'),
    ('TORR', 'Toán rời rạc', 'Toán học'),
    ('PPT', 'Phương pháp tính (Giải tích số)', 'Toán học'),
    ('VLDC1', 'Vật lý đại cương 1 (Cơ - Nhiệt)', 'Khoa học tự nhiên'),
    ('VLDC2', 'Vật lý đại cương 2 (Điện - Từ - Quang)', 'Khoa học tự nhiên'),
    ('VLDC3', 'Vật lý đại cương 3 (Vật lý lượng tử)', 'Khoa học tự nhiên'),
    ('HHDC', 'Hóa học đại cương', 'Khoa học tự nhiên'),
    ('SHDC', 'Sinh học đại cương', 'Khoa học tự nhiên'),
    ('ENG1', 'Tiếng Anh đại cương 1', 'Ngoại ngữ'),
    ('ENG2', 'Tiếng Anh đại cương 2', 'Ngoại ngữ'),
    ('ENG3', 'Tiếng Anh đại cương 3', 'Ngoại ngữ'),
    ('ENG_CN', 'Tiếng Anh chuyên ngành (ESP)', 'Ngoại ngữ'),
    ('ENG_IELTS', 'Tiếng Anh học thuật (Academic English)', 'Ngoại ngữ'),
    ('CHN1', 'Tiếng Trung căn bản 1', 'Ngoại ngữ'),
    ('CHN_TM', 'Tiếng Trung thương mại', 'Ngoại ngữ'),
    ('JPN1', 'Tiếng Nhật sơ cấp 1', 'Ngoại ngữ'),
    ('KOR1', 'Tiếng Hàn tổng hợp 1', 'Ngoại ngữ'),
    ('NMLT', 'Nhập môn lập trình (C / C++)', 'Công nghệ thông tin'),
    ('KTLT', 'Kỹ thuật lập trình', 'Công nghệ thông tin'),
    ('OOP', 'Lập trình hướng đối tượng (Java / C++)', 'Công nghệ thông tin'),
    ('DSA', 'Cấu trúc dữ liệu và giải thuật', 'Công nghệ thông tin'),
    ('CSDL', 'Cơ sở dữ liệu (Database Systems)', 'Công nghệ thông tin'),
    ('HQTCSDL', 'Hệ quản trị cơ sở dữ liệu (SQL Server / Oracle)', 'Công nghệ thông tin'),
    ('HDH', 'Hệ điều hành (Operating Systems)', 'Công nghệ thông tin'),
    ('KTMT', 'Kiến trúc máy tính và Hợp ngữ', 'Công nghệ thông tin'),
    ('MMT', 'Mạng máy tính (Computer Networks)', 'Công nghệ thông tin'),
    ('LTM', 'Lập trình mạng (Network Programming)', 'Công nghệ thông tin'),
    ('ATTT', 'Nhập môn An toàn thông tin', 'Công nghệ thông tin'),
    ('MMH', 'Mật mã học và An toàn dữ liệu', 'Công nghệ thông tin'),
    ('CNPM', 'Kỹ nghệ phần mềm (Software Engineering)', 'Công nghệ thông tin'),
    ('PTTK_HTTT', 'Phân tích và thiết kế hệ thống thông tin', 'Công nghệ thông tin'),
    ('WEB_DEV', 'Phát triển ứng dụng Web (HTML, CSS, JS, React, Node)', 'Công nghệ thông tin'),
    ('MOBILE_DEV', 'Lập trình ứng dụng di động (Flutter / Android / iOS)', 'Công nghệ thông tin'),
    ('AI_INTRO', 'Nhập môn Trí tuệ nhân tạo (AI)', 'Công nghệ thông tin'),
    ('ML', 'Học máy (Machine Learning)', 'Công nghệ thông tin'),
    ('NLP', 'Xử lý ngôn ngữ tự nhiên (NLP)', 'Công nghệ thông tin'),
    ('CV', 'Thị giác máy tính (Computer Vision)', 'Công nghệ thông tin'),
    ('CLOUD', 'Điện toán đám mây (Cloud Computing - AWS / Azure / GCP)', 'Công nghệ thông tin'),
    ('DEVOPS', 'DevOps và CI/CD tự động hóa', 'Công nghệ thông tin'),
    ('TESTING', 'Kiểm thử phần mềm (Software Testing & QA)', 'Công nghệ thông tin'),
    ('BLOCKCHAIN', 'Công nghệ chuỗi khối (Blockchain & Web3)', 'Công nghệ thông tin'),
    ('UI_UX', 'Thiết kế giao diện và Trải nghiệm người dùng (UI/UX)', 'Công nghệ thông tin'),
    ('BIGDATA', 'Dữ liệu lớn (Big Data & Hadoop / Spark)', 'Công nghệ thông tin'),
    ('PYTHON', 'Lập trình Python và Phân tích dữ liệu', 'Công nghệ thông tin'),
    ('KTVM1', 'Kinh tế vi mô 1', 'Kinh tế'),
    ('KTVM2', 'Kinh tế vi mô 2', 'Kinh tế'),
    ('KTVMo1', 'Kinh tế vĩ mô 1', 'Kinh tế'),
    ('KTVMo2', 'Kinh tế vĩ mô 2', 'Kinh tế'),
    ('NLKT', 'Nguyên lý kế toán', 'Kinh tế'),
    ('KTTC', 'Kế toán tài chính', 'Kinh tế'),
    ('KTQT', 'Kế toán quản trị', 'Kinh tế'),
    ('TCDN', 'Tài chính doanh nghiệp', 'Tài chính - Ngân hàng'),
    ('TTTC', 'Thị trường tài chính và các định chế tài chính', 'Tài chính - Ngân hàng'),
    ('TCQT', 'Tài chính quốc tế', 'Tài chính - Ngân hàng'),
    ('NHTW', 'Tiền tệ - Ngân hàng', 'Tài chính - Ngân hàng'),
    ('KTL', 'Kinh tế lượng (Econometrics)', 'Kinh tế'),
    ('MKT_CB', 'Marketing căn bản', 'Marketing & Kinh doanh'),
    ('MKT_QT', 'Quản trị Marketing', 'Marketing & Kinh doanh'),
    ('HVNTD', 'Hành vi người tiêu dùng', 'Marketing & Kinh doanh'),
    ('DIGITAL_MKT', 'Marketing kỹ thuật số (Digital Marketing)', 'Marketing & Kinh doanh'),
    ('QTH', 'Quản trị học', 'Quản trị kinh doanh'),
    ('QTCL', 'Quản trị chiến lược', 'Quản trị kinh doanh'),
    ('QTNNL', 'Quản trị nguồn nhân lực (HRM)', 'Quản trị kinh doanh'),
    ('SCM', 'Quản trị chuỗi cung ứng và Logistics', 'Quản trị kinh doanh'),
    ('TMQT', 'Thương mại quốc tế', 'Kinh tế quốc tế'),
    ('DPKD', 'Đàm phán kinh doanh quốc tế', 'Kinh tế quốc tế'),
    ('TTQT', 'Thanh toán quốc tế', 'Kinh tế quốc tế'),
    ('KN_DN', 'Khởi nghiệp và Đổi mới sáng tạo', 'Quản trị kinh doanh'),
    ('LKT', 'Luật kinh tế và Thương mại', 'Luật'),
    ('KTDN', 'Kinh tế doanh nghiệp', 'Kinh tế'),
    ('KT_DIEN', 'Kỹ thuật điện đại cương', 'Điện - Điện tử'),
    ('LT_MACH', 'Lý thuyết mạch điện', 'Điện - Điện tử'),
    ('DT_SO', 'Kỹ thuật điện tử số', 'Điện - Điện tử'),
    ('DT_TT', 'Kỹ thuật điện tử tương tự', 'Điện - Điện tử'),
    ('VXL', 'Hệ thống vi xử lý và vi điều khiển', 'Điện - Điện tử'),
    ('DSP', 'Xử lý tín hiệu số (DSP)', 'Điện - Điện tử'),
    ('CAD', 'Vẽ kỹ thuật và CAD cơ khí', 'Cơ khí'),
    ('CHKT', 'Cơ học kỹ thuật (Cơ lý thuyết)', 'Cơ khí'),
    ('SBVL', 'Sức bền vật liệu', 'Cơ khí'),
    ('NLCTM', 'Nguyên lý - Chi tiết máy', 'Cơ khí'),
    ('VL_CK', 'Vật liệu cơ khí và kim loại học', 'Cơ khí'),
    ('TDH', 'Lý thuyết điều khiển tự động', 'Tự động hóa'),
    ('PLC', 'Điều khiển logic khả trình (PLC)', 'Tự động hóa'),
    ('ROBOT', 'Nhập môn kỹ thuật Robot', 'Tự động hóa'),
    ('XHHDC', 'Xã hội học đại cương', 'Khoa học xã hội'),
    ('TLHDC', 'Tâm lý học đại cương', 'Khoa học xã hội'),
    ('TLHGT', 'Tâm lý học giao tiếp', 'Khoa học xã hội'),
    ('NM_TT', 'Nhập môn Truyền thông đại chúng', 'Báo chí & Truyền thông'),
    ('VIET_BAO', 'Kỹ năng viết báo và biên tập', 'Báo chí & Truyền thông'),
    ('PR_CB', 'Quan hệ công chúng (PR căn bản)', 'Báo chí & Truyền thông'),
    ('LDS', 'Luật dân sự', 'Luật'),
    ('LHS', 'Luật hình sự', 'Luật'),
    ('LSHTT', 'Luật sở hữu trí tuệ', 'Luật'),
    ('GP_NGUOI', 'Giải phẫu học người', 'Y - Dược'),
    ('SLH', 'Sinh lý học', 'Y - Dược'),
    ('DUOC_LY', 'Dược lý học đại cương', 'Y - Dược'),
    ('VS_KY_SINH', 'Vi sinh và Ký sinh trùng', 'Y - Dược'),
    ('KHAC', 'Khác (Môn học khác)', 'Khác')
ON CONFLICT DO NOTHING;

-- Dữ liệu tài liệu mẫu (gắn với các file PDF thực tế trong thư mục dataset/)
INSERT INTO documents (
    id, user_id, university_id, course_id, title, description, caption, doc_type, academic_year,
    ipfs_cid, storage_node_peer, file_url, file_size_bytes, total_pages, free_pages, is_blur_locked, unlock_points_required,
    like_count, comment_count, view_count, download_count, bookmark_count, status
)
VALUES 
    -- 1. Tác giả: Âu Dương Tấn (Leader) - REAL-IT-001
    (
        '77777777-7777-7777-7777-000000000001',
        '10000000-0000-0000-0000-000000000001', -- Âu Dương Tấn
        '55555555-5555-5555-5555-111111111111', -- PTIT
        '55555555-5555-5555-5555-000000000004', -- Lập trình hướng đối tượng
        'Bài giảng Lập trình hướng đối tượng (Java & C++)',
        'Bài giảng chuẩn kỹ thuật OOP: Đóng gói, Kế thừa, Đa hình, Trừu tượng hóa kèm ví dụ code C++ và Java chi tiết.',
        'Tổng hợp slide và code mẫu môn OOP cho các bạn ôn thi đồ án và cuối kỳ.',
        'Bài giảng',
        '2024-2025',
        'QmZtmD2qtQgPrEJ5iqod3nnUchusLiAm99nnzNVnW39Mount',
        '/dns4/sg1.dedocu.eth',
        '/dataset/CongNgheThongTin/LapTrinh_OOP/BaiGiang/BaiGiang_LapTrinhHuongDoiTuong_PTIT.pdf',
        4990000, 150, 3, TRUE, 15,
        0, 0, 1420, 380, 0, 'PUBLISHED'
    ),
    -- 2. Tác giả: Trần Minh Tấn (Phó nhóm) - REAL-IT-004
    (
        '77777777-7777-7777-7777-000000000002',
        '20000000-0000-0000-0000-000000000001', -- Trần Minh Tấn
        '55555555-5555-5555-5555-111111111111', -- PTIT
        '55555555-5555-5555-5555-000000000009', -- Hệ điều hành
        'Giáo trình An toàn và Bảo mật Hệ điều hành (Toàn phần 2017)',
        'Cơ chế bảo vệ bộ nhớ, quản lý tiến trình, kiểm soát truy cập Access Control List (ACL) và bảo mật nhân Linux/Windows.',
        'Tài liệu nâng cao về an toàn hệ điều hành do mình tổng hợp ôn tập.',
        'Giáo trình',
        '2024-2025',
        'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
        '/dns4/vn1.dedocu.io',
        '/dataset/CongNgheThongTin/HeDieuHanh/GiaoTrinh/GiaoTrinh_AnToanHeDieuHanh_PTIT.pdf',
        4829000, 150, 3, TRUE, 12,
        0, 0, 980, 240, 0, 'PUBLISHED'
    ),
    -- 3. Tác giả: Anh Pha (AI Specialist) - REAL-IT-003
    (
        '77777777-7777-7777-7777-000000000003',
        '30000000-0000-0000-0000-000000000001', -- Anh Pha
        '55555555-5555-5555-5555-111111111111', -- PTIT
        '55555555-5555-5555-5555-000000000007', -- An toàn thông tin
        'Giáo trình Cơ sở An toàn Thông tin & Mật mã học (2018)',
        'Mật mã đối xứng DES/AES, mã hóa bất đối xứng RSA, hàm băm SHA, chữ ký số và giao thức xác thực bảo mật.',
        'Giáo trình cốt lõi cho các bạn quan tâm đến an toàn thông tin và bảo mật mạng.',
        'Giáo trình',
        '2024-2025',
        'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        '/dns4/sg1.dedocu.eth',
        '/dataset/CongNgheThongTin/AnToanThongTin/GiaoTrinh/GiaoTrinh_CoSoAnToanThongTin_PTIT.pdf',
        7646000, 150, 3, TRUE, 10,
        0, 0, 1150, 310, 0, 'PUBLISHED'
    ),
    -- 4. Tác giả: Huy Phát (DevOps) - REAL-MATH-001
    (
        '77777777-7777-7777-7777-000000000004',
        '40000000-0000-0000-0000-000000000001', -- Huy Phát
        '22222222-2222-2222-2222-222222222222', -- HUST
        '55555555-5555-5555-5555-000000000008', -- Giải tích 1
        'Giáo trình Giải tích Hàm một biến số (Calculus)',
        'Giới hạn hàm số, phép tính vi phân, tích phân bất định, tích phân suy rộng và chuỗi số vô hạn.',
        'Giáo trình nền tảng toán cao cấp dành cho khối ngành kỹ thuật công nghệ.',
        'Giáo trình',
        '2024-2025',
        'QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbduk34GLiE2KcgLj',
        '/dns4/vn1.dedocu.io',
        '/dataset/KhoaHocTuNhien/ToanHoc/GiaoTrinh/GiaoTrinh_GiaiTich1_ToanPhan.pdf',
        5210000, 150, 3, TRUE, 10,
        0, 0, 890, 215, 0, 'PUBLISHED'
    ),
    -- 5. Tác giả: Quý (Fullstack) - REAL-IT-002
    (
        '77777777-7777-7777-7777-000000000005',
        '50000000-0000-0000-0000-000000000001', -- Quý
        '55555555-5555-5555-5555-111111111111', -- PTIT
        '55555555-5555-5555-5555-000000000004', -- Lập trình hướng đối tượng
        'Tuyển tập Bài tập Kỹ thuật Lập trình Hướng đối tượng',
        'Hệ thống bài tập thực hành thiết kế lớp, nạp chồng toán tử, kế thừa và áp dụng Design Pattern căn bản.',
        'Bộ bài tập kèm lời giải mẫu giúp tự học và chuẩn bị trước khi vào phòng thực hành lab.',
        'Bài tập',
        '2024-2025',
        'QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1KsDwUuaWo',
        '/dns4/sg1.dedocu.eth',
        '/dataset/CongNgheThongTin/LapTrinh_OOP/BaiTap/BaiTap_KyThuatLapTrinhHuongDoiTuong_PTIT.pdf',
        1621000, 150, 3, FALSE, 0,
        0, 0, 1340, 410, 0, 'PUBLISHED'
    ),
    -- 6. Tác giả ngoài: Minh Anh (NEU)
    (
        '77777777-7777-7777-7777-000000000006',
        '66666666-6666-6666-6666-000000000002', -- Minh Anh
        '11111111-1111-1111-1111-111111111111', -- NEU
        '55555555-5555-5555-5555-000000000001', -- Kinh tế vi mô
        'Cung, cầu và cân bằng thị trường',
        'Hệ thống các khái niệm nền tảng, cách xác định điểm cân bằng và bài tập dịch chuyển đường cung, cầu.',
        'Tóm tắt công thức trọng tâm và dạng bài tập thường gặp trong đề thi.',
        'Đề cương',
        '2024-2025',
        'QmZtmD2qtQgPrEJ5iqod3nnUchusLiAm99nnzNVnW39Mount',
        '/dns4/sg1.dedocu.eth',
        '/dataset/KinhTe_TaiChinh/KinhTeViMo/CungCau_CanBangThiTruong.pdf',
        850000, 25, 3, FALSE, 0,
        0, 0, 760, 195, 0, 'PUBLISHED'
    )
ON CONFLICT DO NOTHING;

-- Tương tác Likes (Trigger trg_document_like tự động cập nhật like_count)
INSERT INTO document_likes (user_id, document_id)
VALUES 
    -- Likes cho tài liệu OOP của Âu Dương Tấn
    ('20000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001'), -- Trần Minh Tấn
    ('30000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001'), -- Anh Pha
    ('40000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001'), -- Huy Phát
    ('50000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001'), -- Quý
    ('66666666-6666-6666-6666-000000000001', '77777777-7777-7777-7777-000000000001'), -- Lan Chi
    
    -- Likes cho tài liệu Hệ điều hành của Trần Minh Tấn
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000002'), -- Âu Dương Tấn
    ('30000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000002'), -- Anh Pha
    ('40000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000002'), -- Huy Phát
    
    -- Likes cho tài liệu An toàn thông tin của Anh Pha
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000003'), -- Âu Dương Tấn
    ('20000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000003'), -- Trần Minh Tấn
    ('50000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000003'), -- Quý

    -- Likes cho tài liệu Giải tích của Huy Phát
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000004'),
    ('66666666-6666-6666-6666-000000000002', '77777777-7777-7777-7777-000000000004'),

    -- Likes cho tài liệu Bài tập OOP của Quý
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000005'),
    ('20000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000005')
ON CONFLICT (user_id, document_id) DO NOTHING;

-- Tương tác Comments (Trigger trg_document_comment tự động cập nhật comment_count và sinh notification)
INSERT INTO document_comments (id, user_id, document_id, page_number, content)
VALUES 
    (
        'aaaaaaa1-1111-1111-1111-000000000001',
        '20000000-0000-0000-0000-000000000001', -- Trần Minh Tấn
        '77777777-7777-7777-7777-000000000001', -- OOP
        15,
        'Slide tổng hợp rất rõ ràng, đặc biệt phần tính Đa hình (Polymorphism) và Virtual Table rất dễ hiểu!'
    ),
    (
        'aaaaaaa1-1111-1111-1111-000000000002',
        '10000000-0000-0000-0000-000000000001', -- Âu Dương Tấn phản hồi
        '77777777-7777-7777-7777-000000000001',
        15,
        'Cảm ơn Minh Tấn! Mình sắp bổ sung thêm phần Interface và Smart Pointers trong C++17 nữa nhé.'
    ),
    (
        'aaaaaaa1-1111-1111-1111-000000000003',
        '30000000-0000-0000-0000-000000000001', -- Anh Pha
        '77777777-7777-7777-7777-000000000002', -- Hệ điều hành
        28,
        'Phần kiến trúc an toàn Linux Kernel và cơ chế phân quyền SELinux trình bày rất bài bản.'
    ),
    (
        'aaaaaaa1-1111-1111-1111-000000000004',
        '50000000-0000-0000-0000-000000000001', -- Quý
        '77777777-7777-7777-7777-000000000003', -- An toàn thông tin
        45,
        'Thuật toán RSA và chữ ký số được minh họa bằng các bước toán học rất chi tiết.'
    )
ON CONFLICT DO NOTHING;

-- Đánh dấu tài liệu (Bookmarks - Lưu trữ để xem lại)
INSERT INTO document_bookmarks (user_id, document_id)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000002'),
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000003'),
    ('20000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001'),
    ('30000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001'),
    ('40000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001'),
    ('50000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001')
ON CONFLICT (user_id, document_id, collection_name) DO NOTHING;

-- Dữ liệu giao dịch mở khóa tài liệu mẫu (Freemium Unlock)
INSERT INTO user_unlocked_documents (user_id, document_id, points_spent)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001', 15),
    ('30000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001', 15),
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000002', 12),
    ('50000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001', 15)
ON CONFLICT (user_id, document_id) DO NOTHING;


