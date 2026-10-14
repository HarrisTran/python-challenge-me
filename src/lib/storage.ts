import { AppStoreData, ProblemProgress, ProblemStatus, SubmissionResult } from '../types';

const STORAGE_KEY = 'pyprac:v1';

const defaultStore: AppStoreData = {
  version: 1,
  problems: {},
};

export function loadStore(): AppStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && typeof parsed.problems === 'object') {
      return parsed as AppStoreData;
    }
    return defaultStore;
  } catch (err) {
    console.warn('Lỗi đọc localStorage:', err);
    return defaultStore;
  }
}

export function saveStore(data: AppStoreData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Lỗi ghi localStorage:', err);
  }
}

export function getProblemProgress(id: string): ProblemProgress {
  const store = loadStore();
  return store.problems[id] || { status: 'todo' };
}

export function saveDraftCode(id: string, code: string, isModified: boolean): void {
  const store = loadStore();
  const current = store.problems[id] || { status: 'todo' };

  let newStatus: ProblemStatus = current.status;
  if (current.status !== 'solved') {
    newStatus = isModified ? 'in_progress' : 'todo';
  }

  store.problems[id] = {
    ...current,
    status: newStatus,
    draftCode: code,
    lastVisitedAt: new Date().toISOString(),
  };

  saveStore(store);
}

export function recordSubmission(id: string, result: SubmissionResult): void {
  const store = loadStore();
  const current = store.problems[id] || { status: 'todo' };

  const isSolved = result.verdict === 'Accepted' && result.passedCount === result.totalCount;
  const newStatus: ProblemStatus = (current.status === 'solved' || isSolved) ? 'solved' : 'in_progress';

  store.problems[id] = {
    ...current,
    status: newStatus,
    lastSubmission: result,
    solvedAt: isSolved ? (current.solvedAt || new Date().toISOString()) : current.solvedAt,
    lastVisitedAt: new Date().toISOString(),
  };

  saveStore(store);
}

export function exportProgressJSON(): string {
  const store = loadStore();
  return JSON.stringify(store, null, 2);
}

export function importProgressJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.problems === 'object') {
      const validated: AppStoreData = {
        version: 1,
        problems: parsed.problems,
      };
      saveStore(validated);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Lỗi khi import tiến độ:', err);
    return false;
  }
}

export function clearAllProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Lỗi khi xóa dữ liệu localStorage:', err);
  }
}
