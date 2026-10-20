# QUY CHẾ TÍNH ĐIỂM UY TÍN & BẢNG XẾP HẠNG (GAMIFICATION SPECIFICATION)

> **Tài liệu đặc tả hệ thống tính điểm, tương tác và bảng xếp hạng thi đua cho Mạng lưới học thuật phi tập trung (Decentralized Academic Network - DeDocu).**

---

## 1. MỤC TIÊU & ĐỊNH HƯỚNG
1. **Minh bạch & Nhất quán:** Đảm bảo toàn bộ số liệu (Lượt tim, Lưu, Lượt theo dõi, Điểm số) giữa **Trang cá nhân (Profile)** và **Bảng xếp hạng (Leaderboard)** đồng nhất 100% từ Database, không có sai lệch số liệu.
2. **Định hướng giá trị học thuật thực chất:** Điểm số và danh hiệu đến từ các đóng góp tri thức cụ thể (tải lên tài liệu hữu ích, được cộng đồng đón nhận, tích cực ôn tập Quiz), **loại bỏ các hành vi spam thụ động (như điểm danh hàng ngày)**.
3. **Kích thích thi đua lành mạnh:** Tạo sân chơi cho sinh viên, học giả thi đua chia sẻ tài liệu hàng tuần.

---

## 2. PHÂN ĐỊNH 2 LOẠI ĐIỂM CỐT LÕI

| Đặc tính | 1. Điểm Uy Tín Trọn Đời (Lifetime Reputation - EXP) | 2. Điểm Đua Top Tuần (Weekly Leaderboard Points) |
| :--- | :--- | :--- |
| **Ý nghĩa** | Thể hiện tổng cống hiến và đẳng cấp tri thức của tài khoản từ trước tới nay. | Thể hiện mức độ sôi nổi, đóng góp tích cực của tài khoản trong tuần hiện tại. |
| **Chu kỳ reset** | **Không bao giờ reset** (Tích lũy vĩnh viễn theo thời gian). | **Reset về 0 vào 00:00 rạng sáng thứ Hai hàng tuần**. |
| **Nơi hiển thị** | Hiển thị trên **Profile cá nhân**, Avatar Badge, Popup thông tin tác giả. | Hiển thị trên **Bảng Xếp Hạng (Leaderboard)** và mục "Top 3 Đóng góp xuất sắc". |
| **Tác dụng** | Quyết định Cấp bậc / Danh hiệu (Tân thủ $\rightarrow$ Chuyên gia $\rightarrow$ Cao thủ $\rightarrow$ Huyền thoại). | Xếp hạng nhận vinh danh và phần thưởng tuần. |

---

## 3. BẢNG QUY TẮC CỘNG ĐIỂM (SCORING MATRIX)

Mọi hành động học thuật trên hệ thống được chuẩn hóa điểm thưởng như sau:

| STT | Hành động | Số điểm nhận được | Đối tượng nhận | Mục đích & Ý nghĩa học thuật |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Tải lên 1 tài liệu mới** (được duyệt) | **+10 điểm** | Tác giả tải lên | Khuyến khích chia sẻ giáo trình, đề thi, ghi chép học tập. |
| **2** | **Có người Thả Tim tài liệu** | **+2 điểm** | Tác giả tài liệu | Ghi nhận tài liệu hay, chất lượng, hữu ích với người đọc. |
| **3** | **Có người Lưu bài viết (Bookmark)** | **+5 điểm** | Tác giả tài liệu | Ghi nhận tài liệu có giá trị cao, được dùng làm tài liệu tra cứu lâu dài. |
| **4** | **Có người Tải về máy (Download)** | **+3 điểm** | Tác giả tài liệu | Thưởng khi tài liệu được ứng dụng thực tế vào học tập. |
| **5** | **Hoàn thành 1 bài Quiz (Kết quả ≥ 80%)** | **+5 điểm** | Người giải Quiz | Khuyến khích sinh viên tự ôn tập, kiểm tra kiến thức bài học. |

> 📌 **Lưu ý:** Không áp dụng cộng điểm cho việc đăng nhập hàng ngày (Daily Login) để tránh hành vi bot spam tài khoản ảo mà không tạo ra giá trị chia sẻ kiến thức.

---

## 4. CÔNG THỨC TOÁN HỌC TRÊN BẢNG XẾP HẠNG TUẦN

