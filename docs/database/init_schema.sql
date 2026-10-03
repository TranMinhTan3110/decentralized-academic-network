-- ==============================================================================
-- DỰ ÁN: MẠNG XÃ HỘI CHIA SẺ TÀI LIỆU HỌC THUẬT PHI TẬP TRUNG (DeDocu Commons)
-- HỆ THỐNG CƠ SỞ DỮ LIỆU ĐẦY ĐỦ KHỚP 100% VỚI BẢN VẼ GIAO DIỆN FIGMA UI
-- File: init_schema.sql
-- Thư mục: preProject/
-- Phiên bản: v2.5 (Bổ sung AI Quiz, Admin Moderation, Badges & Recent Activities)
-- ==============================================================================

-- 1. BẬT CÁC EXTENSION CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Sinh UUID ngẫu nhiên v4
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Tìm kiếm gần đúng tiếng Việt (Trigram fuzzy search)
-- CREATE EXTENSION IF NOT EXISTS "vector";      -- Bật nếu dùng pgvector cho AI Vector Embedding

-- ==============================================================================
-- 2. TẠO CÁC BẢNG DANH MỤC TRƯỜNG HỌC & MÔN HỌC (ACADEMIC TAXONOMY)
-- ==============================================================================

-- Bảng Trường Đại học (Universities - Hiển thị trong Chip filter & Bảng xếp hạng trường)
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,            -- PTIT, HUST, VNU, UEH, FTU
    name VARCHAR(255) NOT NULL,                  -- Đại học Bách Khoa Hà Nội
    logo_url VARCHAR(500),
    description TEXT,
    total_documents_count INT DEFAULT 0,         -- Thống kê hiển thị trên Leaderboard trường
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Khoa / Viện (Faculties)
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,                  -- Khoa Công nghệ Thông tin
    code VARCHAR(50),                            -- CNTT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Môn học (Courses)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,                   -- INT1332, CS201
    name VARCHAR(255) NOT NULL,                  -- Lập trình mạng, Cấu trúc dữ liệu
    semester VARCHAR(20),                        -- Học kỳ 1, Học kỳ 2
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_course_code_faculty UNIQUE (faculty_id, code)
);

-- ==============================================================================
-- 3. TẠO BẢNG NGƯỜI DÙNG & HỒ SƠ HỌC THUẬT (USERS & SCHOLAR PROFILES)
-- Khớp với màn hình [Của tôi / Profile] & [Vinh danh Bảng xếp hạng]
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,       -- @an_ptit, @hoang_dev
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(500) DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar',
    bio TEXT,                                    -- Tiểu sử học thuật
    
    -- Danh hiệu & Node IPFS (Hiển thị trong UI Profile & Header)
    scholar_title VARCHAR(100) DEFAULT 'Scholar Node', -- 'Scholar Node', 'Peer Reviewer', 'Genesis Contributor'
    wallet_address VARCHAR(100),                 -- Định danh Web3 mẫu: '0x71C...4b9' hiển thị trên UI
    
    -- Gamification & Bảng xếp hạng
    reputation_points INT DEFAULT 0,             -- Điểm danh tiếng (Dùng xếp hạng Hall of Fame)
    upload_points_balance INT DEFAULT 20,        -- Số dư điểm mở tài liệu (Tặng 20 điểm khởi tạo)
    total_uploads INT DEFAULT 0,                 -- Tổng số tài liệu đã đăng
    total_likes_received INT DEFAULT 0,          -- Tổng số tim nhận được từ cộng đồng
    total_quizzes_completed INT DEFAULT 0,       -- Tổng số bài thi thử AI đã hoàn thành
    
    -- Phân quyền & Trạng thái (Quản trị Admin)
    role VARCHAR(30) DEFAULT 'USER',             -- 'USER', 'VIP', 'MODERATOR', 'ADMIN'
    status VARCHAR(30) DEFAULT 'ACTIVE',         -- 'ACTIVE', 'BANNED', 'SUSPENDED'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Huy hiệu Học thuật (Scholar Badges - Hiển thị trong trang Profile cá nhân)
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,            -- 'IPFS_GENESIS', 'TOP_1_CONTRIBUTOR', 'QUIZ_MASTER'
    name VARCHAR(150) NOT NULL,                  -- 'IPFS Scholar Genesis'
    description TEXT,
    icon_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);

