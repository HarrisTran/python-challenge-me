import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Code2,
  Moon,
  Sun,
  HardDriveDownload,
  HardDriveUpload,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCode2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { exportProgressJSON, importProgressJSON } from '../lib/storage';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme, pyStatus, pyError, resetAll, refreshStore } = useAppStore();
  const location = useLocation();
  const [showDataModal, setShowDataModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const data = exportProgressJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `python-practice-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importProgressJSON(importText);
    if (ok) {
      setImportStatus('success');
      refreshStore();
      setTimeout(() => {
        setShowDataModal(false);
        setImportStatus(null);
        setImportText('');
      }, 1000);
    } else {
      setImportStatus('error');
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#121620]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300 bg-clip-text text-transparent">
                  Python Practice
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 -mt-1 font-medium">
                  LeetCode Style
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location.pathname === '/'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Danh sách bài
              </Link>
            </nav>
          </div>

          {/* Right: Engine Status, Data modal trigger, Theme toggle */}
          <div className="flex items-center space-x-3">
            {/* Pyodide Engine Status Indicator */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-100/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
              {pyStatus === 'loading' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-amber-600 dark:text-amber-400 hidden sm:inline">Khởi động Python…</span>
                </>
              )}
              {pyStatus === 'ready' && (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 hidden sm:inline">Python Sẵn sàng</span>
                </>
              )}
              {pyStatus === 'idle' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-slate-500 hidden sm:inline">Python Chờ</span>
                </>
              )}
              {pyStatus === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400 hidden sm:inline" title={pyError}>Lỗi Python</span>
                </>
              )}
            </div>

            {/* Progress Data Management Modal */}
            <button
              onClick={() => setShowDataModal(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Quản lý tiến độ (Xuất / Nhập / Xóa)"
            >
              <HardDriveDownload className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Progress Data Modal */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <HardDriveUpload className="w-5 h-5 text-blue-500" />
              Quản lý tiến độ học tập
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tiến độ của bạn được lưu hoàn toàn trên trình duyệt này. Bạn có thể xuất file để sao lưu hoặc nhập vào thiết bị khác.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  Xuất file tiến độ (.json)
                </button>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Nhập file tiến độ JSON
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
                  />
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Hoặc dán nội dung JSON vào đây..."
                  rows={4}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {importStatus === 'success' && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Nhập tiến độ thành công!
                  </p>
                )}
                {importStatus === 'error' && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Dữ liệu JSON không hợp lệ!
                  </p>
                )}

                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs disabled:opacity-50 transition-colors"
                >
                  Áp dụng dữ liệu nhập
                </button>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Xóa toàn bộ tiến độ</h4>
                    <p className="text-xs text-slate-500">Khôi phục về trạng thái ban đầu chưa làm bài nào.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử và tiến độ làm bài không? Hành động này không thể hoàn tác.')) {
                        resetAll();
                        setShowDataModal(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDataModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
