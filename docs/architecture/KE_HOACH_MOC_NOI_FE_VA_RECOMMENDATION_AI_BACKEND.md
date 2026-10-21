# KẾ HOẠCH TỔNG THỂ MÓC NỐI FRONTEND VÀ RECOMMENDATION & AI SERVICE

Tài liệu này phân tích chi tiết toàn bộ các tính năng của **Recommendation & AI Service** (Microservice viết bằng Python FastAPI trên cổng 8000), đối chiếu với các màn hình giao diện người dùng (**Frontend React/Vite** trên cổng 5173), đánh giá trạng thái hiện tại (Đã có, Đang dùng Mock cục bộ, hay Chưa có), phân tích quan hệ phụ thuộc đa tầng giữa các dịch vụ, và đề ra lộ trình triển khai từng bước.

---

## 1. TỔNG QUAN KIẾN TRÚC MÓC NỐI HỆ THỐNG

Recommendation & AI Service không chỉ đơn thuần là bộ gợi ý bài viết, mà là một microservice AI toàn diện với 5 nhóm chức năng nghiệp vụ cốt lõi:

1. **Công cụ gợi ý học thuật (Recommendation Engine)**: Gợi ý theo xu hướng (Trending), gợi ý cá nhân hóa sinh viên (Epsilon-Greedy MAB), và gợi ý tài liệu tương đồng ngữ cảnh (Related Docs).
2. **Theo dõi tương tác và chấm điểm tín nhiệm (Interaction Tracking & Reward Scoring)**: Ghi nhận lượt xem, thích, lưu, tải về, làm bài kiểm tra để tính toán điểm thưởng (Reward Score) phục vụ tái đào tạo mô hình.
3. **Bộ câu hỏi trắc nghiệm AI (AI Quiz & Assessment)**: Quét các phân đoạn văn bản của tài liệu để sinh đề kiểm tra 4 lựa chọn, chấm điểm tự động và trích dẫn giải thích theo trang.
4. **Thẩm định tệp và phân tách ngữ nghĩa (Document Validation & Semantic Chunking)**: Kiểm tra file rác, file trắng, spam từ khóa, bản quyền thương mại; trích xuất văn bản và phân đoạn (Chunking) phục vụ RAG.
5. **Trợ lý gia sư hỏi đáp bài giảng (RAG Academic Chatbot)**: Tìm kiếm tương đồng ngữ nghĩa (Vector/Keyword Matching) từ các đoạn trích của tài liệu và trả lời thắc mắc của sinh viên kèm số trang trích dẫn.

---

## 2. MA TRẬN ĐỐI CHIẾU ENDPOINT BACKEND VỚI GIAO DIỆN FRONTEND

Bảng dưới đây mô tả chính xác từng endpoint của Recommendation Service, vị trí hiển thị trên giao diện người dùng, trạng thái hiện tại của UI và Backend, cũng như điều kiện phụ thuộc:

