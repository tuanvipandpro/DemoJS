// GitHub client using personal access token (PAT) stored in localStorage.
// Note: For production, prefer OAuth App/PKCE and proxy via backend to hide tokens.
import { getToken, setToken } from '../tokenStore';

const API_BASE = 'https://api.github.com';

export default class GitHubClient {
  async connect() {
    // In this simplified client, "connect" checks if a token exists.
    // If no token, prompt user to paste a GitHub PAT with repo read scope.
    let token = getToken('GitHub');
    if (!token) {
      // eslint-disable-next-line no-alert
      token = window.prompt('Enter your GitHub Personal Access Token (repo read scope)');
      if (!token) return { connected: false };
      setToken('GitHub', token);
    }

    const me = await this._request('/user');
    return { connected: true, user: me };
  }

  async listRepositories() {
    // Fetch first page; you can extend with pagination if needed
    const repos = await this._request('/user/repos?per_page=50&sort=updated');
    return repos.map((r) => ({ id: r.id, full_name: r.full_name }));
  }

  async listBranches(repoFullName) {
    const branches = await this._request(`/repos/${repoFullName}/branches?per_page=50`);
    return branches.map((b) => b.name);
  }

  async _request(path) {
    const token = getToken('GitHub');
    if (!token) throw new Error('Missing GitHub token');
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${text}`);
    }
    return res.json();
  }
}


