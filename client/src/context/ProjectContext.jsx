import { useState, createContext, useContext, useEffect } from 'react';
import { projectService } from '@/services/api';

const ProjectContext = createContext(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getProjects(params);
      setProjects(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async (projectId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.getProject(projectId);
      setCurrentProject(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.createProject(projectData);
      setProjects((prev) => [response.data, ...prev]);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, projectData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectService.updateProject(projectId, projectData);
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? response.data : p))
      );
      if (currentProject?._id === projectId) {
        setCurrentProject(response.data);
      }
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    setLoading(true);
    setError(null);
    try {
      await projectService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      if (currentProject?._id === projectId) {
        setCurrentProject(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCurrentProject = () => {
    setCurrentProject(null);
  };

  const value = {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    clearCurrentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;