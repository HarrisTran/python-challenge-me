import os
import json
import random
import math
from collections import Counter

os.makedirs("content/problems", exist_ok=True)
os.makedirs("content/solutions", exist_ok=True)

problems = []

# Problem 0001: Tinh tong hai so
p1_sol = """def solve(a: int, b: int) -> int:
    return a + b
"""
with open("content/solutions/0001.py", "w", encoding="utf-8") as f:
    f.write(p1_sol)

p1_tests_args = [
    [3, 5], [-2, 2], [0, 0], [10, -5], [-7, -3],
    [100, 200], [999999, 1], [-500000, 500000], [42, -42], [1, 0],
    [0, -1], [12345, 67890], [-9876, 5432], [1000000, 2000000], [-1000000, -2000000],
    [77, 33], [-15, 100], [888, -888], [17, 23], [-50, -50]
]
p1_cases = [{"args": a, "output": a[0] + a[1]} for a in p1_tests_args]
p1 = {
    "id": "0001",
    "slug": "tinh-tong-hai-so",
    "title": "Tính tổng hai số",
    "description": "Cho hai số nguyên `a` và `b`. Hãy viết hàm trả về tổng của hai số đó.\n\n### Ví dụ:\n- `a = 3, b = 5` ➔ Kết quả: `8`\n- `a = -2, b = 2` ➔ Kết quả: `0`\n\n### Ràng buộc:\n- `-10^9 <= a, b <= 10^9`",
    "difficulty": "easy",
    "tags": ["toán tử", "cơ bản"],
    "params": [{"name": "a", "type": "int"}, {"name": "b", "type": "int"}],
    "returnType": "int",
    "examples": [
        {"args": [3, 5], "output": 8, "explanation": "3 + 5 = 8"},
        {"args": [-2, 2], "output": 0, "explanation": "-2 + 2 = 0"}
    ],
    "testCases": p1_cases,
    "compare": "exact"
}
with open("content/problems/0001.json", "w", encoding="utf-8") as f:
    json.dump(p1, f, ensure_ascii=False, indent=2)


# Problem 0002: Kiem tra so chan le
p2_sol = """def solve(n: int) -> bool:
    return n % 2 == 0
"""
with open("content/solutions/0002.py", "w", encoding="utf-8") as f:
    f.write(p2_sol)

p2_tests_args = [
    [4], [7], [0], [-2], [-3],
    [100], [101], [-1000], [-999], [2],
    [1], [-1], [888888], [777777], [2024],
    [2025], [-44], [99], [10], [13]
]
p2_cases = [{"args": a, "output": a[0] % 2 == 0} for a in p2_tests_args]
p2 = {
    "id": "0002",
    "slug": "kiem-tra-so-chan-le",
    "title": "Kiểm tra số chẵn lẻ",
    "description": "Cho một số nguyên `n`. Hãy kiểm tra xem `n` có phải là số chẵn hay không. Trả về `True` nếu là số chẵn, ngược lại trả về `False`.\n\n### Ví dụ:\n- `n = 4` ➔ Kết quả: `True`\n- `n = 7` ➔ Kết quả: `False`\n\n### Ràng buộc:\n- `-10^9 <= n <= 10^9`",
    "difficulty": "easy",
    "tags": ["điều kiện", "cơ bản"],
    "params": [{"name": "n", "type": "int"}],
    "returnType": "bool",
    "examples": [
        {"args": [4], "output": True, "explanation": "4 chia hết cho 2 nên là số chẵn"},
        {"args": [7], "output": False, "explanation": "7 chia 2 dư 1 nên là số lẻ"}
    ],
    "testCases": p2_cases,
    "compare": "exact"
}
with open("content/problems/0002.json", "w", encoding="utf-8") as f:
    json.dump(p2, f, ensure_ascii=False, indent=2)


# Problem 0003: Tim so lon nhat trong ba so
p3_sol = """def solve(a: int, b: int, c: int) -> int:
    return max(a, b, c)
"""
with open("content/solutions/0003.py", "w", encoding="utf-8") as f:
    f.write(p3_sol)

