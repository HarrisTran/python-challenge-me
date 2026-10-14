import { create } from 'zustand';
import { AppStoreData, ProblemProgress, ProblemStatus, PyodideStatus, SubmissionResult } from '../types';
import { clearAllProgress, getProblemProgress, loadStore, recordSubmission, saveDraftCode } from '../lib/storage';
import { pyRunner } from '../lib/pyRunner';

interface AppState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  pyStatus: PyodideStatus;
  pyError?: string;
  storeData: AppStoreData;
  refreshStore: () => void;
  saveDraft: (id: string, code: string, isModified: boolean) => void;
  submitResult: (id: string, result: SubmissionResult) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Read initial theme preference
  const savedTheme = localStorage.getItem('pyprac_theme') as 'dark' | 'light' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Subscribe to pyRunner status
  pyRunner.onStatusChange((status, error) => {
    set({ pyStatus: status, pyError: error });
  });

  return {
    theme: initialTheme,
    toggleTheme: () => {
      const current = get().theme;
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pyprac_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme: next });
    },
    pyStatus: pyRunner.getStatus(),
    pyError: undefined,
    storeData: loadStore(),
    refreshStore: () => {
      set({ storeData: loadStore() });
    },
    saveDraft: (id: string, code: string, isModified: boolean) => {
      saveDraftCode(id, code, isModified);
      set({ storeData: loadStore() });
    },
    submitResult: (id: string, result: SubmissionResult) => {
      recordSubmission(id, result);
      set({ storeData: loadStore() });
    },
    resetAll: () => {
      clearAllProgress();
      set({ storeData: loadStore() });
    },
  };
});
