-- ==============================================================================
-- DỰ ÁN: MẠNG XÃ HỘI CHIA SẺ TÀI LIỆU HỌC THUẬT PHI TẬP TRUNG (DeDocu Commons)
-- MICROSERVICE: USER SERVICE (Java Spring Boot 3 - Port 8081)
-- FLYWAY MIGRATION: V1__init_user_schema.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG TRƯỜNG ĐẠI HỌC (Dùng cho thông tin học tập của User)
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,            -- NEU, HUST, FTU, UEH
    name VARCHAR(255) NOT NULL,                  -- Đại học Bách khoa Hà Nội
    city VARCHAR(100) DEFAULT 'Hà Nội',
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG NGƯỜI DÙNG & HỒ SƠ HỌC THUẬT
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,       -- @lanchi, @minhanh
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(500) DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar',
    avatar_text VARCHAR(10) DEFAULT 'ST',        -- 'LC', 'MA' hiển thị trên UI
    bio TEXT,
    major VARCHAR(150),                          -- 'Khoa học Máy tính', 'Kinh tế Quốc tế'
    scholar_title VARCHAR(100) DEFAULT 'Scholar Node', -- 'Huyền thoại', 'Cao thủ', 'Chuyên gia'
    wallet_address VARCHAR(100),                 -- Định danh Web3
    
    -- Thống kê xã hội & Điểm uy tín
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    reputation_points INT DEFAULT 0,
    upload_points_balance INT DEFAULT 20,
    total_uploads INT DEFAULT 0,
    total_likes_received INT DEFAULT 0,
    total_quizzes_completed INT DEFAULT 0,
    
    -- Phân quyền
    role VARCHAR(30) DEFAULT 'USER',             -- 'USER', 'VIP', 'ADMIN'
    status VARCHAR(30) DEFAULT 'ACTIVE',
    
    -- Phương thức xác thực & Kích hoạt tài khoản
    auth_provider VARCHAR(50) DEFAULT 'LOCAL',   -- 'LOCAL', 'GOOGLE'
    provider_id VARCHAR(255),                    -- Google Subject ID
    is_verified BOOLEAN DEFAULT FALSE,           -- Đã xác minh Email OTP chưa
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG MÃ XÁC THỰC EMAIL OTP (Kích hoạt tài khoản & Quên mật khẩu)
CREATE TABLE IF NOT EXISTS user_verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) DEFAULT 'ACCOUNT_ACTIVATION', -- 'ACCOUNT_ACTIVATION', 'PASSWORD_RESET'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_verif_user_code ON user_verification_codes(user_id, code);

-- 4. BẢNG HUY HIỆU HỌC THUẬT
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,            -- 'IPFS_GENESIS', 'TOP_1_CONTRIBUTOR'
    name VARCHAR(150) NOT NULL,
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

-- 5. BẢNG THEO DÕI (FOLLOWS)
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT chk_not_self_follow CHECK (follower_id <> following_id)
);

-- 6. TRIGGER TỰ ĐỘNG CẬP NHẬT FOLLOWER / FOLLOWING COUNT
CREATE OR REPLACE FUNCTION func_handle_user_follow()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_follow ON user_follows;
CREATE TRIGGER trg_user_follow
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION func_handle_user_follow();

