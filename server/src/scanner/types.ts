export type PackageCategory =
  | 'ml'
  | 'testing'
  | 'automation'
  | 'data'
  | 'ui'
  | 'infra'
  | 'blockchain'
  | 'realtime'
  | 'custom';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DetectedPackage {
  name: string;
  version?: string;
  category: PackageCategory;
  riskLevel: RiskLevel;
}

export interface PackageJsonLike {
  dependencies?: Record<string, string | number | undefined>;
  devDependencies?: Record<string, string | number | undefined>;
  // Allow arbitrary additional fields without relying on `any`.
  [key: string]: unknown;
}

export interface RepoContext {
  path: string;
  packageJson: PackageJsonLike | undefined;
  requirementsTxt: string | undefined;
  hasDockerfile: boolean;
  hasCI: boolean;
  frameworks: string[];
  detectedPackages: DetectedPackage[];
  languages: string[];
  packageJsonPaths: string[];
  requirementsPaths: string[];
}

export type CategoryId =
  | 'codeQuality'
  | 'security'
  | 'dependencies'
  | 'devops'
  | 'architecture'
  | 'frameworkSpecific'
  | 'testing'
  | 'documentation'
  | 'performance'
  | 'aiSpecific'
  | 'accessibility'
  | 'observability'
  | 'dataQuality'
  | 'repoHealth';

export type Severity = 'blocker' | 'high' | 'medium' | 'low';

export interface CheckResult {
  checkId: string;
  title: string;
  category: CategoryId;
  severity: Severity;
  passed: boolean;
  message: string | undefined;
  error: string | undefined;
  autoFixable: boolean | undefined;
}
export interface CheckExecutionResult {
  passed: boolean;
  message?: string;
  error?: string;
  autoFixable?: boolean;
}

export interface Check {
  id: string;
  title: string;
  category: CategoryId;
  severity: Severity;
  automated: boolean;
  checker: (context: RepoContext) => Promise<CheckExecutionResult>;
  autoFix?: (context: RepoContext) => Promise<void>;
}

export interface QuickWin {
  check: CheckResult;
  effort: 'low' | 'medium' | 'high';
  points: number;
  instructions: string;
}

export interface ScanReport {
  score: number;
  results: CheckResult[];
  timestamp: string;
  repoPath: string;
  quickWins?: QuickWin[];
  categoryScores?: Record<CategoryId, number>;
  productionReady?: boolean;
  readinessReasons?: string[];
}
