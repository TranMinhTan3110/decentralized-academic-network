# HƯỚNG DẪN KHỞI TẠO CƠ SỞ DỮ LIỆU KHI VỪA PULL CODE VỀ
**Dành cho:** Thành viên nhóm dự án DeDocu Commons  
**Mô hình kiến trúc:** Microservices (Database-per-Service) + Code-First Migration  
**Công nghệ:** PostgreSQL 15 (Docker) + Java Spring Boot (Flyway) + Python FastAPI (Alembic)  

---

## TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU

Dự án áp dụng mô hình mỗi Microservice sở hữu một cơ sở dữ liệu riêng biệt trên cùng cụm Docker PostgreSQL:
- **user-service (Port 8081):** Quản lý CSDL `user_db` bằng công cụ **Flyway**.
- **document-service (Port 8082):** Quản lý CSDL `document_db` bằng công cụ **Flyway**.
- **recommendation-service (Port 8000):** Quản lý CSDL `ai_service_db` bằng công cụ **Alembic**.

Các service không bao giờ đọc/ghi trực tiếp vào CSDL của nhau mà giao tiếp qua REST API và Kafka.

---

## YÊU CẦU MÔI TRƯỜNG TRÊN MÁY DEV
1. **Docker Desktop:** Bắt buộc cài đặt và bật lên trước khi chạy lệnh.
2. **Java JDK 21:** Dành cho `user-service` và `document-service`.
3. **Python 3.10+:** Dành cho `recommendation-service`.

---

## QUY TRÌNH 4 BƯỚC KHỞI TẠO TOÀN BỘ CSDL

### BƯỚC 1: BẬT POSTGRESQL BẰNG DOCKER (30 GIÂY)

Mở Terminal trên máy tính, di chuyển vào thư mục hạ tầng và khởi chạy:

```bash
cd project/decentralized-academic-network/infrastructure

# Tren Windows PowerShell:
docker.exe compose up -d

# Tren macOS / Linux:
docker compose up -d
```

**Cơ chế hoạt động:**
- Docker khởi động một container PostgreSQL 15 tại cổng `5432`.
- Script tự động `init-multi-postgres.sh` kích hoạt và tạo sẵn 3 database độc lập: `user_db`, `document_db`, `ai_service_db`.
- Thông tin đăng nhập mặc định:
  - **Host:** `localhost` | **Port:** `5432`
  - **Username:** `root`
  - **Password:** `rootpassword`

---

### BƯỚC 2: KHỞI TẠO CSDL CHO USER SERVICE (JAVA FLYWAY)

Mở Terminal tại thư mục `user-service` và chạy ứng dụng:

```bash
# Neu vua xong Buoc 1 (dang dung o thu muc infrastructure):
cd ../services/user-service

# Hoac neu terminal dang o thu muc goc repository:
cd project/decentralized-academic-network/services/user-service

# Tren Windows PowerShell / Command Prompt:
./mvnw.cmd spring-boot:run

# Tren macOS / Linux:
./mvnw spring-boot:run
```

**Co che hoat dong:**
- Flyway tu dong doc file migration `V1__init_user_schema.sql` trong `src/main/resources/db/migration/`.
- Tu dong tao toan bo cac bang: `users`, `universities`, `badges`, `user_verification_codes`, `user_follows`.
- Tu dong gan Trigger cap nhat `follower_count` / `following_count`.
- Tu dong nap san **10 tai khoan cua 5 thanh vien nhom** (1 tai khoan User + 1 tai khoan Admin moi thanh vien, mat khau mac dinh: `Password@123`).
- Service chay thanh cong tai cong `8081`.

---

### BUOC 3: KHOI TAO CSDL CHO DOCUMENT SERVICE (JAVA FLYWAY)

Mo Terminal tai thu muc `document-service` (hoac mo tab Terminal moi) va chay:

```bash
# Neu dang o user-service:
cd ../document-service

# Hoac neu o thu muc goc repository:
cd project/decentralized-academic-network/services/document-service

# Tren Windows PowerShell / Command Prompt:
./mvnw.cmd spring-boot:run

# Tren macOS / Linux:
./mvnw spring-boot:run
```

**Co che hoat dong:**
- Flyway tu dong doc file migration `V1__init_document_schema.sql` va day vao `document_db`.
- Tu dong tao cac bang: `documents`, `courses`, `faculties`, `document_likes`, `document_comments`, `notifications`.
- Tu dong gan Trigger thong bao: Khi co nguoi Like/Comment vao tai lieu, tu dong sinh ban ghi trong bang `notifications`.
- Nap san danh muc mon hoc (`Giai tich 1`, `Lap trinh OOP`, `Kinh te vi mo`...) va cac bai dang tai lieu mau.
- Service chay thanh cong tai cong `8082`.

---

