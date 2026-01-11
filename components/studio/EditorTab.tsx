import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code, FileText, Folder, ChevronRight, ChevronDown, Plus, Save, Download, GitBranch, Play, Loader2 } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';
import { studioService } from '../../services/studioService';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    content?: string;
    language?: string;
    children?: FileNode[];
}

const EditorTab: React.FC = () => {
    const { currentProject } = useStudio();
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
    const [activeFile, setActiveFile] = useState<FileNode | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const buildFileTree = (flatTree: any[]): FileNode[] => {
        const root: FileNode[] = [];
        const map: Record<string, FileNode> = {};

        flatTree.forEach(item => {
            const parts = item.path.split('/');
            let currentPath = '';

            parts.forEach((part: string, index: number) => {
                const isLast = index === parts.length - 1;
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!map[currentPath]) {
                    const node: FileNode = {
                        name: part,
                        path: currentPath,
                        type: isLast && item.type === 'blob' ? 'file' : 'folder',
                        language: isLast && item.type === 'blob' ? getLanguageFromPath(part) : undefined,
                        children: isLast && item.type === 'blob' ? undefined : [],
                    };
                    map[currentPath] = node;

                    if (parentPath) {
                        map[parentPath].children?.push(node);
                    } else {
                        root.push(node);
                    }
                }
            });
        });

        return root;
    };

    const getLanguageFromPath = (fileName: string): string => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'ts':
            case 'tsx': return 'typescript';
            case 'js':
            case 'jsx': return 'javascript';
            case 'json': return 'json';
            case 'md': return 'markdown';
            case 'css': return 'css';
            case 'html': return 'html';
            case 'py': return 'python';
            case 'sql': return 'sql';
            case 'prisma': return 'prisma';
            default: return 'text';
        }
    };

    useEffect(() => {
        if (currentProject?.githubRepo) {
            const fetchFiles = async () => {
                setIsLoading(true);
                try {
                    const { owner, name, defaultBranch } = currentProject.githubRepo!;
                    const data = await studioService.getGithubFiles(owner, name, defaultBranch);
                    if (data && data.tree) {
                        const tree = buildFileTree(data.tree);
                        setFileTree(tree);

                        // Auto-expand first level
                        const initialExpanded = new Set<string>();
                        tree.forEach(node => {
                            if (node.type === 'folder') initialExpanded.add(node.path);
                        });
                        setExpandedFolders(initialExpanded);
                    }
                } catch (error) {
                    console.error('Failed to fetch GitHub files:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchFiles();
        } else {
            // Default mock data if no GitHub repo
            setFileTree([
                {
                    name: 'app',
                    path: 'app',
                    type: 'folder',
                    children: [
                        { name: 'page.tsx', path: 'app/page.tsx', type: 'file', language: 'typescript', content: `export default function Home() {\n  return (\n    <main className="flex min-h-screen flex-col items-center justify-center">\n      <h1 className="text-4xl font-bold">Welcome to Your App</h1>\n      <p className="mt-4 text-lg">Built with DevHub SaaS Factory</p>\n    </main>\n  );\n}\n` },
                        { name: 'layout.tsx', path: 'app/layout.tsx', type: 'file', language: 'typescript', content: `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n` },
                    ],
                },
                {
                    name: 'components',
                    path: 'components',
                    type: 'folder',
                    children: [
                        { name: 'Header.tsx', path: 'components/Header.tsx', type: 'file', language: 'typescript', content: `export function Header() {\n  return (\n    <header className="border-b">\n      <nav className="container mx-auto px-4 py-4">\n        <h1 className="text-xl font-bold">My App</h1>\n      </nav>\n    </header>\n  );\n}\n` },
                        { name: 'Button.tsx', path: 'components/Button.tsx', type: 'file', language: 'typescript', content: `interface ButtonProps {\n  children: React.ReactNode;\n  onClick?: () => void;\n}\n\nexport function Button({ children, onClick }: ButtonProps) {\n  return (\n    <button\n      onClick={onClick}\n      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"\n    >\n      {children}\n    </button>\n  );\n}\n` },
                    ],
                },
                {
                    name: 'lib',
                    path: 'lib',
                    type: 'folder',
                    children: [
                        { name: 'utils.ts', path: 'lib/utils.ts', type: 'file', language: 'typescript', content: `export function cn(...classes: string[]) {\n  return classes.filter(Boolean).join(' ');\n}\n\nexport function formatDate(date: Date) {\n  return new Intl.DateTimeFormat('en-US').format(date);\n}\n` },
                    ],
                },
                { name: 'package.json', path: 'package.json', type: 'file', language: 'json', content: `{\n  "name": "my-app",\n  "version": "0.1.0",\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "14.0.0",\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}\n` },
                { name: 'README.md', path: 'README.md', type: 'file', language: 'markdown', content: `# My App\n\nBuilt with DevHub SaaS Factory 🚀\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen [http://localhost:3000](http://localhost:3000)\n` },
            ]);
            setExpandedFolders(new Set(['app', 'components', 'lib']));
        }
    }, [currentProject?.id]);

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const openFile = async (file: FileNode) => {
        if (file.type === 'folder') {
            toggleFolder(file.path);
            return;
        }

        let fileToOpen = file;

        // If from GitHub and content not loaded, fetch it
        if (currentProject?.githubRepo && !file.content) {
            setIsLoading(true);
            try {
                const { owner, name, defaultBranch } = currentProject.githubRepo;
                const data = await studioService.getGithubContent(owner, name, file.path, defaultBranch);
                if (data && data.content) {
                    // Decode base64
                    const decodedContent = atob(data.content.replace(/\s/g, ''));
                    file.content = decodedContent;
                    fileToOpen = { ...file, content: decodedContent };
                }
            } catch (error) {
                console.error('Failed to fetch file content:', error);
            } finally {
                setIsLoading(false);
            }
        }

        if (!openFiles.find(f => f.path === fileToOpen.path)) {
            setOpenFiles([...openFiles, fileToOpen]);
        }
        setActiveFile(fileToOpen);
    };

    const closeFile = (file: FileNode, e: React.MouseEvent) => {
        e.stopPropagation();
        const newOpenFiles = openFiles.filter(f => f.path !== file.path);
        setOpenFiles(newOpenFiles);

        if (activeFile?.path === file.path) {
            setActiveFile(newOpenFiles[newOpenFiles.length - 1] || null);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (activeFile && value !== undefined) {
            setActiveFile({ ...activeFile, content: value });
            setHasUnsavedChanges(true);
        }
    };

    const renderFileTree = (nodes: FileNode[], level = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedFolders.has(node.path);
            const isActive = activeFile?.path === node.path;

            return (
                <div key={node.path}>
                    <div
                        onClick={() => openFile(node)}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors ${isActive
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'hover:bg-white/5 text-zinc-300'
                            }`}
                        style={{ paddingLeft: `${level * 12 + 8}px` }}
                    >
                        {node.type === 'folder' && (
                            isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                        )}
                        {node.type === 'folder' ? (
                            <Folder className="w-4 h-4 text-blue-400" />
                        ) : (
                            <FileText className="w-4 h-4 text-zinc-500" />
                        )}
                        <span className="font-mono">{node.name}</span>
                    </div>
                    {node.type === 'folder' && isExpanded && node.children && (
                        <div>
                            {renderFileTree(node.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    const getLanguageIcon = (language?: string) => {
        if (!language) return '📄';
        const icons: Record<string, string> = {
            typescript: '📘',
            javascript: '📜',
            json: '📋',
            markdown: '📝',
            css: '🎨',
            html: '🌐',
        };
        return icons[language] || '📄';
    };

    return (
        <div className="h-full flex gap-0 bg-zinc-950">
            {/* File Explorer */}
            <div className="w-64 bg-zinc-900/80 border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Folder className="w-4 h-4 text-blue-400" />
                        Explorer
                    </h3>
                    {isLoading && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                </div>
                {currentProject?.githubRepo && (
                    <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center gap-2">
                        <GitBranch className="w-3 h-3 text-zinc-500" />
                        <span className="text-[10px] text-zinc-400 font-mono truncate">
                            {currentProject.githubRepo.owner}/{currentProject.githubRepo.name}
                        </span>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading && fileTree.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs">Fetching GitHub repo...</span>
                        </div>
                    ) : (
                        renderFileTree(fileTree)
                    )}
                </div>
                <div className="p-3 border-t border-white/10">
                    <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-3 h-3" />
                        New File
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
                {/* Tab Bar */}
                {openFiles.length > 0 && (
                    <div className="flex items-center gap-1 bg-zinc-900/50 border-b border-white/10 px-2 py-1 overflow-x-auto">
                        {openFiles.map((file) => (
                            <div
                                key={file.path}
                                onClick={() => setActiveFile(file)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer group transition-colors min-w-fit ${activeFile?.path === file.path
                                    ? 'bg-zinc-950 text-white'
                                    : 'bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                                    }`}
                            >
                                <span className="text-xs">{getLanguageIcon(file.language)}</span>
                                <span className="text-xs font-mono">{file.name}</span>
                                <button
                                    onClick={(e) => closeFile(file, e)}
                                    className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity"
                                >
                                    <span className="text-xs">×</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Editor */}
                <div className="flex-1 relative">
                    {isLoading && !activeFile?.content && (
                        <div className="absolute inset-0 z-10 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <p className="text-sm text-zinc-400">Loading file content...</p>
                            </div>
                        </div>
                    )}
                    {activeFile ? (
                        <Editor
                            key={activeFile.path}
                            height="100%"
                            language={activeFile.language || 'typescript'}
                            value={activeFile.content || ''}
                            onChange={handleEditorChange}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                padding: { top: 16, bottom: 16 },
                                scrollBeyondLastLine: false,
                                renderWhitespace: 'selection',
                                tabSize: 2,
                                automaticLayout: true,
                            }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-center">
                            <div>
                                <Code className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500">Select a file to start editing</p>
                                <p className="text-sm text-zinc-600 mt-2">or create a new one</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="bg-zinc-900 border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 text-zinc-400">
                        <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {activeFile?.name || 'No file open'}
                        </span>
                        {activeFile && (
                            <>
                                <span>•</span>
                                <span className="uppercase">{activeFile.language || 'text'}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-amber-400">● Unsaved changes</span>
                        )}
                        <button className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded transition-colors flex items-center gap-1">
                            <Save className="w-3 h-3" />
                            Save
                        </button>
                        <button className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded transition-colors flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            Export
                        </button>
                        <button className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Run
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditorTab;