-- Bảng Theo dõi lẫn nhau (Follows)
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT chk_not_self_follow CHECK (follower_id <> following_id)
);

-- ==============================================================================
-- 4. BẢNG BÀI ĐĂNG TÀI LIỆU (DOCUMENTS / POSTS)
-- Khớp với màn hình [Khám phá Feed] & [Publishing Studio]
-- ==============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Người đăng
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,     -- Môn học
    
    -- Nội dung bài chia sẻ mạng xã hội
    title VARCHAR(255) NOT NULL,                 -- Tiêu đề tài liệu
    caption TEXT,                                -- Lời tâm sự / tips ôn thi của người đăng
    doc_type VARCHAR(50) NOT NULL DEFAULT 'SLIDE', -- 'SLIDE', 'EXAM_TEST', 'TEXTBOOK', 'LAB_ASSIGNMENT', 'NOTE'
    academic_year INT,                           -- Năm học: 2024
    semester VARCHAR(20),                        -- Học kỳ 1, 2
    
    -- Lưu trữ phi tập trung & File
    ipfs_cid VARCHAR(255) NOT NULL,              -- Mã CID băm từ IPFS (Qm...)
    storage_node_peer VARCHAR(150),              -- Ví dụ: '/dns4/sg1.dedocu.eth' hiển thị trên UI
    file_url VARCHAR(500),                       -- Gateway URL dự phòng (MinIO / Pinata)
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    file_extension VARCHAR(10) DEFAULT 'pdf',
    thumbnail_url VARCHAR(500),                  -- Ảnh trang bìa render từ Canvas
    total_pages INT NOT NULL DEFAULT 1,
    
    -- Mô hình Freemium StuDocu
    free_pages INT NOT NULL DEFAULT 3,           -- Xem thử miễn phí 3 trang đầu
    is_blur_locked BOOLEAN NOT NULL DEFAULT TRUE,-- Khóa làm mờ từ trang thứ 4
    unlock_points_required INT NOT NULL DEFAULT 10, -- 10 điểm để mở khóa xem toàn bộ
    
    -- Trạng thái duyệt (Khớp với Hàng đợi Kiểm duyệt Admin)
    status VARCHAR(30) DEFAULT 'PUBLISHED',      -- 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'FLAGGED'
    
    -- Bộ đếm tương tác (Denormalized Counters)
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    bookmark_count INT DEFAULT 0,
    quiz_generated_count INT DEFAULT 0,          -- Số lần tài liệu này được dùng để sinh Quiz
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. CÁC TƯƠNG TÁC MẠNG XÃ HỘI (LIKES, COMMENTS, BOOKMARKS)
-- ==============================================================================

-- Bảng Lượt Thích / Đánh Giá
CREATE TABLE IF NOT EXISTS document_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reaction_type VARCHAR(30) DEFAULT 'LIKE',    -- 'LIKE', 'LOVE', 'HELPFUL'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_document_like UNIQUE (user_id, document_id)
);

-- Bảng Bình Luận & Thảo Luận (Hỗ trợ thảo luận theo số trang tài liệu)
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES document_comments(id) ON DELETE CASCADE, -- Reply lồng nhau
    page_number INT,                             -- Thảo luận tại trang số mấy của PDF
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Bộ Sưu Tập Cá Nhân / Lưu Tài Liệu (Bookmarks & Collections)
CREATE TABLE IF NOT EXISTS document_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    collection_name VARCHAR(100) DEFAULT 'Mặc định', -- 'Ôn thi cuối kỳ', 'Bộ đề hay'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_document_bookmark UNIQUE (user_id, document_id, collection_name)
);

-- Bảng Lịch Sử Mở Khóa Tài Liệu (Freemium)
CREATE TABLE IF NOT EXISTS user_unlocked_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    unlock_type VARCHAR(50) DEFAULT 'POINTS',    -- 'POINTS', 'UPLOAD_EXCHANGE', 'VIP'
    points_spent INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_unlocked_doc UNIQUE (user_id, document_id)
);

