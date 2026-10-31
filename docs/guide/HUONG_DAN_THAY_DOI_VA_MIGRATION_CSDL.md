# HƯỚNG DẪN THAY ĐỔI VÀ MIGRATION CƠ SỞ DỮ LIỆU
**Dành cho:** Thành viên Backend (Java & Python) - Dự án DeDocu Commons  
**Mô hình:** Microservices (Database-per-Service) + Code-First Migration  
**Công nghệ:** Java Spring Boot (Flyway) + Python FastAPI (SQLAlchemy & Alembic)  

---

## 1. NGUYÊN TẮC CỐT LÕI CỦA CODE-FIRST & MIGRATION

1. **Tuyệt đối không sửa CSDL trực tiếp:** Không dùng DBeaver hoặc Database Client để gõ lệnh `ALTER TABLE` / `CREATE TABLE` trực tiếp vào database.
2. **Mã nguồn là sự thật duy nhất (Single Source of Truth):** Mọi thay đổi trong CSDL đều phải xuất phát từ Entity (Java) hoặc Model (Python), sau đó sinh ra file Migration được theo dõi bởi Git.
3. **Tính bất biến của Migration (Immutability):** Không bao giờ sửa nội dung file Migration đã commit và đã chạy trên máy đồng đội. Nếu phát hiện sai, hãy tạo một file Migration mới để chỉnh sửa hoặc rollback.
4. **Luôn đi cùng nhau:** File Entity/Model và file Migration tương ứng phải được `git commit` chung trong cùng một commit.

---

## 2. QUY TRÌNH THAY ĐỔI CSDL TRONG JAVA (SPRING BOOT + FLYWAY)

Áp dụng cho:
- **`user-service`** (CSDL: `user_db`)
- **`document-service`** (CSDL: `document_db`)

### Kịch bản 1: Thêm một cột mới vào bảng có sẵn

**Ví dụ:** Thêm cột `phone_number` vào bảng `users` trong `user-service`.

#### Bước 1: Sửa class Entity Java
Mở file Entity tương ứng (ví dụ: `com.network.user_service.entity.User`), khai báo thêm thuộc tính:

```java
@Column(name = "phone_number", length = 20)
private String phoneNumber;

public String getPhoneNumber() {
    return phoneNumber;
}

public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
}
```

#### Bước 2: Tạo file Migration mới cho Flyway
Trong thư mục `src/main/resources/db/migration/`:
- Kiểm tra số thứ tự phiên bản hiện tại (ví dụ đang có `V1__init_user_schema.sql`).
- Tạo file mới với số thứ tự tăng dần, chú ý có **2 dấu gạch dưới** `__`:
  `V2__add_phone_number_to_users.sql`

Nội dung file SQL:
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
```

#### Bước 3: Khởi chạy và kiểm tra
Chạy ứng dụng:
```bash
./mvnw.cmd spring-boot:run
```
- Flyway tự động đọc file `V2`, thực thi lệnh `ALTER TABLE` vào `user_db`.
- Flyway ghi nhận bản ghi `V2` vào bảng `flyway_schema_history`.
- Hibernate kiểm tra Entity `User.java` thấy khớp với CSDL -> Ứng dụng chạy bình thường.

---

### Kịch bản 2: Tạo một bảng hoàn toàn mới

**Ví dụ:** Tạo bảng mới `user_settings` để lưu cài đặt giao diện/thông báo của người dùng.

#### Bước 1: Tạo Entity Java mới
Tạo file `src/main/java/com/network/user_service/entity/UserSetting.java`:

```java
package com.network.user_service.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "theme", length = 20)
    private String theme = "LIGHT";

    @Column(name = "email_notification")
    private Boolean emailNotification = true;

    // Getter và Setter
}
```

#### Bước 2: Tạo file Migration mới cho Flyway
Tạo file `src/main/resources/db/migration/V3__create_user_settings_table.sql`:

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    theme VARCHAR(20) DEFAULT 'LIGHT',
    email_notification BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Bước 3: Khởi chạy
Chạy `./mvnw.cmd spring-boot:run` để Flyway tạo bảng mới tự động.

---

## 3. QUY TRÌNH THAY ĐỔI CSDL TRONG PYTHON (FASTAPI + ALEMBIC)

Áp dụng cho:
- **`recommendation-service`** (CSDL: `ai_service_db`)

Khác với Java phải tự viết tay file SQL, hệ sinh thái Python sử dụng **Alembic** có khả năng tự động so sánh code Model với CSDL thực tế để sinh ra code Migration (`--autogenerate`).

### Kịch bản 1: Thêm cột mới vào bảng có sẵn

**Ví dụ:** Thêm cột `summary` vào bảng `ai_quizzes`.

#### Bước 1: Sửa class Model trong Python
Mở file `services/recommendation-service/models.py`, tìm class `AIQuiz` và thêm cột:

```python
class AIQuiz(Base):
    __tablename__ = "ai_quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)  # <-- Cột mới thêm
    # ... cac cot khac giu nguyen