### BUOC 4: KHOI TAO CSDL CHO AI & RECOMMENDATION SERVICE (PYTHON ALEMBIC)

Mo Terminal tai thu muc `recommendation-service`:

```bash
# Neu dang o document-service:
cd ../recommendation-service

# Hoac neu o thu muc goc repository:
cd project/decentralized-academic-network/services/recommendation-service

# 1. Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# 2. Khởi chạy máy chủ FastAPI
uvicorn main:app --reload --port 8000
```

**Cơ chế hoạt động:**
- Hàm vòng đời `lifespan` trong `main.py` tự động kích hoạt **Alembic** ngay khi server bật lên.
- Alembic tự động đọc bản migration `001_init_ai_service_schema.py` và cập nhật vào CSDL `ai_service_db`:
  - `document_chunks`: Lưu văn bản trích xuất từ PDF để phục vụ RAG.
  - `ai_quizzes`, `ai_quiz_questions`, `user_quiz_attempts`: Phân hệ trắc nghiệm AI.
  - `ai_chat_sessions`, `ai_chat_messages`: Lịch sử hỏi đáp AI.
- Terminal sẽ in ra thông báo: `>> [Alembic] Da tu dong cap nhat CSDL ai_service_db len phien ban moi nhat.`
- Service chạy thành công tại cổng `8000`.

---

## XEM DỮ LIỆU TRỰC QUAN TRÊN VS CODE / DBEAVER

Để kiểm tra các bảng và dữ liệu sau khi chạy xong:

1. Mở VS Code, cài đặt extension **Database Client** (tác giả *cweijan*).
2. Chọn biểu tượng CSDL ở thanh bên trái -> Bấm **Create Connection** -> Chọn **PostgreSQL**.
3. Điền thông tin kết nối:
   - **Host:** `localhost`
   - **Port:** `5432`
   - **User:** `root`
   - **Password:** `rootpassword`
4. Bấm **Connect**. Bạn sẽ thấy ngay 3 CSDL độc lập:
   - `user_db`: Chứa bảng `users`, `universities`, `badges`.
   - `document_db`: Chứa bảng `documents`, `courses`, `document_comments`.
   - `ai_service_db`: Chứa bảng `document_chunks`, `ai_quizzes`, `ai_chat_sessions`.

---

## DANH SÁCH TÀI KHOẢN MẪU KHỞI TẠO CỦA NHÓM

Tất cả tài khoản dưới đây đều có mật khẩu mặc định là: **`Password@123`**

| Thành viên | Email User | Email Admin | Chức vụ |
| :--- | :--- | :--- | :--- |
| **Âu Dương Tấn** | `tan.auduong@dedocu.vn` | `admin.tan@dedocu.vn` | Trưởng nhóm (Leader) |
| **Trần Minh Tấn** | `tan.tranminh@dedocu.vn` | `admin.minhtan@dedocu.vn` | Phó nhóm |
| **Anh Pha** | `pha.anh@dedocu.vn` | `admin.pha@dedocu.vn` | Kỹ sư AI |
| **Huy Phát** | `phat.huy@dedocu.vn` | `admin.phat@dedocu.vn` | Kỹ sư DevOps |
| **Quý** | `quy@dedocu.vn` | `admin.quy@dedocu.vn` | Kỹ sư Fullstack |

---

## QUY TẮC QUẢN TRỊ KHI LÀM TÍNH NĂNG MỚI (QUAN TRỌNG)

Khi bạn muốn thêm cột, đổi tên hoặc tạo bảng mới trong quá trình code:

### 1. Nếu thay đổi CSDL phía Java (`user-service` hoặc `document-service`):
- Tuyệt đối không mở DBeaver/Database Client ra gõ lệnh SQL trực tiếp vào DB.
- Cập nhật thêm thuộc tính vào Entity Java tương ứng.
- Trong thư mục `src/main/resources/db/migration/` của service đó, tạo file mới đánh số thứ tự tiếp theo:
  - Ví dụ: `V2__add_phone_number_to_users.sql`
  - Viết câu lệnh DDL: `ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);`
- Khi bạn push lên Git, đồng đội chỉ cần `git pull` về và chạy app, Flyway sẽ tự động cập nhật CSDL trên máy họ mà không gây xung đột.

### 2. Nếu thay đổi CSDL phía Python (`recommendation-service`):
- Mở file `models.py`, thêm hoặc chỉnh sửa thuộc tính trong class Model tương ứng.
- Mở Terminal tại `services/recommendation-service` và chạy lệnh tự sinh migration của Alembic:
  ```bash
  alembic revision --autogenerate -m "ten_thay_doi"
  ```
- Chạy lệnh áp dụng:
  ```bash
  alembic upgrade head
  ```
  *(Hoặc chỉ cần khởi động lại `uvicorn main:app`, FastAPI sẽ tự động nâng cấp CSDL `ai_service_db` ngay khi bật server).*
