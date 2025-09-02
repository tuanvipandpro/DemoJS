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
  },

  // Lấy danh sách members của project
  getProjectMembers: async (projectId) => {
    try {
      const response = await api.get(`${PROJECTS_API}/${projectId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project members:', error);
      throw error;
    }
  },

  // Thêm member vào project
  addProjectMember: async (projectId, memberData) => {
    try {
      const response = await api.post(`${PROJECTS_API}/${projectId}/members`, memberData);
      return response.data;
    } catch (error) {
      console.error('Error adding project member:', error);
      throw error;
    }
  },

  // Xóa member khỏi project
  removeProjectMember: async (projectId, memberId) => {
    try {
      const response = await api.delete(`${PROJECTS_API}/${projectId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing project member:', error);
      throw error;
    }
  },

  // Lấy danh sách instruction templates
  getInstructionTemplates: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.language) params.append('language', filters.language);
      if (filters.framework) params.append('framework', filters.framework);
      if (filters.scope) params.append('scope', filters.scope);
      if (filters.ids && Array.isArray(filters.ids)) {
        filters.ids.forEach(id => params.append('ids', id));
      }
      
      const response = await api.get(`${PROJECTS_API}/templates?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching instruction templates:', error);
      throw error;
    }
  },

  // Lấy danh sách ngôn ngữ có sẵn
  getAvailableLanguages: async () => {
    try {
      const response = await api.get(`${PROJECTS_API}/templates/languages`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available languages:', error);
      throw error;
    }
  },

  // Tìm user bằng email
  searchUsersByEmail: async (email) => {
    try {
      const response = await api.get(`${PROJECTS_API}/users/search?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Lấy GitHub token cho project
  getGitHubToken: async (projectId) => {
    try {
      const response = await api.get(`${PROJECTS_API}/${projectId}/github-token`);
      return response.data;
    } catch (error) {
      console.error('Error fetching GitHub token:', error);
      throw error;
    }
  },

  // Kiểm tra trạng thái kết nối Git
  getGitStatus: async (projectId) => {
    try {
      const response = await api.get(`${PROJECTS_API}/${projectId}/git-status`);
      return response.data;
    } catch (error) {
      console.error('Error checking git status:', error);
      throw error;
    }
  },

  // Disable/Enable project
  toggleProjectStatus: async (projectId, isDisabled) => {
    try {
      const response = await api.patch(`${PROJECTS_API}/${projectId}/disable`, {
        isDisabled
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling project status:', error);
      throw error;
    }
  },

  // Update project status
  updateProjectStatus: async (projectId, status) => {
    try {
      const response = await api.patch(`${PROJECTS_API}/${projectId}/status`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }
};
