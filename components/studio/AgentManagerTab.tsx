import React, { useState } from 'react';
import { Bot, Plus, Play, Pause, Settings, Trash2, Activity, Zap, Code, Shield, BarChart3, MessageSquare, GitBranch, Check, X } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';

interface Agent {
    id: string;
    name: string;
    type: 'code-assistant' | 'qa' | 'devops' | 'support' | 'analytics' | 'security';
    status: 'active' | 'paused' | 'idle';
    project?: string;
    tasksCompleted: number;
    uptime: string;
    cost: number;
}

interface AgentTemplate {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    capabilities: string[];
}

const agentTemplates: AgentTemplate[] = [
    {
        id: 'code-assistant',
        name: 'Code Assistant',
        description: 'Reviews code, suggests improvements, and enforces best practices',
        icon: Code,
        color: 'from-blue-600 to-cyan-600',
        capabilities: ['Code Review', 'Refactoring Suggestions', 'Bug Detection', 'Documentation'],
    },
    {
        id: 'qa',
        name: 'QA Agent',
        description: 'Writes and runs automated tests',
        icon: Shield,
        color: 'from-emerald-600 to-teal-600',
        capabilities: ['Unit Tests', 'Integration Tests', 'E2E Tests', 'Coverage Reports'],
    },
    {
        id: 'devops',
        name: 'DevOps Agent',
        description: 'Manages deployments and infrastructure',
        icon: GitBranch,
        color: 'from-purple-600 to-pink-600',
        capabilities: ['CI/CD', 'Monitoring', 'Scaling', 'Rollbacks'],
    },
    {
        id: 'support',
        name: 'Support Agent',
        description: 'Handles customer support and FAQs',
        icon: MessageSquare,
        color: 'from-orange-600 to-red-600',
        capabilities: ['24/7 Support', 'FAQs', 'Ticket Management', 'Escalation'],
    },
    {
        id: 'analytics',
        name: 'Analytics Agent',
        description: 'Analyzes data and generates insights',
        icon: BarChart3,
        color: 'from-pink-600 to-rose-600',
        capabilities: ['Data Analysis', 'Reports', 'Predictions', 'Dashboards'],
    },
    {
        id: 'security',
        name: 'Security Agent',
        description: 'Scans for vulnerabilities and security issues',
        icon: Shield,
        color: 'from-red-600 to-orange-600',
        capabilities: ['Vulnerability Scanning', 'Penetration Testing', 'Compliance', 'Alerts'],
    },
];