-- ==============================================================================
-- 6. PHÂN HỆ AI QUIZ GENERATOR (KHỚP 100% VỚI MÀN HÌNH AI QUIZ TRONG UI)
-- ==============================================================================

-- Bảng Bộ Đề Thi Thử AI (AI Quizzes - Sinh tự động từ PDF)
CREATE TABLE IF NOT EXISTS ai_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,                 -- "Đề thi thử Kiến trúc máy tính - Chương 3"
    difficulty VARCHAR(30) DEFAULT 'ADVANCED',   -- 'BASIC' (Cơ bản), 'ADVANCED' (Nâng cao), 'OLYMPIC'
    format_mode VARCHAR(30) DEFAULT 'MULTIPLE_CHOICE', -- 'MULTIPLE_CHOICE' (Trắc nghiệm), 'TRUE_FALSE', 'FLASHCARD'
    total_questions INT NOT NULL DEFAULT 10,     -- 10 câu, 20 câu, 30 câu
    coverage_percent FLOAT DEFAULT 95.0,         -- "Độ phủ: 98.4% lý thuyết" hiển thị trên UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Câu Hỏi Chi Tiết Của Đề Thi AI
CREATE TABLE IF NOT EXISTS ai_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES ai_quizzes(id) ON DELETE CASCADE,
    question_index INT NOT NULL,                 -- Câu số 1, 2, 3...
    question_text TEXT NOT NULL,                 -- "Trong kiến trúc RISC-V, kỹ thuật Pipeline Hazarding..."
    options_json JSONB NOT NULL,                 -- {"A": "Data forwarding", "B": "Stall", "C": "Branch prediction", "D": "Loop unrolling"}
    correct_answer VARCHAR(10) NOT NULL,         -- 'A', 'B', 'C', hoặc 'D'
    explanation TEXT,                            -- Giải thích đáp án chi tiết
    source_page INT,                             -- Trích dẫn: Trang 14 trong tài liệu
    source_snippet TEXT,                         -- Đoạn trích dẫn ngữ cảnh nguồn từ PDF
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Lịch Sử Làm Bài Thi Thử AI (User Quiz Attempts - Hiển thị trong Tab Lịch sử gần đây)
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES ai_quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,                          -- Số câu đúng (VD: 17/20)
    total_questions INT NOT NULL,
    percentage FLOAT NOT NULL,                   -- 85.0%
    time_spent_seconds INT DEFAULT 0,            -- Thời gian làm bài (giây)
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. PHÂN HỆ QUẢN TRỊ ADMIN & KIỂM DUYỆT (ADMIN PORTAL & PEER REVIEW)
-- Khớp với màn hình [Quản trị Admin DeDocu]
-- ==============================================================================

-- Bảng Báo Cáo Vi Phạm (Bản quyền, Nội dung sai lệch, Đề thi giả mạo)
CREATE TABLE IF NOT EXISTS document_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,                -- 'COPYRIGHT_INFRINGEMENT', 'WRONG_CATEGORY', 'SPAM', 'POOR_QUALITY'
    description TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',        -- 'PENDING', 'RESOLVED_REMOVED', 'DISMISSED'
    resolved_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Giám Sát Cụm Node IPFS (Hiển thị biểu đồ băng thông & trạng thái node trên Admin Portal)
CREATE TABLE IF NOT EXISTS ipfs_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_name VARCHAR(100) NOT NULL,             -- 'Minerva_Node', 'Hoang_Dev_Node', 'PTIT_Peer_1'
    peer_multiaddr VARCHAR(255) NOT NULL,        -- '/dns4/sg1.dedocu.eth/tcp/4001/p2p/Qm...'
    status VARCHAR(30) DEFAULT 'ONLINE',         -- 'ONLINE', 'DEGRADED', 'OFFLINE'
    pinned_documents_count INT DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    bandwidth_mbps FLOAT DEFAULT 0.0,
    uptime_percentage FLOAT DEFAULT 99.9,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. THEO DÕI HOẠT ĐỘNG GẦN ĐÂY & AI RECOMMENDATION
-- Khớp với màn hình [Tài Liệu Gần Đây / Recent Activity]
-- ==============================================================================

