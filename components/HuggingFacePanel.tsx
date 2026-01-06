import React, { useState, useEffect } from 'react';
import { Brain, Download, Upload, Search, Filter, Star, Users, Clock, TrendingUp, Zap, Play, Pause, Settings, Code, FileText, Image, BarChart, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
import { HuggingFaceHubService, HFModel, HFDataset, HFSpace } from '../services/huggingFaceHubService';

const HuggingFacePanel: React.FC = () => {
  const [models, setModels] = useState<HFModel[]>([]);
  const [datasets, setDatasets] = useState<HFDataset[]>([]);
  const [spaces, setSpaces] = useState<HFSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'datasets' | 'spaces'>('models');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState('all');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Check if API key is stored
    const storedKey = localStorage.getItem('hf_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      HuggingFaceHubService.initialize(storedKey);
      loadHuggingFaceData();
    } else {
      // Load public data without authentication
      loadPublicData();
    }
  }, []);

  const loadHuggingFaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [modelsData, datasetsData, spacesData, userInfoData] = await Promise.all([
        HuggingFaceHubService.searchModels({ limit: 20 }),
        HuggingFaceHubService.searchDatasets({ limit: 20 }),
        HuggingFaceHubService.searchSpaces({ limit: 20 }),
        HuggingFaceHubService.getWhoAmI().catch(() => null)
      ]);

      setModels(modelsData);
      setDatasets(datasetsData);
      setSpaces(spacesData);
      setUserInfo(userInfoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Hugging Face data');
    } finally {
      setLoading(false);
    }
  };

  const loadPublicData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [modelsData, datasetsData, spacesData] = await Promise.all([
        HuggingFaceHubService.searchModels({ limit: 20 }),
        HuggingFaceHubService.searchDatasets({ limit: 20 }),
        HuggingFaceHubService.searchSpaces({ limit: 20 })
      ]);

      setModels(modelsData);
      setDatasets(datasetsData);
      setSpaces(spacesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Hugging Face data');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    try {
      localStorage.setItem('hf_api_key', apiKey);
      HuggingFaceHubService.initialize(apiKey);
      setShowApiKeyModal(false);
      await loadHuggingFaceData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid API key');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hf_api_key');
    setApiKey('');
    setUserInfo(null);
    loadPublicData();
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams: any = { limit: 20 };
      if (searchQuery) searchParams.search = searchQuery;
      if (selectedTask !== 'all') searchParams.task = selectedTask;

      if (activeTab === 'models') {
        const modelsData = await HuggingFaceHubService.searchModels(searchParams);
        setModels(modelsData);
      } else if (activeTab === 'datasets') {
        const datasetsData = await HuggingFaceHubService.searchDatasets(searchParams);
        setDatasets(datasetsData);
      } else if (activeTab === 'spaces') {
        const spacesData = await HuggingFaceHubService.searchSpaces(searchParams);
        setSpaces(spacesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeModel = async (modelId: string) => {
    if (!apiKey) {
      setError('API key required to like models');
      return;
    }

    try {
      await HuggingFaceHubService.likeModel(modelId);
      // Refresh models to update like count
      const modelsData = await HuggingFaceHubService.searchModels({ limit: 20 });
      setModels(modelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like model');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTaskIcon = (task: string) => {
    switch (task) {
      case 'text-generation': return <FileText className="w-4 h-4" />;
      case 'text-to-image': return <Image className="w-4 h-4" />;
      case 'image-classification': return <Image className="w-4 h-4" />;
      case 'fill-mask': return <Code className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'building': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'stopped': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  if (loading && !apiKey && models.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Zap className="w-8 h-8 animate-pulse text-orange-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1800px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-orange-400" />
            Hugging Face Hub
          </h1>
          <p className="text-zinc-400">Browse models, manage datasets, and deploy inference endpoints</p>
          {userInfo && (
            <p className="text-zinc-500 text-sm mt-1">
              Logged in as {userInfo.name || userInfo.id}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => activeTab === 'models' ? loadHuggingFaceData() : loadPublicData()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          {apiKey ? (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          ) : (
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Connect API
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Brain className="w-8 h-8 text-orange-400" />
            <span className="text-2xl font-bold text-white">{models.length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Models Found</p>
        </div>
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{datasets.length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Datasets Found</p>
        </div>
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">{spaces.filter(s => s.status === 'running').length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Active Spaces</p>
        </div>
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(models.reduce((sum, m) => sum + m.downloads, 0))}</span>
          </div>
          <p className="text-zinc-400 text-sm">Total Downloads</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search models, datasets, spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 bg-[#1c1c1e] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20"
          />
        </div>
        <select
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          className="px-4 py-3 bg-[#1c1c1e] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20"
        >
          <option value="all">All Tasks</option>
          <option value="text-generation">Text Generation</option>
          <option value="text-to-image">Text to Image</option>
          <option value="fill-mask">Fill Mask</option>
          <option value="image-classification">Image Classification</option>
        </select>
        <button 
          onClick={handleSearch}
          className="px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors"
        >
          Search
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'models' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Models
        </button>
        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'datasets' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Datasets
        </button>
        <button
          onClick={() => setActiveTab('spaces')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'spaces' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Spaces
        </button>
      </div>

      {/* Content */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(model => (
            <div key={model.id} className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getTaskIcon(model.pipeline_tag)}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{model.modelId}</h3>
                    <p className="text-zinc-400 text-sm">by {model.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleLikeModel(model.id)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-yellow-400 transition-colors"
                  >
                    <Star className="w-4 h-4" />
                    <span className="text-sm">{formatNumber(model.likes)}</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {model.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">{formatNumber(model.downloads)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">{formatDate(model.lastModified)}</span>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'datasets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {datasets.map(dataset => (
            <div key={dataset.id} className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{dataset.id}</h3>
                  <p className="text-zinc-400 text-sm">by {dataset.author}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-zinc-400">{formatNumber(dataset.likes)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {dataset.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">{formatNumber(dataset.downloads)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">{formatDate(dataset.lastModified)}</span>
                  </div>
                </div>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                  Use Dataset
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'spaces' && (
        <div className="space-y-4">
          {spaces.map(space => (
            <div key={space.id} className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    space.status === 'running' ? 'bg-emerald-400' : 
                    space.status === 'building' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{space.id}</h3>
                    <p className="text-zinc-400 text-sm">{space.author} • {space.runtime?.hardwareCurrent || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(space.status)}`}>
                    {space.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-zinc-400">{formatNumber(space.likes)}</span>
                  </div>
                  <div className="flex gap-1">
                    {space.status === 'running' ? (
                      <button className="p-2 rounded-lg hover:bg-white/10 text-amber-400 transition-colors">
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="p-2 rounded-lg hover:bg-white/10 text-emerald-400 transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Connect Hugging Face API</h3>
            <form onSubmit={handleApiKeySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  API Key (hf_...)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="hf_..."
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-400"
                  required
                />
              </div>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
                >
                  Connect
                </button>
              </div>
            </form>
            
            <p className="text-zinc-500 text-xs text-center mt-4">
              Your API key is stored locally and never sent to our servers
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HuggingFacePanel;
