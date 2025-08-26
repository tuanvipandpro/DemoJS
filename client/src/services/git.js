import { api } from './auth/apiClient.js';

const GIT_API = '/git';

export const gitService = {
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

  // Lấy danh sách branch của repository
  getBranches: async (owner, repo, gitToken) => {
    try {
      const response = await api.post(`${GIT_API}/repos/${owner}/${repo}/branches`, {
        githubToken: gitToken // Giữ nguyên tên parameter để tương thích với backend
      });
      return response.data;
    } catch (error) {
      console.error('Git get branches error:', error);
      throw error;
    }
  }
};