-- Bảng Ghi Vết Hành Vi & Hoạt Động Người Dùng (Vừa xem, Thích, Làm Quiz, Lưu tài liệu)
CREATE TABLE IF NOT EXISTS user_document_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,       -- 'VIEW', 'LIKE', 'DOWNLOAD', 'QUIZ_PRACTICE', 'BOOKMARK'
    duration_seconds INT DEFAULT 0,              -- Thời gian đọc
    pages_viewed INT DEFAULT 1,                  -- Số trang đã xem
    reward_score FLOAT DEFAULT 0.0,              -- Trọng số cho thuật toán Multi-Armed Bandit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Nhật Ký Điểm Thưởng (Reputation Logs - Cơ sở tính BXH Tuần / Tháng)
CREATE TABLE IF NOT EXISTS reputation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,            -- 'UPLOAD_APPROVED', 'DOC_LIKED', 'QUIZ_EXCELLENT', 'DAILY_CHECKIN'
    points_change INT NOT NULL,                  -- +20, +5, +10, +1
    reference_id UUID,                           -- ID tài liệu hoặc quiz
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Vector Chunks & Chatbot RAG Gemini
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Hỏi đáp bài giảng AI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,                   -- 'user', 'assistant'
    content TEXT NOT NULL,
    sources_found_json JSONB,                    -- [{"page": 4, "snippet": "...", "doc_id": "..."}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. TẠO INDEX TỐI ƯU HIỆU NĂNG CHO CÁC MÀN HÌNH UI
-- ==============================================================================

-- Index cho màn hình Feed & Tìm kiếm
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON documents(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin (title gin_trgm_ops);

-- Index cho màn hình "Tài liệu gần đây" (Recent Activity Tabs)
CREATE INDEX IF NOT EXISTS idx_interactions_user_created ON user_document_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_type ON user_document_interactions(user_id, interaction_type);

-- Index cho bình luận theo trang
CREATE INDEX IF NOT EXISTS idx_comments_doc_page ON document_comments(document_id, page_number);

-- Index cho Bảng xếp hạng
CREATE INDEX IF NOT EXISTS idx_reputation_user_created ON reputation_logs(user_id, created_at DESC);

-- ==============================================================================
-- 10. TẠO VIEW CHO MÀN HÌNH BẢNG XẾP HẠNG (LEADERBOARDS)
-- ==============================================================================

-- VIEW 1: Top Học Giả Đóng Góp Mọi Thời Đại (Hall of Fame)
CREATE OR REPLACE VIEW view_leaderboard_all_time AS
SELECT 
    u.id AS user_id,
    u.username,
    u.full_name,
    u.avatar_url,
    u.scholar_title,
    uni.name AS university_name,
    u.reputation_points,
    u.total_uploads,
    u.total_likes_received,
    RANK() OVER (ORDER BY u.reputation_points DESC, u.total_likes_received DESC) AS ranking
FROM users u
LEFT JOIN universities uni ON u.university_id = uni.id
WHERE u.status = 'ACTIVE'
ORDER BY ranking ASC;

-- VIEW 2: Top Học Giả Tuần Này (Weekly Top Scholars)
CREATE OR REPLACE VIEW view_leaderboard_weekly AS
SELECT 
    u.id AS user_id,
    u.username,
    u.full_name,
    u.avatar_url,
    u.scholar_title,
    uni.name AS university_name,
    COALESCE(SUM(r.points_change), 0) AS weekly_points,
    COUNT(DISTINCT d.id) AS weekly_uploads,
    RANK() OVER (ORDER BY COALESCE(SUM(r.points_change), 0) DESC) AS weekly_ranking
FROM users u
LEFT JOIN universities uni ON u.university_id = uni.id
LEFT JOIN reputation_logs r ON u.id = r.user_id AND r.created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
LEFT JOIN documents d ON u.id = d.user_id AND d.created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
WHERE u.status = 'ACTIVE'
GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.scholar_title, uni.name
HAVING COALESCE(SUM(r.points_change), 0) > 0
ORDER BY weekly_ranking ASC;

-- VIEW 3: Top Trường Đại Học Tuần Này (Top Universities Leaderboard)
CREATE OR REPLACE VIEW view_leaderboard_universities AS
SELECT 
    uni.id AS university_id,
    uni.code,
    uni.name,
    uni.logo_url,
    COUNT(DISTINCT d.id) AS documents_uploaded_count,
    COALESCE(SUM(d.like_count), 0) AS total_likes_count,
    RANK() OVER (ORDER BY COUNT(DISTINCT d.id) DESC, COALESCE(SUM(d.like_count), 0) DESC) AS uni_rank
FROM universities uni
LEFT JOIN courses c ON c.faculty_id IN (SELECT id FROM faculties WHERE university_id = uni.id)
LEFT JOIN documents d ON d.course_id = c.id
GROUP BY uni.id, uni.code, uni.name, uni.logo_url
ORDER BY uni_rank ASC;

-- ==============================================================================
-- 11. DATABASE TRIGGERS TỰ ĐỘNG CẬP NHẬT DỮ LIỆU
-- ==============================================================================

-- Trigger tự động tăng/giảm like_count và cộng điểm uy tín cho tác giả
CREATE OR REPLACE FUNCTION func_handle_document_like()
RETURNS TRIGGER AS $$
DECLARE
    doc_author_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE documents SET like_count = like_count + 1 WHERE id = NEW.document_id RETURNING user_id INTO doc_author_id;
        UPDATE users 
        SET total_likes_received = total_likes_received + 1,
            reputation_points = reputation_points + 5,
            upload_points_balance = upload_points_balance + 2
        WHERE id = doc_author_id;
        
        INSERT INTO reputation_logs (user_id, action_type, points_change, reference_id, description)
        VALUES (doc_author_id, 'DOC_LIKED', 5, NEW.document_id, 'Tài liệu nhận được 1 lượt thích mới');
        
        -- Ghi nhận luôn vào hoạt động gần đây
        INSERT INTO user_document_interactions (user_id, document_id, interaction_type)
        VALUES (NEW.user_id, NEW.document_id, 'LIKE');
        
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE documents SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.document_id RETURNING user_id INTO doc_author_id;
        UPDATE users SET total_likes_received = GREATEST(total_likes_received - 1, 0) WHERE id = doc_author_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_like ON document_likes;
CREATE TRIGGER trg_document_like
AFTER INSERT OR DELETE ON document_likes
FOR EACH ROW EXECUTE FUNCTION func_handle_document_like();

-- Trigger tự động cập nhật số bình luận
CREATE OR REPLACE FUNCTION func_handle_document_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE documents SET comment_count = comment_count + 1 WHERE id = NEW.document_id;
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

-- ==============================================================================
-- 12. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA ĐỂ TEST ĐƯỢC TOÀN BỘ CÁC MÀN HÌNH UI)
-- ==============================================================================

-- 1. Thêm trường học mẫu
INSERT INTO universities (id, code, name, logo_url) 
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'BKHN', 'Đại học Bách Khoa Hà Nội', 'https://upload.wikimedia.org/wikipedia/vi/a/a1/Logo_Hust.png'),
    ('22222222-2222-2222-2222-222222222222', 'PTIT', 'Học viện Công nghệ Bưu chính Viễn thông', 'https://upload.wikimedia.org/wikipedia/vi/thumb/1/1a/Logo_PTIT.svg/1200px-Logo_PTIT.svg.png'),
    ('33333333-3333-3333-3333-333333333333', 'UEH', 'Đại học Kinh Tế TP.HCM', 'https://upload.wikimedia.org/wikipedia/commons/2/25/Logo_UEH_xanh.png')
