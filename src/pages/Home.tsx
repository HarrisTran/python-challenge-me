import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  ArrowRight,
  Filter,
  Sparkles,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { getAllProblems } from '../lib/problems';
import { useAppStore } from '../store/useAppStore';
import { Difficulty, ProblemStatus } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { storeData } = useAppStore();
  const problems = useMemo(() => getAllProblems(), []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProblemStatus>('all');
  const [diffFilter, setDiffFilter] = useState<'all' | Difficulty>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Compute stats
  const stats = useMemo(() => {
    let solved = 0;
    let inProgress = 0;
    let todo = 0;

    problems.forEach((p) => {
      const prog = storeData.problems[p.id]?.status || 'todo';
      if (prog === 'solved') solved++;
      else if (prog === 'in_progress') inProgress++;
      else todo++;
    });

    return {
      total: problems.length,
      solved,
      inProgress,
      todo,
      percent: Math.round((solved / (problems.length || 1)) * 100),
    };
  }, [problems, storeData]);

  // Find next problem to continue
  const continueProblemId = useMemo(() => {
    // 1. Try to find the latest visited in_progress problem
    let latestVisitedId: string | null = null;
    let latestVisitedTime = 0;

    for (const p of problems) {
      const item = storeData.problems[p.id];
      if (item?.status === 'in_progress' && item.lastVisitedAt) {
        const time = new Date(item.lastVisitedAt).getTime();
        if (time > latestVisitedTime) {
          latestVisitedTime = time;
          latestVisitedId = p.id;
        }
      }
    }
    if (latestVisitedId) return latestVisitedId;

    // 2. Otherwise find the first in_progress
    const firstInProgress = problems.find(
      (p) => storeData.problems[p.id]?.status === 'in_progress'
    );
    if (firstInProgress) return firstInProgress.id;

    // 3. Otherwise find the first todo
    const firstTodo = problems.find(
      (p) => !storeData.problems[p.id] || storeData.problems[p.id].status === 'todo'
    );
    if (firstTodo) return firstTodo.id;

    return problems[0]?.id || '0001';
  }, [problems, storeData]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [problems]);

  // Filter problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const itemStatus: ProblemStatus = storeData.problems[p.id]?.status || 'todo';

      // Status filter
      if (statusFilter !== 'all' && itemStatus !== statusFilter) {
        return false;
      }

      // Difficulty filter
      if (diffFilter !== 'all' && p.difficulty !== diffFilter) {
        return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && !p.tags?.includes(selectedTag)) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchId = p.id.includes(query);
        const matchTag = p.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchId && !matchTag) {
          return false;
        }
      }

      return true;
    });
  }, [problems, storeData, search, statusFilter, diffFilter, selectedTag]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero & Progress Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40">
              <Sparkles className="w-3.5 h-3.5" /> Nền tảng luyện tập Python sinh viên
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Luyện Tập Thuật Toán Python
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Trải nghiệm phong cách LeetCode: đọc đề, viết hàm <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">solve(...)</code>, chạy thử và nộp bài chấm tự động qua WebAssembly Pyodide ngay trên trình duyệt.
            </p>
          </div>

          {/* Quick Continue CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3">
            <button
              onClick={() => navigate(`/problem/${continueProblemId}`)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Tiếp tục làm bài #{continueProblemId}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-right">
              Tự động lưu nháp & tiến độ trong trình duyệt
            </span>
          </div>
        </div>

        {/* Progress bar & Stat Cards */}
        <div className="relative z-10 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Tiến độ hoàn thành:
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                Đã xong {stats.solved} / {stats.total} bài
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {stats.percent}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(stats.percent, 3)}%` }}
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-5">
            <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0d1117]/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Đã xong</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.solved}</div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0d1117]/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Đang làm</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.inProgress}</div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0d1117]/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-500/10 text-slate-400 flex items-center justify-center shrink-0">
                <Circle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Chưa làm</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.todo}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên bài, số ID hoặc chủ đề..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status tabs */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('todo')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'todo'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Chưa làm
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Đang làm
            </button>
            <button
              onClick={() => setStatusFilter('solved')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === 'solved'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Đã xong
            </button>
          </div>

          {/* Difficulty Dropdown */}
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="all">Độ khó: Tất cả</option>
            <option value="easy">Dễ (Easy)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="hard">Khó (Hard)</option>
          </select>

          {/* Tags Dropdown */}
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="all">Chủ đề: Tất cả</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Problem Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th scope="col" className="w-16 px-4 py-3.5 text-center">Trạng thái</th>
                <th scope="col" className="w-20 px-4 py-3.5"># ID</th>
                <th scope="col" className="px-4 py-3.5">Tên bài tập</th>
                <th scope="col" className="px-4 py-3.5 hidden sm:table-cell">Chủ đề</th>
                <th scope="col" className="w-32 px-4 py-3.5">Độ khó</th>
                <th scope="col" className="w-24 px-4 py-3.5 text-right">Làm bài</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredProblems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    Không tìm thấy bài tập nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProblems.map((prob) => {
                  const itemProgress = storeData.problems[prob.id];
                  const status: ProblemStatus = itemProgress?.status || 'todo';

                  return (
                    <tr
                      key={prob.id}
                      onClick={() => navigate(`/problem/${prob.id}`)}
                      className="group hover:bg-slate-50 dark:hover:bg-[#1c222d] transition-colors cursor-pointer"
                    >
                      {/* Status Icon */}
                      <td className="px-4 py-3.5 text-center">
                        {status === 'solved' && (
                          <span
                            title="Đã giải quyết"
                            className="inline-flex items-center justify-center text-emerald-500 font-bold"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                        {status === 'in_progress' && (
                          <span
                            title="Đang làm dở"
                            className="inline-flex items-center justify-center text-amber-500 font-bold"
                          >
                            <Clock className="w-4 h-4" />
                          </span>
                        )}
                        {status === 'todo' && (
                          <span
                            title="Chưa làm"
                            className="inline-flex items-center justify-center text-slate-300 dark:text-slate-600"
                          >
                            <Circle className="w-4 h-4" />
                          </span>
                        )}
                      </td>

                      {/* ID */}
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {prob.id}
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{prob.title}</span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {prob.tags?.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Difficulty Badge */}
                      <td className="px-4 py-3.5">
                        {prob.difficulty === 'easy' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40">
                            Dễ
                          </span>
                        )}
                        {prob.difficulty === 'medium' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40">
                            Trung bình
                          </span>
                        )}
                        {prob.difficulty === 'hard' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
                            Khó
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/problem/${prob.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 transition-colors"
                          title="Làm bài này"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
