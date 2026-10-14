import { Problem } from '../types';

export function generateStarterCode(problem: Problem): string {
  if (problem.starterCode && problem.starterCode.trim().length > 0) {
    return problem.starterCode;
  }

  const paramsList = problem.params
    .map(p => `${p.name}: ${p.type}`)
    .join(', ');

  const retType = problem.returnType ? ` -> ${problem.returnType}` : '';

  return `def solve(${paramsList})${retType}:
    # TODO: Viết code của bạn ở đây
    pass
`;
}
