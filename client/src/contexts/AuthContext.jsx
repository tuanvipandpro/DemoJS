import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, bindApiErrorHandler } from '../services/auth/apiClient.js';
import { useError } from './ErrorContext';
import { getAccessToken, setAccessToken, setRefreshToken, clearAllAuthLike } from '../services/auth/tokenStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { showError } = useError();
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bindApiErrorHandler(showError);
    const token = getAccessToken();
    if (!token) return;
    (async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.status === 200) {
          const data = res.data;
          setUser(data.profile || null);
          setIsAuthenticated(!!data.profile);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (_e) {
        setUser(null);
        setIsAuthenticated(false);
      }
    })();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { provider: 'local', username, password });
      if (res.status === 200) {
        const tokens = res.data;
        if (tokens.access_token) setAccessToken(tokens.access_token);
        if (tokens.refresh_token) setRefreshToken(tokens.refresh_token);
        setIsAuthenticated(true);
        const meRes = await api.get('/auth/profile');
        if (meRes.status === 200) {
          const me = meRes.data;
          setUser(me.profile || null);
        }
        return { success: true };
      } else {
        return { success: false, error: res.data?.error || 'Login failed' };
      }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login error' };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    return { success: false, error: 'Google login is not available yet' };
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', userData);
      if (res.status === 200) {
        return { success: true, user: res.data.user };
      } else {
        return { success: false, error: res.data?.error || 'Registration failed' };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || 'Registration error' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAllAuthLike();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
