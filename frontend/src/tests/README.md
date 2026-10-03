# Tài Liệu Mô Tả Hệ Thống Unit Test (Frontend)

Tài liệu này mô tả chi tiết các bộ unit test (Test Suites) hiện có trong thư mục `src/tests/` của ứng dụng Frontend.

---

## 1. Tổng Quan Kỹ Thuật (Tech Stack & Config)

- **Test Runner:** [Vitest](https://vitest.dev/)
- **Testing Library:** `@testing-library/react`, `@testing-library/user-event`
- **DOM Matchers:** `@testing-library/jest-dom` (được cấu hình mở rộng type assertions trong `src/tests/setup.ts`)
- **Environment:** `jsdom`
- **Lệnh thực thi:**
  - `npm run test` (Chạy tất cả test suite một lần và báo cáo kết quả)
  - `npx vitest` (Chạy ở chế độ watch mode khi phát triển)

---

## 2. Cấu Trúc Thư Mục Test

```text
src/tests/
├── setup.ts                    # Cấu hình môi trường test & jest-dom matchers
├── components/                 # Unit test cho các Reusable Component & Layout Component
│   ├── Avatar.test.tsx
│   ├── Button.test.tsx
│   ├── Header.test.tsx
│   ├── Input.test.tsx
│   └── Sidebar.test.tsx
├── pages/                      # Smoke test kiểm tra sự tồn tại của các trang
│   └── Pages.test.tsx
└── routes/                     # Unit test kiểm tra cấu hình định tuyến (routes config)
    └── routes.config.test.tsx
```

---

## 3. Chi Tiết Các Test Suite

### 3.1. Reusable Components (`src/tests/components/`)

#### `Button.test.tsx` (4 tests)
Kiểm tra thành phần Nút bấm (`Button`):
1. **Render & Children:** Hiển thị đúng văn bản nội dung được truyền vào (children).
2. **Biến thể & Kích thước (Variants & Sizes):** Áp dụng đúng các class CSS Tailwind tương ứng khi dùng `variant="outline"` hoặc `size="lg"`.
3. **Sự kiện Click:** Gọi hàm callback `onClick` khi người dùng bấm chuột.
4. **Trạng thái Disabled / Loading:** Nút bị vô hiệu hóa khi `disabled={true}` hoặc khi đang ở trạng thái tải dữ liệu `isLoading={true}` (hiển thị hiệu ứng loading spinner).

#### `Input.test.tsx` (4 tests)
Kiểm tra thành phần Ô nhập liệu (`Input`) và Ô tìm kiếm (`SearchInput`):
1. **Hiển thị & Nhập liệu (`onChange`):** Cập nhật đúng giá trị người dùng gõ vào ô input.
2. **Nhãn & Câu báo lỗi (`label` & `error`):** Hiển thị đúng nhãn mô tả và thông báo lỗi validation nếu có.
3. **Trạng thái Disabled:** Không cho phép thao tác nhập dữ liệu khi `disabled={true}`.
4. **Component `SearchInput`:** Phát sự kiện `onSearchSubmit` khi người dùng gõ từ khóa và ấn Submit/Enter form.

#### `Avatar.test.tsx` (2 tests)
Kiểm tra thành phần Ảnh đại diện (`Avatar`):
1. **Render Ảnh (`src`):** Hiển thị thẻ `<img>` với URL hình ảnh chính xác.
2. **Ký tự viết tắt (`fallback`):** Hiển thị đúng văn bản đại diện (ví dụ: chữ cái đầu của tên) khi không có ảnh `src`.

---

### 3.2. Layout Components (`src/tests/components/`)

#### `Header.test.tsx` (3 tests)
Kiểm tra thanh Header điều hướng phía trên:
1. **Thanh tìm kiếm (Search Bar):** Hiển thị ô tìm kiếm tài liệu với placeholder chỉ dẫn.
2. **Breadcrumb navigation:** Đảm bảo hiển thị đúng phân cấp vị trí trang người dùng đang đứng.
3. **Nút hành động (Actions):** Hiển thị các nút truy cập Hồ sơ / Đăng nhập và nút Tải tài liệu lên hệ thống.

#### `Sidebar.test.tsx` (5 tests)
Kiểm tra thanh Menu bên hông (`Sidebar`):
1. **Logo & Tagline:** Render đúng thương hiệu `"mục lục"` và khẩu hiệu `"MỘT NƠI CHO VIỆC HỌC"`.
2. **Liên kết điều hướng (Nav Links):** Render đủ 8 liên kết trang chính trong thẻ `<nav>` (`Home`, `Khám phá`, `Recent`, `Library`, `Hồ sơ`, `Cài đặt`, `Bảng xếp hạng`, `Quiz`).
3. **Nổi bật trang hiện tại (Active Link State):** Link tương ứng với tuyến đường hiện tại (ví dụ `/explore`) sẽ nhận class nổi bật (`bg-[#1f3a5f] text-white`).
4. **Huy hiệu số lượng đã lưu (`savedCount`):** Hiển thị badge con số cạnh mục Thư viện khi truyền prop `savedCount={5}`.
5. **Card đóng góp tài liệu:** Hiển thị card kêu gọi đóng góp *"GÓP MỘT TRANG HAY"* với liên kết trỏ chính xác về `/upload`.

---

### 3.3. Pages (`src/tests/pages/`)

#### `Pages.test.tsx` (8 tests)
Thực hiện **Smoke Test** kiểm tra quá trình Render ban đầu của 8 trang trong ứng dụng để đảm bảo không trang nào bị lỗi gãy (crash) DOM:
1. `HomePage`
2. `ExplorePage`
3. `LibraryPage`
4. `ProfilePage`
5. `SettingsPage`
6. `LeaderboardPage`
7. `UploadPage`
8. `LoginPage`

---

### 3.4. Routes (`src/tests/routes/`)

#### `routes.config.test.tsx` (3 tests)
Thử nghiệm cấu hình lộ trình (Routing Configuration):
1. **Tài nguyên Route:** Đảm bảo danh sách `routesConfig` khai báo đầy đủ thông tin `path`, `label`, `element` và `icon`.
2. **Bộ lọc Menu Navigation (`navRoutes`):** Đảm bảo hàm lọc loại bỏ chính xác các route không dùng hiển thị trên Sidebar (như `/upload` hoặc `/login`).
3. **Cấu hình Public/Private:** Kiểm tra tính hợp lệ của cờ bảo mật trên từng tuyến đường.

---

## 4. Tóm Tắt Kết Quả Chạy Kiểm Thử (Latest Test Execution)

```bash
 Test Files  7 passed (7)
      Tests  29 passed (29)
   Start at  14:54:33
   Duration  1.91s
```
