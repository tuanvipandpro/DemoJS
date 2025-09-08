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
  approveTestCases: async (runId) => {
    try {
      const response = await api.post(`${RUNS_API}/${runId}/approve-test-cases`);
      return response.data;
    } catch (error) {
      console.error('Error approving test cases:', error);
      throw error;
    }
  },

  // Approve test report
  approveReport: async (runId) => {
    try {
      const response = await api.post(`${RUNS_API}/${runId}/approve-report`);
      return response.data;
    } catch (error) {
      console.error('Error approving report:', error);
      throw error;
    }
  },

  // Reject test cases
  rejectTestCases: async (runId) => {
    try {
      const response = await api.post(`${RUNS_API}/${runId}/reject-test-cases`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting test cases:', error);
      throw error;
    }
  },

  // Reject test report
  rejectReport: async (runId) => {
    try {
      const response = await api.post(`${RUNS_API}/${runId}/reject-report`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting report:', error);
      throw error;
    }
  },

  // Get test cases for a run
  getTestCases: async (runId) => {
    try {
      const response = await api.get(`${RUNS_API}/${runId}/test-cases`);
      return response.data;
    } catch (error) {
      console.error('Error fetching test cases:', error);
      throw error;
    }
  },

  // Get step history for a run
  getStepHistory: async (runId) => {
    try {
      const response = await api.get(`${RUNS_API}/${runId}/step-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching step history:', error);
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
