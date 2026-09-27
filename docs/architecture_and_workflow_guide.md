# TÀI LIỆU HƯỚNG DẪN KIẾN TRÚC & LUỒNG ĐI CỦA DỰ ÁN
**Dự án:** Decentralized Academic Network (Mạng xã hội tài liệu học thuật phi tập trung)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG
Dự án áp dụng mô hình **Microservices** kết hợp **Mạng lưu trữ phi tập trung (IPFS)**.
Luồng đi cơ bản của một chức năng (Ví dụ: Đăng tài liệu) sẽ diễn ra như sau:

1. **Frontend (Người dùng):** Tương tác với giao diện Web (React/Vite), chọn file PDF và bấm nút Đăng.
2. **API Gateway:** Đứng làm bảo vệ. Nhận Request từ Frontend, kiểm tra Token đăng nhập hợp lệ rồi mới mở cửa chuyển Request vào cho Backend Java.
3. **Backend Java (`document-service`):** 
   - Nhận file PDF, đẩy file này lên mạng lưới phi tập trung **IPFS** để lưu trữ.
   - IPFS trả về một mã băm (Mã Hash / CID).
   - Java lấy mã CID này, cộng với Tiêu đề, Tên tác giả lưu vào Database **PostgreSQL** (`document_db`).
4. **Kafka (Kẻ đưa thư):** Ngay khi lưu xong, Java gửi một tin nhắn vào Kafka: *"Có tài liệu mới vừa được đăng!"*.
5. **Backend AI (Python - `recommendation-service`):** Nghe lén Kafka, nhận được tin báo, lập tức lấy thông tin tài liệu mới lưu vào Database riêng (`recommendation_db`) để phục vụ việc tính toán AI (Gợi ý tài liệu) sau này.

---

## 2. GIẢI THÍCH CHI TIẾT CẤU TRÚC THƯ MỤC DỰ ÁN

Dưới đây là cấu trúc toàn bộ dự án mà mọi thành viên cần nắm rõ trước khi code:

```text
decentralized-academic-network/
│
├── api-gateway/            # Cổng bảo vệ (Java Spring Boot)
│   └── src/main/java/com/network/api_gateway/
│       ├── config/         # Cấu hình bảo mật, phân quyền
│       ├── filter/         # Các bộ lọc (Kiểm tra Token JWT, chống Spam)
│       └── route/          # Chứa các đường dẫn chỉ đường (Đẩy request về đúng Service)
│
├── frontend/               # Giao diện người dùng (React / Vite + TypeScript)
│   └── src/
│       ├── assets/         # Hình ảnh tĩnh, icon, font chữ
│       ├── components/     # Các khối UI dùng chung (Navbar, Footer, Nút bấm)
│       ├── layouts/        # Khung bố cục trang (MainLayout có sidebar...)
│       ├── pages/          # Các trang chính (Home, Login, Profile)
│       ├── hooks/          # Custom hooks (useAuth, useFetch...)
│       ├── services/       # File chứa các hàm axios/fetch gọi API tới Backend
│       ├── store/          # Quản lý State toàn cục (Lưu thông tin User đang đăng nhập)
│       └── utils/          # Các hàm hỗ trợ (Format ngày tháng, tiền tệ...)
│
├── infrastructure/         # Hạ tầng dùng chung (Docker)
│   └── docker-compose.yml  # File cấu hình tạo Database PostgreSQL và Kafka chỉ với 1 lệnh
│
├── services/               # Chứa các Microservices xử lý nghiệp vụ chính
│   │
│   ├── document-service/   # (Java) Dịch vụ quản lý Tài liệu và Bình luận
│   │   └── src/main/java/com/network/document_service/
│   │       ├── controller/ # Tầng 1: Lễ tân nhận Request từ API Gateway
│   │       ├── service/    # Tầng 2: Bộ não xử lý nghiệp vụ (Ví dụ: check điều kiện đăng tải)
│   │       ├── repository/ # Tầng 3: Tương tác với PostgreSQL (Thêm/Sửa/Xóa DB)
│   │       ├── entity/     # Định nghĩa cấu trúc Bảng trong Database (class Document)
│   │       ├── dto/        # Đóng gói dữ liệu để trả về cho Frontend (Ẩn thông tin nhạy cảm)
│   │       └── exception/  # Bắt và xử lý lỗi (Báo lỗi 404, 400 ra màn hình)
│   │
│   ├── user-service/       # (Java) Dịch vụ quản lý Người dùng (Đăng nhập, Theo dõi)
│   │   └── (Cấu trúc 3 lớp y hệt như document-service)
│   │
│   └── recommendation-service/ # (Python) Dịch vụ AI tính toán gợi ý tài liệu
│       ├── main.py         # File khởi động máy chủ FastAPI
│       └── requirements.txt# Danh sách thư viện Python cần cài (pandas, numpy, scikit-learn)
│
└── tests/                  # Thư mục chứa các kịch bản kiểm thử (Yêu cầu môn học)
    ├── api-tests/          # File Export của Postman (Test API)
    ├── e2e-tests/          # Script test UI tự động (Selenium/Cypress)
    └── performance/        # Kịch bản test hiệu năng (JMeter)
```

---

## 3. NGUYÊN TẮC LÀM VIỆC CHUNG (TEAM RULES)

1. **Khởi động Database trước tiên:** Ai làm Backend (Java/Python) cũng phải chạy lệnh `docker-compose up -d` trong thư mục `infrastructure` để bật Database và Kafka.
2. **Tuân thủ Logical Database-per-Service:** 
   - Code của `user-service` chỉ được phép tương tác với Database `user_db`.
   - Code của `document-service` chỉ được phép tương tác với Database `document_db`.
   - Nếu `document-service` cần biết tên của User, nó phải gọi API sang `user-service`, **Tuyệt đối không được viết câu lệnh SQL query thẳng vào `user_db`**.
3. **Frontend gọi API:** FE chỉ được phép giao tiếp với Backend thông qua các file code nằm trong thư mục `frontend/src/services/`. Không viết lệnh `axios.get` rải rác ở trong thư mục `pages/`.
4. **Code Coverage:** Chạy Test bằng lệnh `mvn test` (Java) hoặc `pytest` (Python) để đảm bảo độ phủ Code Coverage > 90% (theo yêu cầu đồ án).

---
*(Tài liệu này dùng để các thành viên trong nhóm tham khảo để hiểu rõ cấu trúc và luồng chạy trước khi code).*
