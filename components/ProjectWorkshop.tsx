import React, { useEffect, useMemo, useState } from 'react';
import {
  Hammer,
  Search,
  ChevronRight,
  Layout,
  CheckCircle2,
  Zap,
  Terminal,
  Code,
  Microscope,
  History,
  ShieldCheck,
  Plus,
  ArrowRight,
  RotateCcw,
  Download,
} from 'lucide-react';
import { Project } from '../types';
import { fetchProjects } from '../services/apiClient';
import Mermaid from './Mermaid';

type Tab = 'planning' | 'tracking' | 'reviewing' | 'testing';
type TaskStatus = 'backlog' | 'processing' | 'completed';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

type WorkshopTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type TestingRun = {
  startedAt: string;
  lines: string[];
  summary: string;
};

const DEFAULT_MERMAID = `graph TD
  A[Request] --> B{Valid Root?}
  B -- Yes --> C[Process Data]
  B -- No --> D[Error Response]
  C --> E[Save to DB]
  E --> F[Return Success]`;

const defaultTasks: WorkshopTask[] = [
  { id: 't1', title: 'Refactor auth state hook', priority: 'High', status: 'backlog' },
  { id: 't2', title: 'Update D3.js transitions', priority: 'Medium', status: 'backlog' },
  { id: 't3', title: 'Initial load optimization', priority: 'Low', status: 'backlog' },
  { id: 't4', title: 'Implement dynamic Mermaid integration', priority: 'Critical', status: 'processing' },
  { id: 't5', title: 'Database schema migration v2.4', priority: 'High', status: 'processing' },
  { id: 't6', title: 'Cloud Run config setup', priority: 'Medium', status: 'completed' },
];

const TASK_STORAGE_KEY = 'devhub:workshop:tasks';
const MERMAID_STORAGE_KEY = 'devhub:workshop:mermaid';

const priorityClass: Record<TaskPriority, string> = {
  Low: 'bg-blue-500/10 text-blue-400',
  Medium: 'bg-amber-500/10 text-amber-400',
  High: 'bg-red-500/10 text-red-400',
  Critical: 'bg-pink-500/10 text-pink-400',
};

