import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ScannerDatabase } from '../scanner/database';
import {
  CategoryId,
  Severity,
  CheckResult,
  ScanReport,
} from '../scanner/types';

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
    title: 'Outdated dependencies',
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

const prisma = new PrismaClient({});
const scannerDatabase = new ScannerDatabase(prisma);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'repo';
}

function inferRepoPath(repoUrl: string | null | undefined, projectName: string): string {
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

function deterministicNumber(seed: string, max: number, min = 0): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  return min + (hash % (max - min + 1));
}

function buildReport(projectName: string, repoPath: string): ScanReport {
  const categoryScores: Record<CategoryId, number> = {} as Record<CategoryId, number>;

  CATEGORY_BLUEPRINTS.forEach((blueprint, idx) => {
    const base = 65 + deterministicNumber(`${repoPath}-${idx}`, 25);
    categoryScores[blueprint.category] = Math.min(98, Math.max(45, base));
  });

  const results: CheckResult[] = CATEGORY_BLUEPRINTS.map((blueprint, idx) => {
    const categoryScore = categoryScores[blueprint.category];
    const passed = categoryScore >= 70 || idx % 2 === 0;
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

  const averageScore =
    Object.values(categoryScores).reduce((sum, score) => sum + score, 0) /
    Object.keys(categoryScores).length;

  const productionReady = averageScore >= 80;
  const readinessReasons = productionReady
    ? []
    : [
        'Address high-severity issues highlighted in the scan.',
        'Increase automated testing to unblock production readiness.',
      ];

  return {
    score: Math.round(averageScore),
    results,
    timestamp: new Date().toISOString(),
    repoPath,
    categoryScores,
    productionReady,
    readinessReasons,
  };
}

async function seedRepoScans() {
  const projects = await prisma.project.findMany();
  if (!projects.length) {
    console.warn('No projects found in database; skipping repo scan seeding.');
    return;
  }

  for (const project of projects) {
    const repoPath = inferRepoPath(project.repoUrl, project.name);
    await prisma.repoScan.deleteMany({ where: { repoPath } });
    const report = buildReport(project.name, repoPath);
    await scannerDatabase.saveScanReport(report, project.id);
    console.log(`Seeded repo scan for ${repoPath}`);
  }
}

seedRepoScans()
  .catch((error) => {
    console.error('Failed to seed repo scans', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
