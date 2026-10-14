# Web luyện bài tập Python — Tài liệu hệ thống (v0.2)

> Trạng thái: đã chốt các quyết định chính (mục 1–11). Còn một số điểm cần xác nhận ở mục 12.

## 1. Mục tiêu

Một web tĩnh (không server riêng, không đăng nhập) để sinh viên năm nhất luyện ~300 bài Python cơ bản, theo trải nghiệm giống LeetCode: đọc đề, viết hàm `solve(...)`, chạy thử, nộp bài chấm trên toàn bộ test case.

**Ngoài phạm vi (v1):** đăng nhập, bảng xếp hạng, diễn đàn, đồng bộ tiến độ qua cloud, chấm bài phía server, xem lời giải mẫu.

## 2. Các quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Kiểu bài | Dạng hàm như LeetCode: editor hiện sẵn `def solve(...)` với thân hàm trống/TODO |
| Nơi chạy Python | Trình duyệt người dùng (Pyodide/WebAssembly), không cần server |
| Ngôn ngữ giao diện | Tiếng Việt hoàn toàn |
| Người dùng | Sinh viên năm nhất đại học |
| Phong cách UI | Tối giản kiểu LeetCode |
| Nộp sai | Hiện input và đáp án mong đợi của test ẩn |
| Lời giải mẫu | **Không** hiển thị cho người học (chỉ dùng nội bộ để kiểm chứng test) |
| Thư viện Python | Chỉ thư viện chuẩn (`math`, `random`, …) |
| Hosting | Vercel (static) |
| Giấy phép nguồn bài | MIT (xem mục 6.5) |
| Thêm bài mới | Giao cho AI agent sinh dữ liệu (xem mục 6) |

## 3. Công nghệ

| Hạng mục | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | Vite + React + TypeScript | SPA thuần tĩnh |
| Chạy Python | Pyodide trong Web Worker | Pin phiên bản cố định, tải từ CDN jsDelivr |
| Code editor | CodeMirror 6 (`@uiw/react-codemirror`) | Nhẹ hơn Monaco, đủ tô màu và thụt lề |
| Routing | React Router (`BrowserRouter`) | Thêm `vercel.json` rewrite về `index.html` |
| State | Zustand (hoặc React Context) | Ứng dụng nhỏ |
| Style | Tailwind CSS | Có light/dark |
| Render đề bài | `react-markdown` | Đề viết bằng Markdown |
| Lưu trữ | `localStorage` | Xem mục 7 |
| Validate dữ liệu | Zod | Kiểm tra schema lúc build |
| Test | Vitest | Cho logic so sánh kết quả |

## 4. Kiến trúc và cách chấm

```
┌──────────────┐    postMessage     ┌──────────────────────┐
│  React UI    │ ◄────────────────► │  Web Worker          │
│  (editor,    │  {code, args}      │  Pyodide + harness   │
│   list, ...) │  {result, stdout}  │  gọi solve(*args)    │
└──────┬───────┘                    └──────────────────────┘
       │ import (build time)
┌──────▼────────────────────────────┐
│ content/problems/*.json (dữ liệu) │
└───────────────────────────────────┘
```

UI không chạy code người dùng trên main thread; luôn qua Worker.

### 4.1 Harness chạy hàm `solve`

Với mỗi lần chấm:
1. Worker `exec()` code người dùng trong namespace sạch, kiểm tra có hàm tên `solve`. Nếu không có → lỗi rõ ràng: "Không tìm thấy hàm `solve`".
2. Với mỗi test case: lấy `args` (mảng JSON), **deep copy** rồi gọi `solve(*args)`. Deep copy để hàm sửa tham số tại chỗ không ảnh hưởng test sau.
3. Thay `sys.stdout` bằng bộ đệm để bắt các lệnh `print` do người dùng gọi (hiển thị trong console như LeetCode, không ảnh hưởng kết quả chấm).
4. Chuyển giá trị trả về sang JSON. Nếu không chuyển được (ví dụ trả về `set`, object tự định nghĩa) → báo lỗi dễ hiểu.
5. Trả về `{ result, stdout, error?, timeMs }` cho UI; UI so sánh với `output` mong đợi.

### 4.2 Kiểu dữ liệu được hỗ trợ