| Nhóm chức năng | Endpoint Backend (Port 8000) | Màn hình UI tương ứng | Trạng thái UI | Trạng thái BE | Trạng thái móc nối | Điều kiện và sự phụ thuộc |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gợi ý xu hướng** | `GET /api/v1/recommendations/trending` | [HomePage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/HomePage/HomePage.tsx) (Tab "Đang thịnh hành") | Đã có sẵn | Hoàn thiện | **Đã móc nối thử nghiệm** | Cần Database `ai_service_db` chạy cổng 5432 và bảng `user_document_interactions`. |
| **Gợi ý cá nhân hóa** | `GET /api/v1/recommendations/me?university_id=...&major=...` | [HomePage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/HomePage/HomePage.tsx) (Tab "Dành cho bạn") | Đã có sẵn (đang dùng mock tĩnh) | Hoàn thiện | **Chưa móc nối** | Phụ thuộc vào JWT Token đăng nhập từ `user-service` (cổng 8081) để lấy `user_id`, trường đại học và ngành học. |
| **Gợi ý tài liệu tương tự** | `GET /api/v1/recommendations/related/{documentId}` | [Detail.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/Detail/Detail.tsx) (Section "Cùng môn, thêm một góc nhìn") | Đã có sẵn (đang lọc mock theo môn) | Hoàn thiện | **Chưa móc nối** | Cần `documentId` hợp lệ và dữ liệu phân loại hoặc điểm tương tác của tài liệu gốc. |
| **Ghi nhận hành vi tương tác** | `POST /api/v1/interactions/log` | [Detail.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/Detail/Detail.tsx) và [FeedCard.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/components/FeedCard.tsx) (Sự kiện View, Like, Save, Download) | Đã có nút bấm và state cục bộ | Hoàn thiện | **Chưa móc nối** | Cần JWT Token đăng nhập để định danh `user_id`. Cần bắt các sự kiện click nút để gửi ngầm (silent trigger) lên backend. |
| **Tạo bài thi trắc nghiệm AI** | `POST /api/v1/quiz/generate` | [QuizPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/QuizPage/QuizPage.tsx) và nút "Tạo Quiz từ tài liệu này" ở [Detail.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/Detail/Detail.tsx) | Đã có sẵn giao diện (đang dùng mock client trong `quiz.ts`) | Hoàn thiện | **Chưa móc nối** | Bắt buộc tài liệu đó phải được xử lý và có các dòng trong bảng `document_chunks` của `ai_service_db`. |
| **Lấy đề thi trắc nghiệm** | `GET /api/v1/quiz/{quizId}` | [QuizPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/QuizPage/QuizPage.tsx) (Màn hình trả lời câu hỏi) | Đã có sẵn giao diện câu hỏi | Hoàn thiện | **Chưa móc nối** | Cần `quizId` được tạo từ lệnh sinh đề trước đó. |
| **Nộp bài & Chấm điểm tự động** | `POST /api/v1/quiz/{quizId}/submit` | [QuizPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/QuizPage/QuizPage.tsx) (Nút "Nộp bài quiz") | Đã có sẵn modal tính điểm trên RAM | Hoàn thiện | **Chưa móc nối** | Phụ thuộc vào JWT đăng nhập để lưu kết quả vào bảng `user_quiz_attempts` và cộng điểm tương tác `QUIZ_PRACTICE`. |
| **Lịch sử làm bài trắc nghiệm** | `GET /api/v1/quiz/history/me` | [ProfilePage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/ProfilePage/ProfilePage.tsx) hoặc Tab Lịch sử trên [QuizPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/QuizPage/QuizPage.tsx) | Chưa có khối giao diện hiển thị lịch sử quiz | Hoàn thiện | **Chưa móc nối** | Cần bổ sung UI bảng/thẻ lịch sử các lượt làm bài, điểm số đạt được, thời gian hoàn thành. |
| **Thẩm định tệp khi tải lên** | `POST /api/v1/documents/validate` | [UploadPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/UploadPage/UploadPage.tsx) (Bước 02: "Kiểm tra bản nháp") | Đã có bước 02 nhưng chỉ kiểm tra cục bộ ký tự file `%PDF-` | Hoàn thiện | **Chưa móc nối** | Phụ thuộc vào luồng đọc file PDF ở Frontend hoặc gửi file tạm lên backend để kiểm tra chất lượng tệp. |
| **Phân tách ngữ nghĩa (Chunking)** | `POST /api/v1/documents/{documentId}/process` | Luồng ngầm sau khi đăng tài liệu thành công | Chưa có UI (chạy ngầm) | Hoàn thiện (hỗ trợ cả REST API và Kafka Consumer) | **Chưa móc nối** | Cần tài liệu được lưu thành công trên `document-service` (cổng 8082), sau đó `document-service` bắn tin qua Kafka hoặc Frontend gọi API xử lý. |
| **Hỏi đáp bài giảng AI (RAG Chat)** | `POST /api/v1/chat/sessions` và `POST /api/v1/chat/{sessionId}/ask` | [Detail.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/Detail/Detail.tsx) (Hộp thoại Chatbot nổi bên cạnh trang tài liệu) | **Chưa có UI** (Chỉ có phần bình luận thông thường) | Hoàn thiện | **Chưa móc nối** | Cần thiết kế thêm một Drawer hoặc Widget "Hỏi trợ lý AI về tài liệu này" trong trang chi tiết tài liệu. |

