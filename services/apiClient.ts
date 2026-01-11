import {
  Project,
  ProjectStatus,
  Deployment,
  DependencyIssue,
  AppIdea,
  RepoScanReport,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(ADMIN_TOKEN ? { 'x-admin-token': ADMIN_TOKEN } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorBody = (await res.json()) as unknown;
      if (errorBody && typeof errorBody === 'object') {
        const maybeError = (errorBody as { error?: { message?: string } | null }).error;
        if (maybeError && typeof maybeError.message === 'string') {
          errorMessage = maybeError.message;
        } else if (typeof (errorBody as { message?: string }).message === 'string') {
          errorMessage = (errorBody as { message: string }).message;
        }
      }
    } catch {
      const text = await res.text().catch(() => '');
      if (text) {
        errorMessage = text;
      }
    }
    throw new Error(`API ${res.status}: ${errorMessage}`);
  }

  const json = (await res.json().catch(() => null)) as unknown;

  if (json && typeof json === 'object' && 'data' in json && 'error' in json) {
    const apiResponse = json as {
      data: T | null;
      error: { message?: string } | null;
    };
    if (apiResponse.error && apiResponse.error.message) {
      throw new Error(apiResponse.error.message);
    }
    return (apiResponse.data ?? (undefined as unknown as T)) as T;
  }

  return json as T;
}

function mapProjectStatus(raw: string): ProjectStatus {
  switch (raw) {
    case 'ACTIVE':
      return ProjectStatus.ACTIVE;
    case 'MAINTENANCE':
      return ProjectStatus.MAINTENANCE;
    case 'ARCHIVED':
      return ProjectStatus.ARCHIVED;
    case 'CRITICAL':
      return ProjectStatus.CRITICAL;
    default:
      return ProjectStatus.ACTIVE;
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const data = await request<any[]>('/api/projects');
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: mapProjectStatus(p.status),
    techStack: Array.isArray(p.techStack) ? p.techStack : [],
    repoUrl: p.repoUrl,
    lastDeployed: typeof p.lastDeployedAt === 'string' ? p.lastDeployedAt : new Date(p.lastDeployedAt).toISOString(),
    healthScore: p.healthScore,
  }));
}

export async function fetchDeployments(): Promise<Deployment[]> {
  const data = await request<any[]>('/api/deployments');
  return data.map((d) => ({
    id: d.id,
    projectId: d.projectId,
    projectName: d.projectName,
    status: (d.status as string).toLowerCase() as Deployment['status'],
    timestamp: typeof d.timestamp === 'string' ? d.timestamp : new Date(d.timestamp).toISOString(),
    commitHash: d.commitHash,
    branch: d.branch,
  }));
}

export async function fetchDependencyIssues(): Promise<(DependencyIssue & { cveId?: string })[]> {
  const data = await request<any[]>('/api/dependency-issues');
  return data.map((i) => ({
    id: i.id,
    projectId: i.projectId,
    packageName: i.packageName,
    currentVersion: i.currentVersion,
    latestVersion: i.latestVersion,
    severity: (i.severity as string).toLowerCase() as DependencyIssue['severity'],
    status: (i.status as string).toLowerCase() as DependencyIssue['status'],
    riskScore: i.riskScore,
    cveId: i.cveId ?? undefined,
  }));
}

function mapAppIdeaStatusFromApi(raw: string): AppIdea['status'] {
  const lower = raw.toLowerCase();
  if (lower === 'planned') return 'planned';
  if (lower === 'in_progress') return 'in-progress';
  return 'draft';
}

function mapAppIdeaStatusToApi(status: AppIdea['status']): string {
  switch (status) {
    case 'planned':
      return 'PLANNED';
    case 'in-progress':
      return 'IN_PROGRESS';
    case 'draft':
    default:
      return 'DRAFT';
  }
}

