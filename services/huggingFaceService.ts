import { AppIdea, Project } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

type HFRequestParams = {
  max_new_tokens?: number;
  temperature?: number;
  top_p?: number;
};

const callHuggingFace = async (prompt: string, params: HFRequestParams = {}) => {
  if (!ADMIN_TOKEN) {
    throw new Error('Missing admin token. Set VITE_ADMIN_TOKEN in your .env.local file.');
  }
  const response = await fetch(`${API_BASE_URL}/api/ai/hf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ prompt, params }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI API ${response.status}: ${errorText || response.statusText}`);
  }

  const data = (await response.json()) as
    | { text?: string }
    | { data?: { text?: string } | null; error?: { message?: string } | null };

  let text: string | undefined;

  if (data && typeof data === 'object') {
    if ('data' in data) {
      const inner = (data as { data?: { text?: string } | null }).data;
      text = inner?.text;
    } else if ('text' in data) {
      text = (data as { text?: string }).text;
    }
  }

  if (!text) {
    text = JSON.stringify(data);
  }

  return text.trim();
};

const extractJsonBlock = (content: string, marker: string) => {
  const blockWithFence = content.match(new RegExp(`${marker}\\s*` + '```json([\\s\\S]*?)```', 'i'));
  if (blockWithFence?.[1]) {
    return blockWithFence[1];
  }
  const block = content.match(new RegExp(`${marker}\\s*([\\[{][\\s\\S]*)`, 'i'));
  if (block?.[1]) {
    return block[1];
  }
  return null;
};

const normalizeIdea = (payload: Partial<AppIdea>): AppIdea => ({
  id: payload.id ?? `idea-${Date.now()}`,
  title: payload.title?.trim() || 'Untitled Concept',
  description: payload.description?.trim() || 'No description provided.',
  problemStatement: payload.problemStatement?.trim() || 'The problem is unclear but needs validation.',
  features: Array.isArray(payload.features) && payload.features.length ? payload.features : ['Feature backlog pending'],
  targetAudience: payload.targetAudience || 'General builders',
  revenueModel: payload.revenueModel || 'Subscription',
  marketingStrategy: payload.marketingStrategy || 'Launch on Product Hunt and social channels.',
  techStackSuggestion: payload.techStackSuggestion || 'Next.js, Supabase, Hugging Face Inference.',
  mermaidDiagram: payload.mermaidDiagram || 'graph TD; A[Idea]-->B[Execution];',
  tags: payload.tags && payload.tags.length ? payload.tags : ['AI', 'SaaS'],
  createdAt: payload.createdAt || new Date().toISOString(),
  updatedAt: payload.updatedAt || new Date().toISOString(),
  status: payload.status || 'draft',
  notes: payload.notes,
});

export interface AIEngineerResponse {
  text: string;
  idea?: AppIdea;
}

export const askAIEngineer = async (message: string, context?: string): Promise<AIEngineerResponse> => {
  const prompt = `You are "Vibe Coder", a playful but expert startup architect inside Dev Hub.
Speak with swagger but give concrete advice.

When the user wants a new blueprint, output the following format:
TEXT:
<your conversational response>
IDEA_JSON:
\`\`\`json
{ ... detailed AppIdea ... }
\`\`\`
If you don't have a full idea to save, set IDEA_JSON to null.

Context (optional): ${context || 'None'}

User: ${message}`;

  const raw = await callHuggingFace(prompt, { temperature: 0.85 });
  const ideaJson = extractJsonBlock(raw, 'IDEA_JSON:');
  let idea: AppIdea | undefined;

  if (ideaJson && ideaJson.toLowerCase() !== 'null') {
    try {
      const parsed = JSON.parse(ideaJson);
      idea = normalizeIdea(parsed);
    } catch (err) {
      console.warn('Failed to parse IDEA_JSON block', err);
    }
  }

  const text = raw.replace(/IDEA_JSON:[\s\S]*/i, '').replace(/TEXT:/i, '').trim();

  return {
    text: text || raw,
    idea,
  };
};

const toJsonString = (content: string, fallback: string) => {
  const block = extractJsonBlock(content, 'JSON:') || extractJsonBlock(content, 'DATA:') || content;
  try {
    JSON.parse(block);
    return block;
  } catch {
    return fallback;
  }
};

export const analyzeProjectHealth = async (project: Project): Promise<string> => {
  const prompt = `Analyze the following project and return a JSON array of the top 3 engineering tasks.
Project Name: ${project.name}
Description: ${project.description}
Tech Stack: ${project.techStack.join(', ')}
Health Score: ${project.healthScore}
Last Deployed: ${project.lastDeployed}
Status: ${project.status}

Respond ONLY with JSON, e.g. ["task 1", "task 2"].`;

  const raw = await callHuggingFace(prompt, { temperature: 0.4, max_new_tokens: 400 });
  return toJsonString(raw, '[]');
};

export const analyzeDependencyConflict = async (packageName: string, currentVersion: string, targetVersion: string): Promise<string> => {
  const prompt = `You are a senior TypeScript architect. Summarize the risks of upgrading ${packageName} from v${currentVersion} to v${targetVersion}.
Return a concise list (markdown allowed) covering breaking changes, migration tips, and test focus areas.`;
  return callHuggingFace(prompt, { temperature: 0.5, max_new_tokens: 500 });
};

export const compareProjects = async (projects: Project[]): Promise<string> => {
  const prompt = `Compare these projects from a CTO perspective. Highlight consolidation opportunities, biggest risk, and a standardization recommendation in under 120 words.

${projects.map((p) => `- ${p.name}: ${p.techStack.join(', ')} | Status ${p.status} | Health ${p.healthScore}/100 | Last deployed ${p.lastDeployed}`).join('\n')}`;

  return callHuggingFace(prompt, { temperature: 0.45, max_new_tokens: 400 });
};

export interface HFStreamChunk {
  text: string;
}

export const streamRepoAudit = async function* (project: Project): AsyncGenerator<HFStreamChunk> {
  const prompt = `ROLE: Principal Software Architect & Code Quality Auditor inside Dev Hub.
TARGET PROJECT:
- Name: ${project.name}
- Stack: ${project.techStack.join(', ')}
- Description: ${project.description}

TASK:
1. Produce 10-15 CLI-style log lines describing an audit. Use '>' for info and '!' for alerts.
2. Then output '|||JSON_START|||', followed by a JSON object with fields projectId, overallScore, executiveSummary, detectedFeatures, and categories (Code Quality, Automation & CI/CD, Security, Innovation & Specialized Tech). Close with '|||JSON_END|||'.

FORMAT EXACTLY:
LOGS:
> ...
! ...
|||JSON_START|||
{...}
|||JSON_END|||`;

  const raw = await callHuggingFace(prompt, { temperature: 0.35, max_new_tokens: 1200 });
  const [logsPart, rest] = raw.split('|||JSON_START|||');
  const formattedLogs = logsPart.replace(/LOGS:/i, '').trim();
  if (formattedLogs) {
    yield { text: formattedLogs };
  }

  if (rest) {
    const [jsonBody] = rest.split('|||JSON_END|||');
    yield { text: `|||JSON_START|||${jsonBody.trim()}|||JSON_END|||` };
  }
};
