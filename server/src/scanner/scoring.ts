import { CATEGORY_WEIGHTS, SEVERITY_IMPACT } from './constants';
import { CategoryId, CheckResult } from './types';

function calculateCategoryScore(results: CheckResult[]): number | undefined {
  if (results.length === 0) {
    // No checks for this category yet -> treat as "not scored" rather than
    // artificially boosting the overall score.
    return undefined;
  }

  const hasBlockers = results.some(
    (r) => !r.passed && r.severity === 'blocker',
  );
  if (hasBlockers) {
    return 0;
  }

  let categoryScore = 100;
  for (const check of results) {
    if (!check.passed) {
      const multiplier = SEVERITY_IMPACT[check.severity];
      const penalty = 1 - multiplier;
      categoryScore *= 1 - penalty / results.length;
    }
  }

  return Math.round(categoryScore);
}

export function calculateCategoryScores(
  results: CheckResult[],
): Record<CategoryId, number> {
  const scores: Record<CategoryId, number> = {} as Record<CategoryId, number>;

  (Object.keys(CATEGORY_WEIGHTS) as CategoryId[]).forEach((category) => {
    const categoryChecks = results.filter((r) => r.category === category);
    const score = calculateCategoryScore(categoryChecks);
    if (typeof score === 'number' && !Number.isNaN(score)) {
      scores[category] = score;
    }
  });

  return scores;
}

export function calculateScore(results: CheckResult[]): number {
  const categoryScores = calculateCategoryScores(results);

  let weightedTotal = 0;
  let totalWeight = 0;

  (Object.entries(CATEGORY_WEIGHTS) as [CategoryId, number][]).forEach(
    ([category, weight]) => {
      if (weight <= 0) return;
      const score = categoryScores[category];
      if (typeof score !== 'number' || Number.isNaN(score)) return;
      weightedTotal += score * weight;
      totalWeight += weight;
    },
  );

  if (totalWeight === 0) {
    return 0;
  }

  const baseScore = Math.round(weightedTotal / totalWeight);

  const hasGlobalBlocker = results.some(
    (r) => !r.passed && r.severity === 'blocker',
  );

  // If there are any blocker-level failures anywhere, cap the overall score
  // so repos with critical issues cannot appear as "healthy".
  let finalScore = baseScore;
  if (hasGlobalBlocker) {
    finalScore = Math.max(0, baseScore - 40);
  }

  // Additional penalty for high concentrations of mock/placeholder code
  const mockChecks = results.filter(r => r.checkId.startsWith('mock-') && !r.passed);
  if (mockChecks.length > 0) {
    // Calculate mock penalty based on severity and count
    let mockPenalty = 0;
    for (const check of mockChecks) {
      if (check.severity === 'high') {
        mockPenalty += 15; // High severity mock checks get 15 point penalty each
      } else if (check.severity === 'medium') {
        mockPenalty += 8; // Medium severity mock checks get 8 point penalty each
      } else {
        mockPenalty += 3; // Low severity mock checks get 3 point penalty each
      }
    }
    
    // Cap the mock penalty to avoid overly harsh penalties
    mockPenalty = Math.min(mockPenalty, 35);
    finalScore = Math.max(0, finalScore - mockPenalty);
  }

  return finalScore;
}

export function evaluateProductionReadiness(
  results: CheckResult[],
  categoryScores: Record<CategoryId, number>,
  overallScore: number,
): { productionReady: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const failingBlockers = results.filter(
    (r) => !r.passed && r.severity === 'blocker',
  );
  if (failingBlockers.length > 0) {
    reasons.push(
      `One or more blocker-level checks failed: ${failingBlockers
        .map((r) => `[${r.category}] ${r.title}`)
        .join('; ')}`,
    );
  }

  // Check for high concentrations of mock/placeholder code
  const failingMockChecks = results.filter(r => r.checkId.startsWith('mock-') && !r.passed);
  const highSeverityMockChecks = failingMockChecks.filter(r => r.severity === 'high');
  const mediumSeverityMockChecks = failingMockChecks.filter(r => r.severity === 'medium');
  
  if (highSeverityMockChecks.length >= 2) {
    reasons.push(`High concentration of mock/simulation code detected: ${highSeverityMockChecks.length} high-severity issues found.`);
  } else if (failingMockChecks.length >= 3) {
    reasons.push(`Multiple mock/placeholder issues detected: ${failingMockChecks.length} issues found. Code may not be production-ready.`);
  }

  const securityScore = categoryScores.security;
  const devopsScore = categoryScores.devops;
  const testingScore = categoryScores.testing;
  const codeQualityScore = categoryScores.codeQuality;

  if (typeof securityScore === 'number' && securityScore < 85) {
    reasons.push(`Security score below 85 (got ${securityScore}).`);
  }
  if (typeof devopsScore === 'number' && devopsScore < 80) {
    reasons.push(`DevOps score below 80 (got ${devopsScore}).`);
  }
  if (typeof testingScore === 'number' && testingScore < 75) {
    reasons.push(`Testing score below 75 (got ${testingScore}).`);
  }
  if (typeof codeQualityScore === 'number' && codeQualityScore < 70) {
    reasons.push(`Code quality score below 70 (got ${codeQualityScore}).`);
  }

  if (overallScore < 85) {
    reasons.push(`Overall score below 85 (got ${overallScore}).`);
  }

  const productionReady = reasons.length === 0;
  return { productionReady, reasons };
}