const ProjectWorkshop: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('planning');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tasksByProject, setTasksByProject] = useState<Record<string, WorkshopTask[]>>({});
  const [chartsByProject, setChartsByProject] = useState<Record<string, string>>({});
  const [testingRun, setTestingRun] = useState<TestingRun | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    const storedTasks = localStorage.getItem(TASK_STORAGE_KEY);
    const storedCharts = localStorage.getItem(MERMAID_STORAGE_KEY);
    if (storedTasks) setTasksByProject(JSON.parse(storedTasks));
    if (storedCharts) setChartsByProject(JSON.parse(storedCharts));

    load();
  }, []);

  useEffect(() => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasksByProject));
  }, [tasksByProject]);

  useEffect(() => {
    localStorage.setItem(MERMAID_STORAGE_KEY, JSON.stringify(chartsByProject));
  }, [chartsByProject]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q));
  }, [projects, search]);

  const currentMermaid = selectedProject ? chartsByProject[selectedProject.id] ?? DEFAULT_MERMAID : DEFAULT_MERMAID;

  const currentTasks = selectedProject
    ? tasksByProject[selectedProject.id] ?? defaultTasks
    : [];

  const updateCurrentProjectTasks = (updater: (tasks: WorkshopTask[]) => WorkshopTask[]) => {
    if (!selectedProject) return;
    setTasksByProject((prev) => ({
      ...prev,
      [selectedProject.id]: updater(prev[selectedProject.id] ?? defaultTasks),
    }));
  };

  const moveTask = (id: string, status: TaskStatus) => {
    updateCurrentProjectTasks((tasks) => tasks.map((task) => (task.id === id ? { ...task, status } : task)));
  };

  const addSignal = () => {
    if (!selectedProject) return;
    const title = window.prompt('Signal title');
    if (!title?.trim()) return;

    const rawPriority = window.prompt('Priority (Low, Medium, High, Critical)', 'Medium') ?? 'Medium';
    const normalized = rawPriority.trim().toLowerCase();
    const priority: TaskPriority =
      normalized === 'low' ? 'Low' : normalized === 'high' ? 'High' : normalized === 'critical' ? 'Critical' : 'Medium';

    updateCurrentProjectTasks((tasks) => [
      {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
        title: title.trim(),
        priority,
        status: 'backlog',
      },
      ...tasks,
    ]);
  };

  const exportMermaid = () => {
    if (!selectedProject) return;
    const blob = new Blob([currentMermaid], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}-architecture.mmd`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const runDeepCheck = () => {
    if (!selectedProject) return;
    const now = new Date().toISOString();
    const lines = [
      `>>> Initializing environment for ${selectedProject.name}...`,
      `>>> Validating repository: ${selectedProject.repoUrl}`,
      `PASS: Core app boot sequence`,
      `PASS: API integration checks`,
      selectedProject.healthScore < 75 ? 'WARN: Health score below target threshold' : 'PASS: Health score within target range',
      `PASS: Tech stack coverage (${selectedProject.techStack.join(', ') || 'unreported'})`,
      '>>> Finalizing report...',
    ];
    const passCount = lines.filter((line) => line.startsWith('PASS')).length;
    const warnCount = lines.filter((line) => line.startsWith('WARN')).length;
    setTestingRun({
      startedAt: now,
      lines,
      summary: `SUCCESS: ${passCount} passed${warnCount ? ` (${warnCount} warning)` : ''}`,
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <Zap className="w-12 h-12 text-pink-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[#050505] overflow-hidden">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {filteredProjects.map((p) => {
            const isCore = ['lotsignal-v2', 'fansurge-11-27-25', 'case-canvas'].includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  selectedProjectId === p.id ? 'bg-pink-500/5 border border-pink-500/20' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedProjectId === p.id ? 'bg-pink-500/10 text-pink-400' : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300'}`}>
                  {isCore ? <Zap className="w-5 h-5" /> : <Layout className="w-5 h-5" />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{p.description}</div>
                </div>
                {selectedProjectId === p.id && <ChevronRight className="w-4 h-4 text-pink-500 shrink-0" />}
              </button>
            );
          })}

          {!filteredProjects.length && <div className="text-xs text-zinc-500 p-3">No projects match your search.</div>}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedProject ? (
          <>
            <header className="p-8 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
                  <p className="text-xs text-zinc-400 mt-1">{selectedProject.description}</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-zinc-900/40 rounded-2xl border border-white/5 w-fit backdrop-blur-md">
                  {[
                    { id: 'planning', label: 'Planning', icon: Code },
                    { id: 'tracking', label: 'Tracking', icon: History },
                    { id: 'reviewing', label: 'Reviewing', icon: Microscope },
                    { id: 'testing', label: 'Testing', icon: ShieldCheck },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as Tab)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeTab === t.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4">
              {activeTab === 'planning' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 h-[500px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">System Architecture</h3>
                      <button onClick={exportMermaid} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 hover:text-white transition-all inline-flex items-center gap-2">
                        <Download className="w-3 h-3" /> Export .mmd
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-4">
                      <Mermaid chart={currentMermaid} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Editor</h3>
                      <textarea
                        className="w-full h-80 bg-zinc-950/50 border border-white/5 rounded-xl p-4 text-xs font-mono text-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
                        value={currentMermaid}
                        onChange={(e) =>
                          selectedProject && setChartsByProject((prev) => ({ ...prev, [selectedProject.id]: e.target.value }))
                        }
                      />
                      <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 italic text-[10px] text-zinc-600 leading-relaxed">
                        Diagram saves automatically per project and updates in real time.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tracking' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-xs text-zinc-400">Signals are saved per project and persist locally.</div>
                    <button onClick={addSignal} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add Signal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['backlog', 'processing', 'completed'] as TaskStatus[]).map((status) => (
                      <div key={status} className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          {status === 'backlog' ? 'Backlog' : status === 'processing' ? 'Processing' : 'Completed'}
                        </h3>
                        {currentTasks.filter((task) => task.status === status).map((task) => (
                          <div key={task.id} className="p-4 bg-[#0c0c0c] border border-white/5 rounded-2xl">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${priorityClass[task.priority]}`}>
                                {task.priority}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-200 font-medium mb-4">{task.title}</p>
                            <div className="flex items-center gap-2">
                              {status === 'backlog' && (
                                <button onClick={() => moveTask(task.id, 'processing')} className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-300 inline-flex items-center gap-1">
                                  <ArrowRight className="w-3 h-3" /> Start
                                </button>
                              )}
                              {status === 'processing' && (
                                <button onClick={() => moveTask(task.id, 'completed')} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Complete
                                </button>
                              )}
                              {status === 'completed' && (
                                <button onClick={() => moveTask(task.id, 'backlog')} className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-300 inline-flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3" /> Reopen
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviewing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10">
                    <h3 className="text-white font-bold mb-4">Readiness Snapshot</h3>
                    <div className="space-y-2 text-sm text-zinc-300">
                      <div>Repo: <span className="text-white">{selectedProject.repoUrl}</span></div>
                      <div>Health Score: <span className="text-white">{selectedProject.healthScore}/100</span></div>
                      <div>Last Deploy: <span className="text-white">{new Date(selectedProject.lastDeployed).toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-black/40 border border-white/10">
                    <h3 className="text-white font-bold mb-4">Stack Coverage</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedProject.techStack.length ? selectedProject.techStack : ['No tech stack data']).map((tech) => (
                        <span key={tech} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300">{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'testing' && (
                <div className="bg-black/80 rounded-3xl border border-white/10 p-8 font-mono relative overflow-hidden">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">DevHub debugger console</span>
                    <button onClick={runDeepCheck} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all">
                      <Terminal className="w-4 h-4" /> Run Deep Check
                    </button>
                  </div>
                  <div className="space-y-2 text-xs custom-scrollbar overflow-y-auto max-h-[60vh] pr-4">
                    {!testingRun && <div className="text-zinc-500">No run yet. Trigger a deep check to execute validation steps.</div>}
                    {testingRun && (
                      <>
                        <div className="text-emerald-500">$ npm run test:vibe</div>
                        {testingRun.lines.map((line, idx) => (
                          <div key={`${line}-${idx}`} className={line.startsWith('WARN') ? 'text-amber-400' : line.startsWith('PASS') ? 'text-white' : 'text-zinc-500'}>
                            {line}
                          </div>
                        ))}
                        <div className="pt-6 text-emerald-400 font-bold">{testingRun.summary}</div>
                        <div className="text-zinc-600">Started: {new Date(testingRun.startedAt).toLocaleString()}</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">No project selected.</div>
        )}
      </main>
    </div>
  );
};

export default ProjectWorkshop;
