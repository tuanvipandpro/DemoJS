import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorProvider, useError } from './contexts/ErrorContext';
import ErrorDialog from './components/ErrorDialog';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectsNew from './pages/ProjectsNew';
import ProjectDetail from './pages/ProjectDetail';
import Profile from './pages/Profile';
import './App.css';
import { useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';

function AppInner() {
  const { isAuthenticated, user, loading } = useAuth();
  const { setError } = useError();
  const { theme, toggleTheme } = useTheme();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [pageParams, setPageParams] = useState({});

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  // Listen for GitHub repos loaded event
  useEffect(() => {
    const handleGitHubReposLoaded = (event) => {
      console.log('GitHub repos loaded event received:', event.detail);
      // Navigate to projects page and open create project modal
      setCurrentPage('projects');
      // Open modal after a short delay to ensure navigation is complete
      setTimeout(() => {
        setShowCreateProject(true);
        console.log('App: Modal opened after GitHub repos loaded');
      }, 200);
    };

    window.addEventListener('github:repos-loaded', handleGitHubReposLoaded);
    return () => {
      window.removeEventListener('github:repos-loaded', handleGitHubReposLoaded);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <ProjectsNew onNavigate={handleNavigate} />;
      case 'project-detail':
        return <ProjectDetail id={pageParams.id || 1} onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  // Hiển thị loading khi đang kiểm tra authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Layout onNavigate={handleNavigate}>
        {renderPage()}
      </Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <ThemeProvider>
          <ErrorDialog />
          <AppInner />
        </ThemeProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}

export default App;
