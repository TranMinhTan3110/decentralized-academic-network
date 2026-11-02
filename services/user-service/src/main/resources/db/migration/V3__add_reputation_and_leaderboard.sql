-- ==============================================================================
-- V3: HỆ THỐNG TÍNH ĐIỂM HỌC THUẬT, HUY HIỆU & BẢNG XẾP HẠNG (REPUTATION & LEADERBOARD)
-- Chuẩn hóa theo QUY_CHE_TINH_DIEM_VA_XEP_HANG.md
-- ==============================================================================

-- 1. Đảm bảo cột avatar_url hỗ trợ chuỗi dài (URL hoặc ảnh Base64)
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;

-- 2. Tạo bảng nhật ký điểm danh tiếng (reputation_logs) phục vụ BXH Tuần / Tháng / Toàn thời gian
CREATE TABLE IF NOT EXISTS reputation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    points INT NOT NULL,
    reference_id VARCHAR(100),
    description VARCHAR(255),
    idempotency_key VARCHAR(120) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reputation_logs_user_created ON reputation_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reputation_logs_created_at ON reputation_logs(created_at DESC);

-- 3. Bổ sung đầy đủ 9 Huy hiệu Học thuật chuẩn theo Quy chế Tính điểm & Xếp hạng
INSERT INTO badges (id, code, name, description, icon_url)
VALUES
    ('88888888-8888-8888-8888-000000000011', 'FIRST_UPLOAD', 'Người Tiên Phong', 'Đã đăng tải tài liệu học thuật đầu tiên lên mạng lưới phi tập trung IPFS.', 'https://api.dicebear.com/7.x/identicon/svg?seed=first_upload'),
    ('88888888-8888-8888-8888-000000000012', 'ACTIVE_CONTRIBUTOR', 'Nhà Đóng Góp Tích Cực', 'Đã chia sẻ từ 10 tài liệu học thuật chất lượng cao cho cộng đồng.', 'https://api.dicebear.com/7.x/identicon/svg?seed=active_contributor'),
    ('88888888-8888-8888-8888-000000000013', 'EXCELLENT_DOC', 'Tài Liệu Xuất Sắc', 'Sở hữu tài liệu nhận được từ 50 lượt Thả tim từ sinh viên toàn quốc.', 'https://api.dicebear.com/7.x/identicon/svg?seed=excellent_doc'),
    ('88888888-8888-8888-8888-000000000014', 'TOP_AUTHOR_2025', 'Tác Giả Nổi Bật 2025', 'Tác giả có đóng góp học thuật xuất sắc với từ 5 tài liệu hoặc 200 điểm uy tín.', 'https://api.dicebear.com/7.x/identicon/svg?seed=top_author_2025'),
    ('88888888-8888-8888-8888-000000000015', 'REPUTATION_500', 'Học Giả Uy Tín', 'Đạt mốc 500 điểm danh tiếng học thuật trên hệ thống DeDocu.', 'https://api.dicebear.com/7.x/identicon/svg?seed=reputation_500'),
    ('88888888-8888-8888-8888-000000000016', 'REPUTATION_1500', 'Huyền Thoại Học Thuật', 'Đạt mốc 1500 điểm danh tiếng học thuật — cấp bậc vinh danh cao nhất.', 'https://api.dicebear.com/7.x/identicon/svg?seed=reputation_1500'),
    ('88888888-8888-8888-8888-000000000017', 'QUIZ_MASTER', 'Chiến Thần Trắc Nghiệm', 'Hoàn thành xuất sắc từ 10 bài thi trắc nghiệm AI trên hệ thống.', 'https://api.dicebear.com/7.x/identicon/svg?seed=quiz_master'),
    ('88888888-8888-8888-8888-000000000018', 'TOP_REVIEWER', 'Nhà Phản Biện Học Thuật', 'Tích cực đánh giá chất lượng tài liệu và đóng góp ý kiến chuyên môn.', 'https://api.dicebear.com/7.x/identicon/svg?seed=top_reviewer'),
    ('88888888-8888-8888-8888-000000000001', 'GENESIS_LEADER', 'Học Giả Kết Nối', 'Có sức ảnh hưởng lớn trong cộng đồng với từ 100 người theo dõi trở lên.', 'https://api.dicebear.com/7.x/identicon/svg?seed=leader')
ON CONFLICT (code) DO NOTHING;

-- 4. Đồng bộ điểm khởi tạo vào reputation_logs cho các tài khoản hiện có để BXH Tuần/Tháng có dữ liệu ngay
INSERT INTO reputation_logs (user_id, action_type, points, description, idempotency_key, created_at)
SELECT
    id,
    'INITIAL_SYNC',
    reputation_points,
    'Đồng bộ điểm danh tiếng học thuật khởi tạo',
    'init-sync-' || id::text,
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users
WHERE status = 'ACTIVE' AND role <> 'ADMIN' AND reputation_points > 0
ON CONFLICT (idempotency_key) DO NOTHING;

-- 5. Cập nhật Avatar đa dạng, rõ nét theo seed username (DiceBear Avatars) cho các tài khoản chưa có avatar cá nhân
UPDATE users
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || username
WHERE avatar_url IS NULL 
   OR avatar_url = '' 
   OR avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scholar';


