import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Pagination
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  BugReport as TestIcon,
  Merge as MergeIcon
} from '@mui/icons-material';
import { runsService } from '../services/runs';
import PipelineSteps from './PipelineSteps';

const RunPipelineModal = ({ open, onClose, runId }) => {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [approving, setApproving] = useState(false);
  const [pipelineKey, setPipelineKey] = useState(0);
  const [testCasesPage, setTestCasesPage] = useState(0);
  const [testCasesPerPage, setTestCasesPerPage] = useState(10);

  useEffect(() => {
    if (open && runId) {
      fetchRunDetails();
    }
  }, [open, runId]);

  // Force refresh PipelineSteps when run state changes
  useEffect(() => {
    if (run) {
      setPipelineKey(prev => prev + 1);
    }
  }, [run?.state, run?.proposals_json]);

  // Auto-refresh logic removed - user will manually refresh when needed

  const isActiveState = (state) => {
    const activeStates = ['queued', 'pulling_code', 'generating_tests', 'generating_scripts', 'running_tests', 'generating_report'];
    return activeStates.includes(state);
  };

  const isWaitingForApproval = (state) => {
    const approvalStates = ['test_approval', 'report_approval'];
    return approvalStates.includes(state);
  };

  const getStatusColor = (state) => {
    const stateMap = {
      'queued': 'default',
      'pulling_code': 'primary',
      'generating_tests': 'primary',
      'test_approval': 'warning',
      'generating_scripts': 'primary',
      'running_tests': 'primary',
      'generating_report': 'primary',
      'report_approval': 'warning',
      'completed': 'success',
      'failed': 'error'
    };
    return stateMap[state] || 'default';
  };

  const fetchRunDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await runsService.getRunById(runId);
      if (response.success) {
        setRun(response.run);
        
        // Auto-select all test cases if in proposals or test_approval state
        if ((response.run.state === 'proposals' || response.run.state === 'test_approval') && response.run.proposals_json) {
          const testCases = Array.isArray(response.run.proposals_json) 
            ? response.run.proposals_json 
            : JSON.parse(response.run.proposals_json || '[]');
          setSelectedTestCases(testCases.map(tc => tc.id));
        }
      } else {
        setError(response.error || 'Failed to fetch run details');
      }
    } catch (error) {
      console.error('Error fetching run details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCaseToggle = (testCaseId) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId) 
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  // Calculate pagination for test cases
  const testCases = run?.proposals_json ? (Array.isArray(run.proposals_json) ? run.proposals_json : JSON.parse(run.proposals_json || '[]')) : [];
  const totalPages = Math.ceil(testCases.length / testCasesPerPage);
  const startIndex = testCasesPage * testCasesPerPage;
  const endIndex = startIndex + testCasesPerPage;
  const paginatedTestCases = testCases.slice(startIndex, endIndex);

  const handleTestCasesPageChange = (event, page) => {
    setTestCasesPage(page - 1); // MUI Pagination is 1-based
  };

  const handleTestCasesPerPageChange = (event) => {
    setTestCasesPerPage(event.target.value);
    setTestCasesPage(0); // Reset to first page
  };

  const handleApproveTestCases = async () => {
    if (selectedTestCases.length === 0) {
      setError('Please select at least one test case to approve');
      return;
    }

    try {
      setApproving(true);
      setError(null);
      
      const testCases = Array.isArray(run.proposals_json) 
        ? run.proposals_json 
        : JSON.parse(run.proposals_json || '[]');
      
      const approvedTestCases = testCases.filter(tc => selectedTestCases.includes(tc.id));
      
      const response = await runsService.approveTestCases(runId, approvedTestCases);
      if (response.success) {
        // Refresh run details
        await fetchRunDetails();
      } else {
        setError(response.error || 'Failed to approve test cases');
      }
    } catch (error) {
      console.error('Error approving test cases:', error);
      setError(error.message);
    } finally {
      setApproving(false);
    }
  };


  const getStateInfo = (state) => {
    const stateMap = {
      'queued': { label: 'Queued', color: 'default', icon: <ScheduleIcon /> },
      'fetching_code': { label: 'Fetching Code', color: 'info', icon: <CodeIcon /> },
      'generating_test_cases': { label: 'Generating Test Cases', color: 'info', icon: <TestIcon /> },
      'proposals': { label: 'Waiting for Approval', color: 'warning', icon: <ScheduleIcon /> },
      'approved': { label: 'Approved', color: 'success', icon: <CheckIcon /> },
      'generating_test_scripts': { label: 'Generating Test Scripts', color: 'info', icon: <TestIcon /> },
      'creating_mr': { label: 'Creating Merge Request', color: 'info', icon: <MergeIcon /> },
      'completed': { label: 'Completed', color: 'success', icon: <CheckIcon /> },
      'failed': { label: 'Failed', color: 'error', icon: <ErrorIcon /> }
    };
    
    return stateMap[state] || { label: state, color: 'default', icon: <ScheduleIcon /> };
  };


  if (loading && !run) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error && !run) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Run Pipeline</DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Run Pipeline - {run?.projectName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={getStateInfo(run?.state).label}
              color={getStateInfo(run?.state).color}
              icon={getStateInfo(run?.state).icon}
            />
            <IconButton onClick={fetchRunDetails} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Run Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Run Information</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Branch</Typography>
                <Typography variant="body1">{run?.branch || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Created</Typography>
                <Typography variant="body1">
                  {run?.createdAt ? new Date(run.createdAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Updated</Typography>
                <Typography variant="body1">
                  {run?.updatedAt ? new Date(run.updatedAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={getStateInfo(run?.state).label}
                  color={getStateInfo(run?.state).color}
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Pipeline Steps */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">Pipeline Progress</Typography>
              {run && (
                <Chip 
                  label={run.state.replace('_', ' ').toUpperCase()} 
                  color={getStatusColor(run.state)}
                  size="small"
                  icon={isActiveState(run.state) ? <CircularProgress size={16} /> : null}
                />
              )}
            </Box>
            <PipelineSteps 
              key={pipelineKey}
              currentState={run?.state}
              errorMessage={run?.errorMessage}
              isFailed={run?.state === 'failed'}
              run={run}
              onRunUpdate={(updatedRun) => {
                setRun(updatedRun);
                // Force re-render of PipelineSteps
                setPipelineKey(prev => prev + 1);
              }}
            />
            
            {/* Test Cases Approval Section */}
            {run?.state === 'test_approval' && run?.proposals_json && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Generated Test Cases ({testCases.length})
                  </Typography>
                  {testCases.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel>Per page</InputLabel>
                        <Select
                          value={testCasesPerPage}
                          label="Per page"
                          onChange={handleTestCasesPerPageChange}
                        >
                          <MenuItem value={5}>5</MenuItem>
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={20}>20</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
                <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                  <List dense>
                    {paginatedTestCases.map((testCase, index) => (
                      <ListItem key={testCase.id || index} dense sx={{ borderBottom: '1px solid #f0f0f0', flexDirection: 'column', alignItems: 'stretch' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                          <ListItemIcon sx={{ minWidth: 'auto', mr: 1, mt: 0.5 }}>
                            <Checkbox
                              checked={selectedTestCases.includes(testCase.id || index)}
                              onChange={() => handleTestCaseToggle(testCase.id || index)}
                            />
                          </ListItemIcon>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {testCase.id || `Test Case ${index + 1}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              {testCase.description || 'No description available'}
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                              <Box>
                                <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                  INPUT:
                                </Typography>
                                <Typography variant="body2" component="pre" sx={{ 
                                  fontFamily: 'monospace', 
                                  fontSize: '0.75rem',
                                  backgroundColor: '#f5f5f5',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #e0e0e0',
                                  display: 'block',
                                  margin: 0,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}>
                                  {testCase.input ? JSON.stringify(testCase.input, null, 2) : 'No input specified'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                  EXPECTED:
                                </Typography>
                                <Typography variant="body2" component="pre" sx={{ 
                                  fontFamily: 'monospace', 
                                  fontSize: '0.75rem',
                                  backgroundColor: '#e8f5e8',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #c8e6c9',
                                  display: 'block',
                                  margin: 0,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word'
                                }}>
                                  {testCase.expected ? JSON.stringify(testCase.expected, null, 2) : 'No expected result specified'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={testCasesPage + 1}
                      onChange={handleTestCasesPageChange}
                      color="primary"
                      size="small"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTestCases.length} of {(Array.isArray(run.proposals_json) ? run.proposals_json : JSON.parse(run.proposals_json || '[]')).length} test cases selected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        const allTestCases = Array.isArray(run.proposals_json) ? run.proposals_json : JSON.parse(run.proposals_json || '[]');
                        setSelectedTestCases(allTestCases.map(tc => tc.id || allTestCases.indexOf(tc)));
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setSelectedTestCases([])}
                    >
                      Clear All
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {run?.testResults && Object.keys(run.testResults).length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Test Results</Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>View Test Results</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
                    {JSON.stringify(run.testResults, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {(run?.state === 'proposals' || run?.state === 'test_approval') && (
          <Button
            variant="contained"
            onClick={handleApproveTestCases}
            disabled={approving || selectedTestCases.length === 0}
            startIcon={approving ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {approving ? 'Approving...' : `Approve ${selectedTestCases.length} Test Cases`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RunPipelineModal;
