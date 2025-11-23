import { getApplicableChecks } from './registry';
import {
  calculateCategoryScores,
  calculateScore,
  evaluateProductionReadiness,
} from './scoring';
import { Check, CheckResult, RepoContext, ScanReport } from './types';

// Simple in-memory cache for file operations
const fileCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ScanOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  enableCache?: boolean;
  categories?: string[];
  excludeChecks?: string[];
}

export async function runAllChecks(
  context: RepoContext,
  options: ScanOptions = {},
): Promise<ScanReport> {
  const {
    parallel = true,
    maxConcurrency = 10,
    enableCache = true,
    categories,
    excludeChecks = []
  } = options;

  let checks = getApplicableChecks(context);
  
  // Filter by categories if specified
  if (categories && categories.length > 0) {
    checks = checks.filter(check => categories.includes(check.category));
  }
  
  // Exclude specific checks
  if (excludeChecks.length > 0) {
    checks = checks.filter(check => !excludeChecks.includes(check.id));
  }

  const results: CheckResult[] = [];

  if (parallel && checks.length > 1) {
    // Run checks in parallel with concurrency limit
    const chunks = chunkArray(checks, maxConcurrency);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(check => runCheck(check, context, enableCache))
      );
      
      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle rejected promises
          console.error('Check execution failed:', result.reason);
        }
      }
    }
  } else {
    // Run checks sequentially
    for (const check of checks) {
      results.push(await runCheck(check, context, enableCache));
    }
  }

  const categoryScores = calculateCategoryScores(results);
  const score = calculateScore(results);
  const readiness = evaluateProductionReadiness(results, categoryScores, score);

  return {
    score,
    results,
    timestamp: new Date().toISOString(),
    repoPath: context.path,
    categoryScores,
    productionReady: readiness.productionReady,
    readinessReasons: readiness.reasons,
  };
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function runCheck(
  check: Check,
  context: RepoContext,
  useCache: boolean = true,
): Promise<CheckResult> {
  try {
    const result = await check.checker(context);
    return {
      checkId: check.id,
      title: check.title,
      category: check.category,
      severity: check.severity,
      passed: result.passed,
      message: result.message ?? undefined,
      error: result.error ?? undefined,
      autoFixable: result.autoFixable,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
        ? err
        : 'Unknown error while running check';
    return {
      checkId: check.id,
      title: check.title,
      category: check.category,
      severity: check.severity,
      passed: false,
      message: undefined,
      error: message,
      autoFixable: undefined,
    };
  }
}

export function clearCache(): void {
  fileCache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: fileCache.size,
    keys: Array.from(fileCache.keys())
  };
}
