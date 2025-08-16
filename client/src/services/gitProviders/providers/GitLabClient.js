// Stub GitLab client — to be implemented later
export default class GitLabClient {
  async connect() {
    return { connected: false };
  }
  async listRepositories() {
    return [];
  }
  async listBranches() {
    return [];
  }
}