p3_tests_args = [
    [1, 5, 3], [-10, -2, -5], [7, 7, 7], [0, 0, 1], [-1, 0, 1],
    [100, 50, 20], [10, 99, 50], [5, 10, 80], [-5, -10, -20], [0, -5, -1],
    [42, 42, 10], [15, 30, 30], [50, 20, 50], [1000000, 999999, 500000], [-999999, -1000000, 0],
    [12, 18, 14], [9, 3, 6], [-100, -200, -50], [8, 8, 2], [3, 9, 9]
]
p3_cases = [{"args": a, "output": max(a)} for a in p3_tests_args]
p3 = {
    "id": "0003",
    "slug": "tim-so-lon-nhat-trong-ba-so",
    "title": "Tìm số lớn nhất trong ba số",
    "description": "Cho ba số nguyên `a`, `b`, và `c`. Hãy tìm và trả về giá trị lớn nhất trong ba số đó.\n\n### Ví dụ:\n- `a = 1, b = 5, c = 3` ➔ Kết quả: `5`\n- `a = -10, b = -2, c = -5` ➔ Kết quả: `-2`\n\n### Ràng buộc:\n- `-10^9 <= a, b, c <= 10^9`",
    "difficulty": "easy",
    "tags": ["điều kiện", "cơ bản"],
    "params": [{"name": "a", "type": "int"}, {"name": "b", "type": "int"}, {"name": "c", "type": "int"}],
    "returnType": "int",
    "examples": [
        {"args": [1, 5, 3], "output": 5, "explanation": "5 lớn hơn 1 và 3"},
        {"args": [-10, -2, -5], "output": -2, "explanation": "-2 lớn nhất trong các số âm"}
    ],
    "testCases": p3_cases,
    "compare": "exact"
}
with open("content/problems/0003.json", "w", encoding="utf-8") as f:
    json.dump(p3, f, ensure_ascii=False, indent=2)


# Problem 0004: Tinh giai thua
p4_sol = """import math
def solve(n: int) -> int:
    return math.factorial(n)
"""
with open("content/solutions/0004.py", "w", encoding="utf-8") as f:
    f.write(p4_sol)

p4_tests_args = [[i] for i in range(16)] + [[2], [3], [4], [5]]  # Make 20 distinct? Need unique args
# Let's make 16 from 0 to 15, wait - spec says "Không trùng args giữa các test"!
# For n in 0..15 there are only 16 integers. But we need 20 tests.
# Wait, can n be up to 19? 19! = 121645100408832000, Python handles arbitrary size integers easily!
p4_tests_args = [[i] for i in range(20)]
p4_cases = [{"args": a, "output": math.factorial(a[0])} for a in p4_tests_args]
p4 = {
    "id": "0004",
    "slug": "tinh-giai-thua",
    "title": "Tính giai thừa",
    "description": "Cho số nguyên không âm `n`. Hãy tính và trả về giai thừa của `n` (ký hiệu là `n!`).\nBiết rằng:\n- `0! = 1`\n- `n! = 1 * 2 * 3 * ... * n` (với `n >= 1`)\n\n### Ví dụ:\n- `n = 0` ➔ Kết quả: `1`\n- `n = 5` ➔ Kết quả: `120`\n\n### Ràng buộc:\n- `0 <= n <= 20`",
    "difficulty": "easy",
    "tags": ["vòng lặp", "toán tử"],
    "params": [{"name": "n", "type": "int"}],
    "returnType": "int",
    "examples": [
        {"args": [0], "output": 1, "explanation": "0! = 1 theo quy ước"},
        {"args": [5], "output": 120, "explanation": "5! = 1 * 2 * 3 * 4 * 5 = 120"}
    ],
    "testCases": p4_cases,
    "compare": "exact"
}
with open("content/problems/0004.json", "w", encoding="utf-8") as f:
    json.dump(p4, f, ensure_ascii=False, indent=2)


# Problem 0005: Dao nguoc chuoi
p5_sol = """def solve(s: str) -> str:
    return s[::-1]
"""
with open("content/solutions/0005.py", "w", encoding="utf-8") as f:
    f.write(p5_sol)

