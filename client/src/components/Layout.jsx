import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Folder as ProjectsIcon,
  Person as ProfileIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  FolderOpen
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { projectsService } from '../services/projects';
import Logo from './Logo';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme: appTheme, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await projectsService.getAllProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectsToggle = () => {
    setProjectsExpanded(!projectsExpanded);
    if (!projectsExpanded && projects.length === 0) {
      fetchProjects();
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Logo />
        <Typography variant="h6" noWrap>
          InsightTestAI
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            component="button"
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              border: 'none',
              borderRadius: 1,
              margin: '4px 8px',
              transition: 'all 0.2s ease-in-out',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.light,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                },
              },
              '&:hover': {
                border: '2px solid',
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : undefined }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
            {item.text === 'Projects' && (
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectsToggle();
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  borderRadius: '50%',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                {projectsExpanded ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItem>
        ))}
      </List>

      {/* Projects List */}
      <Collapse in={projectsExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {loadingProjects ? (
            <ListItem sx={{ pl: 4 }}>
              <ListItemIcon>
                <CircularProgress size={20} />
              </ListItemIcon>
              <ListItemText primary="Loading projects..." />
            </ListItem>
          ) : projects.length > 0 ? (
            projects.map((project) => (
              <ListItem
                key={project.id}
                component="button"
                onClick={() => handleNavigation(`/projects/${project.id}`)}
                selected={location.pathname === `/projects/${project.id}`}
                sx={{
                  border: 'none',
                  borderRadius: 1,
                  margin: '2px 8px 2px 32px',
                  transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light,
                    },
                  },
                  '&:hover': {
                    border: '1px solid',
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <FolderOpen fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={project.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={project.status || 'active'}
                        size="small"
                        color={project.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                      {project.gitProvider && (
                        <Chip
                          label={project.gitProvider}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))
          ) : (
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="No projects found"
                secondary="Create your first project to get started"
              />
            </ListItem>
          )}
        </List>
      </Collapse>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - 250px)` },
          ml: { md: '250px' },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          <IconButton color="inherit" onClick={toggleTheme}>
            {appTheme === 'dark' ? <LightIcon /> : <DarkIcon />}
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.displayName?.[0] || user?.username?.[0] || <AccountIcon />}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { handleNavigation('/profile'); handleMenuClose(); }}>
              <ListItemIcon>
                <ProfileIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: 250 }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? drawerOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 250,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 250px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
