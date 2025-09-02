import { api } from './auth/apiClient.js';

const QUEUE_API = '/queue';

export const queueService = {
  // Enqueue a project run
  enqueueProjectRun: async (projectId, commitId = 'main', branch = 'main', diffSummary = null, priority = 'normal') => {
    try {
      const response = await api.post(`${QUEUE_API}/enqueue`, {
        type: 'agent_run',
        data: {
          projectId,
          commitId,
          branch,
          diffSummary,
          priority
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error enqueueing project run:', error);
      throw error;
    }
  }
};
