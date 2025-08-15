import React, { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, onNavigate }) => {
  const drawerWidth = 240;

  React.useEffect(() => {
    function onAppNavigate(e) {
      const page = e.detail?.page;
      if (page) onNavigate?.(page);
    }
    window.addEventListener('app:navigate', onAppNavigate);
    return () => window.removeEventListener('app:navigate', onAppNavigate);
  }, [onNavigate]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar onNavigate={onNavigate} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: '100vh',
        }}
      >
        <Header />
        <Box
          sx={{
            mt: '64px', // Height of AppBar
            p: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
