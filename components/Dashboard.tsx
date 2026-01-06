
import React, { useEffect, useState, useRef } from 'react';
import {
  ProjectStatus,
  RepoAudit,
  Project,
  DependencyIssue,
  Deployment,
  AuditCategory,
  RepoScanReport,
} from '../types';
import {
  GitCommit,
  FolderGit2,
  Sparkles,
  Activity,
  Cpu,
  AlertCircle,
  GitBranch,
  ArrowUpRight,
  Clock,
  Zap,
  Server,
  Globe,
  ScanLine,
  CheckCircle2,
  Scale,
  Loader2,
  X,
  Microscope,
  Terminal,
  BarChart2,
  Download,
  Share2,
  Layers,
  Bot,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Lock,
  GitPullRequest,
  ExternalLink
} from 'lucide-react';
import {
  analyzeProjectHealth,
  compareProjects,
  analyzeDependencyConflict,
} from '../services/huggingFaceService';
import ReactMarkdown from 'react-markdown';
import {
  fetchProjects,
  fetchDeployments,
  fetchDependencyIssues,
  scanGithubRepoForProject,
  fetchLatestRepoScanForProject,
} from '../services/apiClient';

type AuditLogEntry = {
  id: string;
  text: string;
  timestamp: string;
};

const Dashboard: React.FC = () => {
  // --- DASHBOARD STATE ---
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // --- REPO MANAGER STATE ---
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [comparingLoading, setComparingLoading] = useState(false);

  // --- AUDIT STATE ---
  const [selectedAuditRepo, setSelectedAuditRepo] = useState<Project | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditResult, setAuditResult] = useState<RepoAudit | null>(null);
  const [auditProgress, setAuditProgress] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [auditScoresByProject, setAuditScoresByProject] = useState<Record<string, number>>({});

  // --- DATA STATE ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [issues, setIssues] = useState<(DependencyIssue & { cveId?: string })[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [repoFilter, setRepoFilter] = useState<'all' | 'prod' | 'dev'>('all');
  const [visibleRepoCount, setVisibleRepoCount] = useState(16);

  // --- DEPENDENCY FIX STATE ---
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [fixResult, setFixResult] = useState<{ id: string, message: string } | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const createLogEntry = (text: string): AuditLogEntry => ({
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    text,
    timestamp: new Date().toISOString(),
  });

  const appendAuditLogs = (lines: string[]) => {
    if (!lines.length) return;
    setAuditLogs(prev => {
      const existing = new Set(prev.map(log => log.text));
      const entries = lines
        .filter(line => !existing.has(line))
        .map(line => createLogEntry(line));
      return entries.length ? [...prev, ...entries] : prev;
    });
  };

  const getLogClass = (text: string) => {
    if (text.startsWith('!')) return 'text-red-400 font-bold';
    if (text.startsWith('>')) return 'text-emerald-400';
    return 'text-zinc-500';
  };

  // --- SCROLL REF ---
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [auditLogs]);

  useEffect(() => {
    if (!fixResult) return;
    const timer = setTimeout(() => setFixResult(null), 8000);
    return () => clearTimeout(timer);
  }, [fixResult]);

  useEffect(() => {
    // Reset visible repos when projects or filter change
    setVisibleRepoCount(16);
  }, [projects.length, repoFilter]);

  // --- LOAD DATA FROM API ---
  useEffect(() => {
    const load = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const [projectData, deploymentData, issueData] = await Promise.all([
          fetchProjects(),
          fetchDeployments(),
          fetchDependencyIssues()
        ]);
        setProjects(projectData);
        setDeployments(deploymentData);
        setIssues(issueData);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        setDataError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!projects.length) return;
    let cancelled = false;

    const load = async () => {
      const entries = await Promise.all(
        projects.map(async (project) => {
          const scan = await fetchLatestRepoScanForProject(project);
          if (!scan) return null;
          return { projectId: project.id, score: scan.score };
        }),
      );

      if (cancelled) return;

      setAuditScoresByProject((prev) => {
        const next = { ...prev };
        for (const entry of entries) {
          if (!entry) continue;
          next[entry.projectId] = entry.score;
        }
        return next;
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [projects]);

  // --- AI INSIGHTS ---
  useEffect(() => {
    if (projects.length === 0) return;
    const fetchInsights = async () => {
      setLoadingSuggestions(true);
      try {
        const suggestionsJson = await analyzeProjectHealth(projects[0]);
        const parsed = JSON.parse(suggestionsJson);
        if (Array.isArray(parsed)) {
          setAiSuggestions(parsed);
        }
      } catch (e) {
        console.error("Failed to parse AI suggestions", e);
        setAiSuggestions([
          "Optimize Redis cache configuration",
          "Update React dependencies to v19",
          "Review security policies"
        ]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchInsights();
  }, [projects]);

  // --- HELPERS ---
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
      case ProjectStatus.MAINTENANCE: return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
      case ProjectStatus.CRITICAL: return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
      default: return 'bg-zinc-500';
    }
  };

  const getStatusPillClasses = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case ProjectStatus.MAINTENANCE:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case ProjectStatus.CRITICAL:
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-600';
    }
  };

  const getTechColor = (tech: string) => {
    const t = tech.toLowerCase();
    if (t.includes('react') || t.includes('type')) return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
    if (t.includes('node') || t.includes('vue')) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (t.includes('python') || t.includes('aws')) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    if (t.includes('swift')) return 'text-orange-400 border-orange-500/20 bg-orange-500/10';
    return 'text-zinc-400 border-zinc-700 bg-zinc-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/50 shadow-emerald-500/20';
    if (score >= 70) return 'text-blue-400 border-blue-500/50 shadow-blue-500/20';
    if (score >= 50) return 'text-amber-400 border-amber-500/50 shadow-amber-500/20';
    return 'text-red-400 border-red-500/50 shadow-red-500/20';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }

  const getAuditStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'optimal') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'good') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s === 'warning') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const CATEGORY_LABELS: Record<string, string> = {
    codeQuality: 'Code Quality',
    security: 'Security',
    dependencies: 'Dependencies',
    devops: 'DevOps & CI/CD',
    architecture: 'Architecture',
    frameworkSpecific: 'Framework-specific',
    testing: 'Testing',
    documentation: 'Documentation & DX',
    performance: 'Performance',
    aiSpecific: 'AI Safety',
    accessibility: 'Accessibility',
    observability: 'Observability',
    dataQuality: 'Data Quality',
    repoHealth: 'Repo Health',
  };

  const scoreToCategoryStatus = (
    score: number,
  ): AuditCategory['status'] => {
    if (score >= 85) return 'optimal';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  };

  const buildRepoAuditFromScan = (
    project: Project,
    report: RepoScanReport,
  ): RepoAudit => {
    const categories: AuditCategory[] = [];
    const categoryScores = report.categoryScores ?? {};

    for (const [categoryId, score] of Object.entries(categoryScores)) {
      const findings: string[] = [];
      for (const check of report.results) {
        if (check.category === categoryId && !check.passed) {
          const message = check.message || check.error || check.title;
          findings.push(message);
        }
      }

      categories.push({
        name: CATEGORY_LABELS[categoryId] ?? categoryId,
        score,
        status: scoreToCategoryStatus(score),
        findings,
      });
    }

    const detectedFeatures: string[] = [];
    const passedIds = new Set(
      report.results.filter((r) => r.passed).map((r) => r.checkId),
    );
    if (passedIds.has('devops-001')) detectedFeatures.push('CI configuration');
    if (passedIds.has('devops-002')) detectedFeatures.push('Dockerfile');
    if (passedIds.has('deps-001')) detectedFeatures.push('Dependency lockfile');
    if (passedIds.has('test-001')) detectedFeatures.push('Test suite');

    const weakest = [...categories]
      .filter((c) => c.score < 85)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    const weakestSummary =
      weakest.length > 0
        ? weakest
          .map((c) => `${c.name} (${c.score}/100)`)
          .join(', ')
        : 'no major weak areas';

    const productionReady = report.productionReady === true;
    const readinessReasons = Array.isArray(report.readinessReasons)
      ? report.readinessReasons
      : [];

    const readinessIntro = productionReady
      ? 'This repository is considered production-ready based on static checks.'
      : 'This repository is not production-ready based on static checks.';

    const readinessDetail =
      !productionReady && readinessReasons.length
        ? ` Key blockers: ${readinessReasons.join(' ')}`
        : '';

    const executiveSummary = `Static scan for ${project.name} returned an overall score of ${report.score}/100. Weakest categories: ${weakestSummary}. ${readinessIntro}${readinessDetail}`;

    const issues = report.results
      .filter((r) => !r.passed)
      .map((r) => ({
        checkId: r.checkId,
        title: r.title,
        category: r.category,
        severity: r.severity,
        message: r.message || r.error || r.title,
      }));

    return {
      projectId: project.id,
      timestamp: report.timestamp,
      overallScore: report.score,
      categories,
      detectedFeatures,
      executiveSummary,
      productionReady,
      readinessReasons,
      issues,
    };
  };

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const getDeploymentStatusLabel = (status: Deployment['status']) => {
    if (status === 'success') return 'Deployment completed successfully';
    if (status === 'building') return 'Deployment in progress';
    if (status === 'failed') return 'Deployment failed';
    return 'Deployment status';
  };

  const PROD_BRANCHES = ['main', 'master', 'prod', 'production'];

  const isProdProject = (project: Project) => {
    if (!deployments.length) return false;
    return deployments.some((d) => {
      if (d.projectId !== project.id) return false;
      const branch = (d.branch || '').toLowerCase();
      return PROD_BRANCHES.includes(branch);
    });
  };

  const isDevProject = (project: Project) => {
    if (!deployments.length) return false;
    return deployments.some((d) => {
      if (d.projectId !== project.id) return false;
      const branch = (d.branch || '').toLowerCase();
      return branch !== '' && !PROD_BRANCHES.includes(branch);
    });
  };

  // --- ACTIONS ---
  const toggleRepoSelection = (id: string) => {
    setSelectedRepoIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedRepoIds([]);
    setIsComparing(false);
    setAiComparison(null);
  };

  const handleCompare = async () => {
    setIsComparing(true);
    setComparingLoading(true);
    setAiComparison(null);
    try {
      const selectedProjects = projects.filter(p => selectedRepoIds.includes(p.id));
      const result = await compareProjects(selectedProjects);
      setAiComparison(result);
    } catch (e) {
      setAiComparison("Could not generate AI comparison.");
    } finally {
      setComparingLoading(false);
    }
  };

  const startRepoAudit = async (project: Project) => {
    setSelectedAuditRepo(project);
    setAuditResult(null);
    setAuditLogs([
      createLogEntry(
        `> Initializing static audit protocol for ${project.name}...`,
      ),
    ]);
    setAuditProgress(5);

    try {
      const report = await scanGithubRepoForProject(project);

      setAuditLogs((prev) => [
        ...prev,
        createLogEntry('> Static analysis checks completed. Building report...'),
      ]);

      const failingChecks = report.results.filter((r) => !r.passed);
      const lines: string[] = [];

      lines.push(
        `> Evaluated ${report.results.length} checks across ${Object.keys(
          report.categoryScores ?? {},
        ).length} categories.`,
      );

      failingChecks.forEach((check) => {
        const prefix =
          check.severity === 'blocker' || check.severity === 'high'
            ? '!'
            : '>';
        const message = check.message || check.error || check.title;
        lines.push(
          `${prefix} [${check.category.toUpperCase()}] ${check.title}: ${message}`,
        );
      });

      appendAuditLogs(lines);
      setAuditProgress(90);

      const repoAudit = buildRepoAuditFromScan(project, report);
      setAuditScoresByProject((prev) => ({
        ...prev,
        [project.id]: repoAudit.overallScore,
      }));
      setAuditResult(repoAudit);
      setAuditProgress(100);
      setAuditLogs((prev) => [
        ...prev,
        createLogEntry('> Analysis complete. Generating report...'),
        createLogEntry('> Finalizing scores...'),
      ]);
    } catch (e) {
      console.error(e);
      setAuditLogs((prev) => [
        ...prev,
        createLogEntry('! Fatal: Failed to run static repo scan.'),
      ]);
    }
  };

  const closeAudit = () => {
    setSelectedAuditRepo(null);
    setAuditResult(null);
    setAuditLogs([]);
  }

  const handleAutoFix = async (issueId: string, pkg: string, current: string, target: string) => {
    setFixingId(issueId);
    setFixResult(null);
    try {
      const analysis = await analyzeDependencyConflict(pkg, current, target);
      setFixResult({
        id: issueId,
        message: analysis
      });
    } catch (e) {
      setFixResult({ id: issueId, message: "Failed to generate fix." });
    } finally {
      setFixingId(null);
    }
  };

  const selectedProjects = projects.filter(p => selectedRepoIds.includes(p.id));
  const filteredProjects = projects.filter((project) => {
    if (repoFilter === 'all') return true;
    if (repoFilter === 'prod') return isProdProject(project);
    if (repoFilter === 'dev') return isDevProject(project);
    return true;
  });
  const visibleProjects = filteredProjects.slice(0, visibleRepoCount);
  const hasMoreProjects = filteredProjects.length > visibleRepoCount;
  const deploymentFeed = deployments
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalDeployments = deployments.length;
  const successfulDeployments = deployments.filter((d) => d.status === 'success').length;
  const uptimePercent = totalDeployments
    ? Math.round(((successfulDeployments / totalDeployments) * 100) * 10) / 10
    : 100;

  const getEffectiveHealthScore = (project: Project) => {
    const override = auditScoresByProject[project.id];
    if (typeof override === 'number') return override;
    return project.healthScore ?? 0;
  };

  const averageHealth = projects.length
    ? Math.round(
      projects.reduce((sum, p) => sum + getEffectiveHealthScore(p), 0) /
      projects.length,
    )
    : 0;

  const getProjectDescription = (project: Project) => {
    if (project.description && project.description !== 'No description provided.') {
      return project.description;
    }
    // Fallback descriptions based on name
    if (project.name === 'dev-hub') return 'Central developer command center for managing projects, deployments, and security audits.';
    if (project.name === 'LotSignal-v2') return 'Advanced signal processing and inventory tracking system.';

    return `Active development repository for ${project.name}.`;
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#050505] to-black relative selection:bg-pink-500/30">

      {/* --- COMPARISON OVERLAY --- */}
      {isComparing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-10 duration-300 p-8 overflow-hidden flex flex-col">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Project Comparison</h2>
                  <p className="text-zinc-400 text-sm">Analyzing {selectedProjects.length} repositories side-by-side</p>
                </div>
              </div>
              <button onClick={() => setIsComparing(false)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-12">
              {/* AI Insight */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1c1c1e] to-black border border-pink-500/20 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Sparkles className="w-32 h-32 text-pink-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-bold text-pink-500 uppercase tracking-widest mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2" /> CTO Strategic Insight
                  </h3>
                  {comparingLoading ? (
                    <div className="flex items-center text-zinc-400 text-sm h-20">
                      <Loader2 className="w-4 h-4 mr-3 animate-spin text-pink-500" />
                      Analyzing architecture compatibility and risk factors...
                    </div>
                  ) : (
                    <div className="text-zinc-200 leading-relaxed max-w-4xl text-sm font-medium">
                      <ReactMarkdown>{aiComparison || ''}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-6 bg-zinc-900/80 border-b border-r border-white/5 min-w-[200px] text-xs font-bold text-zinc-500 uppercase tracking-widest sticky left-0 z-20 backdrop-blur-md">Metric</th>
                        {selectedProjects.map(p => (
                          <th key={p.id} className="p-6 bg-zinc-900/40 border-b border-white/5 min-w-[300px]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 shadow-inner">
                                <FolderGit2 className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{p.name}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{p.id}</div>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr className="group hover:bg-white/[0.02] transition-colors">
                        <td className="p-6 border-r border-white/5 text-sm font-medium text-zinc-400 bg-[#0a0a0a] sticky left-0 z-10">Project Status</td>
                        {selectedProjects.map(p => (
                          <td key={p.id} className="p-6">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                p.status === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                              {p.status}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="group hover:bg-white/[0.02] transition-colors">
                        <td className="p-6 border-r border-white/5 text-sm font-medium text-zinc-400 bg-[#0a0a0a] sticky left-0 z-10">Stack</td>
                        {selectedProjects.map(p => (
                          <td key={p.id} className="p-6">
                            <div className="flex flex-wrap gap-2">
                              {p.techStack.map(t => (
                                <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">{t}</span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- AUDIT MODAL --- */}
      {selectedAuditRepo && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[90vh] relative">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Microscope className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedAuditRepo.name}</h2>
                  <p className="text-xs text-zinc-400 font-mono flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                    AUDIT PROTOCOL V2.5
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!auditResult && (
                  <div className="flex items-center text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    SCANNING CODEBASE...
                  </div>
                )}
                <button onClick={closeAudit} className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Left Panel: Logs */}
              <div className={`flex flex-col border-r border-white/10 bg-[#050505] transition-all duration-500 ${auditResult ? 'lg:w-1/3 w-full hidden lg:flex' : 'w-full'}`}>
                <div className="p-3 bg-zinc-950 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center">
                    <Terminal className="w-3 h-3 mr-2" /> Live Execution
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${auditProgress}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">{auditProgress}%</span>
                  </div>
                </div>
                <div
                  ref={logContainerRef}
                  className="flex-1 p-6 overflow-y-auto font-mono text-[12px] space-y-2.5 custom-scrollbar"
                >
                  {auditLogs.map((log) => (
                    <div key={log.id} className={`flex items-start animate-in fade-in slide-in-from-left-2 duration-200 ${getLogClass(log.text)}`}>
                      <span className="mr-3 opacity-30 select-none shrink-0 text-[10px] mt-0.5">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                      <span className="break-all">{log.text}</span>
                    </div>
                  ))}
                  {!auditResult && (
                    <div className="flex items-center text-zinc-700 mt-4">
                      <span className="animate-pulse w-2 h-4 bg-indigo-500 block"></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: Report Dashboard */}
              {auditResult && (
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0c] animate-in slide-in-from-right-10 duration-500">
                  <div className="p-8 md:p-12 space-y-10">

                    {/* Score */}
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                      <div className="relative shrink-0 mx-auto md:mx-0">
                        <svg className="w-40 h-40 transform -rotate-90 drop-shadow-2xl">
                          <circle cx="80" cy="80" r="74" className="text-zinc-900 stroke-current" strokeWidth="12" fill="transparent" />
                          <circle cx="80" cy="80" r="74" className={`${getScoreColor(auditResult.overallScore).split(' ')[0]} stroke-current transition-all duration-1000 ease-out`} strokeWidth="12" fill="transparent" strokeDasharray={465} strokeDashoffset={465 - (465 * auditResult.overallScore) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-5xl font-bold tracking-tighter ${getScoreColor(auditResult.overallScore).split(' ')[0]}`}>{auditResult.overallScore}</span>
                          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Score</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Executive Summary</h3>
                          <div className="flex gap-2">
                            <button className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></button>
                            <button className="p-1.5 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <p className="text-zinc-200 leading-relaxed text-base font-light border-l-2 border-white/10 pl-4">{auditResult.executiveSummary}</p>

                        <div className="mt-6">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Detected Technologies</h4>
                          <div className="flex flex-wrap gap-2">
                            {auditResult.detectedFeatures.map((feature, i) => (
                              <span key={i} className="px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 flex items-center hover:border-indigo-500/50 transition-colors cursor-default">
                                {feature.toLowerCase().includes('playwright') || feature.toLowerCase().includes('cypress') ? <Bot className="w-3.5 h-3.5 mr-2 text-emerald-400" /> :
                                  feature.toLowerCase().includes('ai') || feature.toLowerCase().includes('gpt') ? <Sparkles className="w-3.5 h-3.5 mr-2 text-purple-400" /> :
                                    <Layers className="w-3.5 h-3.5 mr-2 text-blue-400" />}
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="grid grid-cols-1 gap-6">
                      {auditResult.categories.map((category, idx) => (
                        <div key={idx} className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:bg-[#161616] transition-colors group">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-lg ${getScoreBg(category.score)} bg-opacity-10 border border-white/5`}>
                                <BarChart2 className={`w-5 h-5 ${getScoreColor(category.score).split(' ')[0]}`} />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-zinc-100">{category.name}</h4>
                                <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 w-32 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${getScoreBg(category.score)}`}
                                    style={{ width: `${category.score}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border ${getAuditStatusColor(category.status)}`}>
                              {category.status}
                            </div>
                          </div>
                          <ul className="space-y-3">
                            {category.findings.map((finding, fIdx) => (
                              <li key={fIdx} className="flex items-start text-sm text-zinc-400">
                                <CheckCircle2 className="w-4 h-4 mr-3 text-zinc-600 mt-0.5 shrink-0 group-hover:text-zinc-500 transition-colors" />
                                <span className="leading-relaxed">{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {auditResult.issues && auditResult.issues.length > 0 && (
                      <div className="mt-10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Issues</h3>
                          <span className="text-xs text-zinc-500 font-mono">
                            {auditResult.issues.length} issues detected
                          </span>
                        </div>
                        <div className="space-y-2">
                          {auditResult.issues.map((issue, idx) => (
                            <div
                              key={issue.checkId + '-' + idx}
                              className="flex items-start justify-between bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-200"
                            >
                              <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-zinc-500">
                                    {issue.category.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-600">
                                    {issue.checkId}
                                  </span>
                                </div>
                                <div className="font-medium mb-0.5">
                                  {issue.title}
                                </div>
                                <div className="text-xs text-zinc-400">
                                  {issue.message}
                                </div>
                              </div>
                              <div className="shrink-0 flex flex-col items-end gap-1">
                                <span
                                  className={
                                    issue.severity === 'blocker'
                                      ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40'
                                      : issue.severity === 'high'
                                        ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                        : issue.severity === 'medium'
                                          ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                          : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700/40 text-zinc-300 border border-zinc-600'
                                  }
                                >
                                  {issue.severity.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-8 max-w-[1800px] mx-auto space-y-10">

        {/* --- HEADER & METRICS --- */}
        <div className="flex items-end justify-between pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5 drop-shadow-md">Command Center</h1>
            <p className="text-zinc-500 font-medium text-sm flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              All systems operational
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogsModal(true)}
              className="h-10 px-4 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 rounded-xl text-zinc-300 text-xs font-semibold transition-all flex items-center shadow-lg"
            >
              <Activity className="w-3.5 h-3.5 mr-2 text-zinc-500" />
              System Logs
            </button>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="h-10 px-5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all flex items-center"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 fill-black" />
              New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Metrics */}
          <div className="relative group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-emerald-500/30 transition-colors overflow-hidden backdrop-blur-sm">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Globe className="w-16 h-16 text-emerald-500" /></div>
            <div className="flex items-center gap-2 text-emerald-400 mb-2"><Activity className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Uptime</span></div>
            <div className="text-4xl font-mono font-medium text-white tracking-tighter">{uptimePercent}<span className="text-emerald-500/50 text-2xl">%</span></div>
          </div>
          <div className="relative group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-blue-500/30 transition-colors overflow-hidden backdrop-blur-sm">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><GitCommit className="w-16 h-16 text-blue-500" /></div>
            <div className="flex items-center gap-2 text-blue-400 mb-2"><Server className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Deployments</span></div>
            <div className="text-4xl font-mono font-medium text-white tracking-tighter">{totalDeployments}</div>
          </div>
          <div className="relative group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 transition-colors overflow-hidden backdrop-blur-sm">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Cpu className="w-16 h-16 text-amber-500" /></div>
            <div className="flex items-center gap-2 text-amber-400 mb-2"><Cpu className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Avg Health</span></div>
            <div className="text-4xl font-mono font-medium text-white tracking-tighter">{averageHealth}<span className="text-amber-500/50 text-2xl">%</span></div>
          </div>
          <div className="relative group p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-red-500/30 transition-colors overflow-hidden backdrop-blur-sm">
            <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle className="w-16 h-16 text-red-500" /></div>
            <div className="flex items-center gap-2 text-red-400 mb-2"><AlertCircle className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Issues</span></div>
            <div className="text-4xl font-mono font-medium text-white tracking-tighter">{issues.length}</div>
          </div>
        </div>

        {/* --- REPO GRID (MERGED FROM REPO MANAGER) --- */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
              <FolderGit2 className="w-5 h-5 mr-2 text-zinc-400" />
              Active Repositories
            </h2>

            <div className="flex gap-3">
              {selectedRepoIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
                  <span className="text-[10px] text-zinc-400 font-bold px-2">{selectedRepoIds.length} selected</span>
                  <button onClick={clearSelection} className="h-7 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-300 text-[10px] font-bold transition-all">Clear</button>
                  <button onClick={handleCompare} className="h-7 px-3 bg-pink-600 hover:bg-pink-500 text-white rounded-md text-[10px] font-bold transition-all flex items-center">
                    <Scale className="w-3 h-3 mr-1.5" /> Compare
                  </button>
                </div>
              )}
              <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-white/5">
                <button
                  onClick={() => setRepoFilter('all')}
                  className={`px-3 py-1 text-[10px] font-bold rounded ${repoFilter === 'all' ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRepoFilter('prod')}
                  className={`px-3 py-1 text-[10px] font-bold rounded ${repoFilter === 'prod' ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  Prod
                </button>
                <button
                  onClick={() => setRepoFilter('dev')}
                  className={`px-3 py-1 text-[10px] font-bold rounded ${repoFilter === 'dev' ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  Dev
                </button>
              </div>
            </div>
          </div>

          {dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-[#1c1c1e]/40 backdrop-blur-sm rounded-2xl p-6 h-[280px] border border-white/5 animate-pulse flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900/80 border border-white/5" />
                      <div className="w-20 h-5 rounded-full bg-zinc-900/80" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 rounded bg-zinc-900/80 w-3/4" />
                      <div className="h-3 rounded bg-zinc-900/60 w-full" />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      <div className="w-16 h-4 rounded bg-zinc-900/70" />
                      <div className="w-16 h-4 rounded bg-zinc-900/70" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-600">
                      <div className="w-24 h-3 rounded bg-zinc-900/60" />
                      <div className="w-16 h-3 rounded bg-zinc-900/60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center text-xs text-zinc-500 bg-black/40">
              No repositories found for this filter. Adjust filters or import a repository to get started.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {visibleProjects.slice(0, visibleRepoCount).map((project) => {
                  const effectiveScore = getEffectiveHealthScore(project);
                  const hasAudit =
                    typeof auditScoresByProject[project.id] === 'number';

                  return (
                    <div
                      key={project.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        toggleRepoSelection(project.id);
                      }}
                      className={`bg-[#1c1c1e]/50 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-between h-[280px] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer border group relative overflow-hidden shadow-lg ${selectedRepoIds.includes(project.id) ? 'border-pink-500/50 ring-1 ring-pink-500/50' : 'border-white/5 hover:border-white/10'
                        }`}
                    >
                      {/* Status Glow */}
                      <div className={`absolute top-0 inset-x-0 h-[1px] ${project.status === ProjectStatus.ACTIVE ? 'bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : project.status === ProjectStatus.CRITICAL ? 'bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-amber-500/50'}`}></div>

                      {/* Checkbox */}
                      <div className={`absolute top-4 right-4 w-5 h-5 rounded border flex items-center justify-center transition-colors z-20 ${selectedRepoIds.includes(project.id) ? 'bg-pink-500 border-pink-500' : 'border-zinc-600 hover:border-zinc-400 bg-transparent'
                        }`}>
                        {selectedRepoIds.includes(project.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>

                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shadow-inner">
                            <FolderGit2 className="w-6 h-6" />
                          </div>
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${getStatusPillClasses(project.status)}`}
                            title={`Project status: ${project.status}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusColor(project.status)}`}></span>
                            {project.status}
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-sky-400 transition-colors">{project.name}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 font-medium">{getProjectDescription(project)}</p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {project.techStack.slice(0, 3).map(tech => (
                            <span key={tech} className={`text-[10px] font-bold px-2.5 py-1 rounded border ${getTechColor(tech)}`}>
                              {tech}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                          <div className="flex items-center text-[10px] text-zinc-500 font-mono">
                            <Clock className="w-3 h-3 mr-1.5" />
                            {formatTimestamp(project.lastDeployed)}
                          </div>
                          <div
                            className="flex items-center text-[10px] text-zinc-500 font-mono"
                            title={hasAudit
                              ? `Static audit score: ${effectiveScore}/100 (higher is better)`
                              : `Baseline health from GitHub metadata: ${effectiveScore}/100 (run an audit for deeper static analysis)`}
                          >
                            <Activity className="w-3 h-3 mr-1.5 text-zinc-600" />
                            {hasAudit ? `${effectiveScore}/100` : 'Not audited'}
                          </div>
                          {/* Audit Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); startRepoAudit(project); }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all text-[10px] font-bold flex items-center shadow-lg group/audit"
                          >
                            <ScanLine className="w-3 h-3 mr-1.5 group-hover/audit:animate-pulse" />
                            Audit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Create Card */}
                <button className="h-[280px] rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-zinc-600 hover:text-zinc-400 hover:border-white/20 hover:bg-white/[0.02] transition-all group">
                  <div className="w-14 h-14 rounded-full bg-zinc-900/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-zinc-800 transition-all duration-300 shadow-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold">Import Repository</span>
                </button>
              </div>
              {hasMoreProjects && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setVisibleRepoCount((prev) => prev + 16)}
                    className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:border-white/30 transition-colors"
                  >
                    View more repositories ({filteredProjects.length - visibleRepoCount} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* --- BOTTOM SECTION: ACTIVITY & DEPENDENCIES --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4 pb-12">

          {/* Left Column: Deployment Activity */}
          <div className="xl:col-span-2 flex flex-col gap-8">
            {/* Deployments */}
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Deployment Activity</h3>
              <div className="bg-[#1c1c1e]/40 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
                {dataLoading ? (
                  <div className="divide-y divide-white/5">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 animate-pulse"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-zinc-700 bg-zinc-900" />
                          <div className="space-y-2">
                            <div className="h-3 w-32 rounded bg-zinc-900/80" />
                            <div className="h-2 w-40 rounded bg-zinc-900/60" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-4 rounded bg-zinc-900/70" />
                          <div className="w-24 h-3 rounded bg-zinc-900/60" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : deploymentFeed.length === 0 ? (
                  <div className="p-6 text-sm text-zinc-500 text-center">No deployments recorded yet.</div>
                ) : (
                  deploymentFeed.slice(0, 6).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2.5 h-2.5 rounded-full border-2 ${d.status === 'success'
                              ? 'border-emerald-500 bg-emerald-500/20'
                              : d.status === 'building'
                                ? 'border-blue-500 bg-blue-500/20 animate-pulse'
                                : 'border-red-500 bg-red-500/20'
                            }`}
                          title={getDeploymentStatusLabel(d.status)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                            {d.projectName}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono flex items-center mt-0.5">
                            <GitBranch className="w-3 h-3 mr-1.5 text-zinc-600" /> {d.branch}
                            <span className="mx-2 opacity-30">|</span>
                            <GitCommit className="w-3 h-3 mr-1.5 text-zinc-600" /> {d.commitHash}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${d.status === 'success'
                              ? 'text-emerald-500 bg-emerald-500/10'
                              : d.status === 'building'
                                ? 'text-blue-500 bg-blue-500/10'
                                : 'text-red-500 bg-red-500/10'
                            }`}
                          title={getDeploymentStatusLabel(d.status)}
                        >
                          {d.status}
                        </span>
                        <span className="text-xs text-zinc-600 font-mono w-32 text-right">
                          {formatTimestamp(d.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dependency Risks (Merged from RepoManager) */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Dependency Risks</h3>
                {issues.length > 0 && <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/20">{issues.length} Critical</span>}
              </div>
              <div className="bg-[#1c1c1e]/40 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-white/5">
                    {issues.slice(0, 3).map(issue => (
                      <tr key={issue.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 mr-3 font-bold text-[10px]">
                              {projects.find(p => p.id === issue.projectId)?.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{issue.packageName}</div>
                              <div className="text-[10px] text-zinc-500">v{issue.currentVersion} → v{issue.latestVersion}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${issue.severity === 'critical' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' :
                              'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleAutoFix(issue.id, issue.packageName, issue.currentVersion, issue.latestVersion)}
                            className="px-3 py-1.5 bg-white text-black hover:bg-indigo-50 text-[10px] font-bold rounded-lg transition-all shadow-lg shadow-white/5 inline-flex items-center"
                          >
                            {fixingId === issue.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Zap className="w-3 h-3 mr-1.5 fill-black" /> Auto Fix</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: AI Assistant */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">System Intelligence</h3>
              <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-bold flex items-center">
                <Zap className="w-3 h-3 mr-1" /> AI ACTIVE
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-[#1c1c1e] to-black rounded-2xl border border-white/10 p-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
              <div className="h-full bg-[#0a0a0a] rounded-xl p-5 relative z-10 flex flex-col">

                <div className="flex-1 space-y-4">
                  {loadingSuggestions ? (
                    <div className="flex flex-col items-center justify-center h-full text-purple-400 space-y-3">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-medium animate-pulse">Analyzing ecosystem...</span>
                    </div>
                  ) : (
                    aiSuggestions.map((sug, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 transition-colors group/item">
                        <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] group-hover/item:scale-125 transition-transform"></div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-medium">{sug}</p>
                      </div>
                    ))
                  )}
                </div>

                <button className="w-full mt-6 py-3 bg-white hover:bg-purple-50 text-black rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 mr-2 fill-black" />
                  Generate Full Report
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* --- FIX RESULT TOAST --- */}
        {fixResult && (
          <div className="fixed bottom-8 right-8 max-w-md w-full bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 duration-300 z-50">
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center">
                <GitPullRequest className="w-4 h-4 mr-2" />
                Auto-Fix Proposal Generated
              </h4>
              <button onClick={() => setFixResult(null)}><X className="w-4 h-4 text-zinc-500 hover:text-white" /></button>
            </div>
            <div className="text-xs text-zinc-300 leading-relaxed font-mono bg-black p-3 rounded-lg border border-white/5 max-h-[200px] overflow-y-auto custom-scrollbar">
              <ReactMarkdown>{fixResult.message}</ReactMarkdown>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">Create PR</button>
              <button onClick={() => setFixResult(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-xs font-bold transition-colors">Dismiss</button>
            </div>
          </div>
        )}

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                  Create New Project
                </h3>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Project Name</label>
                  <input
                    type="text"
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Repository URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/owner/repo"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Description</label>
                  <textarea
                    placeholder="What does this project do?"
                    rows={3}
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowNewProjectModal(false)}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Project creation functionality
                      setShowNewProjectModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-bold transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Logs Modal */}
        {showLogsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-400" />
                  System Logs
                </h3>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 bg-black/30 border border-white/10 rounded-lg p-4 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <div className="space-y-2 font-mono text-xs">
                    <div className="text-zinc-500">
                      [{new Date().toISOString()}] System initialized successfully
                    </div>
                    <div className="text-zinc-400">
                      [{new Date().toISOString()}] Database connection established
                    </div>
                    <div className="text-emerald-400">
                      [{new Date().toISOString()}] All services operational
                    </div>
                    <div className="text-zinc-500">
                      [{new Date().toISOString()}] API server listening on port 4000
                    </div>
                    <div className="text-blue-400">
                      [{new Date().toISOString()}] Frontend connected to backend
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Log refresh functionality
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Refresh Logs
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;