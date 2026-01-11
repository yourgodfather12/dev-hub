import React, { useState } from 'react';
import { Factory, Layers, Sparkles, Code, Rocket, BarChart3, ArrowLeft, Settings, Bot, Brain } from 'lucide-react';
import { Project } from '../types';
import { StudioProvider, useStudio } from '../contexts/StudioContext';
import ArchitectureTab from './studio/ArchitectureTab';
import GeneratorTab from './studio/GeneratorTab';
import AgentManagerTab from './studio/AgentManagerTab';
import MLTrainingTab from './studio/MLTrainingTab';
import EditorTab from './studio/EditorTab';
import DeployTab from './studio/DeployTab';
import MonitorTab from './studio/MonitorTab';
import { GithubRepoModal } from './studio/GithubRepoModal';
import { Github } from 'lucide-react';

type StudioTab = 'architecture' | 'generator' | 'agents' | 'ml-training' | 'editor' | 'deploy' | 'monitor';

interface ProjectStudioProps {
    onBack?: () => void;
}

const ProjectStudioInner: React.FC<ProjectStudioProps> = ({ onBack }) => {
    const { currentProject, projects, setCurrentProject, createProject, deleteProject } = useStudio();
    const [activeTab, setActiveTab] = useState<StudioTab>('architecture');
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [showGithubModal, setShowGithubModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const tabs = [
        { id: 'architecture' as const, label: 'Architecture', icon: Layers, color: 'text-blue-400' },
        { id: 'generator' as const, label: 'Generator', icon: Sparkles, color: 'text-purple-400' },
        { id: 'agents' as const, label: 'AI Agents', icon: Bot, color: 'text-pink-400' },
        { id: 'ml-training' as const, label: 'ML Training', icon: Brain, color: 'text-cyan-400' },
        { id: 'editor' as const, label: 'Editor', icon: Code, color: 'text-emerald-400' },
        { id: 'deploy' as const, label: 'Deploy', icon: Rocket, color: 'text-orange-400' },
        { id: 'monitor' as const, label: 'Monitor', icon: BarChart3, color: 'text-amber-400' },
    ];

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        await createProject(newProjectName);
        setNewProjectName('');
        setShowNewProjectModal(false);
    };

    return (
        <div className="h-full flex flex-col bg-black overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-black border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg shadow-pink-500/20">
                                <Factory className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">SaaS Factory</h1>
                                <p className="text-sm text-zinc-400">
                                    {currentProject ? currentProject.name : 'No project selected'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-zinc-900/50 border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            New Project
                        </button>
                        <button
                            onClick={() => setShowGithubModal(true)}
                            className="w-full mt-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            <Github className="w-4 h-4" />
                            Connect GitHub
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                            Projects ({projects.length})
                        </div>

                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => setCurrentProject(project)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${currentProject?.id === project.id
                                    ? 'bg-pink-500/20 border-pink-500/50'
                                    : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/20'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-sm font-medium text-white truncate">{project.name}</span>
                                </div>
                                {project.description && (
                                    <p className="text-xs text-zinc-400 truncate">{project.description}</p>
                                )}
                            </div>
                        ))}

                        {projects.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-sm text-zinc-500">No projects yet</p>
                                <p className="text-xs text-zinc-600 mt-1">Create one to get started</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-zinc-900/80">
                        <div className="text-xs text-zinc-500 space-y-1">
                            <div className="flex justify-between">
                                <span>Projects:</span>
                                <span className="text-white font-medium">{projects.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Active:</span>
                                <span className="text-emerald-400 font-medium">{currentProject ? 1 : 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="bg-zinc-900/30 border-b border-white/10 px-6 py-3 flex items-center gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${isActive
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-black' : tab.color}`} />
                                    <span className="text-sm">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
                        {activeTab === 'architecture' && (
                            <div className="p-8 h-full">
                                <ArchitectureTab />
                            </div>
                        )}

                        {activeTab === 'generator' && (
                            <div className="p-8 h-full">
                                <GeneratorTab />
                            </div>
                        )}

                        {activeTab === 'agents' && (
                            <div className="p-8 h-full">
                                <AgentManagerTab />
                            </div>
                        )}

                        {activeTab === 'ml-training' && (
                            <div className="p-8 h-full">
                                <MLTrainingTab />
                            </div>
                        )}

                        {activeTab === 'editor' && (
                            <div className="h-full">
                                <EditorTab />
                            </div>
                        )}
                        {activeTab === 'deploy' && <DeployTab />}

                        {activeTab === 'monitor' && <MonitorTab />}
                    </div>
                </div>
            </div>

            {/* New Project Modal */}
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-white mb-4">Create New Project</h3>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                            placeholder="Project name (e.g., My SaaS App)"
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-pink-400 mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowNewProjectModal(false);
                                    setNewProjectName('');
                                }}
                                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProject}
                                disabled={!newProjectName.trim()}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-pink-800 disabled:to-purple-800 text-white rounded-lg font-medium transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <GithubRepoModal
                isOpen={showGithubModal}
                onClose={() => setShowGithubModal(false)}
            />
        </div>
    );
};

const ProjectStudio: React.FC<ProjectStudioProps> = (props) => {
    return (
        <StudioProvider>
            <ProjectStudioInner {...props} />
        </StudioProvider>
    );
};

export default ProjectStudio;
