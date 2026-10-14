# Hướng Dẫn Thêm Bài Tập Mới (AI Agent Guide)

Tài liệu này dùng để giao nhiệm vụ cho AI agent hoặc đóng góp thêm bài tập mới vào hệ thống.

## 1. Yêu Cầu Đầu Ra Của Mỗi Bài Tập

Mỗi bài tập có ID gồm 4 chữ số (ví dụ: `0011`, `0012`...) và cần tạo 2 file:
1. `content/problems/<id>.json`: Chứa metadata, đề bài Markdown (tiếng Việt), chữ ký hàm, ví dụ, và chính xác 20 test cases.
2. `content/solutions/<id>.py`: Chứa lời giải mẫu chuẩn bằng Python với hàm `def solve(...)`.

## 2. Cấu Trúc Schema `Problem`

```json
{
  "id": "0001",
  "slug": "tinh-tong-hai-so",
  "title": "Tính tổng hai số",
  "description": "Cho hai số nguyên `a` và `b`. Trả về tổng của hai số đó.\n\n### Ràng buộc:\n- `-10^9 <= a, b <= 10^9`",
  "difficulty": "easy",
  "tags": ["toán tử", "cơ bản"],
  "params": [
    { "name": "a", "type": "int" },
    { "name": "b", "type": "int" }
  ],
  "returnType": "int",
  "examples": [
    {
      "args": [3, 5],
      "output": 8,
      "explanation": "3 + 5 = 8"
    }
  ],
  "testCases": [
    { "args": [3, 5], "output": 8 },
    ... (đủ 20 test cases)
  ],
  "compare": "exact",
  "timeLimitMs": 3000
}
```

## 3. Quy Tắc So Soạn Test Cases (Bắt buộc đủ 20 test cases)
1. **Ví dụ đề bài**: 1–3 test đầu tiên lấy từ `examples`.
2. **Test biên (Edge Cases)**: 0, số âm, số lớn, chuỗi rỗng `""`, danh sách rỗng `[]`, danh sách 1 phần tử, v.v.
3. **Test ngẫu nhiên/đa dạng**: Các giá trị ngẫu nhiên có độ phủ cao.
4. **Không trùng lặp**: Các `args` trong 20 test cases không được trùng nhau hoàn toàn.
5. **Nguồn sự thật**: Trường `output` phải được sinh ra từ chính file lời giải `content/solutions/<id>.py` khi chạy qua harness.

## 4. Prompt Mẫu Giao Việc Cho AI Agent

```text
Dựa trên bài tập sau: [Mô tả hoặc link bài tập gốc]
Hãy chuyển đổi thành bài tập cho Web Python Practice theo đúng chuẩn:
1. Viết đề bài hoàn toàn bằng tiếng Việt, rõ ràng, có phần ví dụ và ràng buộc.
2. Quy định chữ ký hàm `solve(...)` rõ ràng kiểu dữ liệu params và returnType.
3. Viết code lời giải mẫu chuẩn trong file content/solutions/<id>.py.
4. Tạo file content/problems/<id>.json với đúng 20 test cases gồm test cơ bản, test biên và test ngẫu nhiên.
```
