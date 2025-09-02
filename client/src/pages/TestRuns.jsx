import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { runsService } from '../services/runs';
import { projectsService } from '../services/projects';
import TestRunCard from '../components/TestRunCard';
import TestRunDetailModal from '../components/TestRunDetailModal';
import RunTestModal from '../components/RunTestModal';

const TestRuns = () => {
  const [runs, setRuns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    search: ''
  });
  
  // Modals
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runDetailModalOpen, setRunDetailModalOpen] = useState(false);
  const [runTestModalOpen, setRunTestModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRuns(),
        fetchProjects()
      ]);
    } catch (error) {
      setError('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const response = await runsService.getRuns(filters);
      if (response.success) {
        setRuns(response.runs || []);
      }
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getAllProjects();
      if (response.success) {
        setProjects(response.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleRefresh = () => {
    fetchRuns();
  };

  const handleRunUpdate = () => {
    fetchRuns();
  };

  const handleViewRunDetails = (run) => {
    setSelectedRunId(run.id);
    setRunDetailModalOpen(true);
  };

  const handleCreateRun = () => {
    setRunTestModalOpen(true);
  };

  const handleRunCreated = (newRun) => {

    fetchRuns();
  };

  const getStatusCounts = () => {
    const counts = {
      queued: 0,
      planning: 0,
      proposals: 0,
      approved: 0,
      executing: 0,
      completed: 0,
      failed: 0
    };

    runs.forEach(run => {
      if (counts.hasOwnProperty(run.state)) {
        counts[run.state]++;
      }
    });

    return counts;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      queued: 'default',
      planning: 'info',
      proposals: 'warning',
      approved: 'primary',
      executing: 'secondary',
      completed: 'success',
      failed: 'error'
    };
    return statusColors[status] || 'default';
  };

  const filteredRuns = runs.filter(run => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        run.projectName?.toLowerCase().includes(searchLower) ||
        run.commitId?.toLowerCase().includes(searchLower) ||
        run.branch?.toLowerCase().includes(searchLower) ||
        run.userEmail?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Test Runs
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage and monitor your test executions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateRun}
          >
            Create Run
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Status Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Grid item xs={12} sm={6} md={2} key={status}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={`${getStatusColor(status)}.main`}>
                  {count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                label="Project"
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="queued">Queued</MenuItem>
                <MenuItem value="planning">Planning</MenuItem>
                <MenuItem value="proposals">Proposals</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="executing">Executing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({ projectId: '', status: '', search: '' })}
                fullWidth
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Test Runs List */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Test Runs ({filteredRuns.length})
          </Typography>
        </Box>

        {filteredRuns.length > 0 ? (
          <Box>
            {filteredRuns.map((run) => (
              <TestRunCard
                key={run.id}
                run={run}
                onRunUpdate={handleRunUpdate}
                onViewDetails={handleViewRunDetails}
              />
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No test runs found
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateRun}
            >
              Create First Test Run
            </Button>
          </Box>
        )}
      </Paper>

      {/* Modals */}
      <RunTestModal
        open={runTestModalOpen}
        onClose={() => setRunTestModalOpen(false)}
        project={selectedProject}
        onRunCreated={handleRunCreated}
      />

      <TestRunDetailModal
        open={runDetailModalOpen}
        onClose={() => setRunDetailModalOpen(false)}
        runId={selectedRunId}
        onRunUpdate={handleRunUpdate}
      />
    </Box>
  );
};

export default TestRuns;
