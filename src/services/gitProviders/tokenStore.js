const STORAGE_KEY = 'insighttestai-git-tokens';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getToken(providerName) {
  const all = readAll();
  return all[providerName] || '';
}

export function setToken(providerName, token) {
  const all = readAll();
  all[providerName] = token || '';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearToken(providerName) {
  const all = readAll();
  delete all[providerName];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}


