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
  const [autoRefresh, setAutoRefresh] = useState(false);
  
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

  // Auto-refresh for active runs
  useEffect(() => {
    let interval;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchRuns();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, filters]);

  // Check if there are any active runs
  useEffect(() => {
    const hasActiveRuns = runs.some(run => 
      ['queued', 'pulling_code', 'generating_tests', 'generating_scripts', 'running_tests', 'generating_report'].includes(run.state)
    );
    setAutoRefresh(hasActiveRuns);
  }, [runs]);

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
    // Mở pipeline modal để hiển thị progress
    setSelectedRunId(newRun.id);
    setRunDetailModalOpen(true);
    fetchRuns();
  };

  const getStatusCounts = () => {
    const counts = {
      queued: 0,
      pulling_code: 0,
      generating_tests: 0,
      test_approval: 0,
      generating_scripts: 0,
      running_tests: 0,
      generating_report: 0,
      report_approval: 0,
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
      pulling_code: 'info',
      generating_tests: 'info',
      test_approval: 'warning',
      generating_scripts: 'info',
      running_tests: 'secondary',
      generating_report: 'info',
      report_approval: 'warning',
      completed: 'success',
      failed: 'error'
    };
    return statusColors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      queued: 'Queued',
      pulling_code: 'Pulling Code',
      generating_tests: 'Generating Tests',
      test_approval: 'Test Approval',
      generating_scripts: 'Generating Scripts',
      running_tests: 'Running Tests',
      generating_report: 'Generating Report',
      report_approval: 'Report Approval',
      completed: 'Completed',
      failed: 'Failed'
    };
    return statusLabels[status] || status;
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
          {autoRefresh && (
            <Chip
              label="Auto-refreshing"
              color="info"
              variant="outlined"
              size="small"
            />
          )}
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
                  {getStatusLabel(status)}
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
                <MenuItem value="pulling_code">Pulling Code</MenuItem>
                <MenuItem value="generating_tests">Generating Tests</MenuItem>
                <MenuItem value="test_approval">Test Approval</MenuItem>
                <MenuItem value="generating_scripts">Generating Scripts</MenuItem>
                <MenuItem value="running_tests">Running Tests</MenuItem>
                <MenuItem value="generating_report">Generating Report</MenuItem>
                <MenuItem value="report_approval">Report Approval</MenuItem>
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