Chỉ các kiểu biểu diễn được bằng JSON, đủ cho bài cơ bản:

| Python | JSON |
|---|---|
| `int`, `float` | number |
| `str` | string |
| `bool` | boolean |
| `list`, `tuple` | array (tuple trả về sẽ được xem như list) |
| `dict` (khóa là `str`) | object |
| `None` | null |

Lưu ý: bài dùng khóa `dict` không phải chuỗi, `set`, hoặc cấu trúc tự định nghĩa nằm ngoài phạm vi v1; nên đề bài được viết lại để dùng `list`.

### 4.3 So sánh kết quả

So sánh sâu (deep equal) giữa kết quả và `output`:

| `compare` | Hành vi |
|---|---|
| `exact` (mặc định) | Bằng nhau từng phần tử; số so theo giá trị (`3` và `3.0` coi như bằng) |
| `float` | Số thực so với sai số `epsilon` (mặc định `1e-6`) |
| `unordered` | Kết quả là list, so không phân biệt thứ tự phần tử (dùng khi đề cho phép nhiều thứ tự) |

### 4.4 Timeout và chống treo

- Mặc định **3 giây / test case** (có thể ghi đè theo bài bằng `timeLimitMs`).
- Cơ chế: main thread đặt timer; hết giờ thì `worker.terminate()` rồi khởi tạo Worker mới. Không dùng `SharedArrayBuffer` để tránh phải cấu hình header COOP/COEP.
- Khi nộp bài gặp timeout: dừng chấm, báo `Time Limit Exceeded` kèm test gây ra, các test chưa chạy ghi nhận "chưa chấm".
- Giới hạn kích thước `stdout` thu về (ví dụ 64 KB) để tránh `print` vô hạn làm đơ tab.

### 4.5 Tải Pyodide

- Pyodide nặng (~10 MB), tải một lần rồi được trình duyệt cache. Preload ngay khi vào trang chủ.
- Nút Chạy/Nộp bài hiển thị "Đang khởi động Python…" cho đến khi sẵn sàng.
- Tùy chọn sau này: Service Worker/PWA để dùng offline.

### 4.6 Kết quả chấm (verdict)

`Accepted` · `Wrong Answer` · `Runtime Error` · `Time Limit Exceeded`. Giao diện hiển thị tiếng Việt kèm nhãn tiếng Anh nhỏ.

Khi sai, hiển thị **test đầu tiên sai**, gồm:
- Input (dạng `tên_tham_số = giá_trị`, dễ đọc)
- Output mong đợi
- Output của bạn
- `print` của bạn (nếu có)
- Traceback rút gọn nếu là Runtime Error (bỏ các dòng thuộc harness, giữ số dòng trong code người dùng)

## 5. Mô hình dữ liệu bài tập

Mỗi bài là một file `content/problems/<id>.json`, id dạng `0001`, `0002`, … (sắp xếp và hiển thị theo id).

```ts
type Json = number | string | boolean | null | Json[] | { [k: string]: Json };

interface Problem {
  id: string;                    // "0001"
  slug: string;                  // "tinh-tong-hai-so"
  title: string;                 // Tên bài (tiếng Việt)
  description: string;           // Markdown: đề bài, ràng buộc
  difficulty: "easy" | "medium" | "hard";   // v1 hầu hết "easy"
  tags?: string[];               // ["vòng lặp", "chuỗi"]

  // Chữ ký hàm
  params: { name: string; type: string }[];  // type là gợi ý kiểu Python: "int", "list[int]", ...
  returnType: string;            // "int", "str", "list[int]", ...

  examples: Example[];           // 1–3 ví dụ hiển thị trong đề, dùng cho nút Chạy
  testCases: TestCase[];         // 20 test, dùng cho nút Nộp bài

  starterCode?: string;          // nếu bỏ trống: tự sinh từ params/returnType
  compare?: "exact" | "float" | "unordered";
  epsilon?: number;              // chỉ dùng khi compare = "float"
  timeLimitMs?: number;          // mặc định 3000
  source?: { name: string; url: string; license: "MIT" };
}

interface Example  { args: Json[]; output: Json; explanation?: string }
interface TestCase { args: Json[]; output: Json }
```

