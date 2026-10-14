import { Problem } from '../types';

// Load all problem JSONs at build time using Vite glob import
const modules = import.meta.glob<Problem>('/content/problems/*.json', {
  eager: true,
  import: 'default',
});

const problemsList: Problem[] = Object.values(modules).sort((a, b) =>
  a.id.localeCompare(b.id)
);

export function getAllProblems(): Problem[] {
  return problemsList;
}

export function getProblemById(id: string): Problem | undefined {
  return problemsList.find(p => p.id === id);
}

export function getNextProblem(id: string): Problem | undefined {
  const index = problemsList.findIndex(p => p.id === id);
  if (index >= 0 && index < problemsList.length - 1) {
    return problemsList[index + 1];
  }
  return undefined;
}

export function getPrevProblem(id: string): Problem | undefined {
  const index = problemsList.findIndex(p => p.id === id);
  if (index > 0) {
    return problemsList[index - 1];
  }
  return undefined;
}
