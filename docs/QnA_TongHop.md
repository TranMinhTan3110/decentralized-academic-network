# TONG HOP KIEN THUC VA GIAI DAP THAC MAC DU AN

Tai lieu nay tong hop cac quyet dinh thiet ke kien truc va giai thich luong cong nghe cho do an Mang xa hoi tai lieu.

### 1. Tai sao dung Microservices ma khong gop chung?
- Doc lap ngon ngu (Polyglot): Core backend dung Java (Spring Boot) cho manh me, nhung mang AI thi bat buoc phai dung Python. Chia Microservices giup moi mang dung dung ngon ngu so truong.
- Khong dung code: Team 5 nguoi lam tren 5 thu muc khac nhau, luc Push len Github khong bao gio bi dung (conflict) code cua nhau.
- Tranh sap he thong day chuyen: Neu AI server (Python) bi sap hoac qua tai, tinh nang Dang nhap (Java User Service) van hoat dong binh thuong.

### 2. File ""phi tap trung"" (IPFS) hoat dong ra sao?
- Thay vi luu thang file PDF vao Database (lam phinh to DB) hoac luu vao AWS S3 (ton tien), he thong dung mang IPFS (thong qua Pinata).
- User day file PDF len mang IPFS -> IPFS tra ve mot chuoi ma bam (CID: Qm123...) -> Backend chi viec luu cai ma CID nay vao bang Documents trong PostgreSQL.
- Khi tai, ghep link: https://ipfs.io/ipfs/{CID} la tai duoc tu mang luoi P2P.

### 3. Kafka dung de lam gi trong du an nay?
- Dung lam Message Queue (Hang doi tin nhan bat dong bo).
- Luong: Khi User vua an tai 1 tai lieu o document-service (Java), no se quang 1 tin nhan vao Kafka (noi dung: ""User A vua doc Doc B""). document-service lam xong nhiem vu va di phuc vu nguoi khac, rat nhe nhang. Luc nay recommendation-service (Python) nam doi san, keo tin nhan do tu Kafka ve va dua vao thuat toan Machine Learning de hoc. Nho Kafka, Java va Python khong can goi cho nhau (Decoupling).

### 4. Code Coverage 90% lam sao dat duoc?
- Theo cau truc du an, ma test (Unit Test, Integration Test) nam chung trong thu muc code cua tung service (Thu muc test/ cua Java hoac tests/ cua React).
- Cau hinh file jest.config.js hoac cau hinh JaCoCo (cua Java) loai bo (exclude) cac file cau hinh. Chi tap trung test cac file xu ly logic (Service, Controller).
- Khi day code len GitHub, file .github/workflows/ci-cd.yml se tu dong chay lenh test. Bat ky ai luoi viet test lam diem rot duoi 90% se bi GitHub chan dung nut Merge.

### 5. TypeScript la FE hay BE? Tai sao dung?
- No la ngon ngu nang cap cua JavaScript (Co dinh nghia chat che Kieu du lieu - Type). 
- Dung duoc cho ca Frontend va Backend. Trong du an nay, no dung cho Frontend (React). 
- Loi ich: Tranh loi vat luc chay (Runtime Error) do gan sai kieu du lieu, VS Code tu dong bat loi ngay luc dang go phim.

### 6. Cau truc Testing Dam bao vuot mon Kiem Thu
He thong bo tri 5 loai Test dung chuan doanh nghiep:
1. Unit Test: Test ham logic (Nam an ben trong tung service).
2. Integration Test: Test tich hop voi DB gia lap (Nam an ben trong tung service).
3. API Test: Chay tu dong REST API bang Postman/Newman (Nam o api-tests/).
4. E2E Test (UI): Dung Cypress mo Chrome mo phong thao tac click chuot cua user (Nam o e2e-tests/).
5. Performance Test: Dung k6/JMeter ban 500 requests/giay de do tai chiu dung (Nam o performance-tests/).