### 5.1 Code khởi tạo (tự sinh)

Nếu không có `starterCode`, hệ thống sinh từ chữ ký:

```python
def solve(a: int, b: int) -> int:
    # TODO: viết code của bạn ở đây
    pass
```

### 5.2 Quy ước test case

- `args` là mảng, thứ tự khớp `params`.
- 20 test gồm: các ví dụ trong đề + test biên (0, số âm, chuỗi rỗng, list rỗng, giá trị lớn…) + test ngẫu nhiên (sinh với `seed` cố định để tái lập được).
- Không trùng `args` giữa các test.
- Ví dụ hoàn chỉnh một bài:

```json
{
  "id": "0001",
  "slug": "tinh-tong-hai-so",
  "title": "Tính tổng hai số",
  "description": "Cho hai số nguyên `a` và `b`. Trả về tổng của chúng.",
  "difficulty": "easy",
  "params": [{ "name": "a", "type": "int" }, { "name": "b", "type": "int" }],
  "returnType": "int",
  "examples": [{ "args": [3, 5], "output": 8 }],
  "testCases": [
    { "args": [3, 5], "output": 8 },
    { "args": [-2, 2], "output": 0 }
  ]
}
```

(Bài thật có đủ 20 test.)

### 5.3 Lời giải mẫu

Đặt ở `content/solutions/<id>.py`, định nghĩa hàm `solve(...)`. **Không** đưa vào bundle web và không hiển thị cho người học; chỉ dùng cho bước kiểm chứng (mục 6.3).

## 6. Quy trình thêm bài mới bằng AI agent

### 6.1 Đầu vào
Một file `.md` hoặc mô tả tự do của bài (đề bài gốc, ví dụ nếu có).

### 6.2 Đầu ra bắt buộc của agent (cho mỗi bài)
1. `content/problems/<id>.json` theo schema mục 5. Đề bài viết lại bằng tiếng Việt, đã quy về dạng hàm `solve` với kiểu dữ liệu thuộc mục 4.2.
2. `content/solutions/<id>.py`: lời giải mẫu.
3. Danh sách `args` của 20 test (viết tay cho test biên, sinh ngẫu nhiên có seed cho phần còn lại). `output` được **tạo bằng cách chạy lời giải mẫu**, không để AI tự đoán.

### 6.3 Bước kiểm chứng tự động
`npm run validate` làm các việc sau, và lỗi thì không cho deploy:
1. Kiểm tra JSON đúng schema (Zod): đủ 20 test, số phần tử `args` khớp `params`, không trùng test.
2. Chạy `solutions/<id>.py` bằng CPython trên từng `args`, so với `output` đã ghi bằng đúng luật so sánh của mục 4.3. Phải khớp 100%.
3. Kiểm tra kết quả và `args` đều chuyển được sang JSON.
4. Kiểm tra id liên tục, slug không trùng, mỗi test chạy dưới giới hạn thời gian.

> Lời giải mẫu là "nguồn sự thật". Đáp án AI tự suy luận dễ sai, bước 2 sẽ bắt được.

### 6.4 Tài liệu đi kèm repo
- `docs/ADD_PROBLEM.md`: hướng dẫn và **prompt mẫu** để giao việc cho agent (mô tả schema, quy tắc test biên, 1–2 ví dụ hoàn chỉnh).
- `content/_template/`: bài mẫu để agent tham chiếu.

### 6.5 Bản quyền nội dung (MIT)
Giấy phép MIT cho phép dùng lại, chỉnh sửa và phân phối, với điều kiện giữ nguyên thông báo bản quyền và nội dung giấy phép của tác giả gốc. Việc cần làm:
- Thêm file `THIRD_PARTY_NOTICES.md` ở gốc repo, chứa thông báo bản quyền và toàn văn giấy phép MIT của repo `alexandercooper97/300-Python-Exercises` (copy từ file LICENSE của repo đó).
- Mỗi bài giữ trường `source` trỏ về bài gốc.
- Nên kiểm tra file LICENSE của repo nguồn để lấy đúng tên và năm bản quyền.

## 7. Lưu trữ tiến độ (localStorage)

Không đăng nhập; dữ liệu nằm trong trình duyệt của người học.

