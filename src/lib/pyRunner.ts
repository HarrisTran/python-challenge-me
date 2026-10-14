import { CompareMode, PyodideStatus, SubmissionResult, TestCase, TestResultItem } from '../types';
import { compareValues } from './grader';

type StatusListener = (status: PyodideStatus, error?: string) => void;

class PythonRunnerService {
  private worker: Worker | null = null;
  private currentStatus: PyodideStatus = 'idle';
  private statusListeners: Set<StatusListener> = new Set();
  private pendingRequest: {
    id: string;
    resolve: (val: any) => void;
    reject: (err: any) => void;
    timer: any;
  } | null = null;
  private reqIdCounter = 0;

  constructor() {
    this.ensureWorker();
  }

  public getStatus(): PyodideStatus {
    return this.currentStatus;
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(status: PyodideStatus, error?: string) {
    this.currentStatus = status;
    this.statusListeners.forEach(listener => listener(status, error));
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/python.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e: MessageEvent) => {
        const { id, type, status, error, payload } = e.data;

        if (type === 'STATUS') {
          this.notifyStatus(status, error);
        }

        if (type === 'RUN_TESTS_RESULT' && this.pendingRequest && this.pendingRequest.id === id) {
          clearTimeout(this.pendingRequest.timer);
          const req = this.pendingRequest;
          this.pendingRequest = null;
          req.resolve(payload);
        }

        if (type === 'ERROR' && this.pendingRequest && this.pendingRequest.id === id) {
          clearTimeout(this.pendingRequest.timer);
          const req = this.pendingRequest;
          this.pendingRequest = null;
          req.reject(new Error(error));
        }
      };

      this.worker.onerror = (err) => {
        console.error('Lỗi Worker Python:', err);
        if (this.pendingRequest) {
          clearTimeout(this.pendingRequest.timer);
          const req = this.pendingRequest;
          this.pendingRequest = null;
          req.reject(new Error('Lỗi Worker Python'));
        }
        this.notifyStatus('error', err.message);
      };

      // Trigger initialization
      this.worker.postMessage({ type: 'INIT' });
    }

    return this.worker;
  }

  public terminate(): void {
    if (this.pendingRequest) {
      clearTimeout(this.pendingRequest.timer);
      this.pendingRequest.reject(new Error('Người dùng đã hủy thực thi'));
      this.pendingRequest = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.notifyStatus('idle');
  }

  public async runTests(
    code: string,
    testCases: TestCase[],
    compareMode: CompareMode = 'exact',
    epsilon: number = 1e-6,
    timeLimitMs: number = 3000
  ): Promise<{
    status: string;
    items: TestResultItem[];
    verdict: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded';
    passedCount: number;
    totalCount: number;
    totalTimeMs: number;
    failedCase?: any;
    error?: string;
  }> {
    const worker = this.ensureWorker();
    const id = `req_${++this.reqIdCounter}`;
    // Max overall timeout: per-case limit * total cases + 2s buffer
    const overallTimeoutMs = Math.max(timeLimitMs * testCases.length + 2000, 5000);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // Timeout triggered: terminate Worker and recreate
        console.warn(`Timeout vượt quá ${overallTimeoutMs}ms`);
        this.terminate();
        this.ensureWorker();

        resolve({
          status: 'timeout',
          items: [],
          verdict: 'Time Limit Exceeded',
          passedCount: 0,
          totalCount: testCases.length,
          totalTimeMs: overallTimeoutMs,
          failedCase: {
            caseIndex: 0,
            args: testCases[0]?.args || [],
            expected: testCases[0]?.output,
            error: `Thời gian chạy vượt quá giới hạn cho phép (${timeLimitMs}ms / test case). Hãy kiểm tra lại vòng lặp vô hạn!`,
          },
          error: 'Thời gian chạy vượt quá giới hạn (Time Limit Exceeded)',
        });
      }, overallTimeoutMs);

      this.pendingRequest = { id, resolve, reject, timer };

      worker.postMessage({
        id,
        type: 'RUN_TESTS',
        code,
        testCases,
      });
    }).then((rawRes: any) => {
      if (rawRes.status === 'timeout') {
        return rawRes;
      }

      if (rawRes.status === 'compile_error' || rawRes.status === 'runtime_error' || rawRes.status === 'no_solve_func') {
        return {
          status: rawRes.status,
          items: [],
          verdict: 'Runtime Error' as const,
          passedCount: 0,
          totalCount: testCases.length,
          totalTimeMs: rawRes.totalTimeMs || 0,
          error: rawRes.error,
          failedCase: {
            caseIndex: 0,
            args: testCases[0]?.args || [],
            expected: testCases[0]?.output,
            stdout: rawRes.stdout,
            error: rawRes.error,
          },
        };
      }

      const caseResults: any[] = rawRes.results || [];
      const items: TestResultItem[] = [];
      let passedCount = 0;
      let firstFailedCase: any = undefined;
      let overallVerdict: 'Accepted' | 'Wrong Answer' | 'Runtime Error' = 'Accepted';

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const runRes = caseResults[i];

        if (!runRes) {
          continue;
        }

        if (!runRes.success) {
          overallVerdict = 'Runtime Error';
          const failedItem: TestResultItem = {
            caseIndex: i,
            args: tc.args,
            expected: tc.output,
            stdout: runRes.stdout,
            passed: false,
            error: runRes.error,
          };
          items.push(failedItem);
          if (!firstFailedCase) {
            firstFailedCase = failedItem;
          }
          break; // Stop on first error during submit
        }

        const isMatch = compareValues(runRes.result, tc.output, compareMode, epsilon);
        const item: TestResultItem = {
          caseIndex: i,
          args: tc.args,
          expected: tc.output,
          actual: runRes.result,
          stdout: runRes.stdout,
          passed: isMatch,
        };

        if (isMatch) {
          passedCount++;
        } else {
          if (overallVerdict === 'Accepted') {
            overallVerdict = 'Wrong Answer';
          }
          if (!firstFailedCase) {
            firstFailedCase = item;
          }
        }
        items.push(item);
      }

      const finalVerdict =
        passedCount === testCases.length ? ('Accepted' as const) : overallVerdict;

      return {
        status: 'ok',
        items,
        verdict: finalVerdict,
        passedCount,
        totalCount: testCases.length,
        totalTimeMs: rawRes.totalTimeMs || 0,
        failedCase: firstFailedCase,
      };
    });
  }
}

export const pyRunner = new PythonRunnerService();
