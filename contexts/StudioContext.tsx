import React, { createContext, useContext, useState, useEffect } from 'react';
import { studioService, StudioProject } from '../services/studioService';

interface StudioContextType {
    currentProject: StudioProject | null;
    projects: StudioProject[];
    setCurrentProject: (project: StudioProject | null) => void;
    createProject: (name: string, description?: string) => Promise<StudioProject>;
    importGithubRepo: (repoData: any) => Promise<StudioProject>;
    loadProjects: () => void;
    deleteProject: (id: string) => Promise<void>;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentProject, setCurrentProject] = useState<StudioProject | null>(null);
    const [projects, setProjects] = useState<StudioProject[]>([]);

    const loadProjects = () => {
        const loadedProjects = studioService.getProjects();
        setProjects(loadedProjects);

        // Auto-select first project if none selected
        if (!currentProject && loadedProjects.length > 0) {
            setCurrentProject(loadedProjects[0]);
        }
    };

    const createProject = async (name: string, description?: string) => {
        const project = await studioService.createProject({ name, description });
        setProjects([...projects, project]);
        setCurrentProject(project);
        return project;
    };

    const importGithubRepo = async (repoData: any) => {
        const project = await studioService.importGithubRepo(repoData);
        setProjects([...projects, project]);
        setCurrentProject(project);
        return project;
    };

    const deleteProject = async (id: string) => {
        await studioService.deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
        if (currentProject?.id === id) {
            setCurrentProject(projects[0] || null);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    return (
        <StudioContext.Provider
            value={{
                currentProject,
                projects,
                setCurrentProject,
                createProject,
                importGithubRepo,
                loadProjects,
                deleteProject,
            }}
        >
            {children}
        </StudioContext.Provider>
    );
};

export const useStudio = () => {
    const context = useContext(StudioContext);
    if (!context) {
        throw new Error('useStudio must be used within StudioProvider');
    }
    return context;
};
