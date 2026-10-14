# Python Practice (Python Challenge Me)

Trang web luyện tập lập trình thuật toán Python trực tuyến phong cách LeetCode dành cho sinh viên. Chạy thử nghiệm và chấm bài tự động 100% trên trình duyệt thông qua **WebAssembly Pyodide** (không cần backend server, không yêu cầu đăng nhập).

---

## 🌟 Tính Năng Nổi Bật

- **Giao diện chuẩn LeetCode**: Tối giản, trực quan, hỗ trợ chế độ Sáng / Tối (Dark / Light mode).
- **Thực thi an toàn trên WebAssembly (Pyodide)**:
  - Code Python người dùng chạy trong Web Worker độc lập, không block UI thread.
  - Tự động bắt stdout (`print`) hiển thị trong console.
  - Deep copy tham số đầu vào chống sửa dữ liệu giữa các test.
  - Cơ chế Timeout chống lặp vô hạn (3s/test case).
- **Chấm bài tự động**:
  - Nút **Chạy thử** (`Ctrl/Cmd + Enter`): Chạy trên các test case ví dụ & test case tự tạo.
  - Nút **Nộp bài** (`Ctrl/Cmd + Shift + Enter`): Chấm trên toàn bộ 20 test cases ẩn và test biên, trả về verdict (`Accepted`, `Wrong Answer`, `Runtime Error`, `Time Limit Exceeded`).
- **Trình soạn thảo CodeMirror 6**: Tô màu cú pháp Python, đánh số dòng, tự động thụt lề, tự động lưu nháp vào `localStorage`.
- **Quản lý tiến độ**: Tự động lưu tiến độ vào trình duyệt; hỗ trợ **Xuất / Nhập file JSON** và xóa dữ liệu tiến độ.
- **Hệ thống kiểm chứng tự động (CI/CD)**: Bộ script `scripts/validate.ts` kiểm tra schema Zod và đối chiếu 100% output qua file lời giải CPython trước khi build.

---

## 🚀 Cài Đặt Và Chạy Cục Bộ

### Yêu cầu
- Node.js >= 20
- Python 3

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Kiểm chứng toàn bộ bài tập (Zod + Python Harness)
```bash
npm run validate
```

### 3. Khởi chạy dev server
```bash
npm run dev
```
Truy cập `http://localhost:5173` trên trình duyệt.

### 4. Build bản production
```bash
npm run build
```

---

## 📁 Cấu Trúc Thư Mục

```
/
├─ content/
│  ├─ problems/        # Dữ liệu bài tập JSON (0001.json, 0002.json...)
│  ├─ solutions/       # Lời giải mẫu chuẩn Python (.py) dùng kiểm chứng
│  └─ _template/       # Bài tập mẫu cho agent
├─ docs/
│  └─ ADD_PROBLEM.md   # Hướng dẫn và prompt cho AI agent thêm bài
├─ scripts/
│  ├─ validate.ts      # Kiểm tra schema Zod & chạy harness CPython
│  ├─ harness.py       # Harness chạy lời giải đối chiếu output
│  └─ generate_starter_problems.py
├─ src/
│  ├─ components/      # Navbar, Editor, Result panels...
│  ├─ pages/           # Home (/), Problem (/problem/:id), NotFound
│  ├─ lib/
│  │  ├─ grader.ts     # Logic so sánh deep equal (exact, float, unordered)
│  │  ├─ starter.ts    # Tự sinh starter code def solve(...)
│  │  ├─ storage.ts    # Đọc/ghi localStorage & export/import
│  │  ├─ pyRunner.ts   # Giao tiếp với Web Worker & xử lý timeout
│  │  └─ problems.ts   # Glob import tĩnh các bài tập
│  ├─ store/           # Zustand store quản lý state & theme
│  ├─ workers/         # Web Worker nạp Pyodide & thực thi Python
│  └─ main.tsx
├─ THIRD_PARTY_NOTICES.md
├─ vercel.json         # SPA rewrite cho Vercel CDN
└─ package.json
```

---

## 🚢 Triển Khai Lên Vercel

Dự án là SPA tĩnh (Static Site). Toàn bộ code chạy trên trình duyệt người học:
1. Đẩy code lên GitHub:
   ```bash
   git add .
   git commit -m "feat: initial python practice platform"
   git push origin main
   ```
2. Đăng nhập Vercel, chọn **Add New Project** và liên kết với repository này.
3. Cấu hình build:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Bấm **Deploy**.
