import { api } from './auth/apiClient';

const GITHUB_API = '/github';

export const githubService = {
  // Kết nối GitHub bằng Personal Access Token
  connectWithToken: async (token, provider = 'github') => {
    try {
      const response = await api.post(`${GITHUB_API}/connect-with-token`, {
        token,
        provider
      });
      return response.data;
    } catch (error) {
      console.error('GitHub connect error:', error);
      throw error;
    }
  },

  // Lấy danh sách repository (sau khi đã connect)
  getRepositories: async () => {
    try {
      const response = await api.get(`${GITHUB_API}/repos`);
      return response.data;
    } catch (error) {
      console.error('GitHub get repos error:', error);
      throw error;
    }
  },

  // Lấy danh sách branch của repository
  getBranches: async (owner, repo, githubToken) => {
    try {
      const response = await api.post(`${GITHUB_API}/repos/${owner}/${repo}/branches`, {
        githubToken
      });
      return response.data;
    } catch (error) {
      console.error('GitHub get branches error:', error);
      throw error;
    }
  }
};
