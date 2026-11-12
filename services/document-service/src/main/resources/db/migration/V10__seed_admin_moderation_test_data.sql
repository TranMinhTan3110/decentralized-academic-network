-- V10: Seed dữ liệu mẫu cho Quản trị viên (Admin Moderation & Reports & Stats)
-- ============================================================================
-- Dữ liệu này phục vụ test trực tiếp các API Admin:
-- 1. GET /api/v1/admin/reports (Báo cáo vi phạm PENDING)
-- 2. PUT /api/v1/admin/documents/{id}/moderate (Duyệt hoặc gỡ bài)
-- 3. GET /api/v1/admin/documents (Danh sách bài đăng phân trang, tìm kiếm)
-- 4. DELETE /api/v1/admin/documents/{id} (Gỡ bài đăng)
-- 5. GET /api/v1/admin/documents/stats (Thống kê Dashboard)
-- ============================================================================

-- 1. Seed danh sách tài liệu mẫu
INSERT INTO documents (
    id, user_id, university_id, course_id,
    title, description, caption, doc_type, academic_year, semester,
    ipfs_cid, storage_node_peer, file_url, file_size_bytes, file_extension,
    thumbnail_url, total_pages, free_pages, is_blur_locked, unlock_points_required,
    status, like_count, comment_count, view_count, download_count, bookmark_count,
    created_at, updated_at
)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    (SELECT id FROM universities WHERE code = 'NEU' LIMIT 1),
    (SELECT id FROM courses LIMIT 1),
    'Giáo trình Kinh tế vi mô (bản scan nguyên cuốn)',
    'Tài liệu tham khảo kinh tế học vi mô dành cho sinh viên khối ngành kinh tế.',
    'Bản scan đầy đủ 12 chương',
    'SLIDE', '2025', 'HK1',
    'bafybeih4d1k77qwe5r0sz88m2cx000000000000000000000000001',
    '12D3KooWTestPeer1',
    'https://gateway.pinata.cloud/ipfs/bafybeih4d1k77qwe5r0sz88m2cx000000000000000000000000001',
    50436505, 'pdf',
    'https://placehold.co/400x560/png?text=Microeconomics',
    240, 3, TRUE, 10,
    'PUBLISHED',
    41, 12, 2210, 85, 15,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
    'a0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    (SELECT id FROM universities WHERE code = 'HUST' LIMIT 1),
    (SELECT id FROM courses LIMIT 1),
    'Slide Bài giảng Vật lý Đại cương',
    'Bộ slide tổng hợp công thức và bài tập vật lý đại cương 1 & 2.',
    'Slide tóm tắt ôn thi cuối kỳ',
    'SLIDE', '2025', 'HK2',
    'bafybeig88ef29vlkxm10992300000000000000000000000000002',
    '12D3KooWTestPeer2',
    'https://gateway.pinata.cloud/ipfs/bafybeig88ef29vlkxm10992300000000000000000000000000002',
    7130316, 'pdf',
    'https://placehold.co/400x560/png?text=Physics',
    85, 5, TRUE, 5,
    'PUBLISHED',
    9, 4, 312, 20, 2,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'a0000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    (SELECT id FROM universities WHERE code = 'HUST' LIMIT 1),
    (SELECT id FROM courses LIMIT 1),
    'Đề cương Ôn thi Giải tích 3 ĐHBK',
    'Đề cương chi tiết và bộ đề thi trắc nghiệm kèm tự luận có lời giải chi tiết.',
    'Kèm lời giải đề thi 3 năm gần nhất',
    'SLIDE', '2025', 'HK1',
    'bafybeic2h7g5y391a4z6p9lq2v7n8m00000000000000000000003',
    '12D3KooWTestPeer1',
    'https://gateway.pinata.cloud/ipfs/bafybeic2h7g5y391a4z6p9lq2v7n8m00000000000000000000003',
    14889779, 'pdf',
    'https://placehold.co/400x560/png?text=Calculus+3',
    120, 3, TRUE, 15,
    'PUBLISHED',
    86, 18, 1240, 150, 24,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'a0000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    (SELECT id FROM universities WHERE code = 'HUST' LIMIT 1),
    (SELECT id FROM courses LIMIT 1),
    'Tài liệu vi phạm bản quyền sách Pearson',
    'Bản sao trái phép sách bài tập có bản quyền thương mại.',
    'Chưa được cấp phép',
    'SLIDE', '2025', 'HK1',
    'bafybeivipham000000000000000000000000000000000000000004',
    '12D3KooWTestPeer3',
    'https://gateway.pinata.cloud/ipfs/bafybeivipham000000000000000000000000000000000000000004',
    1048576, 'pdf',
    'https://placehold.co/400x560/png?text=Pearson+Infringement',
    50, 1, TRUE, 20,
    'REJECTED',
    0, 1, 5, 0, 0,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    (SELECT id FROM universities WHERE code = 'NEU' LIMIT 1),
    (SELECT id FROM courses LIMIT 1),
    'Giáo trình Đại cương Mẫu (Zero UUID)',
    'Tài liệu mẫu phục vụ kiểm thử Postman với ID mặc định 00000000-0000-0000-0000-000000000000.',
    'Bản mẫu test Postman',
    'SLIDE', '2025', 'HK1',
    'bafybeizero00000000000000000000000000000000000000000000000',
    '12D3KooWTestPeerZero',
    'https://gateway.pinata.cloud/ipfs/bafybeizero00000000000000000000000000000000000000000000000',
    1024000, 'pdf',
    'https://placehold.co/400x560/png?text=Zero+UUID+Test',
    10, 3, TRUE, 5,
    'PUBLISHED',
    15, 2, 500, 10, 3,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed danh sách báo cáo vi phạm (Document Reports)
INSERT INTO document_reports (
    id, reporter_user_id, document_id, reason, description, status, created_at
)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'COPYRIGHT_INFRINGEMENT',
    'Báo cáo kiểm thử tài liệu với Zero UUID trên Postman.',
    'PENDING',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
),
(
    'b0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'COPYRIGHT_INFRINGEMENT',
    'Tài liệu là bản scan toàn bộ giáo trình thương mại có ISBN, không phải ghi chú tự soạn. Đề nghị gỡ bỏ khỏi mạng lưới.',
    'PENDING',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
    'b0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'COPYRIGHT_INFRINGEMENT',
    'Nhiều trang slide trùng khớp với bài giảng của tôi mà chưa được cho phép đăng tải.',
    'PENDING',
    CURRENT_TIMESTAMP - INTERVAL '5 hours'
),
(
    'b0000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'POOR_QUALITY',
    'File mờ, nhiều trang bị cắt, không đọc được phần đáp án.',
    'PENDING',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

