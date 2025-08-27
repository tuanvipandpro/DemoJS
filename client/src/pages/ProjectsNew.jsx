import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  GitHub as GitHubIcon,
  PlayArrow as RunIcon,
  Info as DetailIcon,
} from '@mui/icons-material';
import CreateProjectStepperModal from '../components/CreateProjectStepperModal';
import ProjectDetailModal from '../components/ProjectDetailModal';
import { projectsService } from '../services/projects';
import { api } from '../services/auth/apiClient';

const ProjectsNew = ({ onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    provider: 'All',
  });

  const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    function onOpenCreateProject() {
      setOpenModal(true);
    }
    window.addEventListener('app:openCreateProject', onOpenCreateProject);
    return () => window.removeEventListener('app:openCreateProject', onOpenCreateProject);
  }, []);

  const [detailModal, setDetailModal] = useState({ open: false, project: null });
  const [confirmRunModal, setConfirmRunModal] = useState({ open: false, project: null });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load projects from server
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await projectsService.getAllProjects();
      
      if (response.success) {
        setProjects(response.projects);
      } else {
        throw new Error('Failed to load projects');
      }
      
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err.message || 'Failed to load projects');
      // Fallback to empty array
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Planning':
        return 'warning';
      case 'On Hold':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'GitHub':
        return <GitHubIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await projectsService.createProject(projectData);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Project created successfully!',
          severity: 'success',
        });
        
        // Refresh projects list
        loadProjects();
        
        // Close modal
        setOpenModal(false);
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create project',
        severity: 'error',
      });
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const response = await projectsService.deleteProject(id);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: 'Project deleted successfully!',
          severity: 'success',
        });
        
        // Refresh projects list
        loadProjects();
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete project',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRunClick = (project) => {
    if (project.lastRun === 'Running') return;
    setConfirmRunModal({ open: true, project });
  };

  const runProject = async (project) => {
    if (project.lastRun === 'Running') return;
    
    try {
      // Sử dụng api object để gọi backend với interceptors
      const response = await api.post('/queue/enqueue', {
        type: 'agent_run',
        data: {
          projectId: project.id,
          commitId: 'main', // Sử dụng branch mặc định
          branch: 'main',   // Sử dụng branch mặc định
          diffSummary: null, // Không có diff summary cho lần chạy đầu tiên
          priority: 'normal'
        }
      });

      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        setSnackbar({
          open: true,
          message: `Project ${project.name} queued successfully!`,
          severity: 'success'
        });
        
        // Refresh projects để cập nhật trạng thái
        loadProjects();
      } else {
        throw new Error('Failed to enqueue project');
      }
    } catch (error) {
      console.error('Error running project:', error);
      setSnackbar({
        open: true,
        message: `Failed to run project: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = [p.name, p.description].some(v =>
        (v || '').toLowerCase().includes(filters.search.toLowerCase())
      );
      const matchesStatus = filters.status === 'All' || p.status === filters.status;
      const matchesProvider = filters.provider === 'All' || (p.gitProvider || 'Not connected') === filters.provider;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [projects, filters]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load projects: {error}
        </Alert>
        <Button variant="contained" onClick={loadProjects}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
        >
          New Project
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6} lg={6}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by name, description or team"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} md={3} lg={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {['All', 'Planning', 'In Progress', 'Completed', 'On Hold'].map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3} lg={3}>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                label="Provider"
                value={filters.provider}
                onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
              >
                {['All', 'GitHub', 'Not connected'].map(p => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Projects Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Coverage</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                      {project.description || 'No description'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {project.team || 'No team'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getProviderIcon(project.gitProvider)}
                    <Typography variant="body2">
                      {project.gitProvider || 'Not connected'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ position: 'relative', width: 60, height: 60 }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: `conic-gradient(#4caf50 0deg ${(project.coverage || 0) * 3.6}deg, #e0e0e0 ${(project.coverage || 0) * 3.6}deg 360deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 4,
                          borderRadius: '50%',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: 11 }} color="textSecondary">
                          {`${Math.round(project.coverage || 0)}%`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.lastRun || 'Not run'}
                    color={project.lastRun === 'Failed' ? 'error' : project.lastRun === 'Running' ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {/* Run button */}
                    <Tooltip title="Run Project">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleRunClick(project)}
                          disabled={project.lastRun === 'Running'}
                          color="primary"
                        >
                          <RunIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setDetailModal({ open: true, project })}>
                        <DetailIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Project Modal */}
      <CreateProjectStepperModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleCreateProject}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>



      {/* Confirm Run Modal */}
      <Dialog
        open={confirmRunModal.open}
        onClose={() => setConfirmRunModal({ open: false, project: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận chạy Project</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn chạy project <strong>{confirmRunModal.project?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Project sẽ được thêm vào queue và chạy theo thứ tự ưu tiên.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRunModal({ open: false, project: null })}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (confirmRunModal.project) {
                runProject(confirmRunModal.project);
                setConfirmRunModal({ open: false, project: null });
              }
            }}
            startIcon={<RunIcon />}
          >
            Chạy Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Detail Modal (includes edit/delete) */}
      <ProjectDetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, project: null })}
        project={detailModal.project}
        onDelete={(id) => {
          setDetailModal({ open: false, project: null });
          handleDeleteProject(id);
        }}
        onUpdate={(updated) => {
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setDetailModal({ open: true, project: updated });
          setSnackbar({ open: true, message: 'Project updated successfully', severity: 'success' });
        }}
      />
    </Box>
  );
};

export default ProjectsNew;
