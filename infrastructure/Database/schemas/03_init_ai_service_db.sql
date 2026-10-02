-- ==============================================================================
-- DỰ ÁN: MẠNG XÃ HỘI CHIA SẺ TÀI LIỆU HỌC THUẬT PHI TẬP TRUNG (DeDocu Commons)
-- MICROSERVICE: RECOMMENDATION & AI SERVICE (Python FastAPI - Port 8000)
-- DATABASE: ai_service_db
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "vector"; -- Kích hoạt khi cài pgvector

-- 1. BẢNG CÁC ĐOẠN VĂN BẢN TRÍCH XUẤT TỪ PDF (DOCUMENT CHUNKS)
-- LƯU Ý MICROSERVICES: document_id là tham chiếu logic sang Document Service
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,                   -- ID tài liệu (Logic ref to Document Service)
    chunk_index INT NOT NULL,                    -- Đoạn thứ 0, 1, 2...
    page_number INT NOT NULL,                    -- Trang số mấy của PDF
    heading VARCHAR(255),                        -- Tiêu đề phần (Heading)
    content TEXT NOT NULL,                       -- Nội dung text trích xuất
    formula TEXT,                                -- Công thức toán học (nếu có)
    token_count INT DEFAULT 0,
    -- embedding vector(768),                    -- Bật khi dùng mô hình Gemini text-embedding-004
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doc_chunk UNIQUE (document_id, chunk_index)
);

