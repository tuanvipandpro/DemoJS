// Simple provider client registry for future extensibility
import GitHubClient from './providers/GitHubClient';
import GitLabClient from './providers/GitLabClient';
import BitbucketClient from './providers/BitbucketClient';
import AzureDevOpsClient from './providers/AzureDevOpsClient';

export function getGitProviderClient(providerName) {
  switch (providerName) {
    case 'GitHub':
      return new GitHubClient();
    case 'GitLab':
      return new GitLabClient();
    case 'Bitbucket':
      return new BitbucketClient();
    case 'Azure DevOps':
      return new AzureDevOpsClient();
    default:
      return {
        connect: async () => ({ connected: false }),
        listRepositories: async () => [],
        listBranches: async () => [],
      };
  }
}


