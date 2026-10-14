// Web Worker running Pyodide

let pyodide: any = null;
let isInitializing = false;

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

const HARNESS_PYTHON_CODE = `
import sys
import io
import json
import copy
import traceback

def __run_user_code(user_code_str, test_cases_json_str):
    user_ns = {}
    init_stdout_buf = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = init_stdout_buf
    
    try:
        exec(user_code_str, user_ns)
    except Exception as e:
        sys.stdout = old_stdout
        tb_lines = traceback.format_exc().splitlines()
        cleaned_tb = []
        skip = True
        for line in tb_lines:
            if 'File "<string>"' in line or not skip:
                skip = False
                cleaned_tb.append(line)
        if not cleaned_tb:
            cleaned_tb = tb_lines
        return json.dumps({
            "status": "runtime_error",
            "error": "\\n".join(cleaned_tb),
            "stdout": init_stdout_buf.getvalue()[:65536]
        })
    finally:
        sys.stdout = old_stdout

    if "solve" not in user_ns or not callable(user_ns["solve"]):
        return json.dumps({
            "status": "no_solve_func",
            "error": "Không tìm thấy hàm 'solve' trong mã nguồn. Hãy định nghĩa hàm 'def solve(...)' theo yêu cầu đề bài.",
            "stdout": init_stdout_buf.getvalue()[:65536]
        })

    solve_fn = user_ns["solve"]
    test_cases = json.loads(test_cases_json_str)
    case_results = []

    for idx, tc in enumerate(test_cases):
        args = copy.deepcopy(tc.get("args", []))
        case_stdout_buf = io.StringIO()
        sys.stdout = case_stdout_buf
        
        try:
            val = solve_fn(*args)
            try:
                serialized_val = json.dumps(val)
            except Exception as json_err:
                raise TypeError(f"Giá trị trả về ({type(val).__name__}) không thể chuyển sang JSON. Vui lòng trả về kiểu int, float, str, bool, list hoặc dict.")
            
            stdout_str = case_stdout_buf.getvalue()
            if len(stdout_str) > 65536:
                stdout_str = stdout_str[:65536] + "\\n...[stdout bị cắt bớt vì vượt quá giới hạn 64KB]"

            case_results.append({
                "caseIndex": idx,
                "result": json.loads(serialized_val),
                "stdout": stdout_str,
                "success": True
            })
        except Exception as e:
            stdout_str = case_stdout_buf.getvalue()
            tb_lines = traceback.format_exc().splitlines()
            cleaned = []
            for line in tb_lines:
                if 'in __run_user_code' not in line:
                    cleaned.append(line)
            case_results.append({
                "caseIndex": idx,
                "error": "\\n".join(cleaned) if cleaned else str(e),
                "stdout": stdout_str[:65536],
                "success": False
            })
        finally:
            sys.stdout = old_stdout

    return json.dumps({
        "status": "ok",
        "results": case_results
    })
`;

async function initPyodide(): Promise<any> {
  if (pyodide) return pyodide;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    return pyodide;
  }

  isInitializing = true;
  self.postMessage({ type: 'STATUS', status: 'loading' });

  try {
    // Dynamically import official pyodide ES module in Web Worker
    const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_CDN}pyodide.mjs`);
    pyodide = await loadPyodide({
      indexURL: PYODIDE_CDN,
      stdout: () => {},
      stderr: () => {},
    });

    // Run harness definition in clean Python namespace
    await pyodide.runPythonAsync(HARNESS_PYTHON_CODE);
    self.postMessage({ type: 'STATUS', status: 'ready' });
    isInitializing = false;
    return pyodide;
  } catch (err: any) {
    isInitializing = false;
    self.postMessage({ type: 'STATUS', status: 'error', error: err?.message || String(err) });
    throw err;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, code, testCases } = e.data;

  if (type === 'INIT') {
    try {
      await initPyodide();
    } catch (err: any) {
      self.postMessage({ id, type: 'ERROR', error: err?.message || 'Khởi tạo Pyodide thất bại' });
    }
    return;
  }

  if (type === 'RUN_TESTS') {
    const startTime = performance.now();
    try {
      const py = await initPyodide();
      
      const runner = py.globals.get('__run_user_code');
      const jsonResString = runner(code, JSON.stringify(testCases));
      const parsedRes = JSON.parse(jsonResString);
      const totalTimeMs = Math.round(performance.now() - startTime);

      self.postMessage({
        id,
        type: 'RUN_TESTS_RESULT',
        payload: {
          ...parsedRes,
          totalTimeMs,
        },
      });
    } catch (err: any) {
      const totalTimeMs = Math.round(performance.now() - startTime);
      self.postMessage({
        id,
        type: 'RUN_TESTS_RESULT',
        payload: {
          status: 'runtime_error',
          error: err?.message || String(err),
          totalTimeMs,
        },
      });
    }
  }
};
