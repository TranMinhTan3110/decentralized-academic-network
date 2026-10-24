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
| **5** | **Được cộng đồng đánh giá 5 sao (⭐ 5.0)** | **+5 điểm** | Tác giả tài liệu | Tôn vinh tài liệu chuẩn mực, nội dung chính xác, trình bày đẹp mắt. |
| **6** | **Được cộng đồng đánh giá 4 sao (⭐ 4.0)** | **+3 điểm** | Tác giả tài liệu | Động viên tài liệu có chất lượng khá tốt. |
| **7** | **Hoàn thành 1 bài Quiz (Kết quả ≥ 80%)** | **+5 điểm** | Người giải Quiz | Khuyến khích sinh viên tự ôn tập, kiểm tra kiến thức bài học. |

> 📌 **Lưu ý:** Không áp dụng cộng điểm cho việc đăng nhập hàng ngày (Daily Login) để tránh hành vi bot spam tài khoản ảo mà không tạo ra giá trị chia sẻ kiến thức. Các đánh giá 1 - 2 sao sẽ không được cộng điểm uy tín.

---

## 4. CÔNG THỨC TOÁN HỌC TRÊN BẢNG XẾP HẠNG TUẦN

$$\text{Điểm Tuần} = (\text{Số bài đăng tuần} \times 10) + (\text{Lượt tim tuần} \times 2) + (\text{Lượt lưu tuần} \times 5) + (\text{Lượt tải tuần} \times 3) + (\text{Lượt đánh giá 5★ tuần} \times 5) + (\text{Lượt Quiz đạt tuần} \times 5)$$

### Ví dụ đối soát thực tế:
* **Tài khoản Lan Chi:**
  * Đăng 8 tài liệu trong tuần $\rightarrow 8 \times 10 = 80$ điểm.
  * Nhận được 24 lượt thả tim $\rightarrow 24 \times 2 = 48$ điểm.
  * **Tổng điểm tuần:** $80 + 48 = \mathbf{128\text{ điểm}}$ (Khớp hoàn toàn với số điểm Top 1 hiển thị trên Bảng xếp hạng).

* **Tài khoản Nguyễn Văn A:**
  * Đăng 5 tài liệu trong tuần $\rightarrow 5 \times 10 = 50$ điểm.
  * Nhận được 18 lượt thả tim $\rightarrow 18 \times 2 = 36$ điểm.
  * Nhận 2 lượt đánh giá 5 sao từ người dùng $\rightarrow 2 \times 5 = 10$ điểm.
  * Giải đúng 2 bài Quiz ôn tập $\rightarrow 2 \times 5 = 10$ điểm.
  * **Tổng điểm tuần:** $50 + 36 + 10 + 10 = \mathbf{106\text{ điểm}}$ (Khớp hoàn toàn vị trí Top 2).

---

## 5. HỆ THỐNG CẤP BẬC UY TÍN (TIERS)

Cấp bậc được tính dựa trên **Điểm Uy Tín Trọn Đời (Lifetime Reputation)**:

