import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Approval as ApprovalIcon,
  BugReport as BugReportIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { runsService } from '../services/runs';
import PipelineSteps from './PipelineSteps';

const TestRunDetailModal = ({ open, onClose, runId, onRunUpdate }) => {
  const [run, setRun] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && runId) {
      loadRunDetails();
    }
  }, [open, runId]);

  const loadRunDetails = async () => {
    setLoading(true);
    try {
      const [runResponse, logsResponse] = await Promise.all([
        runsService.getRunById(runId),
        runsService.getRunLogs(runId)
      ]);

      if (runResponse.success) {
        setRun(runResponse.run);
      }

      if (logsResponse.success) {
        setLogs(logsResponse.logs || []);
      }
    } catch (error) {
      console.error('Error loading run details:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status) => {
    const statusIcons = {
      queued: <ScheduleIcon />,
      planning: <PlayIcon />,
      proposals: <ApprovalIcon />,
      approved: <CheckIcon />,
      executing: <PlayIcon />,
      completed: <CheckIcon />,
      failed: <ErrorIcon />
    };
    return statusIcons[status] || <ScheduleIcon />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getProgressValue = () => {
    if (!run) return 0;
    const statusProgress = {
      queued: 10,
      planning: 25,
      proposals: 50,
      approved: 75,
      executing: 90,
      completed: 100,
      failed: 0
    };
    return statusProgress[run.state] || 0;
  };

  const getProgressColor = () => {
    if (!run) return 'primary';
    if (run.state === 'failed') return 'error';
    if (run.state === 'completed') return 'success';
    return 'primary';
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`run-tabpanel-${index}`}
      aria-labelledby={`run-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!run) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Alert severity="error">Run not found</Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Test Run #{run.id} - {run.projectName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {run.userEmail} • {formatDate(run.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getStatusIcon(run.state)}
              label={run.state.toUpperCase()}
              color={getStatusColor(run.state)}
              variant="outlined"
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={getProgressValue()}
            color={getProgressColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {getProgressValue()}% Complete
          </Typography>
        </Box>

        {/* Basic Info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Commit ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {run.commitId || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Branch</Typography>
                <Typography variant="body2">
                  {run.branch || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {formatDate(run.createdAt)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Updated</Typography>
                <Typography variant="body2">
                  {formatDate(run.updatedAt)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Message */}
        {run.errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {run.errorMessage}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<PlayIcon />} label="Pipeline" />
            <Tab icon={<CodeIcon />} label="Test Plan" />
            <Tab icon={<BugReportIcon />} label="Test Cases" />
            <Tab icon={<AssessmentIcon />} label="Results" />
            <Tab icon={<HistoryIcon />} label="Logs" />
          </Tabs>
        </Box>

        {/* Pipeline Tab */}
        <TabPanel value={activeTab} index={0}>
          <PipelineSteps 
            currentState={run.state} 
            errorMessage={run.errorMessage}
          />
        </TabPanel>

        {/* Test Plan Tab */}
        <TabPanel value={activeTab} index={1}>
          {run.testPlan ? (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                {typeof run.testPlan === 'string' ? run.testPlan : JSON.stringify(run.testPlan, null, 2)}
              </pre>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No test plan available
            </Typography>
          )}
        </TabPanel>

        {/* Test Cases Tab */}
        <TabPanel value={activeTab} index={2}>
          {run.proposals && run.proposals.length > 0 ? (
            <List>
              {run.proposals.map((proposal, index) => (
                <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                  <ListItemIcon>
                    <BugReportIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={proposal.title || `Proposal ${index + 1}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" component="div">
                          {proposal.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {proposal.testType && (
                            <Chip label={proposal.testType} size="small" />
                          )}
                          {proposal.priority && (
                            <Chip label={`Priority: ${proposal.priority}`} size="small" />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No proposals available
            </Typography>
          )}
        </TabPanel>

        {/* Results Tab */}
        <TabPanel value={activeTab} index={3}>
          {run.testResults ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="primary">
                        {run.testResults.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Tests
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="success.main">
                        {run.testResults.passed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Passed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="error.main">
                        {run.testResults.failed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="info.main">
                        {run.testResults.duration}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {run.coverage && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Coverage Report
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h4" color="primary">
                            {run.coverage.lines}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Line Coverage
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h4" color="primary">
                            {run.coverage.branches}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Branch Coverage
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h4" color="primary">
                            {run.coverage.functions}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Function Coverage
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {run.confidenceScore && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Confidence Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={run.confidenceScore * 100}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">
                      {(run.confidenceScore * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No test results available
            </Typography>
          )}
        </TabPanel>

        {/* Logs Tab */}
        <TabPanel value={activeTab} index={4}>
          {logs.length > 0 ? (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List>
                {logs.map((log, index) => (
                  <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon>
                      {log.level === 'error' ? <ErrorIcon color="error" /> :
                       log.level === 'warning' ? <ErrorIcon color="warning" /> :
                       <CheckIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={log.message}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(log.timestamp)}
                          </Typography>
                          <Chip label={log.level} size="small" />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No logs available
            </Typography>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestRunDetailModal;
