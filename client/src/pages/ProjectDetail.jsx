import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { projectsService } from '../services/projects';

const ProjectDetail = ({ id, onNavigate }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id, fetchProject]);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectsService.getProjectById(id);
      if (response.success) {
        setProject(response.project);
      } else {
        setError('Failed to fetch project');
      }
    } catch (err) {
      setError('Error loading project');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDeleteProject = useCallback(async () => {
    try {
      await projectsService.deleteProject(id);
      if (onNavigate) {
        onNavigate('projects');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  }, [id, onNavigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Alert severity="error">
          {error || 'Project not found'}
        </Alert>
        <Button onClick={() => onNavigate && onNavigate('projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  // Use mock data if project doesn't have required fields
  const projectData = {
    ...project,
    tasks: project.tasks || [
      { id: 1, title: 'Design System Setup', status: 'Completed', assignee: 'Sarah Wilson' },
      { id: 2, title: 'Homepage Development', status: 'In Progress', assignee: 'Jane Smith' },
      { id: 3, title: 'API Integration', status: 'Planning', assignee: 'Mike Johnson' }
    ],
    team: project.team || [
      { id: 1, name: 'John Doe', role: 'Project Manager', avatar: 'JD' },
      { id: 2, name: 'Jane Smith', role: 'Frontend Developer', avatar: 'JS' },
      { id: 3, name: 'Mike Johnson', role: 'Backend Developer', avatar: 'MJ' },
      { id: 4, name: 'Sarah Wilson', role: 'UI/UX Designer', avatar: 'SW' }
    ],
    milestones: project.milestones || [
      { id: 1, title: 'Design Phase Complete', status: 'Completed', date: '2024-01-31' },
      { id: 2, title: 'Development Phase Start', status: 'In Progress', date: '2024-02-01' },
      { id: 3, title: 'Testing Phase', status: 'Planning', date: '2024-03-01' }
    ]
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Pending':
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                 <Box>
           <Typography variant="h4" gutterBottom>
             {projectData.name}
           </Typography>
           <Typography variant="body1" color="textSecondary">
             {projectData.description}
           </Typography>
         </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Project">
            <IconButton color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Project">
            <IconButton color="error" onClick={handleDeleteProject}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Project Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                                     <Chip
                     label={projectData.status}
                     color={getStatusColor(projectData.status)}
                     size="small"
                   />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Priority
                  </Typography>
                                     <Chip
                     label={projectData.priority}
                     color={getPriorityColor(projectData.priority)}
                     size="small"
                   />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Start Date
                  </Typography>
                                     <Typography variant="body1">
                     {projectData.startDate}
                   </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    End Date
                  </Typography>
                                     <Typography variant="body1">
                     {projectData.endDate}
                   </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Budget
                  </Typography>
                                     <Typography variant="body1">
                     {projectData.budget}
                   </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={projectData.progress}
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography variant="body2">
                      {projectData.progress}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

                     {/* Tasks */}
           <Paper sx={{ p: 3, mb: 3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6">
                 Tasks
               </Typography>
               <Button
                 variant="outlined"
                 size="small"
                 startIcon={<AddIcon />}
               >
                 Add Task
               </Button>
             </Box>
             <List>
               {projectData.tasks.map((task) => (
                 <ListItem key={task.id} divider>
                   <ListItemAvatar>
                     <Avatar sx={{ bgcolor: getStatusColor(task.status) === 'success' ? '#2e7d32' : '#1976d2' }}>
                       <ProjectIcon />
                     </Avatar>
                   </ListItemAvatar>
                   <ListItemText
                     primary={task.title}
                     secondary={`${task.status} • ${task.assignee}`}
                   />
                   <Chip
                     label={task.status}
                     color={getStatusColor(task.status)}
                     size="small"
                   />
                 </ListItem>
               ))}
             </List>
           </Paper>

                     {/* Milestones */}
           <Paper sx={{ p: 3 }}>
             <Typography variant="h6" gutterBottom>
               Milestones
             </Typography>
             <List>
               {projectData.milestones.map((milestone) => (
                 <ListItem key={milestone.id} divider>
                   <ListItemAvatar>
                     <Avatar sx={{ bgcolor: getStatusColor(milestone.status) === 'success' ? '#2e7d32' : '#1976d2' }}>
                       <ScheduleIcon />
                     </Avatar>
                   </ListItemAvatar>
                   <ListItemText
                     primary={milestone.title}
                     secondary={milestone.date}
                   />
                   <Chip
                     label={milestone.status}
                     color={getStatusColor(milestone.status)}
                     size="small"
                   />
                 </ListItem>
               ))}
             </List>
           </Paper>
        </Grid>

        {/* Team & Quick Actions */}
        <Grid item xs={12} md={4}>
          {/* Team */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Members
            </Typography>
                         <List>
               {projectData.team.map((member) => (
                 <ListItem key={member.id}>
                   <ListItemAvatar>
                     <Avatar>{member.avatar}</Avatar>
                   </ListItemAvatar>
                   <ListItemText
                     primary={member.name}
                     secondary={member.role}
                   />
                 </ListItem>
               ))}
             </List>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Add Member
            </Button>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" fullWidth>
                Update Progress
              </Button>
              <Button variant="outlined" fullWidth>
                Schedule Meeting
              </Button>
              <Button variant="outlined" fullWidth>
                Generate Report
              </Button>
              <Button variant="outlined" fullWidth>
                Share Project
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectDetail;
