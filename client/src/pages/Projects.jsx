import React, { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';
import { projectsService } from '../services/projects';
import GitHubConnectModal from '../components/GitHubConnectModal';

const Projects = ({ onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsService.getAllProjects();
      if (response.success) {
        setProjects(response.projects);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      setError('Error loading projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await projectsService.deleteProject(projectId);
      // Refresh projects after deletion
      fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleGitHubSuccess = (githubData) => {
    console.log('GitHub connected successfully:', githubData);
    // Có thể thêm logic để lưu thông tin GitHub vào project hoặc user profile
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Planning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button onClick={fetchProjects} variant="outlined" sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Projects
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={() => setShowGitHubModal(true)}
          >
            Connect Repository
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => console.log('Add new project')}
          >
            New Project
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Repository</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>GitHub Token</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.name}</TableCell>
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
                <TableCell>
                  {project.repository ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GitHubIcon fontSize="small" />
                      <Typography variant="body2">{project.repository}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Not connected</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {project.branch ? (
                    <Chip label={project.branch} size="small" variant="outlined" />
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {project.personalAccessToken ? (
                    <Chip 
                      label="Token Saved" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                      icon={<GitHubIcon />}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">No token</Typography>
                  )}
                </TableCell>
                <TableCell>{project.startDate}</TableCell>
                <TableCell>{project.endDate}</TableCell>
                <TableCell>{project.team}</TableCell>
                <TableCell>
                  <Chip
                    label={project.priority}
                    color={getPriorityColor(project.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => onNavigate && onNavigate('project-detail', { id: project.id })}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => console.log('Edit project', project.id)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeleteProject(project.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* GitHub Connect Modal */}
      <GitHubConnectModal
        open={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        onSuccess={handleGitHubSuccess}
      />
    </Box>
  );
};

export default Projects;
