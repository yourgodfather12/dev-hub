import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  Clock3,
  Cpu,
  DraftingCompass,
  Factory,
  Gauge,
  Hammer,
  Lightbulb,
  Loader2,
  Play,
  ScanSearch,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WandSparkles,
} from 'lucide-react';
import {
  ArchiAgentRole,
  ArchiQuickAction,
  ArchiRunLog,
  ArchiRunResult,
  ArchiRunStatus,
  ArchiWorkspaceOption,
} from '../types';
import AIEngineer from './AIEngineer';
import ProjectStudio from './ProjectStudio';
import { ARCHI_AGENT_ROLES, ARCHI_QUICK_ACTIONS, ARCHI_WORKSPACES } from './archi/archiData';

type ArchiWorkspaceMode = 'operator' | 'factory' | 'ideas';

const runTemplates: Record<ArchiQuickAction['actionType'], string[]> = {
  audit: [
    'Initializing workspace runtime',
    'Loading repository topology and ownership map',
    'Inspecting architecture boundaries and coupling hotspots',
    'Running reliability and deployment checks',
    'Generating blocker report and recommended remediations',
  ],
  plan: [
    'Booting planning agent context',
    'Reviewing product goals and repository constraints',
    'Building execution phases and milestone sequence',
    'Scoring effort and risk for each milestone',
    'Assembling final implementation blueprint',
  ],
  patch: [
    'Preparing patch strategy context',
    'Locating high-leverage change points in codebase',
    'Composing staged patch plan with validation gates',
    'Running compatibility impact checks',
    'Packaging patch recommendations and rollout order',
  ],
  review: [
    'Connecting architecture review workspace',
    'Collecting current service and dependency graph',
    'Evaluating scaling and reliability bottlenecks',
    'Ranking modernization opportunities',
    'Drafting executive recommendation summary',
  ],
};

const roleIconMap: Record<ArchiAgentRole['icon'], React.ComponentType<{ className?: string }>> = {
  DraftingCompass,
  Hammer,
  ShieldCheck,
  TrendingUp,
  ServerCog,
  ScanSearch,
};

const actionLabels: Record<ArchiQuickAction['actionType'], string> = {
  audit: 'Run Audit',
  plan: 'Generate Plan',
  patch: 'Create Patch',
  review: 'Review Architecture',
};

const statusTone: Record<ArchiRunStatus, string> = {
  idle: 'text-zinc-400 border-zinc-700 bg-zinc-900/80',
  running: 'text-cyan-300 border-cyan-400/40 bg-cyan-500/10',
  success: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10',
  warning: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
};

const workspaceStatusTone: Record<ArchiWorkspaceOption['status'], string> = {
  synced: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30',
  indexing: 'text-amber-300 bg-amber-500/10 border-amber-400/30',
  attention: 'text-rose-300 bg-rose-500/10 border-rose-400/30',
};

const getLogStyle = (level: ArchiRunLog['level']) => {
  if (level === 'success') return 'text-emerald-300';
  if (level === 'warning') return 'text-amber-300';
  return 'text-zinc-300';
};

const modeTabs: { id: ArchiWorkspaceMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'operator', label: 'Operator', icon: Brain },
  { id: 'factory', label: 'SaaS Factory', icon: Factory },
  { id: 'ideas', label: 'App Ideas', icon: Lightbulb },
];

const ModeTabs: React.FC<{
  activeMode: ArchiWorkspaceMode;
  onSelectMode: (mode: ArchiWorkspaceMode) => void;
  className?: string;
}> = ({ activeMode, onSelectMode, className = '' }) => (
  <div className={`inline-flex p-1 rounded-xl bg-zinc-900 border border-white/10 gap-1 ${className}`}>
    {modeTabs.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        onClick={() => onSelectMode(id)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
          id === activeMode ? 'bg-cyan-500/20 text-cyan-200' : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </button>
    ))}
  </div>
);

