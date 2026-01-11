import React, { useState } from 'react';
import { Brain, Upload, Play, Pause, Download, Settings, BarChart3, Zap, TrendingUp, Cpu, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';

interface Model {
    id: string;
    name: string;
    task: string;
    downloads: string;
    likes: number;
}

interface TrainingJob {
    id: string;
    modelName: string;
    dataset: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    progress: number;
    epoch: number;
    totalEpochs: number;
    loss: number;
    accuracy: number;
    startTime: Date;
    estimatedTime?: string;
}

const popularModels: Model[] = [
    { id: 'bert-base', name: 'BERT Base', task: 'Text Classification', downloads: '10M+', likes: 5420 },
    { id: 'gpt2', name: 'GPT-2', task: 'Text Generation', downloads: '8M+', likes: 4230 },
    { id: 'distilbert', name: 'DistilBERT', task: 'NER', downloads: '6M+', likes: 3890 },
    { id: 't5-small', name: 'T5 Small', task: 'Translation', downloads: '5M+', likes: 3120 },
    { id: 'roberta', name: 'RoBERTa', task: 'Sentiment Analysis', downloads: '7M+', likes: 4580 },
];

const MLTrainingTab: React.FC = () => {
    const { currentProject } = useStudio();
    const [selectedModel, setSelectedModel] = useState<Model | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([
        {
            id: '1',
            modelName: 'BERT Base',
            dataset: 'customer-reviews.csv',
            status: 'running',
            progress: 67,
            epoch: 2,
            totalEpochs: 3,
            loss: 0.342,
            accuracy: 89.4,
            startTime: new Date(Date.now() - 3600000),
            estimatedTime: '15 min',
        },
    ]);

    // Training configuration state
    const [config, setConfig] = useState({
        learningRate: 0.00002,
        batchSize: 16,
        epochs: 3,
        optimizer: 'adamw',
        warmupSteps: 500,
    });

    const [datasetFile, setDatasetFile] = useState<File | null>(null);

    const startTraining = () => {
        if (!selectedModel || !datasetFile) return;

        const newJob: TrainingJob = {
            id: Date.now().toString(),
            modelName: selectedModel.name,
            dataset: datasetFile.name,
            status: 'running',
            progress: 0,
            epoch: 0,
            totalEpochs: config.epochs,
            loss: 0,
            accuracy: 0,
            startTime: new Date(),
            estimatedTime: '~45 min',
        };

        setTrainingJobs([newJob, ...trainingJobs]);
        setShowConfig(false);
        setSelectedModel(null);
        setDatasetFile(null);
    };

    const toggleJobStatus = (id: string) => {
        setTrainingJobs(trainingJobs.map(job =>
            job.id === id
                ? { ...job, status: job.status === 'running' ? 'paused' : 'running' }
                : job
        ));
    };

    const getStatusIcon = (status: TrainingJob['status']) => {
        switch (status) {
            case 'running': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
            case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
            case 'paused': return <Pause className="w-4 h-4 text-amber-400" />;
        }
    };

    const getStatusColor = (status: TrainingJob['status']) => {
        switch (status) {
            case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <span className="text-2xl font-bold text-white">{trainingJobs.length}</span>
                    </div>
                    <p className="text-xs text-zinc-400">Training Jobs</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 text-blue-400" />
                        <span className="text-2xl font-bold text-white">{trainingJobs.filter(j => j.status === 'running').length}</span>
                    </div>
                    <p className="text-xs text-zinc-400">Active</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-2xl font-bold text-white">{trainingJobs.filter(j => j.status === 'completed').length}</span>
                    </div>
                    <p className="text-xs text-zinc-400">Completed</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Cpu className="w-5 h-5 text-pink-400" />
                        <span className="text-2xl font-bold text-white">~2.4h</span>
                    </div>
                    <p className="text-xs text-zinc-400">GPU Time Used</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
                {/* Left: Model Selection & Config */}
                <div className="flex flex-col gap-4 overflow-auto">
                    <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-400" />
                            Select Model
                        </h3>

                        <div className="space-y-2 mb-4">
                            {popularModels.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    className={`w-full p-4 rounded-xl border transition-all text-left ${selectedModel?.id === model.id
                                        ? 'bg-purple-500/20 border-purple-500/50'
                                        : 'bg-zinc-800/50 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">{model.name}</h4>
                                        <span className="text-xs text-zinc-400">{model.downloads}</span>
                                    </div>
                                    <p className="text-sm text-zinc-400">{model.task}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                        <span>❤️ {model.likes}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {selectedModel && (
                            <button
                                onClick={() => setShowConfig(true)}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all"
                            >
                                Configure Training
                            </button>
                        )}
                    </div>

                    {/* Training Config */}
                    {showConfig && selectedModel && (
                        <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-blue-400" />
                                Training Configuration
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Dataset</label>
                                    <input
                                        type="file"
                                        accept=".csv,.json,.txt"
                                        onChange={(e) => setDatasetFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer"
                                    />
                                    {datasetFile && (
                                        <p className="text-xs text-emerald-400 mt-2">✓ {datasetFile.name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Learning Rate</label>
                                        <input
                                            type="number"
                                            value={config.learningRate}
                                            onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) })}
                                            step="0.00001"
                                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Batch Size</label>
                                        <input
                                            type="number"
                                            value={config.batchSize}
                                            onChange={(e) => setConfig({ ...config, batchSize: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Epochs</label>
                                        <input
                                            type="number"
                                            value={config.epochs}
                                            onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Optimizer</label>
                                        <select
                                            value={config.optimizer}
                                            onChange={(e) => setConfig({ ...config, optimizer: e.target.value })}
                                            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                                        >
                                            <option value="adamw">AdamW</option>
                                            <option value="adam">Adam</option>
                                            <option value="sgd">SGD</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={startTraining}
                                    disabled={!datasetFile}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-zinc-700 disabled:to-zinc-800 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="w-5 h-5" />
                                    Start Training
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Active Training Jobs */}
                <div className="bg-zinc-900/30 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Training Jobs
                        </h3>
                    </div>

                    <div className="flex-1 overflow-auto p-6 space-y-4">
                        {trainingJobs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center">
                                <div>
                                    <Brain className="w-16 h-16 text-zinc-500 mx-auto mb-4 opacity-20" />
                                    <p className="text-zinc-500">No training jobs yet</p>
                                    <p className="text-sm text-zinc-600 mt-2">Select a model to get started</p>
                                </div>
                            </div>
                        ) : (
                            trainingJobs.map((job) => (
                                <div key={job.id} className="bg-zinc-800/50 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-bold text-white flex items-center gap-2">
                                                {getStatusIcon(job.status)}
                                                {job.modelName}
                                            </h4>
                                            <p className="text-xs text-zinc-400 mt-1">{job.dataset}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                                            {job.status}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                                            <span>Epoch {job.epoch}/{job.totalEpochs}</span>
                                            <span>{job.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-500"
                                                style={{ width: `${job.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                                        <div>
                                            <p className="text-zinc-500 mb-1">Loss</p>
                                            <p className="text-white font-medium">{job.loss.toFixed(3)}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">Accuracy</p>
                                            <p className="text-white font-medium">{job.accuracy.toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 mb-1">ETA</p>
                                            <p className="text-white font-medium">{job.estimatedTime || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-white/10">
                                        <button
                                            onClick={() => toggleJobStatus(job.id)}
                                            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            {job.status === 'running' ? (
                                                <>
                                                    <Pause className="w-3 h-3" />
                                                    Pause
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-3 h-3" />
                                                    Resume
                                                </>
                                            )}
                                        </button>
                                        {job.status === 'completed' && (
                                            <button className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
                                                <Download className="w-3 h-3" />
                                                Download
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MLTrainingTab;