-- 2. PHÂN HỆ AI QUIZ GENERATOR (PHỤC VỤ TRANG /quiz)
CREATE TABLE IF NOT EXISTS ai_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,                   -- ID tài liệu nguồn (Logic ref to Document Service)
    creator_user_id UUID,                        -- ID người tạo (Logic ref to User Service)
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(30) DEFAULT 'ADVANCED',
    format_mode VARCHAR(30) DEFAULT 'MULTIPLE_CHOICE',
    total_questions INT NOT NULL DEFAULT 5,
    coverage_percent FLOAT DEFAULT 95.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES ai_quizzes(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    question_text TEXT NOT NULL,
    options_json JSONB NOT NULL,                 -- Danh sách phương án ["A...", "B...", "C...", "D..."]
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    source_heading VARCHAR(255),                 -- '01. Cung và cầu' (Khớp với UI)
    source_page INT,
    source_snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,                       -- ID thí sinh (Logic ref to User Service)
    quiz_id UUID NOT NULL REFERENCES ai_quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    percentage FLOAT NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. THEO DÕI HÀNH VI ĐỂ HUẤN LUYỆN KHUYẾN NGHỊ (RECOMMENDATION ENGINE)
-- Áp dụng thuật toán Multi-Armed Bandit và Collaborative Filtering
CREATE TABLE IF NOT EXISTS user_document_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,                       -- Logic ref to User Service
    document_id UUID NOT NULL,                   -- Logic ref to Document Service
    interaction_type VARCHAR(50) NOT NULL,       -- 'VIEW', 'LIKE', 'DOWNLOAD', 'BOOKMARK'
    duration_seconds INT DEFAULT 0,
    pages_viewed INT DEFAULT 1,
    reward_score FLOAT DEFAULT 0.0,              -- Trọng số phần thưởng (Reward)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PHÂN HỆ HỎI ĐÁP RAG CHATBOT (GEMINI API)
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,                                -- Logic ref to User Service
    document_id UUID NOT NULL,                   -- Logic ref to Document Service
    title VARCHAR(255) DEFAULT 'Hỏi đáp bài giảng AI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,                   -- 'user', 'assistant'
    content TEXT NOT NULL,
    sources_found_json JSONB,                    -- Trích dẫn nguồn: [{"page": 1, "snippet": "..."}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. INDEX TỐI ƯU
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_document_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_doc ON user_document_interactions(document_id);
CREATE INDEX IF NOT EXISTS idx_quiz_doc ON ai_quizzes(document_id);

-- 6. SEED DATA CHO AI SERVICE
-- Document Chunks phục vụ kiểm thử tìm kiếm ngữ nghĩa và RAG
INSERT INTO document_chunks (id, document_id, chunk_index, page_number, content, token_count)
VALUES 
    (
        'cccccccc-1111-1111-1111-000000000001',
        '77777777-7777-7777-7777-000000000001', -- OOP Java/C++
        0, 1,
        'Chương 1: Tổng quan về Lập trình hướng đối tượng. Bốn tính chất nền tảng gồm Đóng gói (Encapsulation), Kế thừa (Inheritance), Đa hình (Polymorphism) và Trừu tượng hóa (Abstraction). Đối tượng kết hợp dữ liệu (thuộc tính) và hành vi (phương thức).',
        65
    ),
    (
        'cccccccc-1111-1111-1111-000000000002',
        '77777777-7777-7777-7777-000000000001', -- OOP Java/C++
        1, 15,
        'Chương 3: Tính đa hình và Hàm ảo. Trong C++, hàm ảo (virtual function) cho phép gọi đúng phương thức của lớp dẫn xuất thông qua con trỏ lớp cơ sở tại runtime bằng cơ chế bảng ảo (vtable) và con trỏ vptr.',
        68
    ),
    (
        'cccccccc-1111-1111-1111-000000000003',
        '77777777-7777-7777-7777-000000000002', -- Hệ điều hành
        0, 1,
        'Chương 1: Kiến trúc phân quyền hệ điều hành. Cơ chế bảo vệ phần cứng chia thành User Mode (Ring 3) và Kernel Mode (Ring 0) để ngăn tiến trình ứng dụng gây sập hệ thống hoặc ghi đè bộ nhớ quan trọng.',
        62
    )
ON CONFLICT (document_id, chunk_index) DO NOTHING;

-- Đề thi trắc nghiệm AI sinh tự động
INSERT INTO ai_quizzes (id, document_id, creator_user_id, title, difficulty, format_mode, total_questions, coverage_percent)
VALUES 
    (
        '99999999-9999-9999-9999-000000000001',
        '77777777-7777-7777-7777-000000000001', -- Tài liệu OOP của Âu Dương Tấn
        '10000000-0000-0000-0000-000000000001', -- Âu Dương Tấn
        'Quiz Ôn tập: Lập trình hướng đối tượng & Đa hình',
        'INTERMEDIATE',
        'MULTIPLE_CHOICE',
        3,
        92.5
    ),
    (
        '99999999-9999-9999-9999-000000000002',
        '77777777-7777-7777-7777-000000000002', -- Tài liệu Hệ điều hành của Trần Minh Tấn
        '20000000-0000-0000-0000-000000000001', -- Trần Minh Tấn
        'Quiz Ôn tập: An toàn & Bảo mật Hệ điều hành',
        'BASIC',
        'MULTIPLE_CHOICE',
        2,
        88.0
    )
ON CONFLICT DO NOTHING;

-- Câu hỏi trắc nghiệm kèm đáp án và trích dẫn mục tài liệu
INSERT INTO ai_quiz_questions (quiz_id, question_index, question_text, options_json, correct_answer, source_heading)
VALUES 
    (
        '99999999-9999-9999-9999-000000000001',
        1,
        'Bốn tính chất cơ bản của lập trình hướng đối tượng (OOP) gồm những gì?',
        '["Đóng gói, Kế thừa, Đa hình, Trừu tượng hóa", "Cấu trúc, Rẽ nhánh, Lặp, Thủ tục", "Con trỏ, Mảng, Danh sách liên kết, Ngăn xếp", "Biên dịch, Thông dịch, Đóng gói, Thực thi"]'::jsonb,
        'Đóng gói, Kế thừa, Đa hình, Trừu tượng hóa',
        'Chương 1: Tổng quan về OOP'
    ),
    (
        '99999999-9999-9999-9999-000000000001',
        2,
        'Trong C++, từ khóa nào dùng để kích hoạt cơ chế liên kết động (Dynamic Binding) tại runtime?',
        '["virtual", "static", "friend", "inline"]'::jsonb,
        'virtual',
        'Chương 3: Tính đa hình và Hàm ảo'
    ),
    (
        '99999999-9999-9999-9999-000000000001',
        3,
        'Con trỏ thông minh nào trong C++ đảm bảo quyền sở hữu duy nhất (Exclusive Ownership)?',
        '["std::unique_ptr", "std::shared_ptr", "std::weak_ptr", "std::auto_ptr"]'::jsonb,
        'std::unique_ptr',
        'Chương 5: Quản lý bộ nhớ hiện đại'
    ),
    (
        '99999999-9999-9999-9999-000000000002',
        1,
        'Cơ chế phần cứng nào ngăn chặn ứng dụng người dùng truy cập trực tiếp bộ nhớ hệ thống?',
        '["Phân vùng User Mode (Ring 3) và Kernel Mode (Ring 0)", "Mã hóa đối xứng AES", "Bảng băm Hash Table", "Giao thức mạng TCP"]'::jsonb,
        'Phân vùng User Mode (Ring 3) và Kernel Mode (Ring 0)',
        'Chương 1: Kiến trúc phân quyền hệ điều hành'
    ),
    (
        '99999999-9999-9999-9999-000000000002',
        2,
        'Quyền kiểm soát truy cập trên hệ thống tệp POSIX được định nghĩa qua cơ chế nào?',
        '["Access Control List (ACL) và phân quyền Owner/Group/Other", "Hàm băm SHA-256", "Chữ ký điện tử RSA", "Mã xác thực HMAC"]'::jsonb,
        'Access Control List (ACL) và phân quyền Owner/Group/Other',
        'Chương 2: Kiểm soát truy cập hệ điều hành'
    )
ON CONFLICT DO NOTHING;

-- Lịch sử làm bài Quiz của thành viên
INSERT INTO user_quiz_attempts (user_id, quiz_id, score, total_questions, percentage, time_spent_seconds)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-000000000001', 3, 3, 100.0, 120), -- Trần Minh Tấn
    ('50000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-000000000001', 2, 3, 66.7, 95),   -- Quý
    ('30000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-000000000002', 2, 2, 100.0, 80)   -- Anh Pha
ON CONFLICT DO NOTHING;

-- Nhật ký tương tác tài liệu (Training/Evaluation log cho Recommendation Service - Python AI)
INSERT INTO user_document_interactions (user_id, document_id, interaction_type, duration_seconds, pages_viewed, reward_score)
VALUES 
    -- Tương tác của Âu Dương Tấn
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000002', 'VIEW', 240, 15, 0.8),
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000003', 'DOWNLOAD', 60, 25, 1.0),
    ('10000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000004', 'LIKE', 30, 5, 0.9),

    -- Tương tác của Trần Minh Tấn
    ('20000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001', 'DOWNLOAD', 180, 20, 1.0),
    ('20000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000003', 'VIEW', 90, 8, 0.7),

    -- Tương tác của Anh Pha
    ('30000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001', 'LIKE', 45, 12, 0.9),
    ('30000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000002', 'DOWNLOAD', 120, 18, 1.0),

    -- Tương tác của Huy Phát & Quý
    ('40000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001', 'VIEW', 150, 10, 0.8),
    ('50000000-0000-0000-0000-000000000001', '77777777-7777-7777-7777-000000000001', 'DOWNLOAD', 210, 25, 1.0)
ON CONFLICT DO NOTHING;

-- Phiên hội thoại hỏi đáp trợ lý AI (RAG Academic Assistant)
INSERT INTO ai_chat_sessions (id, user_id, document_id, title)
VALUES 
    (
        'bbbbbbbb-1111-1111-1111-000000000001',
        '10000000-0000-0000-0000-000000000001', -- Âu Dương Tấn
        '77777777-7777-7777-7777-000000000001', -- OOP
        'Hỏi đáp về Tính đa hình trong C++'
    )
ON CONFLICT DO NOTHING;

INSERT INTO ai_chat_messages (session_id, role, content, sources_found_json)
VALUES 
    (
        'bbbbbbbb-1111-1111-1111-000000000001',
        'user',
        'Giải thích giúp mình cơ chế con trỏ hàm ảo vtable trong C++ hoạt động như thế nào khi gọi phương thức đa hình?',
        NULL
    ),
    (
        'bbbbbbbb-1111-1111-1111-000000000001',
        'assistant',
        'Trong C++, khi một lớp khai báo ít nhất một hàm ảo (virtual), trình biên dịch sẽ tạo ra một bảng ảo gọi là vtable (Virtual Table) chứa địa chỉ của các hàm ảo đó. Mỗi đối tượng của lớp sẽ tự động chứa một con trỏ ẩn vptr trỏ tới vtable tương ứng. Khi gọi phương thức qua con trỏ lớp cơ sở, chương trình sẽ tra cứu địa chỉ thực thi trong vtable tại runtime thay vì gán tĩnh lúc compile time, nhờ đó đảm bảo phương thức của lớp dẫn xuất được thực thi chính xác.',
        '[{"page": 15, "chapter": "Chương 3: Tính đa hình và Hàm ảo", "document_id": "77777777-7777-7777-7777-000000000001"}]'::jsonb
    )
ON CONFLICT DO NOTHING;