```

#### Bước 2: Dùng lệnh Alembic tự động sinh Migration
Mở Terminal tại thư mục `services/recommendation-service`:

```bash
alembic revision --autogenerate -m "add_summary_to_ai_quizzes"
```

Alembic sẽ tự động sinh file trong `alembic/versions/` (ví dụ `002_add_summary_to_ai_quizzes.py`):
```python
def upgrade() -> None:
    op.add_column('ai_quizzes', sa.Column('summary', sa.Text(), nullable=True))

def downgrade() -> None:
    op.drop_column('ai_quizzes', 'summary')
```

#### Bước 3: Áp dụng vào CSDL
Bạn có 2 cách áp dụng:
- **Cách A (Lệnh trực tiếp):**
  ```bash
  alembic upgrade head
  ```
- **Cách B (Khởi chạy FastAPI):**
  ```bash
  uvicorn main:app --reload --port 8000
  ```
  Hàm `lifespan` trong `main.py` sẽ tự động phát hiện phiên bản mới và chạy `upgrade head` ngay khi bật server.

---

### Kịch bản 2: Tạo một bảng hoàn toàn mới trong Python

**Ví dụ:** Tạo bảng mới `ai_model_feedbacks` để lưu phản hồi đánh giá của người dùng về câu trả lời của AI.

#### Bước 1: Thêm class Model mới vào `models.py`
Mở `services/recommendation-service/models.py`, thêm class:

```python
class AIModelFeedback(Base):
    __tablename__ = "ai_model_feedbacks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 den 5 sao
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.current_timestamp())
```

#### Bước 2: Chạy lệnh tự sinh Migration
```bash
alembic revision --autogenerate -m "create_ai_model_feedbacks_table"
```

Alembic tự động phân tích quan hệ khóa ngoại `ForeignKey` và viết code `op.create_table(...)` hoàn chỉnh.

#### Bước 3: Áp dụng vào CSDL
```bash
alembic upgrade head
```

---

## 4. BẢNG SO SÁNH THAO TÁC GIỮA JAVA VÀ PYTHON

| Thao tác | Java Spring Boot (Flyway) | Python FastAPI (Alembic) |
| :--- | :--- | :--- |
| **Khai báo cấu trúc** | File `@Entity` (`User.java`, `Document.java`...) | File `models.py` kế thừa từ `Base` |
| **Cách tạo Migration** | Tự tạo file `V{version}__{ten}.sql` | Gõ lệnh: `alembic revision --autogenerate -m "ten"` |
| **Vị trí lưu file** | `src/main/resources/db/migration/` | `alembic/versions/` |
| **Quy tắc đặt tên file** | `V2__add_column.sql` (2 dấu gạch dưới) | Alembic tự sinh ID ngẫu nhiên hoặc có tiền tố |
| **Cách áp dụng vào DB** | Tự chạy khi gọi `./mvnw.cmd spring-boot:run` | Tự chạy khi bật `uvicorn main:app` (hoặc `alembic upgrade head`) |
| **Khả năng Rollback** | Bản Flyway Community không hỗ trợ tự rollback (phải viết file `V3` để revert) | Hỗ trợ rollback dễ dàng bằng lệnh `alembic downgrade -1` |
| **Bảng lưu vết phiên bản** | `flyway_schema_history` | `alembic_version` |

---

## 5. NHỮNG LỖI THƯỜNG GẶP VÀ CÁCH XỬ LÝ

### 1. Lỗi Flyway: `Checksum mismatch for migration version X`
- **Nguyên nhân:** Bạn đã sửa lại nội dung của một file SQL migration cũ sau khi Flyway đã chạy file đó trên máy của bạn.
- **Cách xử lý:** 
  + Không bao giờ sửa nội dung file migration cũ đã chạy.
  + Nếu muốn thay đổi, hãy tạo một file `V` tiếp theo (ví dụ `V3`, `V4`) để sửa.

### 2. Lỗi Alembic: `Target database is not up to date`
- **Nguyên nhân:** Cơ sở dữ liệu chưa ở phiên bản mới nhất trước khi chạy autogenerate.
- **Cách xử lý:**
  ```bash
  alembic upgrade head
  ```
  Sau khi CSDL đã lên `head`, chạy lại lệnh `alembic revision --autogenerate`.

### 3. Đồng đội bị xung đột số thứ tự phiên bản Flyway (`V2` bị trùng)
- **Tình huống:** Thành viên A tạo file `V2__add_phone.sql`, thành viên B cũng tạo `V2__add_avatar.sql` trên branch riêng.
- **Cách xử lý:** Khi merge code, thành viên merge sau chỉ cần đổi tên file của mình thành `V3__add_avatar.sql` là Flyway sẽ chạy tuần tự không bị lỗi.
