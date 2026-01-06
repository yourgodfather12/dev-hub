const DOCKER_API_BASE = import.meta.env.VITE_DOCKER_API_BASE || 'http://localhost:2375';

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

interface DockerStats {
  read: string;
  network: {
    rx_bytes: number;
    tx_bytes: number;
  };
  memory_stats: {
    usage: number;
    limit: number;
  };
  cpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
  precpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
}

export class DockerService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${DOCKER_API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Docker API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async getContainers(): Promise<DockerContainer[]> {
    try {
      const containers = await this.request<DockerContainer[]>('/containers/json?all=true');
      return containers.map(container => ({
        ...container,
        // Clean up container name (remove leading '/')
        Names: container.Names.map(name => name.startsWith('/') ? name.slice(1) : name),
      }));
    } catch (error) {
      console.error('Failed to fetch containers:', error);
      throw new Error('Unable to connect to Docker. Please ensure Docker is running and API is accessible.');
    }
  }

  static async getImages(): Promise<DockerImage[]> {
    try {
      const images = await this.request<DockerImage[]>('/images/json');
      return images;
    } catch (error) {
      console.error('Failed to fetch images:', error);
      throw new Error('Unable to fetch Docker images.');
    }
  }

  static async getContainerStats(containerId: string): Promise<DockerStats> {
    try {
      const stats = await this.request<DockerStats>(`/containers/${containerId}/stats?stream=false`);
      return stats;
    } catch (error) {
      console.error('Failed to fetch container stats:', error);
      throw new Error('Unable to fetch container statistics.');
    }
  }

  static async startContainer(containerId: string): Promise<void> {
    try {
      await this.request(`/containers/${containerId}/start`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to start container:', error);
      throw new Error('Unable to start container.');
    }
  }

  static async stopContainer(containerId: string): Promise<void> {
    try {
      await this.request(`/containers/${containerId}/stop`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to stop container:', error);
      throw new Error('Unable to stop container.');
    }
  }

  static async restartContainer(containerId: string): Promise<void> {
    try {
      await this.request(`/containers/${containerId}/restart`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to restart container:', error);
      throw new Error('Unable to restart container.');
    }
  }

  static async removeContainer(containerId: string): Promise<void> {
    try {
      await this.request(`/containers/${containerId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to remove container:', error);
      throw new Error('Unable to remove container.');
    }
  }

  static async removeImage(imageId: string): Promise<void> {
    try {
      await this.request(`/images/${imageId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to remove image:', error);
      throw new Error('Unable to remove image.');
    }
  }

  static async pullImage(imageName: string): Promise<void> {
    try {
      await this.request(`/images/create?fromImage=${imageName}`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to pull image:', error);
      throw new Error('Unable to pull image.');
    }
  }

  static async createContainer(config: {
    Image: string;
    name?: string;
    ExposedPorts?: Record<string, {}>;
    HostConfig?: {
      PortBindings?: Record<string, Array<{ HostPort: string }>>;
    };
  }): Promise<string> {
    try {
      const response = await fetch(`${DOCKER_API_BASE}/containers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to create container: ${response.statusText}`);
      }

      const result = await response.json();
      return result.Id;
    } catch (error) {
      console.error('Failed to create container:', error);
      throw new Error('Unable to create container.');
    }
  }

  static async getSystemInfo(): Promise<any> {
    try {
      const info = await this.request('/info');
      return info;
    } catch (error) {
      console.error('Failed to fetch system info:', error);
      throw new Error('Unable to fetch Docker system information.');
    }
  }
}
