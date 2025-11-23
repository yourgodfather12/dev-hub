import React, { useEffect, useState } from 'react';
import { Triangle, RefreshCw, ExternalLink, Server } from 'lucide-react';

interface VercelDeployment {
  id: string;
  name: string;
  url: string;
  state: string;
  createdAt: number;
  readyState?: string;
}

interface VercelProject {
  id: string;
  name: string;
  framework?: string;
  createdAt: number;
  updatedAt?: number;
  favorite?: boolean;
}

interface VercelSummary {
  connected: boolean;
  reason?: string;
  requiredEnv?: string[];
  teamId?: string | null;
  deployments?: VercelDeployment[];
  projects?: VercelProject[];
  lastCheckedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const VercelPanel: React.FC = () => {
  const [data, setData] = useState<VercelSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/vercel/summary`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const body = (await res.json()) as
        | VercelSummary
        | { data?: VercelSummary | null; error?: unknown };
      const summary =
        body && typeof body === 'object' && 'data' in body
          ? ((body as { data?: VercelSummary | null }).data ?? null)
          : (body as VercelSummary | null);
      setData(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Vercel status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const connected = data?.connected;
  const projects = data?.projects ?? [];
  const deployments = data?.deployments ?? [];

  const displayedProjects = showFavoritesOnly
    ? projects.filter((p) => p.favorite)
    : projects;

  return (
    <div className="flex h-full bg-black text-zinc-200">
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-zinc-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-zinc-700/15 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-3xl w-full px-8 py-10 glass rounded-3xl border border-white/10 bg-zinc-950/80">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-black flex items-center justify-center mr-4 shadow-[0_0_30px_rgba(250,250,250,0.3)]">
                <Triangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Vercel</h1>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Deployments Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-zinc-900/60 border border-white/10 rounded-full p-0.5 text-[10px] font-semibold">
                <button
                  onClick={() => setShowFavoritesOnly(false)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    !showFavoritesOnly
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setShowFavoritesOnly(true)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    showFavoritesOnly
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Favorites
                </button>
              </div>
              <button
                onClick={() => void load()}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/30 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-40 bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-3 w-full bg-zinc-900 rounded-full animate-pulse" />
              <div className="h-3 w-2/3 bg-zinc-900 rounded-full animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl p-4">{error}</div>
          ) : connected ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Team: {data?.teamId || 'Personal account'}</span>
                <span>Last checked: {data?.lastCheckedAt ? new Date(data.lastCheckedAt).toLocaleTimeString() : '—'}</span>
              </div>

              {/* Projects List */}
              <div className="bg-[#09090b] border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest">Projects</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-[11px] text-zinc-300">
                    <Server className="w-3 h-3 mr-1.5" />
                    {projects.length} projects
                  </div>
                </div>

                {projects.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/10 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm text-white font-medium">{p.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {p.framework || 'Unknown framework'}
                          </p>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono text-right">
                          Created {new Date(p.createdAt).toLocaleDateString()}
                          {p.updatedAt && (
                            <div>Updated {new Date(p.updatedAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">No projects found for this account.</p>
                )}
              </div>

              {/* Optional: keep recent deployments as a secondary view */}
              {deployments.length > 0 && (
                <div className="bg-[#09090b] border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest">Recent Deployments</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 text-[11px] text-zinc-300">
                      <Server className="w-3 h-3 mr-1.5" />
                      {deployments.length} shown
                    </div>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                    {deployments.map((d) => {
                      const stateLabel = (d.readyState || d.state || '').toLowerCase();
                      const stateClass =
                        stateLabel === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : stateLabel === 'error'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : stateLabel === 'building' || stateLabel === 'queued'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700';
                      return (
                        <div
                          key={d.id}
                          className="px-3 py-2 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/10 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm text-white font-medium flex items-center gap-2">
                              {d.name}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${stateClass}`}>
                                {d.readyState || d.state}
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500 font-mono">{d.url}</p>
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono text-right">
                            {new Date(d.createdAt).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-zinc-100 transition-colors shadow-[0_0_18px_rgba(255,255,255,0.15)]"
              >
                Open Vercel Dashboard
                <ExternalLink className="w-3 h-3 ml-2" />
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Vercel is not configured yet. Add your API token to the <span className="font-mono text-xs">server</span> environment to view recent deployments
                across your projects.
              </p>
              {data?.requiredEnv && (
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-2">Required Environment Variables</p>
                  <ul className="text-xs text-zinc-300 space-y-1 font-mono">
                    {data.requiredEnv.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data?.reason && <p className="text-xs text-zinc-500">{data.reason}</p>}
              <button
                onClick={() => void load()}
                className="inline-flex items-center px-4 py-2 rounded-xl border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/30"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Re-check configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VercelPanel;