export async function fetchAppIdeas(): Promise<AppIdea[]> {
  const data = await request<any[]>('/api/app-ideas');
  return data.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    problemStatement: i.problemStatement,
    features: Array.isArray(i.features) ? i.features : [],
    targetAudience: i.targetAudience,
    revenueModel: i.revenueModel,
    marketingStrategy: i.marketingStrategy,
    techStackSuggestion: i.techStackSuggestion,
    mermaidDiagram: i.mermaidDiagram,
    tags: Array.isArray(i.tags) ? i.tags : [],
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    status: mapAppIdeaStatusFromApi(i.status as string),
    notes: i.notes ?? undefined,
  }));
}

export async function createAppIdea(idea: AppIdea): Promise<AppIdea> {
  const payload = {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    problemStatement: idea.problemStatement,
    features: idea.features,
    targetAudience: idea.targetAudience,
    revenueModel: idea.revenueModel,
    marketingStrategy: idea.marketingStrategy,
    techStackSuggestion: idea.techStackSuggestion,
    mermaidDiagram: idea.mermaidDiagram,
    tags: idea.tags,
    status: mapAppIdeaStatusToApi(idea.status),
    notes: idea.notes ?? null,
  };

  const created = await request<any>('/api/app-ideas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    problemStatement: created.problemStatement,
    features: Array.isArray(created.features) ? created.features : JSON.parse(created.featuresJson ?? '[]'),
    targetAudience: created.targetAudience,
    revenueModel: created.revenueModel,
    marketingStrategy: created.marketingStrategy,
    techStackSuggestion: created.techStackSuggestion,
    mermaidDiagram: created.mermaidDiagram,
    tags: Array.isArray(created.tags) ? created.tags : JSON.parse(created.tagsJson ?? '[]'),
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    status: mapAppIdeaStatusFromApi(created.status as string),
    notes: created.notes ?? undefined,
  };
}

function parseGithubRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== 'github.com') return null;
    const parts = url.pathname.replace(/^\/+/, '').split('/');
    if (parts.length < 2) return null;
    const [owner, repoWithMaybeGit] = parts;
    const repo = repoWithMaybeGit.replace(/\.git$/, '');
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

export async function scanGithubRepoForProject(
  project: Project,
): Promise<RepoScanReport> {
  const parsed = parseGithubRepoUrl(project.repoUrl);
  if (!parsed) {
    throw new Error('Project does not have a valid GitHub repoUrl to scan.');
  }

  const body = {
    owner: parsed.owner,
    repo: parsed.repo,
  };

  return request<RepoScanReport>('/api/repo-scan/github', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchLatestRepoScanForProject(
  project: Project,
): Promise<RepoScanReport | null> {
  const parsed = parseGithubRepoUrl(project.repoUrl);
  if (!parsed) return null;

  const repoPath = `${parsed.owner}/${parsed.repo}`;
  const query = new URLSearchParams({ repoPath }).toString();

  try {
    return await request<RepoScanReport>(`/api/repo-scans/latest?${query}`);
  } catch {
    return null;
  }
}

export async function createProject(project: {
  name: string;
  description?: string;
  repoUrl: string;
  techStack?: string[];
}): Promise<Project> {
  const created = await request<any>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    status: mapProjectStatus(created.status),
    techStack: Array.isArray(created.techStack) ? created.techStack : JSON.parse(created.techStackJson || '[]'),
    repoUrl: created.repoUrl,
    lastDeployed: created.lastDeployedAt,
    healthScore: created.healthScore,
  };
}

export async function fetchLogs(limit: number = 20): Promise<any[]> {
  return request<any[]>(`/api/logs?limit=${limit}`);
}

export async function fetchIntegrationSummary(service: 'supabase' | 'vercel'): Promise<any> {
  return request<any>(`/api/integrations/${service}/summary`);
}

export async function fetchSystemStats(): Promise<any> {
  return request<any>('/api/system/stats');
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) => request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};
