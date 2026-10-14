import sys
import json
import copy
import math
import importlib.util

def compare_results(actual, expected, mode="exact", epsilon=1e-6):
    if mode == "exact":
        return actual == expected
    elif mode == "float":
        if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
            return math.isclose(actual, expected, abs_tol=epsilon, rel_tol=epsilon)
        return actual == expected
    elif mode == "unordered":
        if isinstance(actual, list) and isinstance(expected, list):
            try:
                return sorted(actual) == sorted(expected)
            except TypeError:
                return actual == expected
        return actual == expected
    return actual == expected

def test_solution(solution_path, test_cases, compare_mode="exact", epsilon=1e-6):
    spec = importlib.util.spec_from_file_location("solution", solution_path)
    if not spec or not spec.loader:
        return {"passed": False, "error": f"Không thể nạp file {solution_path}"}
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    if not hasattr(module, "solve"):
        return {"passed": False, "error": f"Không tìm thấy hàm solve trong {solution_path}"}

    solve = getattr(module, "solve")

    for idx, tc in enumerate(test_cases):
        args = copy.deepcopy(tc["args"])
        expected = tc["output"]
        try:
            actual = solve(*args)
            # Ensure JSON serializable
            json.dumps(actual)
            if not compare_results(actual, expected, compare_mode, epsilon):
                return {
                    "passed": False,
                    "case_index": idx,
                    "args": tc["args"],
                    "expected": expected,
                    "actual": actual,
                    "error": f"Sai kết quả tại test case #{idx + 1}"
                }
        except Exception as e:
            return {
                "passed": False,
                "case_index": idx,
                "args": tc["args"],
                "error": f"Lỗi thực thi tại test case #{idx + 1}: {str(e)}"
            }

    return {"passed": True, "total": len(test_cases)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"passed": False, "error": "Thiếu tham số (cần solution_path và problem_json_path)"}))
        sys.exit(1)

    sol_path = sys.argv[1]
    prob_path = sys.argv[2]

    try:
        with open(prob_path, "r", encoding="utf-8") as f:
            prob_data = json.load(f)
        mode = prob_data.get("compare", "exact")
        eps = prob_data.get("epsilon", 1e-6)
        res = test_solution(sol_path, prob_data["testCases"], mode, eps)
        print(json.dumps(res, ensure_ascii=False))
        if not res["passed"]:
            sys.exit(1)
    except Exception as err:
        print(json.dumps({"passed": False, "error": str(err)}, ensure_ascii=False))
        sys.exit(1)
