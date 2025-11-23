import 'dotenv/config';
import path from 'path';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fetch from 'cross-fetch';
import { z } from 'zod';
import { prisma } from './prisma';
import { ScannerDatabase } from './scanner/database';
import { createScannerService } from './scanner/service';
import { analyzeRepo } from './scanner/detector';
import { runAllChecks } from './scanner/runner';
import { scanGithubRepo } from './githubScanner';

const PORT = Number(process.env.PORT || 4000);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const HF_API_KEY = process.env.HF_API_KEY;
const HF_API_URL =
  process.env.HF_API_URL ||
  'https://router.huggingface.co/v1/chat/completions';
const HF_MODEL_ID =
  process.env.HF_MODEL_ID || 'meta-llama/Meta-Llama-3.1-8B-Instruct';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENABLE_LOCAL_REPO_SCAN =
  process.env.ENABLE_LOCAL_REPO_SCAN === 'true';
const API_PROXY_LOG_BODIES =
  process.env.API_PROXY_LOG_BODIES === 'true';
const CORS_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const LOG_RETENTION_DAYS = Number(process.env.LOG_RETENTION_DAYS || '30');
const ALLOWED_PROXY_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']);
const API_PROXY_ALLOWLIST = (process.env.API_PROXY_ALLOWLIST ?? '')
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_TOKEN = (process.env.API_ADMIN_TOKEN ?? '').trim() || undefined;
const ADMIN_HEADER = 'x-admin-token';
const RAW_LOCAL_SCAN_ROOTS = (process.env.REPO_SCAN_ALLOWED_ROOTS ?? '')
  .split(',')
  .map((dir) => dir.trim())
  .filter(Boolean);
const LOCAL_SCAN_ROOTS = RAW_LOCAL_SCAN_ROOTS.map((dir) => path.resolve(dir));
const GITHUB_OWNER_ALLOWLIST = (process.env.GITHUB_OWNER_ALLOWLIST ?? '')
  .split(',')
  .map((owner) => owner.trim().toLowerCase())
  .filter(Boolean);
const DEFAULT_CORS_ALLOWED_ORIGINS = ['http://localhost:3000'];
const EFFECTIVE_CORS_ALLOWED_ORIGINS =
  CORS_ALLOWED_ORIGINS.length > 0
    ? CORS_ALLOWED_ORIGINS
    : DEFAULT_CORS_ALLOWED_ORIGINS;
const scannerDatabase = new ScannerDatabase(prisma);
const scannerService = createScannerService(prisma);

