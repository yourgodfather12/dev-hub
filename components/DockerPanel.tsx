import React, { useState, useEffect } from 'react';
import { Container, Activity, Cpu, HardDrive, Network, Zap, RefreshCw, Play, Square, Download, Plus, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { DockerService } from '../services/dockerService';

interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  Status: string;
  Ports: Array<{
    IP: string;
    PrivatePort: number;
    PublicPort: number;
    Type: string;
  }>;
  Created: number;
  State: string;
}

interface DockerImage {
  Id: string;
  RepoTags: string[];
  Size: number;
  Created: number;
}

interface ContainerStats {
  containerId: string;
  cpu: number;
  memory: number;
  memoryUsage: number;
  memoryLimit: number;
}

const DockerPanel: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [stats, setStats] = useState<Record<string, ContainerStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'containers' | 'images'>('containers');
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    loadDockerData();
    const interval = setInterval(loadContainerStats, 5000); // Update stats every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDockerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [containersData, imagesData, systemInfoData] = await Promise.all([
        DockerService.getContainers(),
        DockerService.getImages(),
        DockerService.getSystemInfo().catch(() => null)
      ]);

      setContainers(containersData);
      setImages(imagesData);
      setSystemInfo(systemInfoData);
      
      // Load stats for running containers
      await loadContainerStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Docker');
    } finally {
      setLoading(false);
    }
  };

  const loadContainerStats = async () => {
    const runningContainers = containers.filter(c => c.State === 'running');
    const statsPromises = runningContainers.map(async (container) => {
      try {
        const containerStats = await DockerService.getContainerStats(container.Id);
        const cpuPercent = calculateCPUPercent(containerStats);
        const memoryUsage = containerStats.memory_stats.usage || 0;
        const memoryLimit = containerStats.memory_stats.limit || 0;
        const memoryPercent = (memoryUsage / memoryLimit) * 100;

        return {
          containerId: container.Id,
          cpu: cpuPercent,
          memory: memoryPercent,
          memoryUsage,
          memoryLimit
        };
      } catch (err) {
        return {
          containerId: container.Id,
          cpu: 0,
          memory: 0,
          memoryUsage: 0,
          memoryLimit: 0
        };
      }
    });

    const statsData = await Promise.all(statsPromises);
    const statsMap = statsData.reduce((acc, stat) => {
      acc[stat.containerId] = stat;
      return acc;
    }, {} as Record<string, ContainerStats>);
    
    setStats(statsMap);
  };

  const calculateCPUPercent = (stats: any): number => {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    
    if (systemDelta > 0) {
      return (cpuDelta / systemDelta) * 100;
    }
    return 0;
  };

  const handleContainerAction = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setError(null);
      
      switch (action) {
        case 'start':
          await DockerService.startContainer(containerId);
          break;
        case 'stop':
          await DockerService.stopContainer(containerId);
          break;
        case 'restart':
          await DockerService.restartContainer(containerId);
          break;
      }
      
      // Reload data after action
      await loadDockerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} container`);
    }
  };

  const handleRemoveContainer = async (containerId: string) => {
    if (!confirm('Are you sure you want to remove this container?')) return;
    
    try {
      setError(null);
      await DockerService.removeContainer(containerId);
      await loadDockerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove container');
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return;
    
    try {
      setError(null);
      await DockerService.removeImage(imageId);
      await loadDockerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    }
  };

  const handlePullImage = async (imageName: string) => {
    try {
      setError(null);
      await DockerService.pullImage(imageName);
      await loadDockerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pull image');
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'running': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'exited': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'paused': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1800px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Container className="w-8 h-8 mr-3 text-blue-400" />
            Docker Management
          </h1>
          <p className="text-zinc-400">Manage containers, images, and Docker resources</p>
          {systemInfo && (
            <p className="text-zinc-500 text-sm mt-1">
              Docker Engine {systemInfo.ServerVersion} • {systemInfo.OperatingSystem}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => loadDockerData()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Container
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Container className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{containers.length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Total Containers</p>
        </div>
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold text-white">{containers.filter(c => c.State === 'running').length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Running</p>
        </div>
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <HardDrive className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold text-white">{images.length}</span>
          </div>
          <p className="text-zinc-400 text-sm">Images</p>
        </div>
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Cpu className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">
              {Object.values(stats).reduce((sum, stat) => sum + stat.cpu, 0).toFixed(1)}%
            </span>
          </div>
          <p className="text-zinc-400 text-sm">Total CPU Usage</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('containers')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'containers' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Containers
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'images' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Images
        </button>
      </div>

      {/* Containers Tab */}
      {activeTab === 'containers' && (
        <div className="space-y-4">
          {containers.length === 0 ? (
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-8 text-center">
              <Container className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400">No containers found</p>
              <p className="text-zinc-500 text-sm mt-2">Start by pulling an image or creating a container</p>
            </div>
          ) : (
            containers.map(container => {
              const containerStats = stats[container.Id];
              const ports = container.Ports.filter(p => p.PublicPort > 0);
              
              return (
                <div key={container.Id} className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        container.State === 'running' ? 'bg-emerald-400' : 
                        container.State === 'exited' ? 'bg-red-400' : 'bg-amber-400'
                      }`} />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{container.Names[0]}</h3>
                        <p className="text-zinc-400 text-sm">{container.Image}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(container.State)}`}>
                        {container.State}
                      </span>
                      <div className="flex gap-1">
                        {container.State === 'running' ? (
                          <button 
                            onClick={() => handleContainerAction(container.Id, 'stop')}
                            className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                            title="Stop"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleContainerAction(container.Id, 'start')}
                            className="p-2 rounded-lg hover:bg-white/10 text-emerald-400 transition-colors"
                            title="Start"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleContainerAction(container.Id, 'restart')}
                          className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors"
                          title="Restart"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveContainer(container.Id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">Ports</p>
                      <p className="text-white font-mono">
                        {ports.length > 0 ? ports.map(p => `${p.PublicPort}:${p.PrivatePort}`).join(', ') : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">CPU</p>
                      <p className="text-white">{containerStats ? `${containerStats.cpu.toFixed(1)}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Memory</p>
                      <p className="text-white">
                        {containerStats ? `${containerStats.memory.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Created</p>
                      <p className="text-white">{formatDate(container.Created)}</p>
                    </div>
                  </div>
                  
                  {containerStats && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-zinc-500 mb-1">Memory Usage</p>
                          <p className="text-white">{formatBytes(containerStats.memoryUsage)} / {formatBytes(containerStats.memoryLimit)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 mb-1">Status</p>
                          <p className="text-white">{container.Status}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          {images.length === 0 ? (
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-8 text-center">
              <HardDrive className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400">No images found</p>
              <p className="text-zinc-500 text-sm mt-2">Pull an image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map(image => (
                <div key={image.Id} className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {image.RepoTags[0] || '<none>:<none>'}
                      </h3>
                      <p className="text-zinc-400 text-sm">{formatBytes(image.Size)}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveImage(image.Id)}
                      className="p-2 rounded-lg hover:bg-white/10 text-red-400 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-zinc-500 text-sm">Created {formatDate(image.Created)}</p>
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => {
                        const imageName = prompt('Enter image name to pull (e.g., nginx:latest):');
                        if (imageName) handlePullImage(imageName);
                      }}
                      className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Pull
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DockerPanel;