---

## 3. PHÂN TÍCH QUAN HỆ PHỤ THUỘC ĐA TẦNG VÀ ĐIỀU KIỆN TIÊN QUYẾT

Khi xem xét mối liên kết giữa Frontend và Backend, cần nắm vững 4 chuỗi phụ thuộc cốt lõi sau:

### Phụ thuộc 1: Luồng Đăng và Thẩm định tài liệu (Upload & Validation Pipeline)
- **Vấn đề thực tế**:
  Trong [UploadPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/UploadPage/UploadPage.tsx), giao diện hiện tại chỉ thực hiện thẩm định giả định trên trình duyệt (kiểm tra đuôi file, đọc 5 byte đầu để thấy `%PDF-`), sau đó lưu nháp vào `localStorage` (`publishLocalDraft`), thông báo rõ: *"Tài liệu chưa được tải lên hoặc xuất bản"*.
- **Điều kiện để AI quét được file**:
  Backend `recommendation-service` đã có thuật toán thẩm định chuyên sâu tại [content_validator.py](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/services/recommendation-service/app/services/content_validator.py):
  1. Kiểm tra tài liệu có bị rỗng/file trắng không (dưới 50 từ).
  2. Kiểm tra spam ký tự vô nghĩa (tỷ lệ từ lặp lại bất thường).
  3. Kiểm tra bản quyền thương mại và dấu hiệu tài liệu cấm.
- **Để móc nối phần này cần có**:
  1. Frontend đọc trước văn bản hoặc tải file tạm lên `document-service` (cổng 8082).
  2. Frontend gọi `POST /api/v1/documents/validate` của cổng 8000.
  3. Khi đạt tiêu chuẩn chất lượng (Quality Score >= 60%), hệ thống mới cho phép người dùng bấm "Xuất bản chính thức".

### Phụ thuộc 2: Luồng Sinh Quiz và Hỏi đáp RAG (Quiz & Chat Dependency)
- **Vấn đề thực tế**:
  Một tài liệu không thể sinh câu hỏi trắc nghiệm hay trả lời thắc mắc nếu trong cơ sở dữ liệu `ai_service_db` chưa có dữ liệu tại bảng `document_chunks`.
- **Luồng dữ liệu bắt buộc**:
  ```text
  Người dùng tải PDF lên 
       --> document-service lưu file và metadata (cổng 8082)
       --> Bắn sự kiện DOCUMENT_UPLOADED qua Apache Kafka (Topic document-events)
       --> recommendation-service tiêu thụ tin nhắn (Kafka Consumer)
       --> Phân tích và chia nhỏ nội dung vào bảng document_chunks (cổng 8000)
       --> SẴN SÀNG để sinh AI Quiz (POST /quiz/generate) và Hỏi đáp RAG (POST /chat/sessions)
  ```
- **Giải pháp xử lý nhanh khi chưa có Kafka chạy đầy đủ**:
  Frontend có thể gọi trực tiếp REST API `POST /api/v1/documents/{documentId}/process` với nội dung văn bản `raw_text` hoặc `pages` để backend tạo chunks ngay lập tức.

### Phụ thuộc 3: Luồng Ghi nhận Tương tác và Cá nhân hóa (Interaction & Personalization Loop)
- **Vấn đề thực tế**:
  Muốn thuật toán gợi ý cá nhân hóa `GET /api/v1/recommendations/me` hoạt động chính xác (thay vì luôn rơi vào chế độ Cold-Start cho người mới), hệ thống cần lịch sử tương tác của người đó.