const isHostAllowed = (target: string) => {
  if (!API_PROXY_ALLOWLIST.length) {
    return false;
  }
  try {
    const hostname = new URL(target).hostname.toLowerCase();
    return API_PROXY_ALLOWLIST.some((allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
};

const LocalRepoScanBodySchema = z.object({
  path: z.string().min(1).max(4096).optional(),
});

const GithubScanBodySchema = z.object({
  owner: z.string().min(1).max(256).optional(),
  repo: z.string().min(1).max(256),
  ref: z.string().min(1).max(256).optional(),
});

const AppIdeaStatusSchema = z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS']);

const AppIdeaBodySchema = z.object({
  id: z.string().min(1).max(128),
  title: z.string().min(1).max(256),
  description: z.string().min(1).max(4000),
  problemStatement: z.string().min(1).max(4000),
  features: z.array(z.string().min(1)).default([]),
  targetAudience: z.string().min(1).max(2000),
  revenueModel: z.string().min(1).max(2000),
  marketingStrategy: z.string().min(1).max(4000),
  techStackSuggestion: z.string().min(1).max(4000),
  mermaidDiagram: z.string().min(1).max(8000),
  tags: z.array(z.string().min(1)).default([]),
  status: AppIdeaStatusSchema,
  notes: z.string().max(4000).nullable().optional(),
});

const ProxyRequestSchema = z.object({
  method: z.string().optional(),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().nullable().optional(),
});

interface GithubHealthSource {
  pushed_at?: string | null;
  updated_at?: string | null;
  stargazers_count?: number | null;
  open_issues_count?: number | null;
  archived?: boolean | null;
  disabled?: boolean | null;
}

interface GithubRepo extends GithubHealthSource {
  id?: number | string;
  name?: string;
  description?: string | null;
  topics?: unknown;
  language?: string | null;
  html_url?: string;
}

interface SupabaseProjectJson {
  id?: string | number;
  name?: string;
  status?: string;
  region?: string;
  created_at?: string;
  organization_id?: string;
}

interface VercelDeploymentJson {
  uid?: string;
  id?: string;
  name?: string;
  url?: string;
  state?: string;
  readyState?: string;
  created?: number;
  createdAt?: number;
}

interface VercelProjectJson {
  id?: string;
  projectId?: string;
  name?: string;
  framework?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface VercelFavoriteJson {
  teamId?: string;
  projectId?: string | number;
}

interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

function fail<T = unknown>(
  message: string,
  code?: string,
  details?: unknown,
): ApiResponse<T> {
  const error: ApiError = { message };
  if (code !== undefined) {
    error.code = code;
  }
  if (details !== undefined) {
    error.details = details;
  }
  return {
    data: null,
    error,
  };
}

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_SCAN_MAX = 10;
const RATE_LIMIT_PROXY_MAX = 30;
const RATE_LIMIT_HF_MAX = 20;

const rateLimitBuckets = new Map<string, RateLimitBucket>();

async function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  try {
    const existing = await prisma.rateLimitCounter.findUnique({ where: { key } });
    if (!existing || existing.resetAt.getTime() <= now.getTime()) {
      await prisma.rateLimitCounter.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return false;
    }
    if (existing.count >= maxRequests) {
      return true;
    }
    await prisma.rateLimitCounter.update({
      where: { key },
      data: { count: existing.count + 1 },
    });
    return false;
  } catch (err) {
    const fallbackBucket = rateLimitBuckets.get(key);
    const nowMs = Date.now();
    if (!fallbackBucket || nowMs >= fallbackBucket.resetAt) {
      rateLimitBuckets.set(key, { count: 1, resetAt: nowMs + windowMs });
      return false;
    }
    if (fallbackBucket.count >= maxRequests) {
      return true;
    }
    fallbackBucket.count += 1;
    return false;
  }
}

const normalizedGithubOwnerAllowlist = GITHUB_OWNER_ALLOWLIST.length
  ? GITHUB_OWNER_ALLOWLIST
  : (GITHUB_OWNER ? [GITHUB_OWNER.toLowerCase()] : []);

function ensureAdminToken(request: FastifyRequest, reply: FastifyReply): boolean {
  if (!ADMIN_TOKEN) {
    reply.code(500).send(fail('API_ADMIN_TOKEN is not configured on the server.', 'INTERNAL_ERROR'));
    return false;
  }
  const headerValue = request.headers[ADMIN_HEADER] as string | string[] | undefined;
  const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (provided !== ADMIN_TOKEN) {
    reply.code(401).send(fail('Invalid admin token.', 'UNAUTHORIZED'));
    return false;
  }
  return true;
}

function ensureProxyAllowlistConfigured(reply: FastifyReply): boolean {
  if (!API_PROXY_ALLOWLIST.length) {
    reply
      .code(500)
      .send(
        fail(
          'API_PROXY_ALLOWLIST is not configured on the server. Update API_PROXY_ALLOWLIST to enable proxy access.',
          'INTERNAL_ERROR',
        ),
      );
    return false;
  }
  return true;
}

function isPathWithinAllowedRoots(targetPath: string) {
  if (!LOCAL_SCAN_ROOTS.length) {
    return false;
  }
  const normalized = path.resolve(targetPath);
  return LOCAL_SCAN_ROOTS.some((root) => normalized === root || normalized.startsWith(`${root}${path.sep}`));
}

function isGithubOwnerAllowed(owner: string | undefined | null) {
  if (!owner) {
    return false;
  }
  if (!normalizedGithubOwnerAllowlist.length) {
    return false;
  }
  return normalizedGithubOwnerAllowlist.includes(owner.toLowerCase());
}

function logConfigWarnings(app: ReturnType<typeof Fastify>) {
  if (!ADMIN_TOKEN) {
    app.log.warn('API_ADMIN_TOKEN is not configured; protected endpoints will respond with errors.');
  }
  if (NODE_ENV === 'production' && !API_PROXY_ALLOWLIST.length) {
    app.log.warn(
      'API_PROXY_ALLOWLIST is empty in production; /api/proxy will reject all requests.',
    );
  }
  if (!NODE_ENV && !API_PROXY_ALLOWLIST.length) {
    app.log.warn('API_PROXY_ALLOWLIST is empty; configure allowed hosts before using /api/proxy.');
  }

  if (ENABLE_LOCAL_REPO_SCAN) {
    app.log.warn(
      'ENABLE_LOCAL_REPO_SCAN is true; local repository scanning is enabled. Ensure this server is not exposed to untrusted clients.',
    );
    if (!LOCAL_SCAN_ROOTS.length) {
      app.log.warn('REPO_SCAN_ALLOWED_ROOTS is empty while ENABLE_LOCAL_REPO_SCAN is true. No local paths can be scanned.');
    }
  }

  if (!CORS_ALLOWED_ORIGINS.length) {
    app.log.warn(`CORS_ALLOWED_ORIGINS is empty; defaulting to ${DEFAULT_CORS_ALLOWED_ORIGINS.join(', ')}.`);
  }
}

function getConfigStatus() {
  return {
    env: NODE_ENV,
    admin: {
      tokenConfigured: !!ADMIN_TOKEN,
    },
    github: {
      tokenConfigured: !!GITHUB_TOKEN,
      ownerConfigured: !!GITHUB_OWNER,
      ownerAllowlistSize: normalizedGithubOwnerAllowlist.length,
    },
    supabase: {
      accessTokenConfigured: !!SUPABASE_ACCESS_TOKEN,
      urlConfigured: !!SUPABASE_URL,
      serviceRoleKeyConfigured: !!SUPABASE_SERVICE_ROLE_KEY,
    },
    vercel: {
      tokenConfigured: !!VERCEL_TOKEN,
      teamIdConfigured: !!VERCEL_TEAM_ID,
    },
    huggingFace: {
      apiKeyConfigured: !!HF_API_KEY,
      apiUrl: HF_API_URL,
      modelId: HF_MODEL_ID,
    },
    proxy: {
      allowlistSize: API_PROXY_ALLOWLIST.length,
      logBodies: API_PROXY_LOG_BODIES,
    },
    localRepoScan: {
      enabled: ENABLE_LOCAL_REPO_SCAN,
      allowedRootCount: LOCAL_SCAN_ROOTS.length,
    },
    cors: {
      allowedOriginsCount: EFFECTIVE_CORS_ALLOWED_ORIGINS.length,
    },
    database: {
      urlConfigured: !!process.env.DATABASE_URL,
    },
    logs: {
      retentionDays: LOG_RETENTION_DAYS,
    },
  };
}

async function pruneOldRecords(app: ReturnType<typeof Fastify>) {
  const days = LOG_RETENTION_DAYS;
  if (!Number.isFinite(days) || days <= 0) {
    return;
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const [logsResult, scansResult] = await Promise.all([
      prisma.apiRequestLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      }),
      prisma.repoScan.deleteMany({
        where: { timestamp: { lt: cutoff } },
      }),
    ]);

    app.log.info(
      {
        apiRequestLogsDeleted: logsResult.count,
        repoScansDeleted: scansResult.count,
        cutoff,
      },
      'Pruned old logs and repo scans',
    );
  } catch (err) {
    app.log.error(err, 'Failed to prune old logs and repo scans');
  }
}

function computeGithubHealth(repo: GithubHealthSource) {
  const now = Date.now();
  const pushedAt = repo.pushed_at ?? repo.updated_at ?? new Date().toISOString();

  let score = 60;

  try {
    const lastTs = new Date(pushedAt).getTime();
    if (!Number.isNaN(lastTs)) {
      const diffDays = (now - lastTs) / (1000 * 60 * 60 * 24);
      if (diffDays <= 30) score += 25;
      else if (diffDays <= 180) score += 10;
      else if (diffDays <= 365) score -= 5;
      else score -= 20;
    }
  } catch {
  }

  const stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0;
  if (stars === 0) score -= 5;
  else if (stars > 1000) score += 15;
  else if (stars > 100) score += 10;
  else if (stars > 20) score += 5;

  const openIssues = typeof repo.open_issues_count === 'number' ? repo.open_issues_count : 0;
  if (openIssues > 500) score -= 25;
  else if (openIssues > 100) score -= 15;
  else if (openIssues > 20) score -= 5;

  const archived = !!repo.archived;
  const disabled = !!repo.disabled;
  if (archived || disabled) {
    score -= 40;
  }

  const healthScore = Math.max(0, Math.min(100, Math.round(score)));

  let status: 'ACTIVE' | 'MAINTENANCE' | 'ARCHIVED' | 'CRITICAL';
  if (archived || disabled) status = 'ARCHIVED';
  else if (healthScore < 40) status = 'CRITICAL';
  else if (healthScore < 70) status = 'MAINTENANCE';
  else status = 'ACTIVE';

  return { healthScore, status };
}

async function fetchGithubProjects() {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured');
  }

  const baseUrl = 'https://api.github.com/user/repos';
  const url = `${baseUrl}?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) {
    throw new Error('GitHub API returned unexpected payload');
  }
  const data = json as GithubRepo[];

  return data.map((repo) => {
    const topicsValue = Array.isArray(repo.topics)
      ? (repo.topics as string[])
      : [];
    const languageArray = repo.language ? [repo.language] : [];
    const techStack = Array.from(new Set([...topicsValue, ...languageArray]));
    const { healthScore, status } = computeGithubHealth(repo);

    return {
      id: String(repo.id ?? ''),
      name: repo.name ?? 'Unknown',
      description: repo.description ?? 'No description provided.',
      status,
      techStack,
      repoUrl: repo.html_url ?? '',
      lastDeployedAt:
        repo.pushed_at ?? repo.updated_at ?? new Date().toISOString(),
      healthScore,
    };
  });
}

export async function buildServer() {
  const app = Fastify({ logger: true });

  logConfigWarnings(app);
  void pruneOldRecords(app);

  await app.register(cors, {
    origin: EFFECTIVE_CORS_ALLOWED_ORIGINS,
  });

  app.get('/health', async () => ok({ status: 'ok' }));

  app.get('/health/config', async () => ok(getConfigStatus()));

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error, 'Unhandled error');
    reply.status(500).send(fail('Internal server error', 'INTERNAL_ERROR'));
  });

  app.post('/api/ai/hf', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    if (!HF_API_KEY) {
      reply.code(500);
      return fail('HF_API_KEY is not configured', 'INTERNAL_ERROR');
    }

    const body = request.body as {
      prompt?: string;
      params?: {
        max_new_tokens?: number;
        temperature?: number;
        top_p?: number;
      };
    };

    const prompt = body?.prompt;
    const params = body?.params ?? {};

    if (!prompt || typeof prompt !== 'string') {
      reply.code(400);
      return fail('Missing prompt', 'BAD_REQUEST');
    }

    const ip = request.ip ?? 'unknown';
    if (await isRateLimited(`hf:${ip}`, RATE_LIMIT_HF_MAX, RATE_LIMIT_WINDOW_MS)) {
      reply.code(429);
      return fail('Too many AI requests. Please slow down.', 'RATE_LIMITED');
    }

    try {
      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HF_API_KEY}`,
        },
        body: JSON.stringify({
          model: HF_MODEL_ID,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: params.temperature ?? 0.7,
          max_tokens: params.max_new_tokens ?? 900,
          top_p: params.top_p ?? 0.9,
          stream: false,
        }),
      });

      const rawText = await response.text();

      let data: unknown = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        reply.code(response.status);
        return fail(
          `Hugging Face API ${response.status}`,
          'UPSTREAM_ERROR',
          rawText || response.statusText,
        );
      }

      let text: string | undefined;

      if (
        data &&
        typeof data === 'object' &&
        'choices' in (data as any) &&
        Array.isArray((data as any).choices) &&
        (data as any).choices[0]?.message?.content
      ) {
        text = String((data as any).choices[0].message.content);
      }

      if (!text) {
        text = rawText || JSON.stringify(data ?? {});
      }

      return ok({ text });
    } catch (err) {
      reply.code(502);
      return fail(
        err instanceof Error ? err.message : 'Failed to reach Hugging Face',
        'BAD_GATEWAY',
      );
    }
  });

  app.get('/api/integrations/supabase/summary', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const requiredEnv = ['SUPABASE_ACCESS_TOKEN'];

    if (!SUPABASE_ACCESS_TOKEN) {
      return ok({
        connected: false,
        reason: 'Supabase access token is not configured.',
        requiredEnv,
      });
    }

    const managementUrl = 'https://api.supabase.com/v1/projects';

    try {
      const res = await fetch(managementUrl, {
        headers: {
          Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return ok({
          connected: false,
          reason: 'Supabase API responded with an error.',
          statusCode: res.status,
          requiredEnv,
          lastCheckedAt: new Date().toISOString(),
        });
      }

      const json = (await res.json()) as unknown;
      const rawProjects: SupabaseProjectJson[] = Array.isArray(json)
        ? (json as SupabaseProjectJson[])
        : [];

      const projects = rawProjects.map((p) => ({
        id: String(p.id ?? ''),
        name: p.name ?? 'Unknown',
        status: p.status ?? undefined,
        region: p.region ?? undefined,
        createdAt: p.created_at ?? undefined,
        organizationId: p.organization_id ?? undefined,
      }));

      return ok({
        connected: true,
        url: managementUrl,
        statusCode: res.status,
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          status: project.status,
          region: project.region,
        })),
        requiredEnv,
        lastCheckedAt: new Date().toISOString(),
      });
    } catch (err) {
      return ok({
        connected: false,
        reason: 'Failed to reach Supabase.',
        error: err instanceof Error ? err.message : 'Unknown error',
        requiredEnv,
        lastCheckedAt: new Date().toISOString(),
      });
    }
  });

  app.get('/api/integrations/vercel/summary', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const requiredEnv = ['VERCEL_TOKEN'];

    if (!VERCEL_TOKEN) {
      return ok({
        connected: false,
        reason: 'Vercel token is not configured.',
        requiredEnv,
      });
    }

    try {
      const params = new URLSearchParams({ limit: '20' });
      if (VERCEL_TEAM_ID) {
        params.set('teamId', VERCEL_TEAM_ID);
      }

      const headers = {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      } as const;

      const deploymentsRes = await fetch(
        `https://api.vercel.com/v6/deployments?${params.toString()}`,
        { headers },
      );

      if (!deploymentsRes.ok) {
        const text = await deploymentsRes.text().catch(() => '');
        return ok({
          connected: false,
          reason: 'Vercel API responded with an error.',
          statusCode: deploymentsRes.status,
          requiredEnv,
          teamId: VERCEL_TEAM_ID ?? null,
          lastCheckedAt: new Date().toISOString(),
        });
      }

      const deploymentsJson = (await deploymentsRes.json()) as unknown;
      const deploymentsArray =
        (deploymentsJson as { deployments?: unknown }).deployments;
      const rawDeployments: VercelDeploymentJson[] = Array.isArray(
        deploymentsArray,
      )
        ? (deploymentsArray as VercelDeploymentJson[])
        : [];

      const deployments = rawDeployments.map((d) => {
        const created =
          typeof d.created === 'number'
            ? d.created
            : typeof d.createdAt === 'number'
            ? d.createdAt
            : Date.now();

        return {
          id: String(d.uid ?? d.id ?? ''),
          name: d.name ?? 'Unknown',
          url: d.url ?? '',
          state: d.state ?? d.readyState ?? '',
          createdAt: created,
          readyState: d.readyState,
        };
      });

      // Fetch projects list (best-effort; deployments are primary)
      let projects: VercelProjectJson[] = [];
      try {
        const projectParams = new URLSearchParams();
        if (VERCEL_TEAM_ID) {
          projectParams.set('teamId', VERCEL_TEAM_ID);
        }
        const projectsRes = await fetch(
          `https://api.vercel.com/v9/projects?${projectParams.toString()}`,
          { headers },
        );
        if (projectsRes.ok) {
          const projectsJson = (await projectsRes.json()) as unknown;
          const projectsArray =
            (projectsJson as { projects?: unknown }).projects;
          const rawProjects: VercelProjectJson[] = Array.isArray(projectsArray)
            ? (projectsArray as VercelProjectJson[])
            : [];
          projects = rawProjects.map((p) => {
            const createdAt =
              typeof p.createdAt === 'number' ? p.createdAt : Date.now();
            const updatedAt =
              typeof p.updatedAt === 'number' ? p.updatedAt : createdAt;
            const mapped: VercelProjectJson = {
              id: String(p.id ?? p.projectId ?? p.name ?? ''),
              name: p.name ?? 'Unknown',
              createdAt,
              updatedAt,
            };
            if (p.projectId !== undefined) {
              mapped.projectId = p.projectId;
            }
            if (p.framework !== undefined) {
              mapped.framework = p.framework;
            }
            return mapped;
          });
        }
      } catch {
        // Ignore project fetch errors; deployments summary is still useful
      }

      // Determine favorites from the authenticated user
      let favoriteProjectIds = new Set<string>();
      try {
        const userRes = await fetch('https://api.vercel.com/v2/user', {
          headers,
        });
        if (userRes.ok) {
          const userJson = (await userRes.json()) as unknown;
          const user = (userJson as {
            user?: { favoriteProjectsAndSpaces?: unknown };
          }).user;
          const favoritesArray = user?.favoriteProjectsAndSpaces;
          const favorites: VercelFavoriteJson[] = Array.isArray(favoritesArray)
            ? (favoritesArray as VercelFavoriteJson[])
            : [];
          favoriteProjectIds = new Set(
            favorites
              .filter((f) =>
                VERCEL_TEAM_ID ? f.teamId === VERCEL_TEAM_ID : true,
              )
              .map((f) => String(f.projectId)),
          );
        }
      } catch {
        // If this fails, we simply won't mark any favorites
      }

      const projectsWithFavorites = projects.map((p) => ({
        ...p,
        favorite: favoriteProjectIds.has(String(p.id ?? '')),
      }));

      return ok({
        connected: true,
        teamId: VERCEL_TEAM_ID ?? null,
        deployments: deployments.slice(0, 20).map((deployment) => ({
          id: deployment.id,
          name: deployment.name,
          url: deployment.url,
          state: deployment.state,
          createdAt: deployment.createdAt,
        })),
        projects: projectsWithFavorites.slice(0, 20).map((project) => ({
          id: project.id,
          name: project.name,
          framework: project.framework,
          favorite: project.favorite,
        })),
        lastCheckedAt: new Date().toISOString(),
      });
    } catch (err) {
      return ok({
        connected: false,
        reason: 'Failed to reach Vercel.',
        error: err instanceof Error ? err.message : 'Unknown error',
        requiredEnv,
        teamId: VERCEL_TEAM_ID ?? null,
        lastCheckedAt: new Date().toISOString(),
      });
    }
  });

  app.get('/api/projects', async () => {
    // Prefer live GitHub data when configured, otherwise fall back to seeded Prisma data
    if (GITHUB_TOKEN) {
      try {
        const projects = await fetchGithubProjects();
        return ok(projects);
      } catch (err) {
        // Log and fall back to Prisma data so the dashboard still loads
        console.error('GitHub integration failed, falling back to Prisma projects:', err);
      }
    }

    const projects = await prisma.project.findMany();
    const mapped = projects.map((p: (typeof projects)[number]) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      techStack: JSON.parse(p.techStackJson) as string[],
      repoUrl: p.repoUrl,
      lastDeployedAt: p.lastDeployedAt,
      healthScore: p.healthScore,
    }));
    return ok(mapped);
  });

  app.post('/api/repo-scan/local', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    if (!ENABLE_LOCAL_REPO_SCAN) {
      reply.code(403);
      return fail(
        'Local repository scanning is disabled on this server.',
        'FORBIDDEN',
      );
    }

    if (!LOCAL_SCAN_ROOTS.length) {
      reply.code(400);
      return fail('REPO_SCAN_ALLOWED_ROOTS is not configured on the server.', 'BAD_REQUEST');
    }

    const parseResult = LocalRepoScanBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return fail(
        'Invalid request body',
        'BAD_REQUEST',
        parseResult.error.issues,
      );
    }

    const ip = request.ip ?? 'unknown';
    if (await isRateLimited(`scan-local:${ip}`, RATE_LIMIT_SCAN_MAX, RATE_LIMIT_WINDOW_MS)) {
      reply.code(429);
      return fail(
        'Too many local scan requests. Please slow down.',
        'RATE_LIMITED',
      );
    }

    const requestedPath = parseResult.data.path ?? process.cwd();
    if (!isPathWithinAllowedRoots(requestedPath)) {
      reply.code(403);
      return fail('Requested path is not within the allowed scan roots.', 'FORBIDDEN');
    }
    const targetPath = path.resolve(requestedPath);

    try {
      const context = await analyzeRepo(targetPath);
      const report = await runAllChecks(context);

      try {
        await scannerDatabase.saveScanReport(report);
      } catch (persistErr) {
        request.log.error(persistErr, 'Failed to persist local repo scan');
      }

      return ok(report);
    } catch (err) {
      request.log.error(
        err,
        `Failed to run repository scan for path ${targetPath}`,
      );
      reply.code(500);
      return fail(
        err instanceof Error ? err.message : 'Failed to run repository scan',
        'INTERNAL_ERROR',
      );
    }
  });

  app.post('/api/repo-scan/github', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    if (!GITHUB_TOKEN) {
      reply.code(500);
      return fail('GITHUB_TOKEN is not configured', 'INTERNAL_ERROR');
    }

    const parseResult = GithubScanBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return fail(
        'Invalid request body',
        'BAD_REQUEST',
        parseResult.error.issues,
      );
    }

    const parsed = parseResult.data;
    const ownerFromBody = parsed.owner;
    const owner = ownerFromBody ?? GITHUB_OWNER;
    const repo = parsed.repo;
    const ref = parsed.ref;

    if (!owner) {
      reply.code(400);
      return fail(
        'Owner is required (either in request body or via GITHUB_OWNER env var)',
        'BAD_REQUEST',
      );
    }

    if (!isGithubOwnerAllowed(owner)) {
      reply.code(403);
      return fail('Owner is not in the allowed GitHub owner list.', 'FORBIDDEN');
    }

    const ip = request.ip ?? 'unknown';
    if (await isRateLimited(`scan-github:${ip}`, RATE_LIMIT_SCAN_MAX, RATE_LIMIT_WINDOW_MS)) {
      reply.code(429);
      return fail(
        'Too many GitHub scan requests. Please slow down.',
        'RATE_LIMITED',
      );
    }

    try {
      const scanOptions: { owner: string; repo: string; token: string; ref?: string } = {
        owner,
        repo,
        token: GITHUB_TOKEN,
      };
      if (ref && ref.trim()) {
        scanOptions.ref = ref.trim();
      }
      const report = await scanGithubRepo(scanOptions);

      try {
        const fullRepoUrl = `https://github.com/${owner}/${repo}`;
        const linkedProject = await prisma.project.findFirst({
          where: {
            repoUrl: fullRepoUrl,
          },
        });

        await scannerDatabase.saveScanReport(report, linkedProject?.id);
      } catch (persistErr) {
        request.log.error(persistErr, 'Failed to persist GitHub repo scan');
      }

      return ok(report);
    } catch (err) {
      request.log.error(
        err,
        `Failed to run GitHub repository scan for ${owner}/${repo}`,
      );
      reply.code(500);
      return fail(
        err instanceof Error
          ? err.message
          : 'Failed to run GitHub repository scan',
        'INTERNAL_ERROR',
      );
    }
  });

  app.get('/api/deployments', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const deployments = await prisma.deployment.findMany();
    return ok(deployments);
  });

  app.get('/api/dependency-issues', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const issues = await prisma.dependencyIssue.findMany();
    return ok(issues);
  });

  app.get('/api/app-ideas', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const ideas = await prisma.appIdea.findMany({ orderBy: { createdAt: 'desc' } });
    const mapped = ideas.map((i: (typeof ideas)[number]) => ({
      ...i,
      features: JSON.parse(i.featuresJson) as string[],
      tags: JSON.parse(i.tagsJson) as string[],
    }));
    return ok(mapped);
  });

  app.post('/api/app-ideas', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const parseResult = AppIdeaBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return fail(
        'Invalid app idea payload',
        'BAD_REQUEST',
        parseResult.error.issues,
      );
    }

    const body = parseResult.data;
    const created = await prisma.appIdea.create({
      data: {
        id: body.id,
        title: body.title,
        description: body.description,
        problemStatement: body.problemStatement,
        featuresJson: JSON.stringify(body.features),
        targetAudience: body.targetAudience,
        revenueModel: body.revenueModel,
        marketingStrategy: body.marketingStrategy,
        techStackSuggestion: body.techStackSuggestion,
        mermaidDiagram: body.mermaidDiagram,
        tagsJson: JSON.stringify(body.tags),
        status: body.status,
        notes: body.notes ?? null,
      },
    });
    reply.code(201);
    return ok(created);
  });

  app.get('/api/logs', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const rawLimit = Number((request.query as { limit?: string })?.limit ?? 20);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
    const take = Math.min(Math.max(limit, 1), 100);
    const logs = await prisma.apiRequestLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
    return ok(logs);
  });

  app.get('/api/repo-scans/latest', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    const { repoPath } = request.query as { repoPath?: string };

    if (!repoPath) {
      reply.code(400);
      return fail('repoPath query parameter is required', 'BAD_REQUEST');
    }

    try {
      const scan = await prisma.repoScan.findFirst({
        where: { repoPath },
        orderBy: { timestamp: 'desc' },
      });

      if (!scan) {
        reply.code(404);
        return fail('No scan found for the specified repoPath', 'NOT_FOUND');
      }

      let categoryScores: Record<string, number> = {};
      let results: unknown = [];
      let readinessReasons: string[] | undefined;

      try {
        categoryScores = JSON.parse(scan.categoryScoresJson) as Record<string, number>;
      } catch {
        categoryScores = {};
      }

      try {
        results = JSON.parse(scan.resultsJson) as unknown;
      } catch {
        results = [];
      }

      try {
        readinessReasons = scan.readinessReasonsJson
          ? (JSON.parse(scan.readinessReasonsJson) as string[])
          : undefined;
      } catch {
        readinessReasons = undefined;
      }

      return ok({
        score: scan.score,
        results,
        timestamp: scan.timestamp.toISOString(),
        repoPath: scan.repoPath,
        categoryScores,
        productionReady: scan.productionReady ?? undefined,
        readinessReasons,
      });
    } catch (err) {
      request.log.error(err, 'Failed to fetch latest repo scan');
      reply.code(500);
      return fail('Failed to fetch latest repo scan', 'INTERNAL_ERROR');
    }
  });

  app.get('/api/repo-scans/dashboard', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }

    try {
      const stats = await scannerService.getDashboardStats();
      return ok(stats);
    } catch (err) {
      request.log.error(err, 'Failed to fetch scanner dashboard stats');
      reply.code(500);
      return fail('Failed to fetch scanner dashboard stats', 'INTERNAL_ERROR');
    }
  });

  app.post('/api/proxy', async (request, reply) => {
    if (!ensureAdminToken(request, reply)) {
      return;
    }
    if (!ensureProxyAllowlistConfigured(reply)) {
      return;
    }
    const parseResult = ProxyRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      reply.code(400);
      return fail(
        'Invalid proxy request body',
        'BAD_REQUEST',
        parseResult.error.issues,
      );
    }

    const { method, url, headers: rawHeaders, body } = parseResult.data;

    const headers: Record<string, string> = rawHeaders ?? {};

    const ip = request.ip ?? 'unknown';
    if (await isRateLimited(`proxy:${ip}`, RATE_LIMIT_PROXY_MAX, RATE_LIMIT_WINDOW_MS)) {
      reply.code(429);
      return fail(
        'Too many proxied requests. Please slow down.',
        'RATE_LIMITED',
      );
    }

    if (!url || !/^https?:\/\//i.test(url)) {
      reply.code(400);
      return fail('A valid http(s) URL is required.', 'BAD_REQUEST');
    }

    if (!isHostAllowed(url)) {
      reply.code(403);
      return fail('Target host not allowed.', 'FORBIDDEN');
    }

    const upperMethod = method?.toUpperCase() ?? 'GET';
    if (!ALLOWED_PROXY_METHODS.has(upperMethod)) {
      reply.code(405);
      return fail(
        `Method ${upperMethod} not permitted.`,
        'METHOD_NOT_ALLOWED',
      );
    }
    const start = Date.now();

    let statusCode = 0;
    let responseText = '';

    try {
      const fetchBody = ['GET', 'HEAD'].includes(upperMethod) ? null : (body ?? null);
      const sanitizedHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(headers)) {
        const lower = key.toLowerCase();
        if (
          lower === 'host' ||
          lower === 'content-length' ||
          lower === 'connection'
        ) {
          continue;
        }
        sanitizedHeaders[key] = value;
      }
      const init: RequestInit = {
        method: upperMethod,
        headers: sanitizedHeaders,
      };
      if (fetchBody !== null) {
        init.body = fetchBody as BodyInit;
      }
      const res = await fetch(url, init);
      statusCode = res.status;
      responseText = await res.text();

      const loggedRequestBody =
        API_PROXY_LOG_BODIES && body != null ? body.substring(0, 2000) : null;
      const loggedResponseBody =
        API_PROXY_LOG_BODIES ? responseText.substring(0, 2000) : null;

      await prisma.apiRequestLog.create({
        data: {
          method: upperMethod,
          url,
          requestBody: loggedRequestBody,
          responseBody: loggedResponseBody,
          statusCode,
        },
      });

      return ok({
        statusCode,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseText,
        durationMs: Date.now() - start,
        bodySize: Buffer.byteLength(responseText, 'utf8'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      await prisma.apiRequestLog.create({
        data: {
          method: upperMethod,
          url,
          requestBody: API_PROXY_LOG_BODIES && body != null ? body.substring(0, 2000) : null,
          responseBody: API_PROXY_LOG_BODIES ? message : null,
          statusCode: statusCode || 0,
        },
      });
      reply.code(502);
      return fail(message, 'BAD_GATEWAY');
    }
  });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
