
import React, { useState, useEffect } from 'react';
import {
    Hammer,
    Search,
    ChevronRight,
    Layout,
    CheckCircle2,
    Clock,
    AlertCircle,
    Zap,
    Terminal,
    Code,
    Microscope,
    History,
    Rocket,
    ShieldCheck,
    MoreVertical,
    Plus
} from 'lucide-react';
import { Project, ProjectStatus, Task, TaskStatus } from '../types';
import { fetchProjects } from '../services/apiClient';
import Mermaid from './Mermaid';

type Tab = 'planning' | 'tracking' | 'reviewing' | 'testing';

const ProjectWorkshop: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('planning');
    const [loading, setLoading] = useState(true);
    const [mermaidChart, setMermaidChart] = useState<string>(`graph TD
  A[Request] --> B{Valid Root?}
  B -- Yes --> C[Process Data]
  B -- No --> D[Error Response]
  C --> E[Save to DB]
  E --> F[Return Success]`);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchProjects();
                setProjects(data);
                if (data.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(data[0].id);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-black">
                <Zap className="w-12 h-12 text-pink-500 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="h-full flex bg-[#050505] overflow-hidden">
            {/* Side Project Picker */}
            <aside className="w-80 border-r border-white/5 flex flex-col bg-zinc-950/20 backdrop-blur-md">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                            <Hammer className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">Workshop</h1>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Lifecycle Control</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-pink-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {projects.map(p => {
                        const isCore = ['lotsignal-v2', 'fansurge-11-27-25', 'case-canvas'].includes(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${selectedProjectId === p.id
                                    ? 'bg-pink-500/5 border border-pink-500/20'
                                    : 'hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedProjectId === p.id
                                    ? 'bg-pink-500/10 text-pink-400'
                                    : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300'
                                    }`}>
                                    {isCore ? <Zap className="w-5 h-5 shadow-[0_0_8px_rgba(236,72,153,0.4)]" /> : <Layout className="w-5 h-5" />}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors uppercase tracking-tight truncate">{p.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isCore ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-600'}`} />
                                        {isCore ? '60% Mastery' : 'Tracking'}
                                    </div>
                                </div>
                                {selectedProjectId === p.id && <ChevronRight className="w-4 h-4 text-pink-500 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />

                {selectedProject ? (
                    <>
                        {/* Header / Tabs */}
                        <header className="p-8 pb-4 relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] text-pink-400 font-bold uppercase tracking-widest mb-1.5">
                                        <Rocket className="w-3 h-3" /> System Integration Active
                                    </div>
                                    <h2 className="text-4xl font-bold text-white tracking-tighter mb-2">{selectedProject.name}</h2>
                                    <div className="flex items-center gap-4">
                                        <p className="text-xs text-zinc-400 font-medium max-w-lg">{selectedProject.description}</p>
                                        <a
                                            href={selectedProject.repoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                                        >
                                            <Code className="w-3 h-3" /> {selectedProject.id}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/20">
                                        <Rocket className="w-4 h-4" />
                                        Deploy Now
                                    </button>
                                    <button className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10 transition-all">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 p-1 bg-zinc-900/40 rounded-2xl border border-white/5 w-fit backdrop-blur-md">
                                {[
                                    { id: 'planning', label: 'Planning', icon: Code },
                                    { id: 'tracking', label: 'Tracking', icon: History },
                                    { id: 'reviewing', label: 'Reviewing', icon: Microscope },
                                    { id: 'testing', label: 'Testing', icon: ShieldCheck },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id as Tab)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === t.id
                                            ? 'bg-white text-black shadow-xl shadow-white/5'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                            }`}
                                    >
                                        <t.icon className={`w-3.5 h-3.5 ${activeTab === t.id ? 'text-pink-600' : ''}`} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </header>

                        {/* Tab Panels */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4 relative z-10">
                            {activeTab === 'planning' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-2 duration-500">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 group relative overflow-hidden h-[500px] flex flex-col">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Code className="w-32 h-32 text-pink-500" />
                                            </div>
                                            <div className="flex items-center justify-between mb-6 relative z-10">
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                                                    <span className="w-2 h-2 rounded-full bg-pink-500 mr-3 animate-pulse" />
                                                    System Architecture
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 hover:text-white transition-all">Export SVG</button>
                                                </div>
                                            </div>
                                            <div className="flex-1 relative z-10 overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4">
                                                <Mermaid chart={mermaidChart} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                            <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 group hover:border-pink-500/30 transition-all cursor-pointer relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="w-12 h-12 text-pink-500" /></div>
                                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Zap className="w-5 h-5 text-pink-400" />
                                                </div>
                                                <h4 className="text-sm font-bold text-white mb-2 tracking-tight">Vibe Analysis</h4>
                                                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Extract the remaining 40% blueprint by scanning current repository state and dependency drift.</p>
                                            </div>
                                            <div className="bg-[#0b0b0d] border border-indigo-500/20 rounded-2xl p-6 group hover:border-indigo-500/40 transition-all cursor-pointer shadow-lg shadow-indigo-500/5">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Rocket className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <h4 className="text-sm font-bold text-white mb-2 tracking-tight">Roadmap Extraction</h4>
                                                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Generate a visual timeline for {selectedProject.name} to reach 100% production readiness.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Editor</h3>
                                            <textarea
                                                className="w-full h-80 bg-zinc-950/50 border border-white/5 rounded-xl p-4 text-xs font-mono text-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all resize-none shadow-inner"
                                                value={mermaidChart}
                                                onChange={(e) => setMermaidChart(e.target.value)}
                                            />
                                            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 italic text-[10px] text-zinc-600 leading-relaxed">
                                                Diagram updates in real-time as you tweak the Vibe Logic. Use Mermaid syntax.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tracking' && (
                                <div className="animate-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
                                    {(() => {
                                        const isCoreProject = ['lotsignal-v2', 'fansurge-11-27-25', 'case-canvas'].includes(selectedProject.id);
                                        return (
                                            <>
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-12">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Mastery Progress</span>
                                                            <span className="text-white font-mono text-sm font-bold">{isCoreProject ? '60%' : 'ALPHA'}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Target State</span>
                                                            <span className="text-white font-mono text-sm font-bold">100% READINESS</span>
                                                        </div>
                                                    </div>
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">
                                                        <Plus className="w-3.5 h-3.5" />
                                                        Add Signal
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                                                    {/* TODO */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 px-2 mb-4">
                                                            <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Backlog</h3>
                                                        </div>
                                                        {[
                                                            { id: 1, title: 'Refactor auth state hook', priority: 'High' },
                                                            { id: 2, title: 'Update D3.js transitions', priority: 'Medium' },
                                                            { id: 3, title: 'Initial load optimization', priority: 'Low' }
                                                        ].map(task => (
                                                            <div key={task.id} className="p-4 bg-[#0c0c0c] border border-white/5 rounded-2xl group hover:border-white/10 transition-all cursor-move shadow-sm">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${task.priority === 'High' ? 'bg-red-500/10 text-red-400' : task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                        {task.priority}
                                                                    </span>
                                                                    <MoreVertical className="w-3.5 h-3.5 text-zinc-700" />
                                                                </div>
                                                                <p className="text-xs text-zinc-300 font-medium leading-relaxed">{task.title}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* IN PROGRESS */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3 px-2 mb-4">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Processing</h3>
                                                        </div>
                                                        {[
                                                            { id: 4, title: 'Implement dynamic Mermaid integration', priority: 'High' },
                                                            { id: 5, title: 'Database schema migration v2.4', priority: 'Critical' }
                                                        ].map(task => (
                                                            <div key={task.id} className="p-4 bg-[#0c0c0c] border border-pink-500/20 rounded-2xl group relative overflow-hidden shadow-lg">
                                                                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 text-[8px] font-bold uppercase">Active</span>
                                                                    <div className="flex -space-x-2">
                                                                        <div className="w-5 h-5 rounded-full border border-black bg-zinc-800" />
                                                                        <div className="w-5 h-5 rounded-full border border-black bg-zinc-700" />
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-white font-bold leading-relaxed">{task.title}</p>
                                                                <div className="mt-4 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                                                    <div className="w-2/3 h-full bg-pink-500" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* DONE */}
                                                    <div className="space-y-4 opacity-60">
                                                        <div className="flex items-center gap-3 px-2 mb-4">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Completed</h3>
                                                        </div>
                                                        {[
                                                            { id: 6, title: 'Cloud Run config setup', priority: 'Medium' }
                                                        ].map(task => (
                                                            <div key={task.id} className="p-4 bg-[#0c0c0c] border border-white/5 rounded-2xl grayscale transition-all">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                </div>
                                                                <p className="text-xs text-zinc-500 font-medium line-through">{task.title}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}

                            {activeTab === 'reviewing' && (
                                <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest block mb-2">Stability</span>
                                            <span className="text-3xl font-mono text-emerald-400 font-bold">94%</span>
                                        </div>
                                        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest block mb-2">Performance</span>
                                            <span className="text-3xl font-mono text-sky-400 font-bold">8.2<span className="text-xs opacity-50 ml-1">ms</span></span>
                                        </div>
                                        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest block mb-1">Security Score</span>
                                            <span className="text-3xl font-mono text-amber-400 font-bold">A-</span>
                                        </div>
                                        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest block mb-2">Build Health</span>
                                            <span className="text-3xl font-mono text-pink-400 font-bold">GOOD</span>
                                        </div>
                                    </div>

                                    <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 overflow-hidden relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                                                <ShieldCheck className="w-4 h-4 mr-3 text-indigo-400" />
                                                Security Protocol Analysis
                                            </h3>
                                            <span className="text-[10px] font-mono text-zinc-600">LAST CHECKED: 2h AGO</span>
                                        </div>

                                        <div className="space-y-4 relative z-10">
                                            {[
                                                { check: 'XSS Prevention', status: 'optimal', desc: 'Content Security Policy is correctly configured.' },
                                                { check: 'Secrets Scanning', status: 'optimal', desc: 'No sensitive tokens detected in primary branch.' },
                                                { check: 'Dependency Integrity', status: 'warning', desc: '3 packages have minor security updates available.' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-black/40 border border-white/5 hover:bg-white/[0.02] transition-all">
                                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.status === 'optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <div>
                                                        <div className="text-sm font-bold text-white mb-1">{item.check}</div>
                                                        <div className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'testing' && (
                                <div className="animate-in slide-in-from-bottom-2 duration-500 h-full flex flex-col">
                                    <div className="flex-1 bg-black/80 rounded-3xl border border-white/10 p-8 font-mono relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 to-black pointer-events-none" />
                                        <div className="mb-4 flex items-center gap-2 relative z-10">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                            <span className="ml-4 text-[10px] text-zinc-700 font-bold uppercase tracking-widest">DevHub Debugger console v2.5</span>
                                        </div>
                                        <div className="space-y-2 text-xs relative z-10 custom-scrollbar overflow-y-auto max-h-[60vh] pr-4">
                                            <div className="text-emerald-500 font-bold">$ npm run test:vibe</div>
                                            <div className="text-zinc-500">&gt;&gt;&gt; Initializing environment for {selectedProject.name}...</div>
                                            <div className="text-zinc-500">&gt;&gt;&gt; Connecting to core simulation cluster...</div>
                                            <div className="text-white flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASS: Auth flow validation (402ms)
                                            </div>
                                            <div className="text-white flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASS: Real-time synchronization check (120ms)
                                            </div>
                                            <div className="text-white flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> PASS: Database CRUD integrity tests (2.4s)
                                            </div>
                                            <div className="text-amber-400 flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> WARN: Large media payload performance (&gt; 1500ms)
                                            </div>
                                            <div className="text-zinc-500 mt-4">&gt;&gt;&gt; Finalizing test report...</div>
                                            <div className="pt-6">
                                                <div className="text-lg font-bold text-emerald-400">SUCCESS: 4/4 PASSED (1 Warn)</div>
                                                <div className="text-zinc-600 mt-1">Total runtime: 3.82s</div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-8 right-8 z-10">
                                            <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all shadow-2xl">
                                                <Terminal className="w-4 h-4" />
                                                Run Deep Check
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-sm">
                        <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-pink-500/20 mb-8 border border-white/20">
                            <Layout className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight mb-3">Project Workshop Empty</h3>
                        <p className="text-sm text-zinc-500 max-w-sm leading-relaxed font-medium">Select one of your projects to enter the Vibe Workflow and start planning, tracking, or reviewing your code health.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProjectWorkshop;
