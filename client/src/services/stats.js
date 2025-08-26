import { api } from './auth/apiClient.js';

export const statsService = {
  // Lấy thống kê tổng quan
  async getSummary(range = '7d') {
    try {
      const response = await api.get(`/stats/summary?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats summary:', error);
      throw error;
    }
  },

  // Lấy thống kê cho project cụ thể
  async getProjectSummary(projectId, range = '7d') {
    try {
      const response = await api.get(`/stats/projects/${projectId}/summary?range=${range}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
  },

  // Lấy dữ liệu xu hướng
  async getTrends(days = 30) {
    try {
      const response = await api.get(`/stats/trends?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  }
};
