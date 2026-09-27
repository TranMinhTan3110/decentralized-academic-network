# Decentralized Academic Network

Mạng xã hội chia sẻ tài liệu học thuật phi tập trung tích hợp Hệ thống Khuyến nghị (Recommendation System) bằng AI.

## Kien truc He thong (Microservices)
Du an duoc xay dung theo kien truc Microservices va API-First Design, chia lam cac khoi doc lap:
- Frontend (Web App): ReactJS + TypeScript + Vite
- API Gateway: Spring Cloud Gateway (Cua ngo dinh tuyen)
- User Service: Java Spring Boot (Quan ly tai khoan, Auth)
- Document Service: Java Spring Boot (Quan ly metadata, ket noi mang IPFS luu file)
- Recommendation Service: Python FastAPI (Tri tue nhan tao goi y tai lieu)
- Ha tang (DevOps): PostgreSQL, Kafka, Docker, GitHub Actions

## Cau truc Thu muc (Monorepo)
- frontend/: Source code giao dien web.
- api-gateway/: Cong chuyen huong API duy nhat.
- services/: Chua cac Microservices doc lap (user, document, recommendation).
- infrastructure/: Chua file docker-compose.yml dung ha tang (DB, Kafka).
- tests/ (e2e-tests, api-tests, performance-tests): Noi chua cac script tu dong hoa kiem thu.
- docs/: Tai lieu Test Plan, RTM, Swagger API.

---

## Huong dan Khoi dong cho Team (Onboarding)

Sau khi keo (Pull) code tu nhanh main ve may, moi nguoi chi can lam theo huong dan cua mang minh phu trach:

### 1. Danh cho DevOps / Database
- Yeu cau: Da cai dat Docker Desktop.
- Mo Terminal, tro vao: cd infrastructure
- Chay lenh: docker-compose up -d
- (Ket qua: Database PostgreSQL va Kafka se tu dong chay ngam o background).

### 2. Danh cho Frontend (React)
- Mo Terminal, tro vao: cd frontend
- Cai dat thu vien: npm install
- Chay web len xem: npm run dev

### 3. Danh cho Backend (Java)
- Dung IntelliJ / VS Code mo truc tiep thu muc cua service ban lam (VD: services/user-service).
- IDE se tu dong tai thu vien Maven ve.
- Mo file Application chinh va bam Run.

### 4. Danh cho AI (Python)
- Mo Terminal, tro vao: cd services/recommendation-service
- Tai thu vien: pip install -r requirements.txt
- Chay server AI: uvicorn main:app --reload

---

## Luong lam viec (Git Workflow)
1. Tuyet doi KHONG push thang len nhanh main.
2. Tao nhanh moi de lam tinh nang: git checkout -b feature/ten-tinh-nang.
3. Code xong, Push nhanh do len va tao Pull Request (PR).
4. Cho con Bot GitHub Actions (CI) chay tu dong. Neu Code Coverage < 90% hoac Test vang loi -> Bi chan khong cho Merge.
5. Can it nhat 1 nguoi trong team vao Review Code va Approve moi duoc gop vao main.