- **Luồng dữ liệu bắt buộc**:
  Mỗi khi người dùng bấm Thích bài viết, Lưu tài liệu, Tải xuống, hoặc hoàn thành một bài trắc nghiệm, Frontend phải tự động gửi một gói tin ngầm `POST /api/v1/interactions/log`. Backend sẽ lưu vào bảng `user_document_interactions` và tính điểm thưởng (Reward Score). Nhờ đó, lần tải trang tiếp theo của tab "Dành cho bạn" sẽ ưu tiên chính xác các chủ đề sinh viên đang quan tâm.

---

## 4. KẾ HOẠCH HÀNH ĐỘNG TỪNG BƯỚC (STEP-BY-STEP PLAN)

Kế hoạch được chia thành 4 giai đoạn logic, đảm bảo làm tới đâu kiểm thử được tới đó mà không làm xáo trộn các tính năng đang hoạt động ổn định:

### Giai đoạn 1: Móc nối toàn diện các luồng Gợi ý và Tương tác (Ưu tiên cao nhất)
*Mục tiêu: Hoàn thiện toàn bộ dữ liệu thật cho trang chủ và trang chi tiết tài liệu.*

1. **Bước 1.1 - Hoàn thiện tab "Dành cho bạn" trên HomePage**:
   - Mở rộng [recommendationService.ts](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/services/recommendationService.ts) để thêm hàm `fetchPersonalRecommendations(universityId, major, limit)`.
   - Kết nối với `useAuth()` trong [HomePage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/HomePage/HomePage.tsx) để truyền thông tin trường và chuyên ngành của sinh viên.
2. **Bước 1.2 - Móc nối tài liệu tương tự trên trang chi tiết (Detail.tsx)**:
   - Thêm hàm `fetchRelatedRecommendations(documentId, limit)` trong service.
   - Thay thế việc lọc mock tĩnh trong [Detail.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/Detail/Detail.tsx) tại khu vực *"Cùng môn, thêm một góc nhìn"*.
3. **Bước 1.3 - Tích hợp ghi nhận tương tác ngầm (Tracking Service)**:
   - Thêm hàm `logUserInteraction(documentId, type, duration, pages)` gửi tới `POST /api/v1/interactions/log`.
   - Gắn hàm vào các hành động thực tế: khi mở trang Detail (loại VIEW), khi bấm tim (loại LIKE), khi bấm lưu (loại BOOKMARK), khi bấm tải (loại DOWNLOAD).

### Giai đoạn 2: Móc nối Bộ công cụ Trắc nghiệm AI (AI Quiz & Assessment)
*Mục tiêu: Đưa tính năng sinh đề thi AI và chấm điểm thật từ backend lên giao diện Quiz.*

1. **Bước 2.1 - Thay thế hàm sinh câu hỏi mock bằng API backend**:
   - Thay thế hàm `generateQuizForDocument` trong [QuizPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/QuizPage/QuizPage.tsx) bằng lời gọi tới `POST /api/v1/quiz/generate`.
   - Hiển thị trạng thái đang tải (Loading Spinner) với thông điệp: *"Trí tuệ nhân tạo đang phân tích nội dung tài liệu để sinh câu hỏi..."*.
2. **Bước 2.2 - Móc nối nộp bài và nhận giải thích chuyên sâu**:
   - Khi người dùng bấm "Nộp bài", gửi toàn bộ câu trả lời lên `POST /api/v1/quiz/{quizId}/submit`.
   - Nhận về kết quả chấm điểm chính thức, số câu đúng/sai, kèm phần trích dẫn số trang và giải thích chi tiết từ tài liệu gốc.
3. **Bước 2.3 - Bổ sung giao diện xem lịch sử làm bài**:
   - Tạo thêm một tab hoặc bảng hiển thị dữ liệu từ `GET /api/v1/quiz/history/me` giúp sinh viên xem lại các lần luyện thi trước đây và tiến độ học tập.

