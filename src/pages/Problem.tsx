import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import {
  Play,
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  List,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  FileText,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Info,
  SquareCode,
  Square,
  Loader2,
} from 'lucide-react';

import { getProblemById, getNextProblem, getPrevProblem } from '../lib/problems';
import { generateStarterCode } from '../lib/starter';
import { pyRunner } from '../lib/pyRunner';
import { useAppStore } from '../store/useAppStore';
import { SubmissionResult, TestCase, TestResultItem } from '../types';

export const Problem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, storeData, saveDraft, submitResult, pyStatus } = useAppStore();

  const problem = useMemo(() => (id ? getProblemById(id) : undefined), [id]);
  const prevProblem = useMemo(() => (id ? getPrevProblem(id) : undefined), [id]);
  const nextProblem = useMemo(() => (id ? getNextProblem(id) : undefined), [id]);

  // Code state
  const starterCode = useMemo(() => (problem ? generateStarterCode(problem) : ''), [problem]);
  const [code, setCode] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Left panel active tab: 'description' | 'submissions'
  const [leftTab, setLeftTab] = useState<'description' | 'submissions'>('description');

  // Bottom console active tab: 'testcases' | 'run_result'
  const [consoleTab, setConsoleTab] = useState<'testcases' | 'run_result'>('testcases');

  // Custom test cases for run button
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);
  const [customCases, setCustomCases] = useState<TestCase[]>([]);

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [runResults, setRunResults] = useState<TestResultItem[] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [activeResultIdx, setActiveResultIdx] = useState<number>(0);

  // Initialize code from draft or starter
  useEffect(() => {
    if (!problem) return;
    const existingProgress = storeData.problems[problem.id];
    if (existingProgress?.draftCode) {
      setCode(existingProgress.draftCode);
    } else {
      setCode(starterCode);
    }

    // Initialize custom test cases from problem examples
    const initialCases: TestCase[] = problem.examples.map((ex) => ({
      args: JSON.parse(JSON.stringify(ex.args)),
      output: ex.output,
    }));
    setCustomCases(initialCases);
    setActiveCaseIdx(0);
    setRunResults(null);
    setRunError(null);
    setConsoleTab('testcases');
  }, [problem?.id, starterCode]);

  // Debounced auto-save draft
  const saveTimeoutRef = useRef<any>(null);
  const handleCodeChange = (value: string) => {
    setCode(value);
    setSaveStatus('Đang lưu...');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (problem) {
        const isModified = value.trim() !== starterCode.trim();
        saveDraft(problem.id, value, isModified);
        setSaveStatus('Đã lưu nháp');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    }, 500);
  };

  // Reset code to starter template
  const handleResetCode = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại mã nguồn về ban đầu?')) {
      setCode(starterCode);
      if (problem) {
        saveDraft(problem.id, starterCode, false);
      }
    }
  };

  // Handle RUN (tests on examples & custom cases)
  const handleRun = async () => {
    if (!problem || isRunning || isSubmitting) return;

    setIsRunning(true);
    setRunError(null);
    setConsoleTab('run_result');

    try {
      const res = await pyRunner.runTests(
        code,
        customCases,
        problem.compare || 'exact',
        problem.epsilon || 1e-6,
        problem.timeLimitMs || 3000
      );

      if (res.status === 'ok') {
        setRunResults(res.items);
        setActiveResultIdx(0);
      } else {
        setRunError(res.error || 'Lỗi khi thực thi mã nguồn');
        setRunResults(null);
      }
    } catch (err: any) {
      setRunError(err?.message || 'Lỗi không xác định');
      setRunResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle SUBMIT (runs all 20 test cases)
  const handleSubmit = async () => {
    if (!problem || isRunning || isSubmitting) return;

    setIsSubmitting(true);
    setLeftTab('submissions');

    try {
      const res = await pyRunner.runTests(
        code,
        problem.testCases,
        problem.compare || 'exact',
        problem.epsilon || 1e-6,
        problem.timeLimitMs || 3000
      );

      const submission: SubmissionResult = {
        verdict: res.verdict,
        passedCount: res.passedCount,
        totalCount: res.totalCount,
        totalTimeMs: res.totalTimeMs,
        failedCase: res.failedCase,
        submittedAt: new Date().toISOString(),
      };

      submitResult(problem.id, submission);

      // Trigger Confetti on Accepted
      if (submission.verdict === 'Accepted' && submission.passedCount === submission.totalCount) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#6366f1'],
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi nộp bài:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle STOP execution
  const handleStop = () => {
    pyRunner.terminate();
    setIsRunning(false);
    setIsSubmitting(false);
  };

  // Keyboard shortcuts: Cmd/Ctrl + Enter = Run, Cmd/Ctrl + Shift + Enter = Submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmit();
        } else {
          handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, customCases, problem, isRunning, isSubmitting]);

  // 404 state if problem doesn't exist
  if (!problem) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Không tìm thấy bài tập</h2>
        <p className="text-slate-500 text-sm">
          Bài tập mang mã số <span className="font-mono text-rose-500">#{id}</span> không tồn tại hoặc đã bị thay đổi.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
        >
          <List className="w-4 h-4" /> Về danh sách bài
        </Link>
      </div>
    );
  }

  const currentProgress = storeData.problems[problem.id];
  const lastSub = currentProgress?.lastSubmission;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-50 dark:bg-[#0d1117]">
      {/* Top Problem Navigation & Actions Bar */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] px-4 flex items-center justify-between shrink-0">
        {/* Left: Nav Back, Prev, Next */}
        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Danh sách bài</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            onClick={() => prevProblem && navigate(`/problem/${prevProblem.id}`)}
            disabled={!prevProblem}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={prevProblem ? `Bài trước: ${prevProblem.title}` : 'Không có bài trước'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
              #{problem.id}
            </span>
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-[320px]">
              {problem.title}
            </span>
            {problem.difficulty === 'easy' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40">
                Dễ
              </span>
            )}
            {problem.difficulty === 'medium' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40">
                Trung bình
              </span>
            )}
            {problem.difficulty === 'hard' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
                Khó
              </span>
            )}
          </div>

          <button
            onClick={() => nextProblem && navigate(`/problem/${nextProblem.id}`)}
            disabled={!nextProblem}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title={nextProblem ? `Bài sau: ${nextProblem.title}` : 'Không có bài sau'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (Run, Submit, Stop) */}
        <div className="flex items-center space-x-2">
          {saveStatus && (
            <span className="text-[11px] text-slate-400 hidden sm:inline transition-opacity">
              {saveStatus}
            </span>
          )}

          {/* If running or submitting, show Stop button */}
          {(isRunning || isSubmitting) ? (
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shadow-sm"
              title="Dừng tiến trình chạy Python"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Dừng</span>
            </button>
          ) : (
            <>
              {/* Run button */}
              <button
                id="run-code-btn"
                onClick={handleRun}
                disabled={pyStatus === 'loading'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                title="Chạy thử nghiệm trên các test case ví dụ (Ctrl/Cmd + Enter)"
              >
                <Play className="w-3.5 h-3.5 fill-current text-blue-500" />
                <span>Chạy thử</span>
                <span className="hidden lg:inline text-[10px] text-slate-400 font-mono">⌘↵</span>
              </button>

              {/* Submit button */}
              <button
                id="submit-code-btn"
                onClick={handleSubmit}
                disabled={pyStatus === 'loading'}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                title="Nộp bài và chấm trên toàn bộ 20 test cases (Ctrl/Cmd + Shift + Enter)"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài</span>
                <span className="hidden lg:inline text-[10px] text-emerald-200 font-mono">⇧⌘↵</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Panel & Right Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN: Problem Description & Submissions */}
        <div className="lg:col-span-5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] overflow-hidden">
          {/* Left Tab Header */}
          <div className="h-10 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center space-x-4 text-xs font-semibold shrink-0">
            <button
              id="tab-description"
              onClick={() => setLeftTab('description')}
              className={`h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                leftTab === 'description'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mô tả đề bài</span>
            </button>
            <button
              id="tab-submissions"
              onClick={() => setLeftTab('submissions')}
              className={`h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                leftTab === 'submissions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kết quả nộp bài</span>
              {currentProgress?.status === 'solved' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>

          {/* Left Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {leftTab === 'description' ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {problem.id}. {problem.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {problem.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Markdown Description */}
                <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {problem.description}
                  </ReactMarkdown>
                </div>

                {/* Parameters & Return Type Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0d1117]/60 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Chữ ký hàm Python
                  </h4>
                  <div className="font-mono text-xs bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-blue-600 dark:text-blue-400 overflow-x-auto">
                    def solve({problem.params.map((p) => `${p.name}: ${p.type}`).join(', ')}) -&gt; {problem.returnType}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div>
                      <span className="font-medium">Tham số:</span>{' '}
                      {problem.params.map((p) => `${p.name} (${p.type})`).join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Giá trị trả về:</span> {problem.returnType}
                    </div>
                  </div>
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ví dụ minh họa
                  </h4>
                  {problem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0d1117]/60 p-3.5 space-y-2 text-xs"
                    >
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        Ví dụ {idx + 1}:
                      </div>
                      <div className="font-mono space-y-1">
                        <div>
                          <span className="text-slate-400">Đầu vào:</span>{' '}
                          <span className="text-slate-800 dark:text-slate-200">
                            {problem.params
                              .map((p, pIdx) => `${p.name} = ${JSON.stringify(ex.args[pIdx])}`)
                              .join(', ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Đầu ra:</span>{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {JSON.stringify(ex.output)}
                          </span>
                        </div>
                      </div>
                      {ex.explanation && (
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                          <span className="font-medium">Giải thích:</span> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Submissions Tab */
              <div className="space-y-6">
                {isSubmitting ? (
                  <div className="p-8 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      Đang chấm bài trên toàn bộ 20 test cases...
                    </h3>
                    <p className="text-xs text-slate-500">Mã nguồn đang được thực thi trong Pyodide sandbox.</p>
                  </div>
                ) : lastSub ? (
                  <div className="space-y-4">
                    {/* Verdict Card */}
                    <div
                      className={`p-4 rounded-xl border ${
                        lastSub.verdict === 'Accepted'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {lastSub.verdict === 'Accepted' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                          <span
                            className={`font-bold text-base ${
                              lastSub.verdict === 'Accepted'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {lastSub.verdict === 'Accepted' ? 'Chấp nhận (Accepted)' : lastSub.verdict}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {lastSub.passedCount} / {lastSub.totalCount} tests passed
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {lastSub.totalTimeMs} ms
                        </span>
                        <span>
                          Nộp lúc: {new Date(lastSub.submittedAt).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* Failing Test Details (Spec 4.6) */}
                    {lastSub.verdict !== 'Accepted' && lastSub.failedCase && (
                      <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-[#0d1117] p-4 space-y-3">
                        <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Chi tiết test case sai (Test #
                          {(lastSub.failedCase.caseIndex ?? 0) + 1})
                        </h4>

                        <div className="space-y-2 text-xs font-mono">
                          {/* Input */}
                          <div>
                            <div className="text-slate-400 text-[11px] font-sans">Đầu vào (Input):</div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto">
                              {problem.params
                                .map(
                                  (p, idx) =>
                                    `${p.name} = ${JSON.stringify(lastSub.failedCase?.args?.[idx])}`
                                )
                                .join(', ')}
                            </div>
                          </div>

                          {/* Expected */}
                          <div>
                            <div className="text-slate-400 text-[11px] font-sans">Đáp án mong đợi:</div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                              {JSON.stringify(lastSub.failedCase.expected)}
                            </div>
                          </div>

                          {/* Actual */}
                          {lastSub.failedCase.actual !== undefined && (
                            <div>
                              <div className="text-slate-400 text-[11px] font-sans">Kết quả của bạn:</div>
                              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 overflow-x-auto">
                                {JSON.stringify(lastSub.failedCase.actual)}
                              </div>
                            </div>
                          )}

                          {/* User print/stdout */}
                          {lastSub.failedCase.stdout && (
                            <div>
                              <div className="text-slate-400 text-[11px] font-sans">
                                Console Output (`print` của bạn):
                              </div>
                              <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800 text-xs overflow-x-auto whitespace-pre-wrap">
                                {lastSub.failedCase.stdout}
                              </pre>
                            </div>
                          )}

                          {/* Error / Traceback */}
                          {lastSub.failedCase.error && (
                            <div>
                              <div className="text-rose-500 text-[11px] font-sans">Lỗi (Traceback):</div>
                              <pre className="bg-rose-950/20 text-rose-400 p-2.5 rounded-lg border border-rose-900/30 text-xs overflow-x-auto whitespace-pre-wrap">
                                {lastSub.failedCase.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                    <p>Bạn chưa nộp bài lần nào cho bài tập này.</p>
                    <p>Nhấn nút "Nộp bài" ở góc trên bên phải để bắt đầu chấm 20 test cases.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Code Editor (Top) & Console/Testcases (Bottom) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-slate-900">
          {/* Editor Header Bar */}
          <div className="h-10 border-b border-slate-800 bg-[#1e1e24] px-4 flex items-center justify-between text-xs font-medium text-slate-300 shrink-0">
            <div className="flex items-center space-x-2">
              <SquareCode className="w-4 h-4 text-blue-400" />
              <span>Python 3 (Pyodide)</span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleResetCode}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Khôi phục mã nguồn ban đầu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại code</span>
              </button>
            </div>
          </div>

          {/* CodeMirror Python Editor */}
          <div className="flex-1 overflow-auto bg-[#1e1e1e]">
            <CodeMirror
              value={code}
              height="100%"
              extensions={[python()]}
              theme={theme === 'dark' ? oneDark : 'light'}
              onChange={handleCodeChange}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                history: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: false,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
            />
          </div>

          {/* Bottom Console Panel */}
          <div className="h-64 border-t border-slate-800 bg-[#161b22] flex flex-col shrink-0">
            {/* Console Header Tabs */}
            <div className="h-9 border-b border-slate-800 px-4 flex items-center space-x-4 text-xs font-semibold shrink-0">
              <button
                id="tab-testcases"
                onClick={() => setConsoleTab('testcases')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                  consoleTab === 'testcases'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Test Cases ({customCases.length})</span>
              </button>

              <button
                id="tab-run-results"
                onClick={() => setConsoleTab('run_result')}
                className={`h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                  consoleTab === 'run_result'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kết quả chạy thử</span>
                {runResults && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      runResults.every((r) => r.passed) ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                )}
              </button>
            </div>

            {/* Console Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {consoleTab === 'testcases' ? (
                /* Testcases Tab */
                <div className="space-y-3">
                  {/* Case selection pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {customCases.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCaseIdx(idx)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          activeCaseIdx === idx
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        // Clone the first case args as template
                        const newCase: TestCase = {
                          args: JSON.parse(JSON.stringify(problem.examples[0]?.args || [])),
                          output: problem.examples[0]?.output,
                        };
                        setCustomCases([...customCases, newCase]);
                        setActiveCaseIdx(customCases.length);
                      }}
                      className="p-1 px-2 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 flex items-center gap-1 transition-colors"
                      title="Thêm test case mới"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm</span>
                    </button>
                  </div>

                  {/* Active Case Parameters Editor */}
                  {customCases[activeCaseIdx] && (
                    <div className="space-y-2 bg-[#0d1117] p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                          Tham số đầu vào (Case #{activeCaseIdx + 1})
                        </span>
                        {customCases.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = customCases.filter((_, i) => i !== activeCaseIdx);
                              setCustomCases(updated);
                              setActiveCaseIdx(Math.max(0, activeCaseIdx - 1));
                            }}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                            title="Xóa test case này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 font-mono">
                        {problem.params.map((param, pIdx) => {
                          const currentVal = customCases[activeCaseIdx].args[pIdx];
                          return (
                            <div key={param.name} className="flex items-center gap-2">
                              <span className="w-20 text-slate-400 shrink-0">
                                {param.name} =
                              </span>
                              <input
                                type="text"
                                value={
                                  typeof currentVal === 'object'
                                    ? JSON.stringify(currentVal)
                                    : String(currentVal ?? '')
                                }
                                onChange={(e) => {
                                  const text = e.target.value;
                                  try {
                                    const parsed = JSON.parse(text);
                                    const updatedCases = [...customCases];
                                    updatedCases[activeCaseIdx].args[pIdx] = parsed;
                                    setCustomCases(updatedCases);
                                  } catch {
                                    // Keep as string if parsing not yet finished
                                    const updatedCases = [...customCases];
                                    updatedCases[activeCaseIdx].args[pIdx] = text;
                                    setCustomCases(updatedCases);
                                  }
                                }}
                                className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Run Results Tab */
                <div className="space-y-3">
                  {isRunning ? (
                    <div className="p-6 text-center text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                      <p>Đang chạy thử nghiệm...</p>
                    </div>
                  ) : runError ? (
                    <div className="bg-rose-950/30 border border-rose-900/50 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Lỗi khi chạy code:</span>
                      </div>
                      <pre className="text-xs font-mono text-rose-300 whitespace-pre-wrap overflow-x-auto">
                        {runError}
                      </pre>
                    </div>
                  ) : runResults ? (
                    <div className="space-y-3">
                      {/* Case selector with pass/fail badges */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {runResults.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveResultIdx(idx)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                              activeResultIdx === idx
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {item.passed ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-400" />
                            )}
                            <span>Case {idx + 1}</span>
                          </button>
                        ))}
                      </div>

                      {/* Detail of active result */}
                      {runResults[activeResultIdx] && (
                        <div className="bg-[#0d1117] p-3 rounded-xl border border-slate-800 space-y-2 font-mono">
                          <div>
                            <div className="text-slate-400 text-[11px] font-sans">Đầu vào (Input):</div>
                            <div className="text-slate-200">
                              {problem.params
                                .map(
                                  (p, idx) =>
                                    `${p.name} = ${JSON.stringify(
                                      runResults[activeResultIdx].args[idx]
                                    )}`
                                )
                                .join(', ')}
                            </div>
                          </div>

                          <div>
                            <div className="text-slate-400 text-[11px] font-sans">Kết quả của bạn:</div>
                            <div
                              className={
                                runResults[activeResultIdx].passed
                                  ? 'text-emerald-400'
                                  : 'text-rose-400 font-semibold'
                              }
                            >
                              {JSON.stringify(runResults[activeResultIdx].actual)}
                            </div>
                          </div>

                          {runResults[activeResultIdx].expected !== undefined && (
                            <div>
                              <div className="text-slate-400 text-[11px] font-sans">Đáp án mong đợi:</div>
                              <div className="text-emerald-400">
                                {JSON.stringify(runResults[activeResultIdx].expected)}
                              </div>
                            </div>
                          )}

                          {runResults[activeResultIdx].stdout && (
                            <div>
                              <div className="text-slate-400 text-[11px] font-sans">
                                Console Output (`print`):
                              </div>
                              <pre className="text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 whitespace-pre-wrap">
                                {runResults[activeResultIdx].stdout}
                              </pre>
                            </div>
                          )}

                          {runResults[activeResultIdx].error && (
                            <div>
                              <div className="text-rose-400 text-[11px] font-sans">Lỗi:</div>
                              <pre className="text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/30 whitespace-pre-wrap">
                                {runResults[activeResultIdx].error}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      Nhấn nút "Chạy thử" để xem kết quả trên các test case ví dụ.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