ON CONFLICT (code) DO NOTHING;

-- 2. Thêm khoa & môn học
INSERT INTO faculties (id, university_id, code, name)
VALUES ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'SOICT', 'Trường Công nghệ Thông tin & Truyền thông')
ON CONFLICT DO NOTHING;

INSERT INTO courses (id, faculty_id, code, name, semester)
VALUES ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'IT3030', 'Kiến trúc máy tính', 'Học kỳ 1')
ON CONFLICT DO NOTHING;

-- 3. Thêm học giả mẫu (Khớp với UI: Minh Hoàng BKHN, Minh Trần)
INSERT INTO users (id, university_id, faculty_id, email, username, password_hash, full_name, scholar_title, wallet_address, reputation_points, upload_points_balance, role)
VALUES 
    ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'hoang.bkhn@gmail.com', 'hoang_dev', '$2a$10$dummyhash', 'Minh Hoàng (BKHN)', 'Top 1 Học Giả', '0x71C...4b9', 485, 120, 'USER'),
    ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'minh.tran@gmail.com', 'minh_tran', '$2a$10$dummyhash', 'Minh Tran', 'Peer Reviewer', '0x94B...21f', 390, 80, 'USER')
ON CONFLICT (email) DO NOTHING;

-- 4. Thêm bài đăng tài liệu mẫu
INSERT INTO documents (
    id, user_id, course_id, title, caption, doc_type, academic_year, semester,
    ipfs_cid, storage_node_peer, total_pages, free_pages, is_blur_locked, unlock_points_required, status
)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555555',
    'Slide Bài Giảng Kiến Trúc Máy Tính - Chương 3: Pipeline & Bộ Nhớ Cache',
    'Tổng hợp đầy đủ bài tập Pipeline Hazarding và cách tính chu kỳ xung nhịp CPI. Kèm phân tích bài toán Cache Direct Mapped và Set Associative có ví dụ cụ thể.',
    'SLIDE',
    2024,
    'Học kỳ 1',
    'QmZtmD2qtQgPrEJ5iqod3nnUchusLiAm99nnzNVnW39Mount',
    '/dns4/sg1.dedocu.eth',
    38,
    3,
    TRUE,
    10,
    'PUBLISHED'
)
ON CONFLICT DO NOTHING;

