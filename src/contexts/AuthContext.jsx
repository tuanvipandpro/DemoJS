import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [isAuthenticated, user]);

  const login = (username, password) => {
    // Tạm thời hardcode credentials
    if (username === 'admin' && password === 'admin') {
      const userData = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@insighttestai.com',
        role: 'admin'
      };
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  };

  const loginWithGoogle = () => {
    // TODO: Implement Google OAuth
    console.log('Google login not implemented yet');
    return { success: false, error: 'Google login is not available yet' };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
