-- ==============================================================================
-- DỰ ÁN: MẠNG XÃ HỘI CHIA SẺ TÀI LIỆU HỌC THUẬT PHI TẬP TRUNG (DeDocu Commons)
-- MICROSERVICE: DOCUMENT SERVICE (Java Spring Boot 3 - Port 8082)
-- FLYWAY MIGRATION: V10__seed_vietnam_faculties_and_independent_taxonomy.sql
-- Tách danh mục Khoa / Viện độc lập với Trường và nạp kho Khoa / Viện toàn quốc
-- ==============================================================================

-- 1. Cho phép Khoa / Viện tồn tại độc lập (không bắt buộc gắn cứng vào 1 trường cụ thể)
ALTER TABLE faculties ALTER COLUMN university_id DROP NOT NULL;
ALTER TABLE faculties ADD COLUMN IF NOT EXISTS description TEXT;

-- Chuẩn hóa mã khoa viết hoa và dọn các bản ghi trùng mã (nếu có) trước khi đánh UNIQUE (code)
UPDATE faculties SET code = UPPER(TRIM(code)) WHERE code IS NOT NULL;
DELETE FROM faculties a USING faculties b
WHERE a.id > b.id AND a.code IS NOT NULL AND b.code IS NOT NULL AND a.code = b.code;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_faculties_code'
    ) THEN
        ALTER TABLE faculties ADD CONSTRAINT uq_faculties_code UNIQUE (code);
    END IF;
END $$;