p5_tests_args = [
    ["hello"], ["python"], [""], ["a"], ["racecar"],
    ["12345"], ["Hello World!"], ["  spaces  "], ["ab"], ["xyz"],
    ["vietnam"], ["OpenAI"], ["LeetCode"], ["A man, a plan"], ["special #@$"],
    ["k"], ["noon"], ["abcdefghijklmnopqrstuvwxyz"], ["---===---"], ["Python Challenge"]
]
p5_cases = [{"args": a, "output": a[0][::-1]} for a in p5_tests_args]
p5 = {
    "id": "0005",
    "slug": "dao-nguoc-chuoi",
    "title": "Đảo ngược chuỗi",
    "description": "Cho một chuỗi ký tự `s`. Hãy trả về chuỗi đảo ngược của `s`.\n\n### Ví dụ:\n- `s = \"hello\"` ➔ Kết quả: `\"olleh\"`\n- `s = \"python\"` ➔ Kết quả: `\"nohtyp\"`\n\n### Ràng buộc:\n- `0 <= len(s) <= 1000`",
    "difficulty": "easy",
    "tags": ["chuỗi", "cơ bản"],
    "params": [{"name": "s", "type": "str"}],
    "returnType": "str",
    "examples": [
        {"args": ["hello"], "output": "olleh", "explanation": "Đảo ngược hello thành olleh"},
        {"args": ["python"], "output": "nohtyp", "explanation": "Đảo ngược python thành nohtyp"}
    ],
    "testCases": p5_cases,
    "compare": "exact"
}
with open("content/problems/0005.json", "w", encoding="utf-8") as f:
    json.dump(p5, f, ensure_ascii=False, indent=2)


# Problem 0006: Dem so nguyen am
p6_sol = """def solve(s: str) -> int:
    vowels = set("aeiouAEIOU")
    return sum(1 for c in s if c in vowels)
"""
with open("content/solutions/0006.py", "w", encoding="utf-8") as f:
    f.write(p6_sol)

def count_vowels(s: str) -> int:
    return sum(1 for c in s if c in set("aeiouAEIOU"))

p6_tests_args = [
    ["Hello World"], ["Python"], [""], ["aeiou"], ["AEIOU"],
    ["rhythm"], ["bcdfg"], ["Programming is fun"], ["A quick brown fox"], ["12345!@#"],
    ["Beautiful"], ["Education"], ["QUEUE"], ["sky"], ["Algorithms and Data Structures"],
    ["xyz"], ["onomatopoeia"], ["Ha Noi"], ["Open Source"], ["Test case number twenty"]
]
p6_cases = [{"args": a, "output": count_vowels(a[0])} for a in p6_tests_args]
p6 = {
    "id": "0006",
    "slug": "dem-so-nguyen-am",
    "title": "Đếm số nguyên âm",
    "description": "Cho một chuỗi ký tự `s`. Hãy đếm tổng số nguyên âm tiếng Anh xuất hiện trong chuỗi (gồm các chữ cái `'a', 'e', 'i', 'o', 'u'`, không phân biệt chữ hoa hay chữ thường).\n\n### Ví dụ:\n- `s = \"Hello World\"` ➔ Kết quả: `3` (gồm 'e', 'o', 'o')\n- `s = \"Python\"` ➔ Kết quả: `1` (gồm 'o')\n\n### Ràng buộc:\n- `0 <= len(s) <= 1000`",
    "difficulty": "easy",
    "tags": ["chuỗi", "vòng lặp"],
    "params": [{"name": "s", "type": "str"}],
    "returnType": "int",
    "examples": [
        {"args": ["Hello World"], "output": 3, "explanation": "Có 3 nguyên âm: 'e', 'o', 'o'"},
        {"args": ["Python"], "output": 1, "explanation": "Có 1 nguyên âm: 'o'"}
    ],
    "testCases": p6_cases,
    "compare": "exact"
}
with open("content/problems/0006.json", "w", encoding="utf-8") as f:
    json.dump(p6, f, ensure_ascii=False, indent=2)


# Problem 0007: Kiem tra chuoi doi xung
p7_sol = """def solve(s: str) -> bool:
    return s == s[::-1]
"""
with open("content/solutions/0007.py", "w", encoding="utf-8") as f:
    f.write(p7_sol)