| Cấp Bậc | Danh Hiệu | Điểm Uy Tín Yêu Cầu | Huy Hiệu & Nhận Diện | Quyền Lợi |
| :---: | :--- | :---: | :--- | :--- |
| **Tier 1** | **Tân Thủ** *(Novice)* | `0 - 99` | Viền xám, biểu tượng Node mầm non | Tải tối đa 5 tài liệu/ngày, làm Quiz cơ bản. |
| **Tier 2** | **Chuyên Gia** *(Scholar)* | `100 - 499` | Viền xanh dương (#0284C7) | Tải 15 tài liệu/ngày, tham gia bình luận thảo luận sâu. |
| **Tier 3** | **Cao Thủ** *(Master Node)* | `500 - 1.499` | Viền tím bạc (#7C3AED), sao bạc | Tải không giới hạn, quyền gắn cờ kiểm duyệt tài liệu sai lệch. |
| **Tier 4** | **Huyền Thoại** *(Grand Master)* | `1.500+` | Viền vàng kim (#D97706), vương miện danh dự | Ghim tài liệu nổi bật, quyền review và xác thực bài giảng chuyên sâu. |

---

## 6. DANH MỤC 9 HUY HIỆU HỌC THUẬT CỐT LÕI (ACADEMIC BADGES)

Hệ thống DeDocu chuẩn hóa 9 huy hiệu học thuật thuộc 3 nhóm chính, được tự động đánh giá và trao tặng theo thời gian thực:

### Nhóm 1: Huy hiệu Cống hiến Chia sẻ (Upload & Đánh giá)
1. 🌱 **Khởi Đầu Chia Sẻ** (`FIRST_UPLOAD`): Tải lên tài liệu học tập đầu tiên được phê duyệt thành công.
2. ✨ **Đóng Góp Tích Cực** (`ACTIVE_CONTRIBUTOR`): Đã chia sẻ từ 10 tài liệu học tập đạt chuẩn trở lên.
3. 🌟 **Tài Liệu Xuất Sắc** (`EXCELLENT_DOC`): Có tài liệu đạt đánh giá 5 sao với ít nhất 10 lượt đánh giá từ cộng đồng.
4. 🏆 **Top Author 2025** (`TOP_AUTHOR_2025`): Top tác giả chia sẻ có từ 5 tài liệu trở lên và nhận được ít nhất 20 lượt thả tim.

### Nhóm 2: Cột mốc Uy tín & Trí tuệ (Reputation & Quiz)
5. 🎖️ **Học Giả Tri Thức** (`REPUTATION_500`): Tích lũy đạt cột mốc 500 điểm uy tín trọn đời.
6. ⭐ **Huyền Thoại DeDocu** (`REPUTATION_1500`): Đạt mốc 1.500+ điểm uy tín trọn đời (Huy hiệu vinh danh cao nhất hệ thống).
7. 🧠 **Bậc Thầy Trắc Nghiệm** (`QUIZ_MASTER`): Hoàn thành xuất sắc từ 20 bài trắc nghiệm Quiz ôn tập với điểm số ≥ 80%.

### Nhóm 3: Tương tác & Tiên phong Cộng đồng
8. ✍️ **Nhà Phê Bình Tận Tâm** (`TOP_REVIEWER`): Tích cực đóng góp trên 15 lượt đánh giá, nhận xét chất lượng cho các tài liệu khác.
9. 🚀 **Tiên Phong Nền Tảng** (`GENESIS_LEADER`): Tài khoản thành viên sáng lập tham gia đóng góp cho mạng lưới trong giai đoạn Genesis.

---

## 7. CƠ CHẾ TỰ ĐỘNG TRAO TẶNG HUY HIỆU (AUTO-AWARD BADGE LOGIC)

1. **Trigger tự động ở Backend:**
   * Mỗi khi người dùng xem hồ sơ cá nhân hoặc khi nhận được lượt tải lên/lượt đánh giá mới, backend hàm `checkAndAwardBadges(user)` sẽ tự động quét các mốc điều kiện.
   * Nếu người dùng đạt mốc chưa có huy hiệu tương ứng, hệ thống tự động gán vào bảng liên kết `user_badges` và lưu trữ vĩnh viễn trong cơ sở dữ liệu.
2. **Hiển thị trực quan trên Frontend:**
   * Trang cá nhân hiển thị rõ danh sách huy hiệu người dùng đã sở hữu.
   * Đồng thời cung cấp danh mục tất cả 9 huy hiệu hệ thống với trạng thái **Đã mở khóa (Unlocked)** hoặc **Khóa (Locked - 🔒 kèm điều kiện)** để người dùng biết mục tiêu cần phấn đấu.

---

## 8. KIẾN TRÚC KỸ THUẬT & ĐỒNG BỘ DỮ LIỆU (BACKEND & FRONTEND)

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