const AgentManagerTab: React.FC = () => {
    const { currentProject } = useStudio();
    const [agents, setAgents] = useState<Agent[]>([
        {
            id: '1',
            name: 'CodeReview Bot',
            type: 'code-assistant',
            status: 'active',
            project: currentProject?.name || 'SaaS Starter',
            tasksCompleted: 127,
            uptime: '7 days',
            cost: 12.50,
        },
        {
            id: '2',
            name: 'Test Runner',
            type: 'qa',
            status: 'active',
            project: currentProject?.name || 'SaaS Starter',
            tasksCompleted: 89,
            uptime: '5 days',
            cost: 8.30,
        },
    ]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
    const [newAgentName, setNewAgentName] = useState('');

    const createAgent = () => {
        if (!selectedTemplate || !newAgentName) return;

        const newAgent: Agent = {
            id: Date.now().toString(),
            name: newAgentName,
            type: selectedTemplate.id as any,
            status: 'idle',
            tasksCompleted: 0,
            uptime: 'Just created',
            cost: 0,
        };

        setAgents([...agents, newAgent]);
        setShowCreateModal(false);
        setSelectedTemplate(null);
        setNewAgentName('');
    };

    const toggleAgentStatus = (id: string) => {
        setAgents(agents.map(agent =>
            agent.id === id
                ? { ...agent, status: agent.status === 'active' ? 'paused' : 'active' }
                : agent
        ));
    };

    const deleteAgent = (id: string) => {
        setAgents(agents.filter(agent => agent.id !== id));
    };

    const getAgentIcon = (type: Agent['type']) => {
        const template = agentTemplates.find(t => t.id === type);
        return template?.icon || Bot;
    };

    const getStatusColor = (status: Agent['status']) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'idle': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
        }
    };

    const totalCost = agents.reduce((sum, agent) => sum + agent.cost, 0);
    const activeAgents = agents.filter(a => a.status === 'active').length;

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Bot className="w-5 h-5 text-blue-400" />
                        <span className="text-2xl font-bold text-white">{agents.length}</span>
                    </div>
                    <p className="text-xs text-zinc-400">Total Agents</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <span className="text-2xl font-bold text-white">{activeAgents}</span>
                    </div>
                    <p className="text-xs text-zinc-400">Active</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <span className="text-2xl font-bold text-white">
                            {agents.reduce((sum, a) => sum + a.tasksCompleted, 0)}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-400">Tasks Completed</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <BarChart3 className="w-5 h-5 text-pink-400" />
                        <span className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-zinc-400">Total Cost</p>
                </div>
            </div>

            {/* Agents List */}
            <div className="flex-1 bg-zinc-900/30 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Your AI Agents</h3>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Agent
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {agents.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center py-20">
                            <div>
                                <Bot className="w-16 h-16 text-zinc-500 mx-auto mb-4 opacity-20" />
                                <p className="text-zinc-500 mb-4">No agents yet</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
                                >
                                    Create Your First Agent
                                </button>
                            </div>
                        </div>
                    ) : (
                        agents.map((agent) => {
                            const Icon = getAgentIcon(agent.type);
                            return (
                                <div
                                    key={agent.id}
                                    className="bg-zinc-800/50 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white">{agent.name}</h4>
                                                <p className="text-xs text-zinc-400 capitalize">{agent.type.replace('-', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                                                {agent.status}
                                            </span>
                                            <button
                                                onClick={() => toggleAgentStatus(agent.id)}
                                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => deleteAgent(agent.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <p className="text-zinc-500 mb-1">Tasks</p>
                                            <p className="text-white font-medium">{agent.tasksCompleted}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">Uptime</p>
                                            <p className="text-white font-medium">{agent.uptime}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">Cost</p>
                                            <p className="text-white font-medium">${agent.cost.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {agent.project && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-zinc-500">
                                                Assigned to: <span className="text-white font-medium">{agent.project}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Create Agent Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-auto">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1c1c1e] z-10">
                            <h3 className="text-xl font-bold text-white">Create New Agent</h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setSelectedTemplate(null);
                                    setNewAgentName('');
                                }}
                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!selectedTemplate ? (
                            <div className="p-6">
                                <p className="text-zinc-400 mb-6">Choose an agent template to get started</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {agentTemplates.map((template) => {
                                        const Icon = template.icon;
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => setSelectedTemplate(template)}
                                                className="bg-zinc-900/50 border border-white/10 hover:border-purple-500/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-105 text-left group"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-10 h-10 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center`}>
                                                        <Icon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white">{template.name}</h4>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-zinc-400 mb-3">{template.description}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {template.capabilities.map((cap, idx) => (
                                                        <span key={idx} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-zinc-300">
                                                            {cap}
                                                        </span>
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${selectedTemplate.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        <selectedTemplate.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{selectedTemplate.name}</h4>
                                        <p className="text-sm text-zinc-400">{selectedTemplate.description}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Agent Name</label>
                                    <input
                                        type="text"
                                        value={newAgentName}
                                        onChange={(e) => setNewAgentName(e.target.value)}
                                        placeholder="e.g., My Code Reviewer"
                                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setSelectedTemplate(null)}
                                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={createAgent}
                                        disabled={!newAgentName}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-purple-800 disabled:to-pink-800 text-white rounded-lg font-medium transition-all"
                                    >
                                        Create Agent
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentManagerTab;
