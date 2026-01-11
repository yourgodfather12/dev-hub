import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Users, Zap, AlertTriangle, CheckCircle2, MoreHorizontal, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';

const MonitorTab: React.FC = () => {
    const { currentProject } = useStudio();
    const [metrics] = useState([
        { label: 'Active Users', value: '1,284', change: '+12%', trend: 'up', icon: Users, color: 'text-blue-500' },
        { label: 'API Calls / min', value: '842', change: '+5%', trend: 'up', icon: Zap, color: 'text-yellow-500' },
        { label: 'Error Rate', value: '0.04%', change: '-2%', trend: 'down', icon: AlertTriangle, color: 'text-red-500' },
        { label: 'System Health', value: '99.98%', change: 'Stable', trend: 'neutral', icon: activity, color: 'text-emerald-500' },
    ]);

    const [logs] = useState([
        { id: 1, type: 'info', service: 'auth-api', message: 'User log_9428 successfully authenticated', time: '2 mins ago' },
        { id: 2, type: 'error', service: 'payment-gateway', message: 'Stripe webhook signature verification failed', time: '5 mins ago' },
        { id: 3, type: 'warning', service: 'db-proxy', message: 'Unusually high connection latency detected in us-east-1', time: '12 mins ago' },
        { id: 4, type: 'info', service: 'image-optimizer', message: 'Successfully cached 842 assets', time: '15 mins ago' },
        { id: 5, type: 'info', service: 'notification-service', message: 'Summary email sent to 12,482 subscribers', time: '24 mins ago' },
    ]);

    return (
        <div className="h-full flex flex-col bg-zinc-950 p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <BarChart3 className="w-7 h-7 text-amber-500" />
                            Operations Center
                        </h2>
                        <p className="text-zinc-400 mt-1">Real-time telemetry and system diagnostics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-zinc-900 border border-white/10 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2">
                            <Search className="w-4 h-4 text-zinc-400" />
                            Search Logs
                        </button>
                        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filter Views
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors`}>
                                    <m.icon className={`w-5 h-5 ${m.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold ${m.trend === 'up' ? 'text-emerald-500' : m.trend === 'down' ? 'text-red-500' : 'text-zinc-400'}`}>
                                    {m.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                                    {m.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                                    {m.change}
                                </div>
                            </div>
                            <div className="text-2xl font-black text-white">{m.value}</div>
                            <div className="text-sm text-zinc-500 font-medium">{m.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Chart Area */}
                    <div className="lg:col-span-2 bg-zinc-900/50 border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-amber-500" />
                                Traffic Distribution
                            </h3>
                            <div className="flex items-center gap-4">
                                {['24h', '7d', '30d'].map(t => (
                                    <button key={t} className={`text-xs font-bold px-2 py-1 rounded transition-colors ${t === '24h' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex items-end gap-2 group cursor-crosshair">
                            {[40, 65, 45, 90, 85, 40, 60, 80, 50, 45, 75, 90, 100, 80, 60, 45, 55, 70, 85, 60, 50, 40, 55, 75, 95, 80, 60, 45, 65, 85].map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-sm transition-all duration-500 hover:scale-y-110 hover:from-amber-400/30 hover:to-amber-400"
                                    style={{ height: `${h}%` }}
                                    title={`Traffic at ${i}:00: ${h}%`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* System Events */}
                    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white">Live Event Log</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                            {logs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-white/5 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${log.type === 'error' ? 'bg-red-500 shadow-lg shadow-red-500/50' : log.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter truncate">{log.service}</span>
                                                <span className="text-[10px] text-zinc-600 font-mono italic shrink-0">{log.time}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed group-hover:text-zinc-200 transition-colors italic">"{log.message}"</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="p-3 bg-zinc-800/50 hover:bg-zinc-800 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors">
                            Inspect Full Logs
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                Security Perimeter
                            </h3>
                            <button className="text-zinc-500 hover:text-white transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-zinc-500 uppercase font-black tracking-wider mb-1">WAF BLOCKED</div>
                                    <div className="text-lg font-bold text-white">4,281</div>
                                </div>
                                <div className="text-xs text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded">+15%</div>
                            </div>
                            <p className="text-[11px] text-zinc-400 italic">DevHub's global WAF is blocking 94% of malicious requests before they hit your origin. 🚀</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Health Status
                            </h3>
                            <button className="text-zinc-500 hover:text-white transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400">Database Cluster</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Healthy</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400">Edge Functions</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Healthy</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400">Compute Workers</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Healthy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fix the Lucide icons import issue
import { Shield } from 'lucide-react';

const activity = Activity;

export default MonitorTab;
