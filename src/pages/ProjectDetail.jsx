import React, { useState } from 'react';
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

const ProjectDetail = () => {
  const [project] = useState({
    id: 1,
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX and improved performance.',
    status: 'In Progress',
    progress: 75,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    team: [
      { id: 1, name: 'John Doe', role: 'Project Manager', avatar: 'JD' },
      { id: 2, name: 'Jane Smith', role: 'Frontend Developer', avatar: 'JS' },
      { id: 3, name: 'Mike Johnson', role: 'Backend Developer', avatar: 'MJ' },
      { id: 4, name: 'Sarah Wilson', role: 'UI/UX Designer', avatar: 'SW' },
    ],
    priority: 'High',
    budget: '$25,000',
    tasks: [
      { id: 1, title: 'Design System Setup', status: 'Completed', assignee: 'Sarah Wilson' },
      { id: 2, title: 'Homepage Development', status: 'In Progress', assignee: 'Jane Smith' },
      { id: 3, title: 'API Integration', status: 'In Progress', assignee: 'Mike Johnson' },
      { id: 4, title: 'Testing & QA', status: 'Pending', assignee: 'John Doe' },
    ],
    milestones: [
      { id: 1, title: 'Design Approval', date: '2024-01-20', status: 'Completed' },
      { id: 2, title: 'Frontend Development', date: '2024-02-15', status: 'In Progress' },
      { id: 3, title: 'Backend Integration', date: '2024-02-28', status: 'Pending' },
      { id: 4, title: 'Testing & Launch', date: '2024-03-15', status: 'Pending' },
    ],
  });

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
            {project.name}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {project.description}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Project">
            <IconButton color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Project">
            <IconButton color="error">
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
                    label={project.status}
                    color={getStatusColor(project.status)}
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
                    label={project.priority}
                    color={getPriorityColor(project.priority)}
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
                    {project.startDate}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    End Date
                  </Typography>
                  <Typography variant="body1">
                    {project.endDate}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Budget
                  </Typography>
                  <Typography variant="body1">
                    {project.budget}
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
                      value={project.progress}
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography variant="body2">
                      {project.progress}%
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
              {project.tasks.map((task) => (
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
              {project.milestones.map((milestone) => (
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
              {project.team.map((member) => (
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
