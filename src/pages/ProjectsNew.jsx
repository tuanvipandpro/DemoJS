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
} from '@mui/material';
import {
  Add as AddIcon,
  GitHub as GitHubIcon,
  Description as ReportIcon,
  Info as DetailIcon,
} from '@mui/icons-material';
import CreateProjectStepperModal from '../components/CreateProjectStepperModal';
import TestReportModal from '../components/TestReportModal';
import ProjectDetailModal from '../components/ProjectDetailModal';
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
  const [reportModal, setReportModal] = useState({ open: false, report: null, projectName: '' });
  const [detailModal, setDetailModal] = useState({ open: false, project: null });
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
      
      const response = await api.get('/github/projects');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load projects');
      }
      
      const projectsData = await response.json();
      setProjects(projectsData);
      
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err.message);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
      case 'Critical':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const response = await api.post('/github/projects', {
        name: projectData.name,
        description: projectData.description,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        team: projectData.team || 'Default Team',
        priority: projectData.priority || 'Medium',
        budget: projectData.budget || '$0',
        gitProvider: projectData.gitProvider || '',
        repository: projectData.repository || projectData.selectedRepository || '',
        branch: projectData.branch || '',
        notifications: projectData.selectedNotifications || []
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      const result = await response.json();
      const newProject = result.project;
      
      setProjects([newProject, ...projects]);
      setSnackbar({
        open: true,
        message: `Project "${newProject.name}" created successfully!`,
        severity: 'success',
      });
      
      // Reload projects to get fresh data
      loadProjects();
      
    } catch (err) {
      console.error('Failed to create project:', err);
      setSnackbar({
        open: true,
        message: `Failed to create project: ${err.message}`,
        severity: 'error',
      });
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      // TODO: Add delete endpoint
      setProjects(projects.filter(project => project.id !== projectId));
      setSnackbar({
        open: true,
        message: 'Project deleted successfully!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Failed to delete project:', err);
      setSnackbar({
        open: true,
        message: `Failed to delete project: ${err.message}`,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const openReport = (project) => {
    if (project.lastRun === 'Running') return;
    
    // For now, create a mock report
    const status = project.lastRun && project.lastRun !== 'Not run' ? project.lastRun : 'Not run';
    const coverageBefore = Math.max(0, (project.coverage || 0) - 1);
    const mockReport = {
      status,
      total: 42,
      passed: status === 'Passed' ? 41 : status === 'Failed' ? 37 : 0,
      failed: status === 'Passed' ? 1 : status === 'Failed' ? 5 : 0,
      duration: status === 'Not run' ? '—' : '1m 45s',
      coverageBefore,
      coverageAfter: project.coverage || 0,
      failedTests: status === 'Failed' ? [
        { name: 'critical flow should pass', error: 'AssertionError: expected true to be false' },
      ] : [],
      logs: status === 'Not run' ? 'No report available yet.' : '[INFO] Loaded cached report.',
    };
    
    setReportModal({ open: true, report: mockReport, projectName: project.name });
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
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="textSecondary">
            Auto-scan is enabled. New commits will trigger AI tests automatically.
          </Typography>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h4">
                {projects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4">
                {projects.filter(p => p.status === 'In Progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4">
                {projects.filter(p => p.status === 'Completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Planning
              </Typography>
              <Typography variant="h4">
                {projects.filter(p => p.status === 'Planning').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Table */}
      <TableContainer component={Paper}>
        <Table>
                     <TableHead>
             <TableRow>
               <TableCell>Project</TableCell>
               <TableCell>Description</TableCell>
               <TableCell>Provider</TableCell>
               <TableCell>Repository</TableCell>
               <TableCell>Branch</TableCell>
               <TableCell>Connected</TableCell>
               <TableCell>Notifications</TableCell>
               <TableCell>Status</TableCell>
               <TableCell>Progress</TableCell>
               <TableCell>Coverage</TableCell>
               <TableCell>Last Run</TableCell>
               <TableCell align="center">Actions</TableCell>
             </TableRow>
           </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {project.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200 }}>
                    {project.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {project.gitProvider ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GitHubIcon fontSize="small" />
                      <Typography variant="body2">{project.gitProvider}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{project.repository || project.selectedRepository || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{project.branch || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.gitProvider && (project.repository || project.selectedRepository) ? 'Connected' : 'Not connected'}
                    color={project.gitProvider && (project.repository || project.selectedRepository) ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                 <TableCell>
                   {project.notifications && project.notifications.length > 0 ? (
                     <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                       {project.notifications.slice(0, 2).map((notification) => (
                         <Chip
                           key={notification}
                           label={notification}
                           size="small"
                           variant="outlined"
                         />
                       ))}
                       {project.notifications.length > 2 && (
                         <Chip
                           label={`+${project.notifications.length - 2}`}
                           size="small"
                           variant="outlined"
                         />
                       )}
                     </Box>
                   ) : (
                     <Typography variant="body2" color="textSecondary">
                       None
                     </Typography>
                   )}
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
                    <Box
                      sx={{
                        width: 60,
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${project.progress}%`,
                          height: '100%',
                          bgcolor: project.status === 'Completed' ? '#2e7d32' : '#1976d2',
                        }}
                      />
                    </Box>
                    <Typography variant="body2">{project.progress}%</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 64 }}>
                    <Box sx={{ position: 'relative', width: 36, height: 36, display: 'inline-flex' }}>
                      <CircularProgress variant="determinate" value={project.coverage || 0} size={36} thickness={5} />
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
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
                    {/* Auto scan enabled: remove manual run button */}
                    <Tooltip title="View Report">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => openReport(project)}
                          disabled={project.lastRun === 'Running'}
                        >
                          <ReportIcon />
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

      {/* Test Report Modal */}
      <TestReportModal
        open={reportModal.open}
        onClose={() => setReportModal({ open: false, report: null, projectName: '' })}
        report={reportModal.report}
        projectName={reportModal.projectName}
      />

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
