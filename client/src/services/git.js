import { api } from './auth/apiClient.js';

const GIT_API = '/git';

export const gitService = {
  // Lấy danh sách Git providers
  getProviders: async () => {
    try {
      const response = await api.get(`${GIT_API}/providers`);
      return response.data;
    } catch (error) {
      console.error('Git get providers error:', error);
      throw error;
    }
  },

  // Kết nối Git provider bằng Personal Access Token
  connectWithToken: async (token, provider = 'github') => {
    try {
      const response = await api.post(`${GIT_API}/connect-with-token`, {
        token,
        provider
      });
      return response.data;
    } catch (error) {
      console.error('Git connect error:', error);
      throw error;
    }
  },

  // Lấy danh sách repository (sau khi đã connect)
  getRepositories: async (token) => {
    try {
      const response = await api.post(`${GIT_API}/repos`, {
        token: token
      });
      return response.data;
    } catch (error) {
      console.error('Git get repos error:', error);
      throw error;
    }
  },

  // Lấy danh sách branch của repository (legacy method)
  getBranches: async (owner, repo, gitToken) => {
    try {
      const response = await api.post(`${GIT_API}/repos/${owner}/${repo}/branches`, {
        githubToken: gitToken || null // Handle null token
      });
      return response.data;
    } catch (error) {
      console.error('Git get branches error:', error);
      throw error;
    }
  },

  // Lấy danh sách branch cho project cụ thể
  getProjectBranches: async (projectId) => {
    try {
      const response = await api.get(`${GIT_API}/projects/${projectId}/branches`);
      return response.data;
    } catch (error) {
      console.error('Git get project branches error:', error);
      throw error;
    }
  },

  // Test connection với token
  testConnection: async (provider, token) => {
    try {
      const response = await api.post(`${GIT_API}/test-connection`, {
        provider,
        token
      });
      return response.data;
    } catch (error) {
      console.error('Git test connection error:', error);
      throw error;
    }
  }
};
