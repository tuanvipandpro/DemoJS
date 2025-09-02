import { api } from './auth/apiClient.js';

const RUNS_API = '/runs';

export const runsService = {
  // Lấy danh sách test runs với filtering
  getRuns: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`${RUNS_API}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching runs:', error);
      throw error;
    }
  },

  // Tạo test run mới cho project
  createRun: async (projectId, runData) => {
    try {
      const response = await api.post(`${RUNS_API}/projects/${projectId}/runs`, runData);
      return response.data;
    } catch (error) {
      console.error('Error creating run:', error);
      throw error;
    }
  },

  // Lấy chi tiết test run
  getRunById: async (runId) => {
    try {
      const response = await api.get(`${RUNS_API}/${runId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching run:', error);
      throw error;
    }
  },

  // Lấy logs của test run
  getRunLogs: async (runId) => {
    try {
      const response = await api.get(`${RUNS_API}/${runId}/logs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching run logs:', error);
      throw error;
    }
  },

  // Approve test cases
  approveTestCases: async (runId, approvedTestCases) => {
    try {
      const response = await api.post(`${RUNS_API}/${runId}/approve`, {
        approvedTestCases
      });
      return response.data;
    } catch (error) {
      console.error('Error approving test cases:', error);
      throw error;
    }
  },

  // Execute approved tests
  executeTests: async (runId) => {
    try {
      const response = await api.post(`${RUNS_API}/${runId}/execute`);
      return response.data;
    } catch (error) {
      console.error('Error executing tests:', error);
      throw error;
    }
  },

  // Record decision for completed test run
  recordDecision: async (runId, decision, decisionData = {}) => {
    try {
      const response = await api.post(`${RUNS_API}/${runId}/decision`, {
        decision,
        decisionData
      });
      return response.data;
    } catch (error) {
      console.error('Error recording decision:', error);
      throw error;
    }
  }
};