```ts
// key: "pyprac:v1"
interface Store {
  version: 1;
  problems: Record<string, {        // key = problem id
    status: "todo" | "in_progress" | "solved";
    draftCode?: string;             // code đang viết dở
    lastSubmission?: { verdict: string; passed: number; total: number; at: string };
    solvedAt?: string;              // ISO date
  }>;
}
```

Quy tắc trạng thái:
- **Chưa làm (`todo`)**: chưa mở hoặc chưa sửa gì.
- **Đang làm (`in_progress`)**: đã sửa code so với code khởi tạo, hoặc đã nộp nhưng chưa đạt.
- **Đã xong (`solved`)**: có một lần nộp qua 20/20 test. Đã `solved` thì không bị hạ trạng thái khi nộp lại sai.

Chi tiết:
- Tự động lưu nháp (debounce ~500 ms) để không mất bài khi tải lại trang.
- Bọc mọi thao tác `localStorage` trong `try/catch` (chế độ ẩn danh hoặc đầy bộ nhớ có thể lỗi).
- Tiến độ gắn với **từng trình duyệt/thiết bị**. Có nút **Xuất / Nhập tiến độ** (file JSON) để chuyển sang máy khác và nút **Xóa toàn bộ tiến độ** (có xác nhận).
- Có `version` để migrate dữ liệu sau này.

## 8. Giao diện

Tiếng Việt, tối giản kiểu LeetCode, hỗ trợ light/dark (mặc định theo hệ thống).

### 8.1 Trang chủ `/`
- Tiêu đề, thanh tiến độ tổng ("Đã xong 12/300").
- Bảng danh sách bài: `#`, tên bài, độ khó, biểu tượng trạng thái (○ chưa làm · ◐ đang làm · ✓ đã xong).
- Ô tìm kiếm theo tên, bộ lọc theo trạng thái.
- Nút "Tiếp tục" nhảy tới bài đang làm gần nhất (hoặc bài chưa làm đầu tiên).
- Không có đăng nhập, không có thông tin cá nhân.

### 8.2 Trang bài `/problem/:id`
Hai cột, có thể kéo chỉnh độ rộng (một cột trên màn hình hẹp).

- **Cột trái**: tab *Mô tả* (đề bài Markdown, ví dụ, ràng buộc) và tab *Kết quả nộp*.
- **Cột phải trên**: editor Python, hiện sẵn code khởi tạo (mục 5.1). Có nút *Đặt lại code*.
- **Cột phải dưới**: console với tab *Test case* (các ví dụ + thêm test tự nhập) và tab *Kết quả*.
- **Thanh điều hướng**: `← Bài trước` · `Về danh sách` · `Bài sau →`.
- **Nút hành động**:
  - **Chạy**: chạy trên các `examples` (và test do người học tự thêm), hiển thị từng case: input, output của bạn, output mong đợi, đúng/sai, `print` nếu có.
  - **Nộp bài**: chấm 20 test, hiện tiến độ `n/20`, verdict tổng và chi tiết test sai đầu tiên (mục 4.6).

### 8.3 Phím tắt
`Ctrl/Cmd + Enter` = Chạy · `Ctrl/Cmd + Shift + Enter` = Nộp bài.

### 8.4 Trạng thái cần xử lý
Đang tải Pyodide · đang chạy (có nút *Dừng*) · lỗi cú pháp (hiển thị số dòng) · thiếu hàm `solve` · hết giờ · bài không tồn tại (404 thân thiện).

### 8.5 Khả năng truy cập
Không chỉ dựa vào màu để phân biệt trạng thái (luôn kèm biểu tượng/chữ), tương phản đủ, điều hướng được bằng bàn phím.

## 9. Triển khai trên Vercel

Web là static site: sau khi build, toàn bộ nằm trên CDN của Vercel. **Máy của bạn tắt hay đóng thì người khác vẫn truy cập và làm bài bình thường**, vì máy của bạn chỉ dùng để chỉnh sửa và đẩy bản mới lên.

Hai cách deploy (chọn một):

