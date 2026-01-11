import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Download, GitBranch, Copy, Check, Loader2, FileText, Folder, ChevronRight, Database, Code } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';
import { studioService } from '../../services/studioService';

interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    features: string[];
    stack: string[];
    color: string;
}

const templates: Template[] = [
    {
        id: 'saas-starter',
        name: 'SaaS Starter',
        description: 'Complete SaaS template with auth, payments, and dashboard',
        icon: '🚀',
        features: ['Next.js 14', 'Stripe Payments', 'Supabase Auth', 'Tailwind UI', 'Admin Dashboard'],
        stack: ['Next.js', 'TypeScript', 'Prisma', 'Stripe', 'Vercel'],
        color: 'from-blue-600 to-cyan-600',
    },
    {
        id: 'ai-wrapper',
        name: 'AI API Wrapper',
        description: 'Monetize AI models with credits and rate limiting',
        icon: '🤖',
        features: ['OpenAI Integration', 'Credit System', 'Usage Dashboard', 'API Keys', 'Rate Limiting'],
        stack: ['Next.js', 'TypeScript', 'Redis', 'PostgreSQL'],
        color: 'from-purple-600 to-pink-600',
    },
    {
        id: 'dashboard-saas',
        name: 'Analytics Dashboard',
        description: 'Multi-tenant analytics platform with real-time charts',
        icon: '📊',
        features: ['Multi-Tenant DB', 'Real-time Charts', 'Export CSV/PDF', 'Team Management', 'Webhooks'],
        stack: ['React', 'TypeScript', 'Chart.js', 'Node.js'],
        color: 'from-emerald-600 to-teal-600',
    },
    {
        id: 'marketplace',
        name: 'Marketplace',
        description: 'Two-sided marketplace with payments and reviews',
        icon: '🛍️',
        features: ['Buyer/Seller Auth', 'Escrow Payments', 'Reviews & Ratings', 'Search & Filters', 'Messaging'],
        stack: ['Next.js', 'Stripe Connect', 'PostgreSQL', 'Redis'],
        color: 'from-orange-600 to-red-600',
    },
];

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    content?: string;
}