$$\text{Điểm Tuần} = (\text{Số bài đăng tuần} \times 10) + (\text{Lượt tim tuần} \times 2) + (\text{Lượt lưu tuần} \times 5) + (\text{Lượt tải tuần} \times 3) + (\text{Lượt Quiz đạt tuần} \times 5)$$

### Ví dụ đối soát thực tế:
* **Tài khoản Lan Chi:**
  * Đăng 8 tài liệu trong tuần $\rightarrow 8 \times 10 = 80$ điểm.
  * Nhận được 24 lượt thả tim $\rightarrow 24 \times 2 = 48$ điểm.
  * **Tổng điểm tuần:** $80 + 48 = \mathbf{128\text{ điểm}}$ (Khớp hoàn toàn với số điểm Top 1 hiển thị trên Bảng xếp hạng).

* **Tài khoản Nguyễn Văn A:**
  * Đăng 5 tài liệu trong tuần $\rightarrow 5 \times 10 = 50$ điểm.
  * Nhận được 18 lượt thả tim $\rightarrow 18 \times 2 = 36$ điểm.
  * Giải đúng 2 bài Quiz ôn tập $\rightarrow 2 \times 5 = 10$ điểm.
  * **Tổng điểm tuần:** $50 + 36 + 10 = \mathbf{96\text{ điểm}}$ (Khớp hoàn toàn vị trí Top 2).

---

## 5. HỆ THỐNG DANH HIỆU & CẤP BẬC (TIERS & BADGES)

Cấp bậc được tính dựa trên **Điểm Uy Tín Trọn Đời (Lifetime Reputation)**:

| Cấp Bậc | Danh Hiệu | Điểm Uy Tín Yêu Cầu | Huy Hiệu & Nhận Diện | Quyền Lợi |
| :---: | :--- | :---: | :--- | :--- |
| **Tier 1** | **Tân Thủ** *(Novice)* | `0 - 99` | Viền xám, biểu tượng Node mầm non | Tải tối đa 5 tài liệu/ngày, làm Quiz cơ bản. |
| **Tier 2** | **Chuyên Gia** *(Scholar)* | `100 - 499` | Viền xanh dương (#0284C7) | Tải 15 tài liệu/ngày, tham gia bình luận thảo luận sâu. |
| **Tier 3** | **Cao Thủ** *(Master Node)* | `500 - 1.499` | Viền tím bạc (#7C3AED), sao bạc | Tải không giới hạn, quyền gắn cờ kiểm duyệt tài liệu sai lệch. |
| **Tier 4** | **Huyền Thoại** *(Grand Master)* | `1.500+` | Viền vàng kim (#D97706), vương miện danh dự | Ghim tài liệu nổi bật, quyền review và xác thực bài giảng chuyên sâu. |

---

## 6. KIẾN TRÚC KỸ THUẬT & ĐỒNG BỘ DỮ LIỆU (BACKEND & FRONTEND)

1. **Nguồn chân lý duy nhất (Single Source of Truth):**
   * Dữ liệu người dùng (Họ tên, Username, Avatar, Follower Count, Following Count, Total Uploads, Reputation Points) được lưu tập trung trong bảng `users` của `user-service`.
   * Mọi màn hình Frontend (Trang cá nhân, Bảng xếp hạng, Header, Danh sách đề xuất) đều đọc từ dữ liệu Backend này, loại bỏ hoàn toàn tình trạng mock data tĩnh gây lệch số.

2. **Cơ chế Event-Driven qua Apache Kafka:**
   * Khi một hành động tương tác xảy ra ở `document-service` (Upload, Like, Save, Download) hoặc Quiz Service:
     - Dịch vụ bắn event qua Kafka: `DocumentLikedEvent`, `DocumentUploadedEvent`, `QuizCompletedEvent`.
     - `user-service` lắng nghe event và tự động cập nhật:
       1. Tăng trường tương ứng trong `users` (`reputation_points`, `total_likes_received`,...).
       2. Ghi nhận vào bảng nhật ký điểm tuần `weekly_leaderboard_logs`.
       3. Bắn WebSocket/Thông báo chuông cho tác giả: *"Bạn vừa nhận được +2 điểm uy tín từ lượt thích của Nguyễn Văn A"*.
