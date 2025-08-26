import { api } from './auth/apiClient.js';

const PROJECTS_API = '/projects';

export const projectsService = {
  // Lấy danh sách tất cả projects
  getAllProjects: async () => {
    try {
      const response = await api.get(PROJECTS_API);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Tạo project mới
  createProject: async (projectData) => {
    try {
      const response = await api.post(PROJECTS_API, projectData);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Lấy project theo ID
  getProjectById: async (projectId) => {
    try {
      const response = await api.get(`${PROJECTS_API}/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Cập nhật project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`${PROJECTS_API}/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Xóa project
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`${PROJECTS_API}/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
};
