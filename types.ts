export enum ProjectStatus {
  ACTIVE = 'Active',
  MAINTENANCE = 'Maintenance',
  ARCHIVED = 'Archived',
  CRITICAL = 'Critical',
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  techStack: string[];
  repoUrl: string;
  lastDeployed: string;
  healthScore: number; // 0-100
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

export interface Deployment {
  id: string;
  projectId: string;
  projectName: string;
  status: 'success' | 'failed' | 'building';
  timestamp: string;
  commitHash: string;
  branch: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  PROJECT_STUDIO = 'PROJECT_STUDIO',
  ARCHI = 'ARCHI',
  APP_IDEAS = 'APP_IDEAS',
  SUPABASE = 'SUPABASE',
  VERCEL = 'VERCEL',
  DOCKER = 'DOCKER',
  STRIPE = 'STRIPE',
  HUGGING_FACE = 'HUGGING_FACE',
  PROJECT_WORKSHOP = 'PROJECT_WORKSHOP',
}

export type ArchiRunStatus = 'idle' | 'running' | 'success' | 'warning';

export interface ArchiAgentRole {
  id: string;
  title: string;
  description: string;
  icon: string;
  capabilities: string[];
  accentClass: string;
}

export interface ArchiQuickAction {
  id: string;
  title: string;
  description: string;
  prompt: string;
  recommendedRoleId: string;
  actionType: 'audit' | 'plan' | 'patch' | 'review';
}

export interface ArchiWorkspaceOption {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  status: 'synced' | 'indexing' | 'attention';
  lastRun: string;
}

export interface ArchiRunLog {
  id: string;
  message: string;
  level: 'info' | 'success' | 'warning';
  timestamp: string;
}

export interface ArchiRunResult {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: ArchiRunStatus;
  summary?: string;
  actionType: ArchiQuickAction['actionType'];
  roleId: string;
  workspaceId: string;
  task: string;
  logs: ArchiRunLog[];
}

export interface DependencyIssue {
  id: string;
  projectId: string;
  packageName: string;
  currentVersion: string;
  latestVersion: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'fixing' | 'fixed';
  riskScore: number; // 1-10
}

export interface AppIdea {
  id: string;
  title: string;
  description: string; // The "Vibe" / Elevator Pitch
  problemStatement: string; // "The Headache"
  features: string[];
  targetAudience: string; // "The Users"
  revenueModel: string; // "The Bag"
  marketingStrategy: string; // "The Hype Plan"
  techStackSuggestion: string; // "The Build"
  mermaidDiagram: string; // "The Flow"
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'planned' | 'in-progress';
  notes?: string;
}

export interface AuditCategory {
  name: string;
  score: number; // 0-100
  status: 'optimal' | 'good' | 'warning' | 'critical';
  findings: string[];
}

export type RepoScanSeverity = 'blocker' | 'high' | 'medium' | 'low';

export interface RepoAudit {
  projectId: string;
  timestamp: string;
  overallScore: number;
  categories: AuditCategory[];
  detectedFeatures: string[]; // e.g., "Playwright", "Hugging Face", "Redis"
  executiveSummary: string;
  productionReady?: boolean;
  readinessReasons?: string[];
  issues?: {
    checkId: string;
    title: string;
    category: string;
    severity: RepoScanSeverity;
    message: string;
  }[];
}

export interface RepoScanCheckResult {
  checkId: string;
  title: string;
  category: string;
  severity: RepoScanSeverity;
  passed: boolean;
  message?: string;
  error?: string;
  autoFixable?: boolean;
}

export interface RepoScanReport {
  score: number;
  results: RepoScanCheckResult[];
  timestamp: string;
  repoPath: string;
  categoryScores?: Record<string, number>;
  productionReady?: boolean;
  readinessReasons?: string[];
}
