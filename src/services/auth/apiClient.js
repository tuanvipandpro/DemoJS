import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from './tokenStorage';
import { useError } from '../../contexts/ErrorContext';

// Sử dụng proxy từ Vite config thay vì gọi trực tiếp
const API_BASE = '/api';

let globalShowError = null;

export function bindApiErrorHandler(showError) {
  globalShowError = showError;
}

async function fetchWithAuth(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (res.status !== 401) return res;

  // try refresh
  const refresh = getRefreshToken();
  if (!refresh) return res;
  const refreshRes = await fetch(`${API_BASE}/auth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!refreshRes.ok) {
    clearTokens();
    if (globalShowError) globalShowError('Session expired. Please login again.');
    return res;
  }
  const data = await refreshRes.json();
  if (data.access_token) setAccessToken(data.access_token);

  // retry original request
  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set('Content-Type', 'application/json');
  const newToken = getAccessToken();
  if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
  const retry = await fetch(url, { ...options, headers: retryHeaders, credentials: 'include' });
  if (!retry.ok && globalShowError) {
    try {
      const data = await retry.json();
      globalShowError(data?.error || 'Request failed');
    } catch {
      globalShowError('Request failed');
    }
  }
  return retry;
}

export const api = {
  post: (path, body) => fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) }),
  get: (path) => fetchWithAuth(path, { method: 'GET' }),
  put: (path, body) => fetchWithAuth(path, { method: 'PUT', body: JSON.stringify(body) }),
};


