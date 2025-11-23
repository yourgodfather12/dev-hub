import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, ExternalLink } from 'lucide-react';

interface SupabaseSummary {
  connected: boolean;
  reason?: string;
  requiredEnv?: string[];
  url?: string;
  statusCode?: number;
  error?: string;
  lastCheckedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

const SupabasePanel: React.FC = () => {
  const [data, setData] = useState<SupabaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!ADMIN_TOKEN) {
        throw new Error('Missing admin token. Set VITE_ADMIN_TOKEN in your .env.local file.');
      }
      const res = await fetch(`${API_BASE_URL}/api/integrations/supabase/summary`, {
        headers: {
          'x-admin-token': ADMIN_TOKEN,
        },
      });
      if (!res.ok) {
        throw new Error(`API ${res.status}`);
      }
      const body = (await res.json()) as
        | SupabaseSummary
        | { data?: SupabaseSummary | null; error?: unknown };
      const summary =
        body && typeof body === 'object' && 'data' in body
          ? ((body as { data?: SupabaseSummary | null }).data ?? null)
          : (body as SupabaseSummary | null);
      setData(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Supabase status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const connected = data?.connected;

  return (
    <div className="flex h-full bg-black text-zinc-200">
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-emerald-700/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-xl w-full px-8 py-10 glass rounded-3xl border border-white/10 bg-zinc-950/80 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mr-4">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Supabase</h1>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Database & Auth Control</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-4 w-32 bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-3 w-full bg-zinc-900 rounded-full animate-pulse" />
              <div className="h-3 w-2/3 bg-zinc-900 rounded-full animate-pulse" />
            </div>
          ) : error ? (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl p-4">
              {error}
            </div>
          ) : connected ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Connection Status</p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    Connected
                  </div>
                </div>
                <button
                  onClick={() => void load()}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/30 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1">Project URL</p>
                  <p className="text-zinc-200 break-all text-xs">{data?.url}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Status code: {data?.statusCode ?? '—'}</span>
                  <span>Last checked: {data?.lastCheckedAt ? new Date(data.lastCheckedAt).toLocaleTimeString() : '—'}</span>
                </div>
              </div>

              {data?.url && (
                <a
                  href={data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-[0_0_18px_rgba(255,255,255,0.15)]"
                >
                  Open Supabase
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Supabase is not configured yet. Add your project credentials to the <span className="font-mono text-xs">server</span> environment to enable live
                database and auth insights.
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
              {data?.reason && (
                <p className="text-xs text-zinc-500">{data.reason}</p>
              )}
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

export default SupabasePanel;