interface OperatorSurfaceProps {
  selectedRoleId: string;
  setSelectedRoleId: React.Dispatch<React.SetStateAction<string>>;
  selectedWorkspaceId: string;
  setSelectedWorkspaceId: React.Dispatch<React.SetStateAction<string>>;
  taskInput: string;
  setTaskInput: React.Dispatch<React.SetStateAction<string>>;
  currentAction: ArchiQuickAction['actionType'];
  setCurrentAction: React.Dispatch<React.SetStateAction<ArchiQuickAction['actionType']>>;
  activeQuickActionId: string | null;
  applyQuickAction: (action: ArchiQuickAction) => void;
  runResult: ArchiRunResult | null;
  runProgress: number;
  selectedRole: ArchiAgentRole;
  selectedWorkspace: ArchiWorkspaceOption;
  recentRuns: ArchiRunResult[];
  startRun: (actionType: ArchiQuickAction['actionType']) => void;
}

const OperatorSurface: React.FC<OperatorSurfaceProps> = ({
  selectedRoleId,
  setSelectedRoleId,
  selectedWorkspaceId,
  setSelectedWorkspaceId,
  taskInput,
  setTaskInput,
  currentAction,
  setCurrentAction,
  activeQuickActionId,
  applyQuickAction,
  runResult,
  runProgress,
  selectedRole,
  selectedWorkspace,
  recentRuns,
  startRun,
}) => {
  const metricValues = [
    { label: 'Active Agents', value: '6', icon: Bot },
    { label: 'Runs Today', value: '28', icon: Activity },
    { label: 'Connected Repos', value: `${ARCHI_WORKSPACES.length}`, icon: Cpu },
    { label: 'Success Rate', value: '94.7%', icon: Gauge },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%)] pointer-events-none" />
          <div className="relative flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5" />
                OpenClaw AI Operator
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Archi</h1>
                <p className="mt-2 text-zinc-300 max-w-xl leading-relaxed">
                  Command OpenClaw agents, launch repo workflows, and run architecture-grade missions from a single control surface built for high-velocity teams.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                OpenClaw Core Connected
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 min-w-0 xl:min-w-[360px]">
              {metricValues.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{label}</p>
                    <Icon className="w-4 h-4 text-cyan-300" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Agent Roles</h2>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Reusable presets</span>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {ARCHI_AGENT_ROLES.map((role) => {
                const Icon = roleIconMap[role.icon];
                const isSelected = role.id === selectedRoleId;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`text-left rounded-xl border p-4 transition-all bg-gradient-to-br ${role.accentClass} ${
                      isSelected
                        ? 'ring-1 ring-white/40 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.06)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-lg bg-black/40 border border-white/15 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-300" />}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{role.title}</p>
                    <p className="text-xs text-zinc-400 mt-1 min-h-[34px]">{role.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {role.capabilities.map((capability) => (
                        <span key={capability} className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-md bg-black/40 border border-white/10 text-zinc-300">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Quick Workflows</h2>
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="space-y-2">
              {ARCHI_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => applyQuickAction(action)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    activeQuickActionId === action.id
                      ? 'border-cyan-400/40 bg-cyan-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{action.title}</p>
                  <p className="text-xs text-zinc-400 mt-1">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[1.15fr_1fr] gap-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Mission Composer</h2>
              <WandSparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-wider text-zinc-500">Workspace</span>
              <select
                value={selectedWorkspaceId}
                onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                {ARCHI_WORKSPACES.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} · {workspace.branch}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid md:grid-cols-2 gap-2">
              {ARCHI_WORKSPACES.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    selectedWorkspaceId === workspace.id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-black/30'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{workspace.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{workspace.repoUrl}</p>
                  <span className={`inline-flex mt-2 px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-md border ${workspaceStatusTone[workspace.status]}`}>
                    {workspace.status}
                  </span>
                </button>
              ))}
            </div>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-wider text-zinc-500">Mission brief</span>
              <textarea
                value={taskInput}
                onChange={(event) => setTaskInput(event.target.value)}
                rows={5}
                className="w-full px-3 py-3 rounded-xl bg-black/50 border border-white/15 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-y"
                placeholder="Tell Archi what to execute..."
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {(Object.keys(actionLabels) as ArchiQuickAction['actionType'][]).map((actionType) => (
                <button
                  key={actionType}
                  onClick={() => {
                    setCurrentAction(actionType);
                    startRun(actionType);
                  }}
                  disabled={!taskInput.trim() || runResult?.status === 'running'}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {actionLabels[actionType]}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              <span>Selected Role: {selectedRole.title}</span>
              <button
                onClick={() => startRun(currentAction)}
                disabled={!taskInput.trim() || runResult?.status === 'running'}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-400 text-black font-semibold hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runResult?.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Launch Mission
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Run Console</h2>
              <div className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-wider border rounded-full px-2.5 py-1 ${statusTone[runResult?.status ?? 'idle']}`}>
                {runResult?.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock3 className="w-3 h-3" />}
                {runResult?.status ?? 'idle'}
              </div>
            </div>

            {!runResult ? (
              <div className="h-[320px] rounded-xl border border-dashed border-white/15 bg-black/40 flex items-center justify-center text-center p-6">
                <div>
                  <Bot className="w-10 h-10 mx-auto text-zinc-600" />
                  <p className="text-sm text-zinc-400 mt-3">No runs yet. Launch a mission to stream OpenClaw execution output.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1 text-xs">
                  <p className="text-zinc-400">Workspace: <span className="text-white">{selectedWorkspace.name}</span></p>
                  <p className="text-zinc-400">Action: <span className="text-white">{actionLabels[runResult.actionType]}</span></p>
                  <p className="text-zinc-400">Started: <span className="text-white">{new Date(runResult.startedAt).toLocaleTimeString()}</span></p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>Execution progress</span>
                    <span>{runProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500" style={{ width: `${runProgress}%` }} />
                  </div>
                </div>
                <div className="h-[210px] rounded-xl border border-white/10 bg-black/60 p-3 overflow-y-auto custom-scrollbar font-mono text-xs space-y-2">
                  {runResult.logs.map((log) => (
                    <p key={log.id} className={getLogStyle(log.level)}>
                      <span className="text-zinc-600 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      {log.message}
                    </p>
                  ))}
                </div>
                {runResult.summary && (
                  <div className={`rounded-xl border p-3 ${runResult.status === 'warning' ? 'border-amber-400/30 bg-amber-500/10' : 'border-emerald-400/30 bg-emerald-500/10'}`}>
                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Result summary</p>
                    <p className="text-sm text-zinc-100">{runResult.summary}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Workspace Health Snapshot</h3>
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {ARCHI_WORKSPACES.map((workspace) => (
                <div key={workspace.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-white">{workspace.name}</p>
                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-md border ${workspaceStatusTone[workspace.status]}`}>{workspace.status}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Branch: {workspace.branch}</p>
                  <p className="text-xs text-zinc-400 mt-2">Last run: {workspace.lastRun}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
            <h3 className="text-lg font-semibold text-white mb-3">Recent Runs</h3>
            <div className="space-y-2">
              {recentRuns.length === 0 ? (
                <p className="text-sm text-zinc-500">No completed runs yet.</p>
              ) : (
                recentRuns.map((run) => (
                  <div key={run.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <p className="text-sm text-white font-medium">{actionLabels[run.actionType]}</p>
                    <p className="text-xs text-zinc-500 mt-1">{new Date(run.startedAt).toLocaleString()}</p>
                    <p className="text-xs mt-2 inline-flex items-center gap-1 text-zinc-300">
                      {run.status === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                      {run.status === 'warning' ? 'Completed with findings' : 'Completed successfully'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ArchiPanel: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ArchiWorkspaceMode>('operator');
  const [selectedRoleId, setSelectedRoleId] = useState(ARCHI_AGENT_ROLES[0].id);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(ARCHI_WORKSPACES[0].id);
  const [taskInput, setTaskInput] = useState('Audit this repository for production blockers and recommend the top fixes.');
  const [currentAction, setCurrentAction] = useState<ArchiQuickAction['actionType']>('audit');
  const [activeQuickActionId, setActiveQuickActionId] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<ArchiRunResult | null>(null);
  const [recentRuns, setRecentRuns] = useState<ArchiRunResult[]>([]);

  const selectedRole = useMemo(
    () => ARCHI_AGENT_ROLES.find((role) => role.id === selectedRoleId) ?? ARCHI_AGENT_ROLES[0],
    [selectedRoleId],
  );

  const selectedWorkspace = useMemo(
    () => ARCHI_WORKSPACES.find((workspace) => workspace.id === selectedWorkspaceId) ?? ARCHI_WORKSPACES[0],
    [selectedWorkspaceId],
  );

  const runProgress = useMemo(() => {
    if (!runResult) return 0;
    const totalSteps = runTemplates[runResult.actionType].length + 1;
    return Math.min(100, Math.round((runResult.logs.length / totalSteps) * 100));
  }, [runResult]);

  useEffect(() => {
    if (!runResult || runResult.status !== 'running') return;

    const template = runTemplates[runResult.actionType];
    const nextStep = runResult.logs.length - 1;

    if (nextStep >= template.length) {
      const completedLog: ArchiRunLog = {
        id: `${runResult.id}-completed`,
        level: runResult.actionType === 'audit' ? 'warning' : 'success',
        message:
          runResult.actionType === 'audit'
            ? 'Completed with 3 high-priority findings and 1 blocker requiring immediate attention'
            : 'Completed successfully with a validated recommendation set ready for execution',
        timestamp: new Date().toISOString(),
      };

      setRunResult((prev) => {
        if (!prev) return prev;
        const status: ArchiRunStatus = prev.actionType === 'audit' ? 'warning' : 'success';
        const finalized: ArchiRunResult = {
          ...prev,
          status,
          finishedAt: new Date().toISOString(),
          summary:
            prev.actionType === 'audit'
              ? `Archi identified production blockers in ${selectedWorkspace.name}. Prioritize auth hardening and CI guardrails.`
              : `Archi generated a complete ${actionLabels[prev.actionType].toLowerCase()} package for ${selectedWorkspace.name}.`,
          logs: [...prev.logs, completedLog],
        };
        setRecentRuns((existing) => [finalized, ...existing.filter((item) => item.id !== finalized.id)].slice(0, 4));
        return finalized;
      });
      return;
    }

    const timer = window.setTimeout(() => {
      const infoLog: ArchiRunLog = {
        id: `${runResult.id}-${nextStep}`,
        level: 'info',
        message: template[nextStep],
        timestamp: new Date().toISOString(),
      };
      setRunResult((prev) => (prev ? { ...prev, logs: [...prev.logs, infoLog] } : prev));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [runResult, selectedWorkspace.name]);

  const startRun = (actionType: ArchiQuickAction['actionType']) => {
    const newRun: ArchiRunResult = {
      id: `${Date.now()}`,
      startedAt: new Date().toISOString(),
      status: 'running',
      actionType,
      roleId: selectedRole.id,
      workspaceId: selectedWorkspace.id,
      task: taskInput.trim(),
      logs: [
        {
          id: `${Date.now()}-init`,
          level: 'info',
          message: `Mission accepted by ${selectedRole.title} agent for ${selectedWorkspace.name}`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setRunResult(newRun);
  };

  const applyQuickAction = (action: ArchiQuickAction) => {
    setTaskInput(action.prompt);
    setSelectedRoleId(action.recommendedRoleId);
    setCurrentAction(action.actionType);
    setActiveQuickActionId(action.id);
  };

  const embeddedMode = activeMode !== 'operator';

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 border-b border-white/10 bg-black/40">
        <ModeTabs activeMode={activeMode} onSelectMode={setActiveMode} />
      </div>

      <div className={embeddedMode ? 'flex-1 min-h-0' : 'flex-1'}>
        {activeMode === 'factory' && <ProjectStudio />}
        {activeMode === 'ideas' && <AIEngineer />}
        {activeMode === 'operator' && (
          <OperatorSurface
            selectedRoleId={selectedRoleId}
            setSelectedRoleId={setSelectedRoleId}
            selectedWorkspaceId={selectedWorkspaceId}
            setSelectedWorkspaceId={setSelectedWorkspaceId}
            taskInput={taskInput}
            setTaskInput={setTaskInput}
            currentAction={currentAction}
            setCurrentAction={setCurrentAction}
            activeQuickActionId={activeQuickActionId}
            applyQuickAction={applyQuickAction}
            runResult={runResult}
            runProgress={runProgress}
            selectedRole={selectedRole}
            selectedWorkspace={selectedWorkspace}
            recentRuns={recentRuns}
            startRun={startRun}
          />
        )}
      </div>
    </div>
  );
};

export default ArchiPanel;