-- 7. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHO USER SERVICE)
INSERT INTO universities (id, code, name, city, logo_url) 
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'NEU', 'Đại học Kinh tế Quốc dân', 'Hà Nội', 'https://upload.wikimedia.org/wikipedia/vi/8/8c/Logo_Đại_học_Kinh_tế_Quốc_dân.svg'),
    ('22222222-2222-2222-2222-222222222222', 'HUST', 'Đại học Bách khoa Hà Nội', 'Hà Nội', 'https://upload.wikimedia.org/wikipedia/vi/a/a1/Logo_Hust.png'),
    ('33333333-3333-3333-3333-333333333333', 'FTU', 'Trường Đại học Ngoại thương', 'Hà Nội', 'https://upload.wikimedia.org/wikipedia/vi/6/6c/Logo_FTU.png'),
    ('44444444-4444-4444-4444-444444444444', 'UEH', 'Đại học Kinh tế TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'https://upload.wikimedia.org/wikipedia/commons/2/25/Logo_UEH_xanh.png'),
    ('55555555-5555-5555-5555-111111111111', 'PTIT', 'Học viện Công nghệ Bưu chính Viễn thông', 'Hà Nội', 'https://portal.ptit.edu.vn/wp-content/uploads/2016/04/Logo-PTIT.jpg')
ON CONFLICT (code) DO NOTHING;

INSERT INTO badges (id, code, name, description, icon_url)
VALUES
    ('88888888-8888-8888-8888-000000000001', 'GENESIS_LEADER', 'Nhà sáng lập Mạng DeDocu', 'Vinh danh người sáng lập và định hướng mạng chia sẻ tài liệu học thuật phi tập trung.', 'https://api.dicebear.com/7.x/identicon/svg?seed=leader'),
    ('88888888-8888-8888-8888-000000000002', 'CORE_ARCHITECT', 'Kiến trúc sư Cốt lõi', 'Vinh danh thành viên kiến tạo kiến trúc hệ thống Microservices & Database.', 'https://api.dicebear.com/7.x/identicon/svg?seed=architect'),
    ('88888888-8888-8888-8888-000000000003', 'AI_PIONEER', 'Tiên phong Trí tuệ Nhân tạo', 'Tích hợp thành công mô hình học tập thông minh RAG, Quiz và Gợi ý học tập.', 'https://api.dicebear.com/7.x/identicon/svg?seed=ai'),
    ('88888888-8888-8888-8888-000000000004', 'DEVOPS_MASTER', 'Bậc thầy Hạ tầng', 'Thiết lập cụm Docker, mạng phân tán IPFS và quy trình triển khai CI/CD chuẩn mực.', 'https://api.dicebear.com/7.x/identicon/svg?seed=devops'),
    ('88888888-8888-8888-8888-000000000005', 'TOP_CONTRIBUTOR', 'Học giả Cống hiến Hàng đầu', 'Đạt mốc chia sẻ tài liệu chất lượng cao nhận được nhiều lượt tải và yêu thích.', 'https://api.dicebear.com/7.x/identicon/svg?seed=contributor')
ON CONFLICT (code) DO NOTHING;

-- 10 Tài khoản thành viên
INSERT INTO users (
    id, university_id, email, username, password_hash, full_name, avatar_text, bio, major,
    scholar_title, reputation_points, upload_points_balance, total_uploads, total_likes_received, follower_count, following_count, role, auth_provider, is_verified
)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'tan.auduong@dedocu.vn', 'auduongtan', crypt('Password@123', gen_salt('bf', 10)), 'Âu Dương Tấn', 'AT', 'Trưởng nhóm DeDocu. Định hướng kiến trúc phân tán & Web3.', 'Khoa học Máy tính', 'Trưởng nhóm', 150, 500, 12, 98, 0, 0, 'USER', 'LOCAL', TRUE),
    ('10000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'admin.tan@dedocu.vn', 'admin_auduongtan', crypt('Password@123', gen_salt('bf', 10)), 'Âu Dương Tấn (Admin)', 'AD', 'Quản trị viên hệ thống mạng học thuật DeDocu.', 'Quản trị Hệ thống', 'Quản trị viên', 999, 9999, 0, 0, 0, 0, 'ADMIN', 'LOCAL', TRUE),
    ('20000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'tan.tranminh@dedocu.vn', 'tranminhtan', crypt('Password@123', gen_salt('bf', 10)), 'Trần Minh Tấn', 'MT', 'Phó nhóm DeDocu. Phụ trách Kiến trúc Microservices & Database.', 'Kỹ thuật Phần mềm', 'Phó nhóm', 130, 450, 9, 76, 0, 0, 'USER', 'LOCAL', TRUE),
    ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'admin.minhtan@dedocu.vn', 'admin_tranminhtan', crypt('Password@123', gen_salt('bf', 10)), 'Trần Minh Tấn (Admin)', 'AD', 'Quản trị viên hệ thống mạng học thuật DeDocu.', 'Quản trị Hệ thống', 'Quản trị viên', 999, 9999, 0, 0, 0, 0, 'ADMIN', 'LOCAL', TRUE),
    ('30000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'pha.anh@dedocu.vn', 'anhpha', crypt('Password@123', gen_salt('bf', 10)), 'Anh Pha', 'AP', 'Kỹ sư AI DeDocu. Phụ trách RAG, Trắc nghiệm AI & Recommendation.', 'Trí tuệ Nhân tạo', 'Chuyên gia AI', 110, 380, 7, 62, 0, 0, 'USER', 'LOCAL', TRUE),
    ('30000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'admin.pha@dedocu.vn', 'admin_anhpha', crypt('Password@123', gen_salt('bf', 10)), 'Anh Pha (Admin)', 'AD', 'Quản trị viên hệ thống mạng học thuật DeDocu.', 'Quản trị Hệ thống', 'Quản trị viên', 999, 9999, 0, 0, 0, 0, 'ADMIN', 'LOCAL', TRUE),
    ('40000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'phat.huy@dedocu.vn', 'huyphat', crypt('Password@123', gen_salt('bf', 10)), 'Huy Phát', 'HP', 'Kỹ sư DevOps DeDocu. Phụ trách Docker, IPFS Clusters & CI/CD.', 'Mạng Máy tính', 'Chuyên gia DevOps', 105, 350, 6, 54, 0, 0, 'USER', 'LOCAL', TRUE),
    ('40000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'admin.phat@dedocu.vn', 'admin_huyphat', crypt('Password@123', gen_salt('bf', 10)), 'Huy Phát (Admin)', 'AD', 'Quản trị viên hệ thống mạng học thuật DeDocu.', 'Quản trị Hệ thống', 'Quản trị viên', 999, 9999, 0, 0, 0, 0, 'ADMIN', 'LOCAL', TRUE),
    ('50000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'quy@dedocu.vn', 'quy', crypt('Password@123', gen_salt('bf', 10)), 'Quý', 'QU', 'Kỹ sư Fullstack DeDocu. Phụ trách Giao diện người dùng & Social Feeds.', 'Hệ thống Thông tin', 'Chuyên gia UI/UX', 95, 300, 5, 48, 0, 0, 'USER', 'LOCAL', TRUE),
    ('50000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'admin.quy@dedocu.vn', 'admin_quy', crypt('Password@123', gen_salt('bf', 10)), 'Quý (Admin)', 'AD', 'Quản trị viên hệ thống mạng học thuật DeDocu.', 'Quản trị Hệ thống', 'Quản trị viên', 999, 9999, 0, 0, 0, 0, 'ADMIN', 'LOCAL', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_badges (user_id, badge_id)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-000000000001'),
    ('20000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-000000000002'),
    ('30000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-000000000003'),
    ('40000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-000000000004'),
    ('50000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-000000000005')
ON CONFLICT (user_id, badge_id) DO NOTHING;
