import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as ProjectIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Projects', icon: <ProjectIcon />, path: '/projects' },
];

const Sidebar = ({ open, onClose, onNavigate }) => {
  const { mode, toggleTheme } = useTheme();

  const handleNavigation = (path) => {
    console.log('Navigate to:', path);
    if (onNavigate) {
      if (path === '/') {
        onNavigate('dashboard');
      } else if (path === '/projects') {
        onNavigate('projects');
      }
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Logo size="small" />
          <Typography variant="h6" noWrap component="div">
            InsightTestAI
          </Typography>
        </Box>
        <IconButton onClick={toggleTheme} color="inherit">
          {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary" display="block">
          Version 1.0.0
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          Deployed: {new Date().toLocaleDateString('vi-VN')}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
