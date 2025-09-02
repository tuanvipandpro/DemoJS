import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Collapse,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon,
  Approval as ApprovalIcon,
  BugReport as BugReportIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { runsService } from '../services/runs';

const TestRunCard = ({ run, onRunUpdate, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const loadLogs = async () => {
    if (logs.length > 0) return; // Already loaded
    
    setLoadingLogs(true);
    try {
      const response = await runsService.getRunLogs(run.id);
      if (response.success) {
        setLogs(response.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleApproveProposals = async () => {
    setActionLoading(true);
    try {
      // For now, approve all proposals
      const approvedProposals = run.proposals || [];
      const response = await runsService.approveProposals(run.id, approvedProposals);
      
      if (response.success) {
        onRunUpdate && onRunUpdate();
      }
    } catch (error) {
      console.error('Error approving proposals:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteTests = async () => {
    setActionLoading(true);
    try {
      const response = await runsService.executeTests(run.id);
      
      if (response.success) {
        onRunUpdate && onRunUpdate();
      }
    } catch (error) {
      console.error('Error executing tests:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDecision = async (decision) => {
    setActionLoading(true);
    try {
      const response = await runsService.recordDecision(run.id, decision, {
        reason: `Decision made: ${decision}`,
        confidence: run.confidenceScore || 0.8,
        notes: 'User decision'
      });
      
      if (response.success) {
        onRunUpdate && onRunUpdate();
      }
    } catch (error) {
      console.error('Error recording decision:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded) {
      loadLogs();
    }
  };

  const getProgressValue = () => {
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
    if (run.state === 'failed') return 'error';
    if (run.state === 'completed') return 'success';
    return 'primary';
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Run #{run.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {run.projectName} • {run.userEmail}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getStatusIcon(run.state)}
              label={run.state.toUpperCase()}
              color={getStatusColor(run.state)}
              variant="outlined"
            />
            <IconButton onClick={toggleExpanded} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2 }}>
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Commit</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {run.commitId || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Branch</Typography>
            <Typography variant="body2">
              {run.branch || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Created</Typography>
            <Typography variant="body2">
              {formatDate(run.createdAt)}
            </Typography>
          </Box>
          {run.finishedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary">Finished</Typography>
              <Typography variant="body2">
                {formatDate(run.finishedAt)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Error Message */}
        {run.errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {run.errorMessage}
          </Alert>
        )}

        {/* Test Results Summary */}
        {run.testResults && (
          <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mb: 2 }}>
            <Typography variant="subtitle2" color="success.dark" gutterBottom>
              Test Results
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="success.dark">
                <strong>Total:</strong> {run.testResults.total}
              </Typography>
              <Typography variant="body2" color="success.dark">
                <strong>Passed:</strong> {run.testResults.passed}
              </Typography>
              <Typography variant="body2" color="success.dark">
                <strong>Failed:</strong> {run.testResults.failed}
              </Typography>
              <Typography variant="body2" color="success.dark">
                <strong>Duration:</strong> {run.testResults.duration}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Coverage Summary */}
        {run.coverage && (
          <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1, mb: 2 }}>
            <Typography variant="subtitle2" color="info.dark" gutterBottom>
              Coverage
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="info.dark">
                <strong>Lines:</strong> {run.coverage.lines}%
              </Typography>
              <Typography variant="body2" color="info.dark">
                <strong>Branches:</strong> {run.coverage.branches}%
              </Typography>
              <Typography variant="body2" color="info.dark">
                <strong>Functions:</strong> {run.coverage.functions}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Expanded Content */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* Test Plan */}
          {run.testPlan && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Test Plan
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                  {typeof run.testPlan === 'string' ? run.testPlan : JSON.stringify(run.testPlan, null, 2)}
                </pre>
              </Box>
            </Box>
          )}

          {/* Proposals */}
          {run.proposals && run.proposals.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Test Proposals ({run.proposals.length})
              </Typography>
              <List dense>
                {run.proposals.map((proposal, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <BugReportIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={proposal.title || `Proposal ${index + 1}`}
                      secondary={proposal.description || proposal.testType}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Logs */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Execution Logs
            </Typography>
            {loadingLogs ? (
              <LinearProgress />
            ) : (
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {logs.length > 0 ? (
                  <List dense>
                    {logs.map((log, index) => (
                      <ListItem key={index} sx={{ pl: 0 }}>
                        <ListItemIcon>
                          {log.level === 'error' ? <ErrorIcon color="error" fontSize="small" /> :
                           log.level === 'warning' ? <ErrorIcon color="warning" fontSize="small" /> :
                           <CheckIcon color="info" fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={log.message}
                          secondary={new Date(log.timestamp).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No logs available
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <Button
            startIcon={<ViewIcon />}
            onClick={() => onViewDetails && onViewDetails(run)}
            size="small"
          >
            View Details
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {run.state === 'proposals' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ApprovalIcon />}
              onClick={handleApproveProposals}
              disabled={actionLoading}
              size="small"
            >
              Approve Proposals
            </Button>
          )}
          
          {run.state === 'approved' && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PlayIcon />}
              onClick={handleExecuteTests}
              disabled={actionLoading}
              size="small"
            >
              Execute Tests
            </Button>
          )}
          
          {run.state === 'completed' && !run.decision && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="success"
                onClick={() => handleRecordDecision('commit')}
                disabled={actionLoading}
                size="small"
              >
                Commit
              </Button>
              <Button
                variant="outlined"
                color="info"
                onClick={() => handleRecordDecision('pr')}
                disabled={actionLoading}
                size="small"
              >
                Create PR
              </Button>
              <Button
                variant="outlined"
                color="default"
                onClick={() => handleRecordDecision('none')}
                disabled={actionLoading}
                size="small"
              >
                None
              </Button>
            </Box>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default TestRunCard;
