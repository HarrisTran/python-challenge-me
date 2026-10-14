import { CompareMode } from '../types';

export function compareValues(
  actual: any,
  expected: any,
  mode: CompareMode = 'exact',
  epsilon: number = 1e-6
): boolean {
  if (mode === 'float') {
    if (typeof actual === 'number' && typeof expected === 'number') {
      return Math.abs(actual - expected) <= epsilon;
    }
  }

  if (mode === 'unordered') {
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      const sortedActual = [...actual].sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
      );
      const sortedExpected = [...expected].sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
      );
      return deepEqual(sortedActual, sortedExpected, 'exact', epsilon);
    }
  }

  return deepEqual(actual, expected, mode, epsilon);
}

function deepEqual(a: any, b: any, mode: CompareMode, epsilon: number): boolean {
  // If exact or float, numbers 3 and 3.0 or equivalent
  if (typeof a === 'number' && typeof b === 'number') {
    if (mode === 'float') {
      return Math.abs(a - b) <= epsilon;
    }
    return Object.is(a, b) || Math.abs(a - b) < 1e-9;
  }

  if (a === b) return true;

  if (a == null || b == null) return a === b;

  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], mode, epsilon)) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key], mode, epsilon)) return false;
    }
    return true;
  }

  return false;
}
