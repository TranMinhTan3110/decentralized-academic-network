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


