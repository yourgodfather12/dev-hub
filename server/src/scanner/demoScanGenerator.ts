import {
  CategoryId,
  Severity,
  CheckResult,
  ScanReport,
} from './types';

const CATEGORY_BLUEPRINTS: Array<{
  category: CategoryId;
  title: string;
  severity: Severity;
  recommendation: string;
}> = [
  {
    category: 'codeQuality',
    title: 'Strict linting configuration',
    severity: 'medium',
    recommendation: 'Enable ESLint/TSLint with blocking CI enforcement.',
  },
  {
    category: 'security',
    title: 'Secrets management',
    severity: 'high',
    recommendation: 'Add secret scanning and rotate any committed tokens.',
  },
  {
    category: 'dependencies',
    title: 'Dependency freshness',
    severity: 'medium',
    recommendation: 'Upgrade vulnerable runtime dependencies.',
  },
  {
    category: 'devops',
    title: 'CI pipeline reliability',
    severity: 'low',
    recommendation: 'Ensure CI workflows cover build, lint, and tests.',
  },
  {
    category: 'testing',
    title: 'Automated test coverage',
    severity: 'medium',
    recommendation: 'Increase unit/integration coverage above 80%.',
  },
  {
    category: 'documentation',
    title: 'Runbook completeness',
    severity: 'low',
    recommendation: 'Document deploy steps and rollback procedures.',
  },
  {
    category: 'performance',
    title: 'Core web vitals budget',
    severity: 'medium',
    recommendation: 'Optimize bundle size and critical rendering paths.',
  },
  {
    category: 'architecture',
    title: 'Modular domain boundaries',
    severity: 'low',
    recommendation: 'Refine module boundaries to reduce coupling.',
  },
  {
    category: 'frameworkSpecific',
    title: 'Framework best practices',
    severity: 'low',
    recommendation: 'Adopt official framework patterns and tooling.',
  },
  {
    category: 'aiSpecific',
    title: 'AI safety guardrails',
    severity: 'high',
    recommendation: 'Audit LLM prompts and add abuse monitoring.',
  },
];

function deterministicNumber(seed: string, max: number, min = 0): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  return min + (hash % (max - min + 1));
}

export function inferRepoPathFromUrl(repoUrl: string | null | undefined, projectName: string): string {
  if (repoUrl) {
    try {
      const url = new URL(repoUrl);
      if (url.hostname === 'github.com') {
        const segments = url.pathname.replace(/^\/+/, '').split('/');
        if (segments.length >= 2) {
          const [owner, repo] = segments;
          if (repo) {
            return `${owner}/${repo.replace(/\.git$/, '')}`;
          }
        }
      }
    } catch {
      // fall through to slug based path
    }
  }
  return `local/${slugify(projectName)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'repo';
}

export function createDemoScanReport(params: {
  repoPath: string;
  projectName?: string;
}): ScanReport {
  const { repoPath, projectName } = params;
  const categoryScores = {} as Record<CategoryId, number>;

  CATEGORY_BLUEPRINTS.forEach((blueprint, idx) => {
    const scoreSeed = `${repoPath}:${blueprint.category}:${idx}`;
    const base = 65 + deterministicNumber(scoreSeed, 25);
    categoryScores[blueprint.category] = Math.min(98, Math.max(45, base));
  });

  const results: CheckResult[] = CATEGORY_BLUEPRINTS.map((blueprint, idx) => {
    const score = categoryScores[blueprint.category];
    const passed = score >= 70 || idx % 2 === 0;
    const message = passed
      ? `${blueprint.title} meets internal standards.`
      : blueprint.recommendation;

    return {
      checkId: `${blueprint.category}-${idx}`,
      title: blueprint.title,
      category: blueprint.category,
      severity: blueprint.severity,
      passed,
      message,
      error: passed ? undefined : blueprint.recommendation,
      autoFixable: !passed && blueprint.severity !== 'blocker',
    };
  });

  const avgScore =
    Object.values(categoryScores).reduce((sum, score) => sum + score, 0) /
    Object.keys(categoryScores).length;

  const productionReady = avgScore >= 80;
  const readinessReasons = productionReady
    ? []
    : [
        'Address high-severity issues highlighted in the scan.',
        'Increase automated testing to unblock production readiness.',
      ];

  const normalizedName = projectName ?? repoPath.split('/').pop() ?? repoPath;

  return {
    score: Math.round(avgScore),
    results,
    timestamp: new Date().toISOString(),
    repoPath,
    categoryScores,
    productionReady,
    readinessReasons,
    quickWins: results
      .filter((r) => !r.passed)
      .slice(0, 3)
      .map((check) => ({
        check,
        effort: 'medium',
        points: 5,
        instructions: `Prioritize remediation for ${normalizedName}: ${check.title}.`,
      })),
  };
}