-- 2. NẠP DANH MỤC KHOA / VIỆN ĐÀO TẠO PHỔ BIẾN TẠI CÁC TRƯỜNG ĐẠI HỌC VIỆT NAM
INSERT INTO faculties (code, name, description)
VALUES
    ('CNTT', 'Khoa Công nghệ thông tin', 'Đào tạo Công nghệ thông tin, phát triển phần mềm và hệ thống máy tính'),
    ('KHMT', 'Khoa Khoa học máy tính', 'Đào tạo thuật toán, trí tuệ nhân tạo và lý thuyết tính toán'),
    ('KTPM', 'Khoa Kỹ thuật phần mềm', 'Đào tạo quy trình phát triển, kiểm thử và kiến trúc phần mềm'),
    ('HTTT', 'Khoa Hệ thống thông tin', 'Đào tạo phân tích, thiết kế và quản trị hệ thống thông tin'),
    ('TTNT', 'Khoa Trí tuệ nhân tạo & Khoa học dữ liệu', 'Đào tạo AI, Học máy, Xử lý ngôn ngữ tự nhiên và Dữ liệu lớn'),
    ('ATTT', 'Khoa An toàn thông tin', 'Đào tạo an ninh mạng, mật mã học và bảo mật hệ thống'),
    ('MMT', 'Khoa Mạng máy tính & Truyền thông', 'Đào tạo hạ tầng mạng, điện toán đám mây và truyền thông dữ liệu'),
    ('KTMT', 'Khoa Kỹ thuật máy tính', 'Đào tạo hệ thống nhúng, vi mạch và kiến trúc máy tính'),
    ('DIEN', 'Khoa Kỹ thuật Điện - Điện tử', 'Đào tạo hệ thống điện, điện công nghiệp và năng lượng tái tạo'),
    ('DTVT', 'Khoa Điện tử Viễn thông', 'Đào tạo mạch điện tử, xử lý tín hiệu và mạng viễn thông'),
    ('TDH', 'Khoa Tự động hóa & Điều khiển', 'Đào tạo điều khiển tự động, robot và đo lường công nghiệp'),
    ('COKHI', 'Khoa Cơ khí', 'Đào tạo chế tạo máy, cơ khí động lực và gia công áp lực'),
    ('CDT', 'Khoa Cơ điện tử', 'Đào tạo hệ thống cơ điện tử thông minh và dây chuyền tự động'),
    ('OTO', 'Khoa Kỹ thuật Ô tô & Máy động lực', 'Đào tạo công nghệ ô tô, xe điện và động cơ đốt trong'),
    ('HKVT', 'Khoa Kỹ thuật Hàng không & Tàu thủy', 'Đào tạo kỹ thuật hàng không, đóng tàu và thiết bị bay'),
    ('NHIET', 'Khoa Kỹ thuật Nhiệt - Điện lạnh', 'Đào tạo hệ thống nhiệt, điều hòa không khí và năng lượng'),
    ('XDDD', 'Khoa Xây dựng Dân dụng & Công nghiệp', 'Đào tạo kết cấu công trình, địa kỹ thuật và quản lý xây dựng'),
    ('CAUDUONG', 'Khoa Kỹ thuật Cầu đường & Giao thông', 'Đào tạo hạ tầng giao thông, cầu hầm và đường bộ'),
    ('KIENTRUC', 'Khoa Kiến trúc & Quy hoạch', 'Đào tạo thiết kế kiến trúc, quy hoạch đô thị và nội thất'),
    ('THUYLOI', 'Khoa Kỹ thuật Thủy lợi & Cấp thoát nước', 'Đào tạo công trình thủy, tài nguyên nước và hạ tầng đô thị'),
    ('KTHH', 'Khoa Hóa học & Kỹ thuật Hóa học', 'Đào tạo công nghệ hóa học, hóa dầu và hợp chất vô cơ/hữu cơ'),
    ('CNTP', 'Khoa Công nghệ Thực phẩm & Sinh học', 'Đào tạo chế biến thực phẩm, dinh dưỡng và công nghệ sinh học'),
    ('VLIEU', 'Khoa Kỹ thuật Vật liệu & Luyện kim', 'Đào tạo vật liệu mới, polymer, kim loại và bán dẫn'),
    ('MODC', 'Khoa Mỏ - Địa chất & Dầu khí', 'Đào tạo khai thác mỏ, địa chất công trình và kỹ thuật dầu khí'),
    ('MOITRUONG', 'Khoa Kỹ thuật Môi trường & Tài nguyên', 'Đào tạo quản lý môi trường, xử lý nước thải và phát triển bền vững'),
    ('KINHTE', 'Khoa Kinh tế', 'Đào tạo kinh tế học, kinh tế phát triển và kinh tế đầu tư'),
    ('QTKD', 'Khoa Quản trị Kinh doanh', 'Đào tạo quản trị doanh nghiệp, khởi nghiệp và quản trị chiến lược'),
    ('TCNH', 'Khoa Tài chính - Ngân hàng', 'Đào tạo tài chính doanh nghiệp, ngân hàng, chứng khoán và đầu tư'),
    ('KETOAN', 'Khoa Kế toán - Kiểm toán', 'Đào tạo kế toán tài chính, kế toán quản trị và kiểm toán độc lập'),
    ('KTQT', 'Khoa Kinh tế Quốc tế & Ngoại thương', 'Đào tạo thương mại quốc tế, kinh doanh quốc tế và xuất nhập khẩu'),
    ('MKT', 'Khoa Marketing', 'Đào tạo quản trị marketing, truyền thông thương hiệu và digital marketing'),
    ('TMDT', 'Khoa Thương mại điện tử & Kinh tế số', 'Đào tạo kinh doanh số, sàn thương mại điện tử và thanh toán số'),
    ('LOGISTICS', 'Khoa Logistics & Quản lý Chuỗi cung ứng', 'Đào tạo vận tải đa phương thức, kho vận và chuỗi cung ứng toàn cầu'),
    ('MIS', 'Khoa Hệ thống Thông tin Quản lý', 'Đào tạo ERP, phân tích dữ liệu kinh doanh và chuyển đổi số'),
    ('QTNL', 'Khoa Quản trị Nguồn nhân lực', 'Đào tạo quản trị nhân sự, hành vi tổ chức và quan hệ lao động'),
    ('TOANTIN', 'Khoa Toán - Tin ứng dụng', 'Đào tạo toán giải tích, đại số, xác suất thống kê và toán tài chính'),
    ('VATLY', 'Khoa Vật lý & Vật lý Kỹ thuật', 'Đào tạo vật lý đại cương, quang học, hạt nhân và vật lý y sinh'),
    ('SINHHOC', 'Khoa Sinh học & Khoa học Sự sống', 'Đào tạo sinh học phân tử, di truyền và sinh thái học'),
    ('YDAKHOA', 'Khoa Y Đa khoa', 'Đào tạo bác sĩ đa khoa, nội khoa, ngoại khoa và lâm sàng'),
    ('DUOC', 'Khoa Dược học', 'Đào tạo dược lý, hóa dược, bào chế và dược lâm sàng'),
    ('RHM', 'Khoa Răng - Hàm - Mặt', 'Đào tạo nha khoa, phẫu thuật hàm mặt và chỉnh nha'),
    ('DIEUDUONG', 'Khoa Điều dưỡng & Kỹ thuật Y học', 'Đào tạo điều dưỡng, xét nghiệm y học và chẩn đoán hình ảnh'),
    ('YTCC', 'Khoa Y tế Công cộng & Y học Dự phòng', 'Đào tạo dịch tễ học, dinh dưỡng và quản lý bệnh viện'),
    ('LUAT', 'Khoa Luật', 'Đào tạo luật hiến pháp, dân sự, hình sự và hành chính'),
    ('LUATKT', 'Khoa Luật Kinh tế & Thương mại', 'Đào tạo pháp luật doanh nghiệp, đầu tư, sở hữu trí tuệ và trọng tài'),
    ('NGOAINGU', 'Khoa Ngoại ngữ', 'Đào tạo biên phiên dịch và ngôn ngữ nước ngoài'),
    ('NNA', 'Khoa Ngôn ngữ Anh', 'Đào tạo tiếng Anh thương mại, biên phiên dịch và sư phạm tiếng Anh'),
    ('NNTQ', 'Khoa Ngôn ngữ Trung Quốc', 'Đào tạo tiếng Trung Quốc ứng dụng, thương mại và văn hóa Hán ngữ'),
    ('NNNB', 'Khoa Ngôn ngữ Nhật Bản', 'Đào tạo tiếng Nhật thương mại, CNTT và văn hóa Nhật Bản'),
    ('NNHQ', 'Khoa Ngôn ngữ Hàn Quốc', 'Đào tạo tiếng Hàn Quốc biên phiên dịch và Hàn Quốc học'),
    ('SUPHAM', 'Khoa Sư phạm & Khoa học Giáo dục', 'Đào tạo nghiệp vụ sư phạm, quản lý giáo dục và phương pháp giảng dạy'),
    ('BAOCHI', 'Khoa Báo chí & Truyền thông', 'Đào tạo báo chí đa phương tiện, PR và sản xuất nội dung số'),
    ('QHQT', 'Khoa Quan hệ Quốc tế & Ngoại giao', 'Đào tạo chính trị quốc tế, ngoại giao và truyền thông quốc tế'),
    ('XHH', 'Khoa Xã hội học & Công tác xã hội', 'Đào tạo xã hội học, nhân học và phát triển cộng đồng'),
    ('TAMLY', 'Khoa Tâm lý học', 'Đào tạo tâm lý học tham vấn, trị liệu và tâm lý học giáo dục'),
    ('VANHOC', 'Khoa Văn học & Ngôn ngữ học', 'Đào tạo văn học Việt Nam, ngôn ngữ học và Hán Nôm'),
    ('LICHSU', 'Khoa Lịch sử - Địa lý - Văn hóa học', 'Đào tạo lịch sử, địa lý nhân văn và quản lý văn hóa'),
    ('DULICH', 'Khoa Du lịch & Quản trị Khách sạn', 'Đào tạo quản trị dịch vụ du lịch, lữ hành và nhà hàng khách sạn'),
    ('NONGLAM', 'Khoa Nông - Lâm - Ngư nghiệp', 'Đào tạo nông học, chăn nuôi, thú y, lâm sinh và thủy sản'),
    ('MYTHUAT', 'Khoa Mỹ thuật & Thiết kế Đồ họa', 'Đào tạo thiết kế đồ họa, truyền thông thị giác và thời trang'),
    ('LLCT', 'Khoa Lý luận Chính trị', 'Đào tạo Triết học Mác-Lênin, Kinh tế chính trị, CNXHKH và Tư tưởng Hồ Chí Minh'),
    ('KHCB', 'Khoa Khoa học Cơ bản & Đại cương', 'Đào tạo các học phần đại cương toán, lý, hóa, tin học và pháp luật'),
    ('GDTCQP', 'Khoa Giáo dục Thể chất & Quốc phòng', 'Đào tạo giáo dục thể chất và giáo dục quốc phòng - an ninh'),
    ('KHAC', 'Khoa / Viện khác', 'Các đơn vị đào tạo, trung tâm và viện nghiên cứu liên ngành khác')
ON CONFLICT (code) DO NOTHING;
