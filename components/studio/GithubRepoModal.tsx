import React, { useState, useEffect } from 'react';
import { X, Search, GitBranch, Lock, Globe, RefreshCcw, Check } from 'lucide-react';
import { studioService } from '../../services/studioService';
import { useStudio } from '../../contexts/StudioContext';

interface GithubRepoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GithubRepoModal: React.FC<GithubRepoModalProps> = ({ isOpen, onClose }) => {
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { importGithubRepo } = useStudio();

    const fetchRepos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await studioService.getGithubRepos();
            setRepos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRepos();
        }
    }, [isOpen]);

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.owner.login.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleImport = async (repo: any) => {
        try {
            await importGithubRepo(repo);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import repository');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[#333] flex items-center justify-between bg-[#1a1a1a]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <RefreshCcw className="w-5 h-5 text-blue-400" />
                            Connect GitHub Repository
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Select a repository to import into your SaaS Factory</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#333] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-[#111] border-b border-[#333]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search repositories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 pointer-events-none">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-400 animate-pulse">Fetching your repositories...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center px-10">
                            <div className="bg-red-500/10 p-4 rounded-full mb-4">
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">Failed to load</h3>
                            <p className="text-gray-400 mb-6">{error}</p>
                            <button
                                onClick={fetchRepos}
                                className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded-xl transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : filteredRepos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <Search className="w-12 h-12 text-gray-600 mb-4" />
                            <p className="text-gray-400">No repositories found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="grid gap-1">
                            {filteredRepos.map((repo) => (
                                <button
                                    key={repo.id}
                                    onClick={() => handleImport(repo)}
                                    className="group flex items-center justify-between p-4 rounded-xl hover:bg-blue-500/5 border border-transparent hover:border-blue-500/20 transition-all text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#333] group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                                            {repo.private ? (
                                                <Lock className="w-5 h-5 text-amber-400" />
                                            ) : (
                                                <Globe className="w-5 h-5 text-emerald-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider text-xs">
                                                    {repo.owner.login}
                                                </span>
                                                <span className="text-gray-600">/</span>
                                                <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {repo.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <GitBranch className="w-3 h-3" />
                                                    {repo.default_branch}
                                                </span>
                                                {repo.description && (
                                                    <span className="truncate max-w-[300px]">{repo.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-blue-500 text-white p-2 rounded-lg">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#111] border-t border-[#333] flex items-center justify-between">
                    <p className="text-xs text-gray-500 italic">Showing up to 100 recent repositories</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