### Giai đoạn 3: Móc nối Thẩm định tệp PDF khi đăng tài liệu (Upload & Content Validation)
*Mục tiêu: Sử dụng thuật toán AI của backend để kiểm tra chất lượng tệp ngay trong quá trình người dùng chuẩn bị tải tài liệu.*

1. **Bước 3.1 - Tích hợp kiểm tra bản nháp bằng API**:
   - Tại Bước 02 của [UploadPage.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/UploadPage/UploadPage.tsx), khi người dùng chọn xong file PDF và nhập thông tin, gửi yêu cầu tới `POST /api/v1/documents/validate`.
2. **Bước 3.2 - Hiển thị phiếu thẩm định chất lượng AI trực quan**:
   - Thay vì chỉ hiện dòng chữ xác nhận tĩnh, hiển thị các tiêu chí đã được backend chấm điểm:
     - Điểm chất lượng nội dung (Quality Score).
     - Kiểm tra file trắng / rỗng (Pass / Fail).
     - Kiểm tra mật độ từ khóa spam (Pass / Fail).
     - Trạng thái kiểm định bản quyền và từ ngữ nhạy cảm.
3. **Bước 3.3 - Phân tách chunks ngầm sau khi đăng**:
   - Khi tài liệu được xuất bản, kích hoạt endpoint `POST /api/v1/documents/{documentId}/process` để lập chỉ mục ngữ nghĩa ngay cho tài liệu mới tải lên.

### Giai đoạn 4: Thiết kế và tích hợp Trợ lý hỏi đáp bài giảng (RAG Academic Chatbot)
*Mục tiêu: Bổ sung tính năng mới giúp sinh viên trò chuyện và đặt câu hỏi trực tiếp với bài giảng.*

1. **Bước 4.1 - Xây dựng Widget Trợ lý AI trên trang Detail**:
   - Thiết kế một nút nổi (Floating Button) hoặc một Tab "Hỏi đáp AI" ngay cạnh cột thông tin tài liệu trong [Detail.tsx](file:///c:/Users/HP/Documents/studocu/project/decentralized-academic-network/frontend/src/pages/Detail/Detail.tsx).
2. **Bước 4.2 - Móc nối API phiên hỏi đáp (Chat Sessions)**:
   - Khi mở hộp thoại, gọi `POST /api/v1/chat/sessions` để khởi tạo ngữ cảnh gắn với `documentId`.
   - Khi sinh viên nhập câu hỏi, gọi `POST /api/v1/chat/{sessionId}/ask`.
   - Hiển thị câu trả lời của trợ lý kèm huy hiệu số trang trích dẫn (ví dụ: *Dẫn chứng từ Trang 3, Trang 12*).

---

## 5. TỔNG KẾT VÀ KHUYẾN NGHỊ THỰC HIỆN

- **Về tính độc lập**: Cả 3 microservice (`user-service`, `document-service`, `recommendation-service`) đều sử dụng chung một mã bí mật JWT (`JWT_SECRET_KEY`), cho phép các service tự giải mã và xác thực sinh viên mà không cần phụ thuộc mạng chéo.
- **Về an toàn hệ thống**: Mọi hàm gọi API từ Frontend đến Recommendation Service cần tuân thủ cấu trúc như đã làm ở tính năng "Đang thịnh hành": luôn có khối `try/catch`, có cơ chế timeout với `AbortSignal`, và tự động dự phòng dữ liệu lưu đệm khi máy chủ AI ngoại tuyến.
- **Thứ tự thực hiện đề xuất**: Bạn nên bắt đầu ngay từ **Giai đoạn 1** (Gợi ý cá nhân hóa & Ghi nhận tương tác), tiếp nối bằng **Giai đoạn 2** (AI Quiz), sau đó phối hợp cùng `document-service` để hoàn thiện **Giai đoạn 3** (Thẩm định tệp PDF khi đăng tải).
