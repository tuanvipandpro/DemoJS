import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  GitHub as GitHubIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Refresh as RefreshIcon,
  Timeline as PipelineIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import CreateProjectModal from '../components/CreateProjectModal';
import ProjectDetailModal from '../components/ProjectDetailModal';
import RunTestModal from '../components/RunTestModal';
import RunPipelineModal from '../components/RunPipelineModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { projectsService } from '../services/projects';
import { runsService } from '../services/runs';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmRunOpen, setConfirmRunOpen] = useState(false);
  const [selectedProjectToRun, setSelectedProjectToRun] = useState(null);
  const [runningProject, setRunningProject] = useState(false);
  const [runTestModalOpen, setRunTestModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [selectedProjectForPipeline, setSelectedProjectForPipeline] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []); // Re-fetch when component mounts

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      const response = await projectsService.getAllProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshProjects = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await projectsService.getAllProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error refreshing projects:', error);
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setError(null);
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleProjectDeleted = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setConfirmDeleteOpen(true);
  };

  const handleViewPipeline = async (project) => {
    try {
      setLoadingRuns(true);
      setSelectedProjectForPipeline(project);
      
      // Lấy runs mới nhất của project
      const response = await runsService.getRuns({ projectId: project.id, limit: 1 });
      
      if (response.success && response.runs && response.runs.length > 0) {
        // Mở pipeline modal với run mới nhất
        setSelectedRunId(response.runs[0].id);
        setPipelineModalOpen(true);
      } else {
        setError('No test runs found for this project');
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
      setError('Failed to load test runs');
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setDeletingProject(true);
      const response = await projectsService.deleteProject(projectToDelete.id);
      if (response.success) {
        handleProjectDeleted(projectToDelete.id);
        setConfirmDeleteOpen(false);
        setProjectToDelete(null);
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.message || 'Failed to delete project');
    } finally {
      setDeletingProject(false);
    }
  };

  const handleRunProject = (project) => {
    setSelectedProjectToRun(project);
    setRunTestModalOpen(true);
  };

  const handleRunCreated = (newRun) => {
    setRunTestModalOpen(false);
    // Optionally show success message or refresh data
  };

  const handleConfirmRun = async () => {
    try {
      setRunningProject(true);
      // TODO: Implement project run functionality

      // Có thể gọi API để chạy project
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConfirmRunOpen(false);
      setSelectedProjectToRun(null);
      // TODO: Show success message
    } catch (error) {
      console.error('Error running project:', error);
      // TODO: Show error message
    } finally {
      setRunningProject(false);
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setDetailModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'archived': return 'warning';
      default: return 'default';
    }
  };

  const getGitProviderIcon = (provider) => {
    switch (provider) {
      case 'github': return <GitHubIcon />;
      case 'gitlab': return <GitHubIcon />; // Replace with GitLab icon when available
      case 'bitbucket': return <GitHubIcon />; // Replace with Bitbucket icon when available
      default: return <GitHubIcon />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading projects...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefreshProjects}
            disabled={refreshing || loading}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Project
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Create your first project to get started with automated testing
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Your First Project
          </Button>
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {projects.map((project, index) => (
            <React.Fragment key={project.id}>
              <ListItem
                sx={{
                  py: 2,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {project.name.charAt(0).toUpperCase()}
                </Avatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" component="span">
                        {project.name}
                      </Typography>
                      <Chip
                        label={project.status}
                        color={getStatusColor(project.status)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography component="div">
                      {project.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {project.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Owner: <strong>{project.ownerDisplayName || project.ownerUsername}</strong>
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      {project.repository && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Tooltip title={project.gitProvider}>
                            <IconButton size="small">
                              {getGitProviderIcon(project.gitProvider)}
                            </IconButton>
                          </Tooltip>
                          <Typography variant="body2" color="textSecondary" sx={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            maxWidth: 300
                          }}>
                            {project.repository}
                          </Typography>
                        </Box>
                      )}

                      {project.notifyChannel && project.notifyChannel !== 'none' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            Notifications:
                          </Typography>
                          <Chip
                            label={project.notifyChannel}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      )}

                      {project.instruction && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="textSecondary">
                            Instructions:
                          </Typography>
                          <Chip
                            label="Has Instructions"
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </Box>
                      )}
                    </Typography>
                  }
                />

                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewProject(project)}
                      variant="outlined"
                    >
                      View
                    </Button>
                    <Tooltip title="View Pipeline">
                      <IconButton
                        size="small"
                        onClick={() => handleViewPipeline(project)}
                        disabled={loadingRuns}
                        color="info"
                      >
                        {loadingRuns ? <CircularProgress size={20} /> : <PipelineIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Run Test">
                      <IconButton
                        size="small"
                        onClick={() => handleRunProject(project)}
                        disabled={runningProject}
                        color="primary"
                      >
                        <RunIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Project">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProject(project)}
                        color="error"
                        disabled={deletingProject}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < projects.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleProjectCreated}
      />

      {selectedProject && (
        <ProjectDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          project={selectedProject}
          onProjectUpdated={handleProjectUpdated}
          onProjectDeleted={handleProjectDeleted}
        />
      )}

      {/* Run Test Modal */}
      <RunTestModal
        open={runTestModalOpen}
        onClose={() => setRunTestModalOpen(false)}
        project={selectedProjectToRun}
        onRunCreated={handleRunCreated}
      />

      {/* Confirm Run Dialog */}
      <ConfirmDialog
        open={confirmRunOpen}
        onClose={() => {
          setConfirmRunOpen(false);
          setSelectedProjectToRun(null);
        }}
        onConfirm={handleConfirmRun}
        title="Xác nhận chạy Project"
        message={`Bạn có chắc chắn muốn chạy project "${selectedProjectToRun?.name}"? Hành động này sẽ bắt đầu quá trình test automation.`}
        confirmText="Chạy Project"
        cancelText="Hủy"
        severity="warning"
        loading={runningProject}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa Project"
        message={`Bạn có chắc chắn muốn xóa project "${projectToDelete?.name}"? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.`}
        confirmText="Xóa Project"
        cancelText="Hủy"
        severity="error"
        loading={deletingProject}
      />

      {/* Run Pipeline Modal */}
      <RunPipelineModal
        open={pipelineModalOpen}
        onClose={() => {
          setPipelineModalOpen(false);
          setSelectedRunId(null);
        }}
        runId={selectedRunId}
      />
    </Container>
  );
};

export default Projects;