| Cách | Quy trình | Ghi chú |
|---|---|---|
| A. Git + Vercel (khuyến nghị) | Đẩy code lên GitHub, kết nối repo với Vercel. Mỗi lần `git push` Vercel tự build và deploy | Có lịch sử phiên bản, rollback dễ, có bản preview cho mỗi nhánh |
| B. Vercel CLI | Chạy `vercel --prod` từ máy bạn | Nhanh, không cần GitHub, nhưng ít an toàn hơn về lịch sử |

Cấu hình:
- Preset Framework: Vite; build command `npm run build` (có chạy `validate` trước), output `dist`.
- `vercel.json`: rewrite mọi đường dẫn về `/index.html` để `BrowserRouter` hoạt động khi tải lại trang.
- Link mặc định có dạng `ten-du-an.vercel.app`; có thể gắn tên miền riêng sau.
- Gói Hobby (miễn phí) đủ cho nhu cầu này nếu dùng cá nhân/phi thương mại.

Lưu ý: vì tiến độ lưu trong trình duyệt (mục 7), mỗi học sinh có tiến độ riêng trên thiết bị của mình, bạn không xem được tiến độ của họ.

Lưu ý bảo mật nhẹ: test case và đáp án nằm trong bundle nên người rành kỹ thuật có thể xem qua DevTools. Chấp nhận được ở v1 vì không có bảng xếp hạng hay thi cử; lời giải mẫu thì không nằm trong bundle.

## 10. Cấu trúc thư mục

```
/
├─ content/
│  ├─ problems/        # 0001.json … 0300.json
│  ├─ solutions/       # 0001.py … (chỉ dùng kiểm chứng, không vào bundle)
│  └─ _template/
├─ docs/
│  └─ ADD_PROBLEM.md
├─ scripts/
│  ├─ validate.ts      # kiểm tra schema + chạy lời giải mẫu
│  └─ harness.py       # harness dùng chung cho CPython (validate)
├─ src/
│  ├─ components/      # Editor, ProblemPanel, ResultPanel, ProblemTable…
│  ├─ pages/           # Home, Problem, NotFound
│  ├─ lib/
│  │  ├─ grader.ts     # so sánh kết quả, tổng hợp verdict
│  │  ├─ starter.ts    # sinh starter code từ params/returnType
│  │  ├─ storage.ts    # đọc/ghi localStorage
│  │  └─ pyRunner.ts   # giao tiếp với Worker
│  ├─ workers/
│  │  └─ python.worker.ts
│  └─ main.tsx
├─ THIRD_PARTY_NOTICES.md
├─ vercel.json
└─ package.json
```

## 11. Yêu cầu phi chức năng và lộ trình

**Phi chức năng**
- Trình duyệt: Chrome, Edge, Firefox, Safari bản mới (2 năm gần nhất).
- Trang chủ tải dưới ~2 s trên mạng thường (không tính Pyodide, tải nền).
- Chạy một test thông thường dưới ~100 ms khi Pyodide đã sẵn sàng.
- Không gửi dữ liệu người dùng ra ngoài (không analytics ở v1).
- Code người dùng chạy trong Worker, không chạm DOM của trang.

**Lộ trình**

| Mốc | Nội dung |
|---|---|
| M1 | Khung dự án, Pyodide Worker, harness gọi `solve`, editor, nút Chạy |
| M2 | Schema, 5–10 bài mẫu, `validate`, nút Nộp bài (20 test) |
| M3 | Trang chủ, lưu tiến độ, lưu nháp, điều hướng trước/sau |
| M4 | Hoàn thiện UI (dark mode, responsive, phím tắt), xuất/nhập tiến độ |
| M5 | Quy trình AI agent + `ADD_PROBLEM.md`, nhập dần đủ 300 bài |
| M6 | Deploy Vercel, thử với sinh viên thật |

## 12. Câu hỏi còn mở

1. Các bài trong `01_Simple` có bài nào cần kiểu dữ liệu ngoài mục 4.2 (ví dụ `set`, `tuple` làm khóa, bài sửa list tại chỗ rồi không trả về gì) không?
2. Đợt đầu muốn làm bao nhiêu bài? Đề xuất: nhập 10 bài để chạy thử toàn bộ quy trình rồi mới mở rộng lên 300.
3. Tên bài và đề bài viết hoàn toàn tiếng Việt, hay giữ thêm tên tiếng Anh gốc trong `source`?
