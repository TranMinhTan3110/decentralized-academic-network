-- V6: Dọn dữ liệu seed giả (placeholder documents)
-- =====================================================================
-- BỐI CẢNH (2026-10-24):
-- V1 đã seed 2 document "mẫu" với CID copy từ ví dụ tài liệu IPFS
-- (QmYwAPJz... = thư mục welcome của IPFS, QmXoypiz... = ví dụ Wikipedia,
-- QmZtmD2...Mount = CID cụt nối thêm chữ — không hợp lệ). 4 doc cùng pattern
-- được insert thẳng vào DB sau đó. Các doc này KHÔNG có nội dung thật trên
-- IPFS (gateway trả 400/404), view/like count bơm sẵn trong SQL.
-- Migration này xóa chúng cùng toàn bộ dữ liệu liên quan để mọi môi trường
-- local của thành viên tự sạch sau khi pull code + khởi động service.
--
-- Phạm vi chặt: chỉ id 77777777-7777-7777-7777-0000000000xx — KHÔNG đụng doc thật.
-- Xóa con trước, xóa documents sau. Idempotent (chạy lại không lỗi).
-- =====================================================================

DELETE FROM notifications WHERE document_id::text LIKE '77777777-7777-7777-7777-%';
DELETE FROM document_reports WHERE document_id::text LIKE '77777777-7777-7777-7777-%';
DELETE FROM document_likes WHERE document_id::text LIKE '77777777-7777-7777-7777-%';
DELETE FROM document_comments WHERE document_id::text LIKE '77777777-7777-7777-7777-%';
DELETE FROM document_bookmarks WHERE document_id::text LIKE '77777777-7777-7777-7777-%';
DELETE FROM user_unlocked_documents WHERE document_id::text LIKE '77777777-7777-7777-7777-%';
DELETE FROM document_views WHERE document_id::text LIKE '77777777-7777-7777-7777-%';
DELETE FROM documents WHERE id::text LIKE '77777777-7777-7777-7777-%';