p7_tests_args = [
    ["radar"], ["python"], [""], ["a"], ["level"],
    ["noon"], ["12321"], ["12345"], ["racecar"], ["madam"],
    ["hello"], ["abba"], ["abcba"], ["abccba"], ["abcde"],
    ["kayak"], ["rotator"], ["step on no pets"], ["top spot"], ["A"]
]
p7_cases = [{"args": a, "output": a[0] == a[0][::-1]} for a in p7_tests_args]
p7 = {
    "id": "0007",
    "slug": "kiem-tra-chuoi-doi-xung",
    "title": "Kiểm tra chuỗi đối xứng (Palindrome)",
    "description": "Một chuỗi được gọi là chuỗi đối xứng (Palindrome) nếu đọc từ trái sang phải hay từ phải sang trái đều giống nhau.\nCho chuỗi ký tự `s`. Trả về `True` nếu `s` là chuỗi đối xứng, ngược lại trả về `False`.\n\n### Ví dụ:\n- `s = \"radar\"` ➔ Kết quả: `True`\n- `s = \"python\"` ➔ Kết quả: `False`\n\n### Ràng buộc:\n- `0 <= len(s) <= 1000`",
    "difficulty": "easy",
    "tags": ["chuỗi", "cơ bản"],
    "params": [{"name": "s", "type": "str"}],
    "returnType": "bool",
    "examples": [
        {"args": ["radar"], "output": True, "explanation": "radar đọc ngược lại vẫn là radar"},
        {"args": ["python"], "output": False, "explanation": "python đọc ngược lại là nohtyp"}
    ],
    "testCases": p7_cases,
    "compare": "exact"
}
with open("content/problems/0007.json", "w", encoding="utf-8") as f:
    json.dump(p7, f, ensure_ascii=False, indent=2)


# Problem 0008: Tinh tong danh sach
p8_sol = """def solve(nums: list[int]) -> int:
    return sum(nums)
"""
with open("content/solutions/0008.py", "w", encoding="utf-8") as f:
    f.write(p8_sol)

p8_tests_args = [
    [[1, 2, 3, 4, 5]], [[]], [[10]], [[-1, -2, -3]], [[-5, 5]],
    [[100, 200, 300]], [[0, 0, 0, 0]], [[1, -1, 2, -2, 3, -3]], [[42]], [[-99]],
    [[5, 10, 15, 20, 25]], [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], [[-10, 20, -30, 40]],
    [[12, 34, 56, 78]], [[999, 1, -1000]], [[2, 4, 6, 8, 10]], [[3, 5, 7, 9]],
    [[1000, -500, 250]], [[-7, -8, -9, 24]], [[100, -100, 50, -50, 0]]
]
p8_cases = [{"args": a, "output": sum(a[0])} for a in p8_tests_args]
p8 = {
    "id": "0008",
    "slug": "tinh-tong-danh-sach",
    "title": "Tính tổng các phần tử trong danh sách",
    "description": "Cho một danh sách các số nguyên `nums`. Hãy tính và trả về tổng của tất cả các phần tử trong danh sách. Nếu danh sách rỗng, trả về `0`.\n\n### Ví dụ:\n- `nums = [1, 2, 3, 4, 5]` ➔ Kết quả: `15`\n- `nums = []` ➔ Kết quả: `0`\n\n### Ràng buộc:\n- `0 <= len(nums) <= 1000`\n- `-10^4 <= nums[i] <= 10^4`",
    "difficulty": "easy",
    "tags": ["danh sách", "toán tử"],
    "params": [{"name": "nums", "type": "list[int]"}],
    "returnType": "int",
    "examples": [
        {"args": [[1, 2, 3, 4, 5]], "output": 15, "explanation": "1 + 2 + 3 + 4 + 5 = 15"},
        {"args": [[]], "output": 0, "explanation": "Danh sách rỗng có tổng bằng 0"}
    ],
    "testCases": p8_cases,
    "compare": "exact"
}
with open("content/problems/0008.json", "w", encoding="utf-8") as f:
    json.dump(p8, f, ensure_ascii=False, indent=2)


# Problem 0009: Loc cac so chan
p9_sol = """def solve(nums: list[int]) -> list[int]:
    return [x for x in nums if x % 2 == 0]
"""
with open("content/solutions/0009.py", "w", encoding="utf-8") as f:
    f.write(p9_sol)