-- 5. Thêm đề thi thử AI mẫu (Khớp với UI màn hình AI Quiz)
INSERT INTO ai_quizzes (id, document_id, creator_user_id, title, difficulty, format_mode, total_questions, coverage_percent)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    '88888888-8888-8888-8888-888888888888',
    '66666666-6666-6666-6666-666666666666',
    'Bộ Câu Hỏi Ôn Tập Kiến Trúc Máy Tính & Vi Xử Lý',
    'ADVANCED',
    'MULTIPLE_CHOICE',
    20,
    98.4
)
ON CONFLICT DO NOTHING;

-- 6. Thêm câu hỏi trắc nghiệm mẫu
INSERT INTO ai_quiz_questions (quiz_id, question_index, question_text, options_json, correct_answer, explanation, source_page, source_snippet)
VALUES (
    '99999999-9999-9999-9999-999999999999',
    4,
    'Trong kỹ thuật Pipeline Hazarding của CPU RISC-V, giải pháp nào sau đây giúp loại bỏ xung đột dữ liệu (Data Hazard) mà KHÔNG làm chậm chu kỳ thực thi?',
    '{"A": "Stall pipeline (Chèn bong bóng NOP)", "B": "Forwarding / Bypassing (Chuyển tiếp dữ liệu trực tiếp)", "C": "Branch Prediction (Dự đoán rẽ nhánh)", "D": "Giảm xung nhịp Clock"}'::jsonb,
    'B',
    'Kỹ thuật Data Forwarding (Bypassing) dẫn trực tiếp kết quả từ đầu ra của tầng ALU (EX/MEM) về đầu vào của tầng ALU ở lệnh kế tiếp, không cần ghi về Register File rồi mới đọc lại.',
    14,
    'Pipeline Data Forwarding resolves RAW hazard without inserting stall cycles.'
)
ON CONFLICT DO NOTHING;

-- 7. Thêm Node IPFS mẫu cho Admin Portal
INSERT INTO ipfs_nodes (node_name, peer_multiaddr, status, pinned_documents_count, storage_used_bytes, bandwidth_mbps, uptime_percentage)
VALUES 
    ('Minerva_Node', '/dns4/sg1.dedocu.eth/tcp/4001/p2p/12D3KooWR7...', 'ONLINE', 4250, 107374182400, 128.5, 99.98),
    ('Hoang_Dev_Node', '/dns4/vn1.dedocu.io/tcp/4001/p2p/12D3KooWB9...', 'ONLINE', 1200, 32212254720, 45.2, 99.85)
ON CONFLICT DO NOTHING;
