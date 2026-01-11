import React, { useState } from 'react';
import { Rocket, Globe, Server, Shield, CheckCircle2, Clock, Play, ExternalLink, GitBranch, Terminal, Loader2 } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';

interface Deployment {
    id: string;
    environment: 'production' | 'staging';
    status: 'success' | 'failed' | 'in-progress';
    version: string;
    deployedAt: Date;
    url?: string;
}

const DeployTab: React.FC = () => {
    const { currentProject } = useStudio();
    const [deployments] = useState<Deployment[]>([
        { id: 'dep1', environment: 'production', status: 'success', version: 'v1.0.2', deployedAt: new Date(Date.now() - 3600000 * 24), url: `https://${currentProject?.name?.toLowerCase().replace(/\s+/g, '-') || 'my-saas'}.vercel.app` },
        { id: 'dep2', environment: 'staging', status: 'success', version: 'v1.1.0-beta.1', deployedAt: new Date(Date.now() - 3600000 * 2), url: `https://staging-${currentProject?.name?.toLowerCase().replace(/\s+/g, '-') || 'my-saas'}.vercel.app` },
    ]);

    const [isDeploying, setIsDeploying] = useState(false);
    const [deployStep, setDeployStep] = useState(0);

    const steps = [
        'Preparing build artifacts...',
        'Compiling frontend assets...',
        'Provisioning serverless functions...',
        'Setting up database connections...',
        'Deploying to Vercel edge network...',
        'Verifying production health check...'
    ];

    const startDeployment = () => {
        setIsDeploying(true);
        setDeployStep(0);
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step >= steps.length) {
                clearInterval(interval);
                setIsDeploying(false);
            } else {
                setDeployStep(step);
            }
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950 p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Rocket className="w-7 h-7 text-orange-500" />
                            Deployment Studio
                        </h2>
                        <p className="text-zinc-400 mt-1">Ship your application to production in seconds</p>
                    </div>
                    {!isDeploying && (
                        <button
                            onClick={startDeployment}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 group"
                        >
                            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Deploy to Production
                        </button>
                    )}
                </div>

                {isDeploying && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                <div>
                                    <h3 className="text-lg font-bold text-white">Deploying version v1.2.0...</h3>
                                    <p className="text-orange-400 text-sm">{steps[deployStep]}</p>
                                </div>
                            </div>
                            <span className="text-2xl font-black text-orange-500">
                                {Math.round(((deployStep + 1) / steps.length) * 100)}%
                            </span>
                        </div>
                        <div className="h-2 bg-orange-500/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-orange-500 transition-all duration-1000"
                                style={{ width: `${((deployStep + 1) / steps.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Environments */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Globe className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded uppercase">Active</span>
                                </div>
                                <h3 className="text-white font-bold">Production</h3>
                                <p className="text-zinc-500 text-xs mt-1 truncate">my-awesome-saas.vercel.app</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">v1.0.2</span>
                                    <button className="text-orange-500 hover:text-orange-400 text-xs font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        View Site <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Server className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded uppercase">Staging</span>
                                </div>
                                <h3 className="text-white font-bold">Staging</h3>
                                <p className="text-zinc-500 text-xs mt-1 truncate">staging-my-awesome-saas.vercel.app</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">v1.1.0-beta</span>
                                    <button className="text-orange-500 hover:text-orange-400 text-xs font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        View Site <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Deployment History */}
                        <div className="bg-zinc-900/30 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 bg-white/5">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    Deployment History
                                </h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {deployments.map((dep) => (
                                    <div key={dep.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${dep.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-white">{dep.version}</span>
                                                    <span className="text-[10px] bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-bold">{dep.environment}</span>
                                                </div>
                                                <span className="text-xs text-zinc-500">{dep.deployedAt.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 transition-colors">
                                            <Terminal className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Infrastructure Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                Security Settings
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">SSL Certificate</span>
                                    <span className="text-emerald-500 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">DDoS Protection</span>
                                    <span className="text-emerald-500 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-400">WAF Status</span>
                                    <span className="text-emerald-500 flex items-center gap-1 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                                    </span>
                                </div>
                            </div>
                            <button className="w-full mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors border border-white/10">
                                Configure Firewall
                            </button>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-purple-500" />
                                Git Integration
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-zinc-500">Repository</span>
                                    <span className="text-xs text-white font-mono bg-white/5 px-2 py-1 rounded">main</span>
                                </div>
                                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                                    <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                                        "Last commit: feat: auto-indexing for database and optimized image proxy"
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Push to main to trigger auto-deploy
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeployTab;
