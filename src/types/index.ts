export type Json =
  | number
  | string
  | boolean
  | null
  | Json[]
  | { [k: string]: Json };

export interface Param {
  name: string;
  type: string;
}

export interface Example {
  args: any[];
  output: any;
  explanation?: string;
}

export interface TestCase {
  args: any[];
  output: any;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type CompareMode = 'exact' | 'float' | 'unordered';

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags?: string[];
  params: Param[];
  returnType: string;
  examples: Example[];
  testCases: TestCase[];
  starterCode?: string;
  compare?: CompareMode;
  epsilon?: number;
  timeLimitMs?: number;
  source?: {
    name: string;
    url: string;
    license: 'MIT';
  };
}

export type Verdict =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Runtime Error'
  | 'Time Limit Exceeded';

export interface TestResultItem {
  caseIndex: number;
  args: any[];
  expected: any;
  actual?: any;
  stdout?: string;
  passed: boolean;
  error?: string;
  timeMs?: number;
}

export interface SubmissionResult {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  totalTimeMs: number;
  failedCase?: {
    caseIndex: number;
    args: any[];
    expected: any;
    actual?: any;
    stdout?: string;
    error?: string;
  };
  submittedAt: string;
}

export type ProblemStatus = 'todo' | 'in_progress' | 'solved';

export interface ProblemProgress {
  status: ProblemStatus;
  draftCode?: string;
  lastSubmission?: SubmissionResult;
  solvedAt?: string;
  lastVisitedAt?: string;
}

export interface AppStoreData {
  version: 1;
  problems: Record<string, ProblemProgress>;
}

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error';
