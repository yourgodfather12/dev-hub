import { apiClient } from './apiClient';

export interface StudioProject {
    id: string;
    name: string;
    description?: string;
    architecture?: any;
    files?: any;
    agentIds?: string[];
    githubRepo?: {
        owner: string;
        name: string;
        url: string;
        defaultBranch: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface Agent {
    id: string;
    name: string;
    type: 'code-assistant' | 'qa' | 'devops' | 'support' | 'analytics' | 'security';
    status: 'active' | 'paused' | 'idle';
    projectId?: string;
    tasksCompleted: number;
    cost: number;
    config?: any;
    createdAt: Date;
}

export interface TrainingJob {
    id: string;
    modelName: string;
    dataset: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    progress: number;
    epoch: number;
    totalEpochs: number;
    loss?: number;
    accuracy?: number;
    config: any;
    createdAt: Date;
    updatedAt: Date;
}

class StudioService {
    // Projects
    async createProject(data: { name: string; description?: string }): Promise<StudioProject> {
        // For now, use localStorage until backend is ready
        const project: StudioProject = {
            id: `proj_${Date.now()}`,
            name: data.name,
            description: data.description,
            architecture: null,
            files: null,
            agentIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const projects = this.getProjects();
        projects.push(project);
        localStorage.setItem('studio_projects', JSON.stringify(projects));

        return project;
    }

    getProjects(): StudioProject[] {
        const data = localStorage.getItem('studio_projects');
        return data ? JSON.parse(data) : [];
    }

    async getProject(id: string): Promise<StudioProject | null> {
        const projects = this.getProjects();
        return projects.find(p => p.id === id) || null;
    }

    async updateProject(id: string, updates: Partial<StudioProject>): Promise<StudioProject> {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);

        if (index === -1) throw new Error('Project not found');

        projects[index] = {
            ...projects[index],
            ...updates,
            updatedAt: new Date(),
        };

        localStorage.setItem('studio_projects', JSON.stringify(projects));
        return projects[index];
    }

    async deleteProject(id: string): Promise<void> {
        const projects = this.getProjects().filter(p => p.id !== id);
        localStorage.setItem('studio_projects', JSON.stringify(projects));
    }

    // Architecture
    async saveArchitecture(projectId: string, architecture: any): Promise<void> {
        await this.updateProject(projectId, { architecture });
    }

    async getArchitecture(projectId: string): Promise<any> {
        const project = await this.getProject(projectId);
        return project?.architecture || null;
    }

    // Files
    async saveFiles(projectId: string, files: any): Promise<void> {
        await this.updateProject(projectId, { files });
    }

    async getFiles(projectId: string): Promise<any> {
        const project = await this.getProject(projectId);
        return project?.files || null;
    }

    // Agents
    async createAgent(data: Omit<Agent, 'id' | 'createdAt'>): Promise<Agent> {
        const agent: Agent = {
            id: `agent_${Date.now()}`,
            ...data,
            createdAt: new Date(),
        };

        const agents = this.getAgents();
        agents.push(agent);
        localStorage.setItem('studio_agents', JSON.stringify(agents));

        return agent;
    }

    getAgents(): Agent[] {
        const data = localStorage.getItem('studio_agents');
        return data ? JSON.parse(data) : [];
    }

    async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
        const agents = this.getAgents();
        const index = agents.findIndex(a => a.id === id);

        if (index === -1) throw new Error('Agent not found');

        agents[index] = { ...agents[index], ...updates };
        localStorage.setItem('studio_agents', JSON.stringify(agents));

        return agents[index];
    }

    async deleteAgent(id: string): Promise<void> {
        const agents = this.getAgents().filter(a => a.id !== id);
        localStorage.setItem('studio_agents', JSON.stringify(agents));
    }

    // Training Jobs
    async createTrainingJob(data: Omit<TrainingJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingJob> {
        const job: TrainingJob = {
            id: `job_${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const jobs = this.getTrainingJobs();
        jobs.push(job);
        localStorage.setItem('studio_training_jobs', JSON.stringify(jobs));

        return job;
    }

    getTrainingJobs(): TrainingJob[] {
        const data = localStorage.getItem('studio_training_jobs');
        return data ? JSON.parse(data) : [];
    }

    async updateTrainingJob(id: string, updates: Partial<TrainingJob>): Promise<TrainingJob> {
        const jobs = this.getTrainingJobs();
        const index = jobs.findIndex(j => j.id === id);

        if (index === -1) throw new Error('Training job not found');

        jobs[index] = {
            ...jobs[index],
            ...updates,
            updatedAt: new Date(),
        };

        localStorage.setItem('studio_training_jobs', JSON.stringify(jobs));

        return jobs[index];
    }

    // GitHub
    async getGithubRepos(): Promise<any[]> {
        const response = await apiClient.get('/github/repos');
        if (response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch repositories');
    }

    async getGithubFiles(owner: string, repo: string, ref: string = 'main'): Promise<any> {
        const response = await apiClient.get(`/github/repo/${owner}/${repo}/files?ref=${ref}`);
        if (response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch files');
    }

    async getGithubContent(owner: string, repo: string, path: string, ref: string = 'main'): Promise<any> {
        const response = await apiClient.get(`/github/repo/${owner}/${repo}/contents/${path}?ref=${ref}`);
        if (response.status === 'success') {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch content');
    }

    async importGithubRepo(repoData: any): Promise<StudioProject> {
        const project: StudioProject = {
            id: `proj_gh_${Date.now()}`,
            name: repoData.name,
            description: repoData.description || '',
            architecture: null,
            files: null,
            agentIds: [],
            githubRepo: {
                owner: repoData.owner.login,
                name: repoData.name,
                url: repoData.html_url,
                defaultBranch: repoData.default_branch || 'main',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const projects = this.getProjects();
        projects.push(project);
        localStorage.setItem('studio_projects', JSON.stringify(projects));

        return project;
    }
}

export const studioService = new StudioService();
