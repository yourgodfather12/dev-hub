
export enum ProjectStatus {
  ACTIVE = 'Active',
  MAINTENANCE = 'Maintenance',
  ARCHIVED = 'Archived',
  CRITICAL = 'Critical'
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
  APP_IDEAS = 'APP_IDEAS',
  API_EXPLORER = 'API_EXPLORER',
  SUPABASE = 'SUPABASE',
  VERCEL = 'VERCEL',
  DOCKER = 'DOCKER',
  STRIPE = 'STRIPE',
  HUGGING_FACE = 'HUGGING_FACE'
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

export type RepoScanSeverity = 'blocker' | 'high' | 'medium' | 'low';

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

export interface ApiRequestLog {
  id: string;
  method: string;
  url: string;
  requestBody?: string | null;
  responseBody?: string | null;
  statusCode?: number | null;
  createdAt: string;
}
