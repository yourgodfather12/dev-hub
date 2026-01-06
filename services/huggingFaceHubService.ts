const HF_API_BASE = 'https://huggingface.co/api';

export interface HFModel {
  id: string;
  modelId: string;
  author: string;
  downloads: number;
  likes: number;
  lastModified: string;
  tags: string[];
  pipeline_tag: string;
  siblings?: Array<{
    rfilename: string;
  }>;
  cardData?: {
    language?: string[];
    license?: string;
    tags?: string[];
  };
}

export interface HFDataset {
  id: string;
  author: string;
  downloads: number;
  likes: number;
  lastModified: string;
  tags: string[];
  cardData?: {
    license?: string;
    tags?: string[];
    language?: string[];
  };
  siblings?: Array<{
    rfilename: string;
  }>;
}

export interface HFSpace {
  id: string;
  author: string;
  likes: number;
  lastModified: string;
  runtime?: {
    hardware: string;
    hardwareCurrent: string;
  };
  subdomain?: string;
  status: 'running' | 'stopped' | 'building' | 'error';
  models?: string[];
  datasets?: string[];
}

export class HuggingFaceHubService {
  private static apiKey: string | null = null;

  static initialize(apiKey: string) {
    this.apiKey = apiKey;
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {};
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${HF_API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Hugging Face API error: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  // Models
  static async searchModels(params: {
    search?: string;
    task?: string;
    library?: string;
    limit?: number;
    sort?: 'downloads' | 'likes' | 'modified';
  } = {}): Promise<HFModel[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.set('search', params.search);
      if (params.task) searchParams.set('task', params.task);
      if (params.library) searchParams.set('library', params.library);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.sort) searchParams.set('sort', params.sort);

      const response = await this.request<{ models: HFModel[] }>(`/models?${searchParams}`);
      return response.models;
    } catch (error) {
      console.error('Failed to search models:', error);
      throw new Error('Unable to search models.');
    }
  }

  static async getModel(modelId: string): Promise<HFModel> {
    try {
      return await this.request<HFModel>(`/models/${modelId}`);
    } catch (error) {
      console.error('Failed to get model:', error);
      throw new Error('Unable to fetch model details.');
    }
  }

  static async getUserModels(username: string): Promise<HFModel[]> {
    try {
      const response = await this.request<HFModel[]>(`/models?author=${username}`);
      return response;
    } catch (error) {
      console.error('Failed to get user models:', error);
      throw new Error('Unable to fetch user models.');
    }
  }

  // Datasets
  static async searchDatasets(params: {
    search?: string;
    task?: string;
    language?: string;
    limit?: number;
    sort?: 'downloads' | 'likes' | 'modified';
  } = {}): Promise<HFDataset[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.set('search', params.search);
      if (params.task) searchParams.set('task', params.task);
      if (params.language) searchParams.set('language', params.language);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.sort) searchParams.set('sort', params.sort);

      const response = await this.request<{ datasets: HFDataset[] }>(`/datasets?${searchParams}`);
      return response.datasets;
    } catch (error) {
      console.error('Failed to search datasets:', error);
      throw new Error('Unable to search datasets.');
    }
  }

  static async getDataset(datasetId: string): Promise<HFDataset> {
    try {
      return await this.request<HFDataset>(`/datasets/${datasetId}`);
    } catch (error) {
      console.error('Failed to get dataset:', error);
      throw new Error('Unable to fetch dataset details.');
    }
  }

  static async getUserDatasets(username: string): Promise<HFDataset[]> {
    try {
      const response = await this.request<HFDataset[]>(`/datasets?author=${username}`);
      return response;
    } catch (error) {
      console.error('Failed to get user datasets:', error);
      throw new Error('Unable to fetch user datasets.');
    }
  }

  // Spaces
  static async searchSpaces(params: {
    search?: string;
    runtime?: string;
    limit?: number;
    sort?: 'likes' | 'modified';
  } = {}): Promise<HFSpace[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.set('search', params.search);
      if (params.runtime) searchParams.set('runtime', params.runtime);
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.sort) searchParams.set('sort', params.sort);

      const response = await this.request<{ spaces: HFSpace[] }>(`/spaces?${searchParams}`);
      return response.spaces;
    } catch (error) {
      console.error('Failed to search spaces:', error);
      throw new Error('Unable to search spaces.');
    }
  }

  static async getSpace(spaceId: string): Promise<HFSpace> {
    try {
      return await this.request<HFSpace>(`/spaces/${spaceId}`);
    } catch (error) {
      console.error('Failed to get space:', error);
      throw new Error('Unable to fetch space details.');
    }
  }

  static async getUserSpaces(username: string): Promise<HFSpace[]> {
    try {
      const response = await this.request<HFSpace[]>(`/spaces?author=${username}`);
      return response;
    } catch (error) {
      console.error('Failed to get user spaces:', error);
      throw new Error('Unable to fetch user spaces.');
    }
  }

  // User info
  static async getUser(username: string): Promise<any> {
    try {
      return await this.request(`/users/${username}`);
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('Unable to fetch user information.');
    }
  }

  static async getWhoAmI(): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key required for authentication. Call HuggingFaceHubService.initialize(apiKey) first.');
    }

    try {
      return await this.request('/whoami');
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw new Error('Unable to authenticate with Hugging Face.');
    }
  }

  // Model inference (if you have access)
  static async runInference(modelId: string, inputs: any, parameters?: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key required for inference. Call HuggingFaceHubService.initialize(apiKey) first.');
    }

    try {
      return await this.request(`/models/${modelId}/inference`, {
        method: 'POST',
        body: JSON.stringify({
          inputs,
          parameters,
        }),
      });
    } catch (error) {
      console.error('Failed to run inference:', error);
      throw new Error('Unable to run model inference.');
    }
  }

  // Create/update resources (requires authentication)
  static async createSpace(repoId: string, config: {
    private?: boolean;
    hardware?: string;
    sdk?: 'gradio' | 'streamlit';
    models?: string[];
    datasets?: string[];
  }): Promise<any> {
    if (!this.apiKey) {
      throw new Error('API key required to create spaces. Call HuggingFaceHubService.initialize(apiKey) first.');
    }

    try {
      return await this.request(`/spaces/${repoId}`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch (error) {
      console.error('Failed to create space:', error);
      throw new Error('Unable to create space.');
    }
  }

  static async likeModel(modelId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key required to like models. Call HuggingFaceHubService.initialize(apiKey) first.');
    }

    try {
      await this.request(`/models/${modelId}/like`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to like model:', error);
      throw new Error('Unable to like model.');
    }
  }

  static async unlikeModel(modelId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key required to unlike models. Call HuggingFaceHubService.initialize(apiKey) first.');
    }

    try {
      await this.request(`/models/${modelId}/like`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to unlike model:', error);
      throw new Error('Unable to unlike model.');
    }
  }
}
