import React, { useState, useEffect } from 'react';
import { Network, Play, Plus, ChevronRight } from 'lucide-react';
import { ApiRequestLog } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN;

const APIExplorer: React.FC = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://api.devhub.internal/v1/projects');
  const [headersInput, setHeadersInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [responseMeta, setResponseMeta] = useState<{ statusCode: number; durationMs: number; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headersError, setHeadersError] = useState<string | null>(null);
  const [history, setHistory] = useState<ApiRequestLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const parseHeaders = () => {
    try {
      if (!headersInput.trim()) {
        setHeadersError(null);
        return {};
      }
      const parsed = JSON.parse(headersInput);
      setHeadersError(null);
      return parsed;
    } catch (err) {
      setHeadersError('Headers must be valid JSON');
      throw new Error('Headers must be valid JSON');
    }
  };

  const reloadHistory = async () => {
    setHistoryLoading(true);
    try {
      if (!ADMIN_TOKEN) {
        throw new Error('Missing admin token. Set VITE_ADMIN_TOKEN in your .env.local file.');
      }
      const res = await fetch(`${API_BASE_URL}/api/logs?limit=20`, {
        headers: {
          'x-admin-token': ADMIN_TOKEN,
        },
      });
      const body = (await res.json()) as
        | ApiRequestLog[]
        | { data?: ApiRequestLog[] | null; error?: unknown };
      const logs =
        body && typeof body === 'object' && 'data' in body
          ? ((body as { data?: ApiRequestLog[] | null }).data ?? [])
          : (body as ApiRequestLog[]);
      setHistory(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    reloadHistory();
  }, []);

  const handleHistoryClick = (log: ApiRequestLog) => {
    setMethod(log.method || 'GET');
    setUrl(log.url || '');
    setHeadersInput('');
    setBodyInput(log.requestBody ?? '');
    setError(null);
    setHeadersError(null);
    setResponse(null);
    setResponseMeta(null);
  };

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseMeta(null);
    try {
      const headers = parseHeaders();
      const payload = {
        method,
        url,
        headers,
        body: bodyInput || null,
      };
      if (!ADMIN_TOKEN) {
        throw new Error('Missing admin token. Set VITE_ADMIN_TOKEN in your .env.local file.');
      }

      const res = await fetch(`${API_BASE_URL}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN,
        },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as
        | {
            data?: {
              statusCode: number;
              headers?: Record<string, string>;
              body: unknown;
              durationMs: number;
              bodySize?: number;
            } | null;
            error?: { message?: string } | null;
          }
        | {
            statusCode: number;
            headers?: Record<string, string>;
            body: unknown;
            durationMs: number;
            bodySize?: number;
            error?: { message?: string } | null;
          };

      if (!res.ok) {
        const errorMessage =
          body && typeof body === 'object' && 'error' in body && (body as { error?: { message?: string } | null }).error?.message
            ? (body as { error?: { message?: string } | null }).error?.message
            : 'Request failed';
        throw new Error(errorMessage || 'Request failed');
      }

      const proxyData =
        body && typeof body === 'object' && 'data' in body
          ? ((body as { data?: {
                statusCode: number;
                headers?: Record<string, string>;
                body: unknown;
                durationMs: number;
                bodySize?: number;
              } | null }).data ?? null)
          : (body as {
              statusCode: number;
              headers?: Record<string, string>;
              body: unknown;
              durationMs: number;
              bodySize?: number;
            } | null);

      let formattedBody: string;
      const rawBody = proxyData?.body;
      if (typeof rawBody === 'string') {
        const trimmed = rawBody.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            formattedBody = JSON.stringify(JSON.parse(trimmed), null, 2);
          } catch {
            formattedBody = rawBody;
          }
        } else {
          formattedBody = rawBody;
        }
      } else {
        formattedBody = JSON.stringify(rawBody, null, 2);
      }

      setResponse(formattedBody);
      setResponseMeta({
        statusCode: proxyData?.statusCode ?? 0,
        durationMs: proxyData?.durationMs ?? 0,
        size: typeof proxyData?.bodySize === 'number'
          ? proxyData.bodySize
          : new TextEncoder().encode(formattedBody).length,
      });
      reloadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-black text-zinc-200">
      {/* Sidebar History */}
      <div className="w-72 border-r border-white/5 bg-black flex flex-col">
         <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <span className="text-sm font-bold text-white">Requests</span>
            <button onClick={reloadHistory} className="w-6 h-6 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors" title="Refresh history">
              <Plus className="w-4 h-4 text-zinc-400" />
            </button>
         </div>
         <div className="flex-1 overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full text-xs text-zinc-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-zinc-500 px-4 text-center">No requests yet. Send one to start logging.</div>
            ) : (
              history.map((log) => (
                <div
                  key={log.id}
                  onClick={() => handleHistoryClick(log)}
                  className="px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                   <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        log.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}>{log.method}</span>
                      <span className="text-xs text-zinc-600 group-hover:text-zinc-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                   </div>
                   <div className="text-xs text-zinc-500 font-mono truncate mt-2">{log.url}</div>
                   {log.statusCode !== null && (
                     <div className="text-[10px] text-zinc-600 mt-1">Status {log.statusCode ?? '—'}</div>
                   )}
                </div>
              ))
            )}
         </div>
      </div>

      {/* Main Request Area */}
      <div className="flex-1 flex flex-col bg-[#050505]">
         <div className="p-8 border-b border-white/5">
            <div className="flex space-x-3 mb-6">
               <div className="relative">
                 <select 
                   value={method} 
                   onChange={(e) => setMethod(e.target.value)}
                   className="appearance-none bg-surface border border-white/5 text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-1 focus:ring-white/20 font-mono text-sm font-bold h-full"
                 >
                   <option>GET</option>
                   <option>POST</option>
                   <option>PUT</option>
                   <option>DELETE</option>
                 </select>
                 <ChevronRight className="w-3 h-3 absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 rotate-90" />
               </div>
               <input 
                 type="text" 
                 value={url}
                 onChange={(e) => setUrl(e.target.value)}
                 className="flex-1 bg-surface border border-white/5 text-zinc-300 rounded-xl px-5 py-3 focus:outline-none focus:ring-1 focus:ring-white/20 font-mono text-sm shadow-inner"
               />
               <button 
                 onClick={handleSend}
                 className="bg-white hover:bg-zinc-200 text-black px-8 py-3 rounded-xl font-bold text-sm flex items-center transition-all shadow-lg shadow-white/5"
               >
                 {loading ? <Network className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 mr-2 fill-black" />}
                 Send Request
               </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 font-bold mb-2 block uppercase tracking-widest">Headers (JSON)</label>
                <textarea
                  value={headersInput}
                  onChange={(e) => setHeadersInput(e.target.value)}
                  placeholder='{"Authorization":"Bearer token"}'
                  className={`w-full bg-surface border text-xs text-zinc-300 rounded-xl px-4 py-3 font-mono resize-none h-24 focus:outline-none focus:ring-1 ${
                    headersError ? 'border-red-500/60 focus:ring-red-500/40' : 'border-white/5 focus:ring-white/20'
                  }`}
                />
                {headersError && (
                  <p className="mt-1 text-[11px] text-red-400 font-medium">{headersError}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-bold mb-2 block uppercase tracking-widest">Body</label>
                <textarea
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  placeholder='{"name":"DevHub"}'
                  className="w-full bg-surface border border-white/5 text-xs text-zinc-300 rounded-xl px-4 py-3 font-mono resize-none h-32 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              {error && <div className="text-xs text-red-400 font-semibold">{error}</div>}
            </div>
         </div>

         <div className="flex-1 p-8 overflow-y-auto bg-black">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Response Body</h3>
               {responseMeta && (
                 <div className="flex space-x-4 text-xs font-mono">
                    <span
                      className={`px-2 py-1 rounded border ${
                        !responseMeta.statusCode
                          ? 'text-zinc-400 bg-zinc-800 border-zinc-700'
                          : responseMeta.statusCode < 300
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : responseMeta.statusCode < 400
                          ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                          : responseMeta.statusCode < 500
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}
                    >
                      {responseMeta.statusCode ?? '—'}{' '}
                      {responseMeta.statusCode
                        ? responseMeta.statusCode < 300
                          ? 'OK'
                          : responseMeta.statusCode < 400
                          ? 'Redirect'
                          : responseMeta.statusCode < 500
                          ? 'Client Error'
                          : 'Server Error'
                        : ''}
                    </span>
                    <span className="text-zinc-500 py-1">{responseMeta.durationMs}ms</span>
                    <span className="text-zinc-500 py-1">{(responseMeta.size / 1024).toFixed(2)}KB</span>
                 </div>
               )}
            </div>
            
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-6 h-[calc(100%-40px)] font-mono text-sm text-zinc-300 overflow-auto relative shadow-inner">
               {loading ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                        <span className="text-xs text-zinc-500">Fetching...</span>
                    </div>
                 </div>
               ) : response ? (
                 <pre className="text-xs leading-6">{response}</pre>
               ) : (
                 <div className="text-zinc-700 flex flex-col items-center justify-center h-full">
                    <Network className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-medium">Ready to send</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default APIExplorer;