const GeneratorTab: React.FC = () => {
    const { currentProject } = useStudio();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Generating your project...');
    const [copied, setCopied] = useState(false);
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [architecture, setArchitecture] = useState<any>(null);

    useEffect(() => {
        if (currentProject?.id) {
            studioService.getArchitecture(currentProject.id).then(setArchitecture);
        }
    }, [currentProject?.id]);

    const generateCode = async () => {
        if (!selectedTemplate) return;

        setGenerating(true);
        setGenerated(false);

        const steps = [
            'Analyzing design tokens...',
            architecture ? `Processing schema: ${architecture.tables?.length || 0} tables found...` : 'Initializing default schema...',
            'Injecting authentication layer...',
            'Generating UI components...',
            'Finalizing project scaffolding...'
        ];

        for (const step of steps) {
            setStatusMessage(step);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Mock file tree based on template
        const mockTree: FileNode[] = [
            {
                name: 'app',
                type: 'folder',
                children: [
                    { name: 'page.tsx', type: 'file', content: '// Main page component' },
                    { name: 'layout.tsx', type: 'file', content: '// Root layout' },
                    {
                        name: 'api',
                        type: 'folder',
                        children: [
                            { name: 'auth', type: 'folder' },
                            { name: 'users', type: 'folder' },
                        ],
                    },
                ],
            },
            {
                name: 'components',
                type: 'folder',
                children: [
                    { name: 'Header.tsx', type: 'file' },
                    { name: 'Sidebar.tsx', type: 'file' },
                    { name: 'Dashboard.tsx', type: 'file' },
                ],
            },
            {
                name: 'lib',
                type: 'folder',
                children: [
                    { name: 'db.ts', type: 'file' },
                    { name: 'auth.ts', type: 'file' },
                ],
            },
            { name: 'package.json', type: 'file' },
            { name: 'tsconfig.json', type: 'file' },
            { name: '.env.example', type: 'file' },
            { name: 'README.md', type: 'file' },
        ];

        setFileTree(mockTree);
        setGenerating(false);
        setGenerated(true);
    };

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const renderFileTree = (nodes: FileNode[], path = '') => {
        return nodes.map((node) => {
            const fullPath = path ? `${path}/${node.name}` : node.name;
            const isExpanded = expandedFolders.has(fullPath);

            return (
                <div key={fullPath}>
                    <div
                        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 cursor-pointer text-sm ${node.type === 'folder' ? 'text-blue-400' : 'text-zinc-300'
                            }`}
                        onClick={() => node.type === 'folder' && toggleFolder(fullPath)}
                    >
                        {node.type === 'folder' && (
                            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                        {node.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4 text-zinc-500" />}
                        <span className="font-mono">{node.name}</span>
                    </div>
                    {node.type === 'folder' && isExpanded && node.children && (
                        <div className="ml-4 border-l border-white/5 pl-2">
                            {renderFileTree(node.children, fullPath)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const copyToClipboard = () => {
        // In real implementation, would copy generated code
        navigator.clipboard.writeText('Generated code would be copied here');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex gap-6">
            {!selectedTemplate ? (
                // Template Selection
                <div className="flex-1 space-y-6">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-4 bg-purple-500/10 rounded-2xl mb-4">
                            <Sparkles className="w-12 h-12 text-purple-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Template</h2>
                        <p className="text-zinc-400">Start with a pre-built template or generate from scratch</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template)}
                                className="bg-zinc-900/50 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:scale-105 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-4xl">{template.icon}</div>
                                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${template.color} text-white text-xs font-bold`}>
                                        Popular
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                                <p className="text-sm text-zinc-400 mb-4">{template.description}</p>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Features</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {template.features.map((feature, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-zinc-300">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Stack</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {template.stack.map((tech, idx) => (
                                                <span key={idx} className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all group-hover:shadow-lg group-hover:shadow-purple-500/20">
                                        Select Template
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Generation View
                <div className="flex-1 flex gap-6">
                    {/* Left Panel - Controls */}
                    <div className="w-96 space-y-4">
                        <button
                            onClick={() => {
                                setSelectedTemplate(null);
                                setGenerated(false);
                                setFileTree([]);
                            }}
                            className="text-sm text-zinc-400 hover:text-white flex items-center gap-2"
                        >
                            ← Back to Templates
                        </button>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                            <div className="text-4xl mb-4">{selectedTemplate.icon}</div>
                            <h3 className="text-2xl font-bold text-white mb-2">{selectedTemplate.name}</h3>
                            <p className="text-sm text-zinc-400 mb-4">{selectedTemplate.description}</p>

                            {architecture && (
                                <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                                    <Database className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Architecture Found</div>
                                        <div className="text-xs text-zinc-300">{architecture.tables?.length || 0} tables mapped to template</div>
                                    </div>
                                </div>
                            )}

                            {!generated ? (
                                <button
                                    onClick={generateCode}
                                    disabled={generating}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-purple-800 disabled:to-pink-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            Generate Code
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-5 h-5 text-emerald-400" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5" />
                                                Copy Code
                                            </>
                                        )}
                                    </button>
                                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                                        <Download className="w-5 h-5" />
                                        Download ZIP
                                    </button>
                                    <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                                        <GitBranch className="w-5 h-5" />
                                        Push to GitHub
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
                            <h4 className="text-sm font-bold text-white mb-3">What's Included</h4>
                            <div className="space-y-2 text-xs text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Complete file structure</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Environment setup</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Database schema</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>API routes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>UI components</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="flex-1 bg-zinc-900/30 border border-white/10 rounded-2xl p-6">
                        {generating ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                                    <p className="text-white font-medium">{statusMessage}</p>
                                    <div className="mt-4 flex justify-center gap-1">
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= Math.floor(Date.now() / 1000) % 5 ? 'bg-purple-500' : 'bg-white/10'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : generated ? (
                            <div className="h-full flex flex-col">
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Folder className="w-5 h-5 text-blue-400" />
                                    Project Structure
                                </h4>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    {renderFileTree(fileTree)}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center">
                                <div>
                                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-20" />
                                    <p className="text-zinc-500">Click "Generate Code" to start</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeneratorTab;