p9_tests_args = [
    [[1, 2, 3, 4, 5, 6]], [[1, 3, 5]], [[]], [[2, 4, 6]], [[0, 1, 2]],
    [[-4, -3, -2, -1, 0]], [[10, 21, 32, 43, 54]], [[7, 9, 11, 13]], [[8, 8, 8]],
    [[100, 101, 102]], [[-2, -4, -6]], [[15, 20, 25, 30]], [[1]], [[2]],
    [[3, 4]], [[0]], [[11, 22, 33, 44, 55, 66]], [[9, 8, 7, 6, 5, 4]],
    [[50, 51, 52, 53]], [[1000, 1001, 1002]]
]
p9_cases = [{"args": a, "output": [x for x in a[0] if x % 2 == 0]} for a in p9_tests_args]
p9 = {
    "id": "0009",
    "slug": "loc-cac-so-chan",
    "title": "Lọc các số chẵn trong danh sách",
    "description": "Cho một danh sách các số nguyên `nums`. Hãy lọc và trả về một danh sách mới chỉ chứa các số chẵn trong `nums`, giữ nguyên thứ tự ban đầu.\n\n### Ví dụ:\n- `nums = [1, 2, 3, 4, 5, 6]` ➔ Kết quả: `[2, 4, 6]`\n- `nums = [1, 3, 5]` ➔ Kết quả: `[]`\n\n### Ràng buộc:\n- `0 <= len(nums) <= 1000`\n- `-10^5 <= nums[i] <= 10^5`",
    "difficulty": "easy",
    "tags": ["danh sách", "điều kiện"],
    "params": [{"name": "nums", "type": "list[int]"}],
    "returnType": "list[int]",
    "examples": [
        {"args": [[1, 2, 3, 4, 5, 6]], "output": [2, 4, 6], "explanation": "Các số chẵn là 2, 4, 6"},
        {"args": [[1, 3, 5]], "output": [], "explanation": "Không có số chẵn nào"}
    ],
    "testCases": p9_cases,
    "compare": "exact"
}
with open("content/problems/0009.json", "w", encoding="utf-8") as f:
    json.dump(p9, f, ensure_ascii=False, indent=2)


# Problem 0010: Tim phan tu xuat hien nhieu nhat
p10_sol = """from collections import Counter

def solve(nums: list[int]) -> int:
    counts = Counter(nums)
    return counts.most_common(1)[0][0]
"""
with open("content/solutions/0010.py", "w", encoding="utf-8") as f:
    f.write(p10_sol)

def most_frequent(nums):
    counts = Counter(nums)
    return counts.most_common(1)[0][0]

p10_tests_args = [
    [[1, 3, 2, 3, 4, 3, 5]], [[7]], [[1, 1, 2]], [[4, 5, 4]], [[9, 9, 9, 9]],
    [[-1, -1, 0, 1]], [[10, 20, 10, 30, 10]], [[5, 5, 6, 6, 5]], [[-3, -3, -3, 2, 2]],
    [[1, 2, 3, 4, 5, 5]], [[42, 42, 10, 20]], [[100, 200, 100]], [[8, 1, 8, 2, 8]],
    [[0, 0, 1, 2]], [[15, 15, 15, 16]], [[-5, -5, -5, -5, 0]], [[1, 2, 2, 3]],
    [[77, 88, 77]], [[3, 3, 3, 1, 2]], [[6, 6, 7, 8, 9]]
]
p10_cases = [{"args": a, "output": most_frequent(a[0])} for a in p10_tests_args]
p10 = {
    "id": "0010",
    "slug": "tim-phan-tu-xuat-hien-nhieu-nhat",
    "title": "Tìm phần tử xuất hiện nhiều nhất",
    "description": "Cho một danh sách các số nguyên `nums` không rỗng. Hãy tìm phần tử xuất hiện nhiều lần nhất trong danh sách.\nĐề bài đảm bảo luôn có một phần tử duy nhất có số lần xuất hiện nhiều nhất.\n\n### Ví dụ:\n- `nums = [1, 3, 2, 3, 4, 3, 5]` ➔ Kết quả: `3` (xuất hiện 3 lần)\n- `nums = [7]` ➔ Kết quả: `7`\n\n### Ràng buộc:\n- `1 <= len(nums) <= 1000`\n- `-10^5 <= nums[i] <= 10^5`",
    "difficulty": "medium",
    "tags": ["danh sách", "dictionary", "đếm"],
    "params": [{"name": "nums", "type": "list[int]"}],
    "returnType": "int",
    "examples": [
        {"args": [[1, 3, 2, 3, 4, 3, 5]], "output": 3, "explanation": "3 xuất hiện 3 lần, nhiều hơn các số khác"},
        {"args": [[7]], "output": 7, "explanation": "Chỉ có 1 phần tử là 7"}
    ],
    "testCases": p10_cases,
    "compare": "exact"
}
with open("content/problems/0010.json", "w", encoding="utf-8") as f:
    json.dump(p10, f, ensure_ascii=False, indent=2)

print("Generated 10 problems and solutions successfully!")
