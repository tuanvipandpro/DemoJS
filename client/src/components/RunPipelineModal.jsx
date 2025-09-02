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
  Tooltip
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

const RunPipelineModal = ({ open, onClose, runId }) => {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (open && runId) {
      fetchRunDetails();
    }
  }, [open, runId]);

  // Auto-refresh khi run đang trong progress
  useEffect(() => {
    if (!open || !run) return;

    const isInProgress = ['queued', 'fetching_code', 'generating_test_cases', 'generating_test_scripts', 'creating_mr'].includes(run.state);
    
    if (isInProgress) {
      const interval = setInterval(() => {
        fetchRunDetails();
      }, 3000); // Refresh mỗi 3 giây

      return () => clearInterval(interval);
    }
  }, [open, run?.state]);

  const fetchRunDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await runsService.getRunById(runId);
      if (response.success) {
        setRun(response.run);
        
        // Auto-select all test cases if in proposals state
        if (response.run.state === 'proposals' && response.run.proposalsJson) {
          const testCases = Array.isArray(response.run.proposalsJson) 
            ? response.run.proposalsJson 
            : JSON.parse(response.run.proposalsJson || '[]');
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

  const handleApproveTestCases = async () => {
    if (selectedTestCases.length === 0) {
      setError('Please select at least one test case to approve');
      return;
    }

    try {
      setApproving(true);
      setError(null);
      
      const testCases = Array.isArray(run.proposalsJson) 
        ? run.proposalsJson 
        : JSON.parse(run.proposalsJson || '[]');
      
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

  const getStepIcon = (step, currentStep, runState) => {
    if (step < currentStep) return <CheckIcon color="success" />;
    if (step === currentStep) {
      // Hiển thị loading nếu đang trong progress
      const isInProgress = ['queued', 'fetching_code', 'generating_test_cases', 'generating_test_scripts', 'creating_mr'].includes(runState);
      if (isInProgress) {
        return <CircularProgress size={20} />;
      }
      // Nếu đang chờ approval
      if (runState === 'proposals') {
        return <ScheduleIcon color="warning" />;
      }
      // Nếu failed
      if (runState === 'failed') {
        return <ErrorIcon color="error" />;
      }
    }
    return <ScheduleIcon color="disabled" />;
  };

  const getStepStatus = (step, currentStep) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
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

  const steps = [
    { label: 'Fetch Code', state: 'fetching_code' },
    { label: 'Generate Test Cases', state: 'generating_test_cases' },
    { label: 'Review & Approve', state: 'proposals' },
    { label: 'Generate Test Scripts', state: 'generating_test_scripts' },
    { label: 'Create Merge Request', state: 'creating_mr' },
    { label: 'Completed', state: 'completed' }
  ];

  const currentStepIndex = steps.findIndex(step => step.state === run?.state);

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
            <Typography variant="h6" gutterBottom>Pipeline Progress</Typography>
            <Stepper activeStep={currentStepIndex} orientation="vertical">
              {steps.map((step, index) => (
                                 <Step key={step.label} completed={index < currentStepIndex}>
                   <StepLabel
                     icon={getStepIcon(index, currentStepIndex, run?.state)}
                     error={run?.state === 'failed' && index === currentStepIndex}
                   >
                     {step.label}
                   </StepLabel>
                  <StepContent>
                    {/* Status message cho từng step */}
                    {step.state === run?.state && (
                      <Box sx={{ mt: 1, mb: 2 }}>
                        {run?.state === 'fetching_code' && (
                          <Alert severity="info">
                            <Typography variant="body2">
                              Đang tải source code từ branch <strong>{run?.branch}</strong>...
                            </Typography>
                          </Alert>
                        )}
                        {run?.state === 'generating_test_cases' && (
                          <Alert severity="info">
                            <Typography variant="body2">
                              Đang tạo test cases dựa trên source code và instruction...
                            </Typography>
                          </Alert>
                        )}
                        {run?.state === 'generating_test_scripts' && (
                          <Alert severity="info">
                            <Typography variant="body2">
                              Đang tạo test scripts từ approved test cases...
                            </Typography>
                          </Alert>
                        )}
                        {run?.state === 'creating_mr' && (
                          <Alert severity="info">
                            <Typography variant="body2">
                              Đang tạo Merge Request với test scripts...
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    )}
                    
                    {step.state === 'proposals' && run?.proposalsJson && (
                       <Box sx={{ mt: 2 }}>
                         <Typography variant="subtitle2" gutterBottom>
                           Generated Test Cases ({Array.isArray(run.proposalsJson) ? run.proposalsJson.length : JSON.parse(run.proposalsJson || '[]').length})
                         </Typography>
                         <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                           <List dense>
                             {(Array.isArray(run.proposalsJson) ? run.proposalsJson : JSON.parse(run.proposalsJson || '[]')).map((testCase, index) => (
                               <ListItem key={testCase.id || index} dense sx={{ borderBottom: '1px solid #f0f0f0' }}>
                                 <ListItemIcon>
                                   <Checkbox
                                     checked={selectedTestCases.includes(testCase.id || index)}
                                     onChange={() => handleTestCaseToggle(testCase.id || index)}
                                   />
                                 </ListItemIcon>
                                 <ListItemText
                                   primary={
                                     <Box>
                                       <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                         {testCase.title || `Test Case ${index + 1}`}
                                       </Typography>
                                       <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                         <Chip 
                                           label={testCase.testType || 'unit'} 
                                           size="small" 
                                           color="primary" 
                                           variant="outlined"
                                         />
                                         <Chip 
                                           label={testCase.priority || 'medium'} 
                                           size="small" 
                                           color={testCase.priority === 'high' ? 'error' : testCase.priority === 'medium' ? 'warning' : 'default'}
                                           variant="outlined"
                                         />
                                       </Box>
                                     </Box>
                                   }
                                   secondary={
                                     <Box sx={{ mt: 1 }}>
                                       <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                         {testCase.description || 'No description available'}
                                       </Typography>
                                       
                                       {testCase.testSteps && testCase.testSteps.length > 0 && (
                                         <Box>
                                           <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                             Test Steps:
                                           </Typography>
                                           <List dense sx={{ py: 0 }}>
                                             {testCase.testSteps.map((step, stepIndex) => (
                                               <ListItem key={stepIndex} dense sx={{ py: 0, pl: 2 }}>
                                                 <ListItemText
                                                   primary={
                                                     <Typography variant="caption" color="text.secondary">
                                                       {stepIndex + 1}. {step}
                                                     </Typography>
                                                   }
                                                 />
                                               </ListItem>
                                             ))}
                                           </List>
                                         </Box>
                                       )}
                                       
                                       {testCase.expectedResult && (
                                         <Box sx={{ mt: 1 }}>
                                           <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                             Expected Result:
                                           </Typography>
                                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                             {testCase.expectedResult}
                                           </Typography>
                                         </Box>
                                       )}
                                       
                                       {testCase.testData && (
                                         <Box sx={{ mt: 1 }}>
                                           <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                             Test Data:
                                           </Typography>
                                           <pre style={{ 
                                             fontSize: '10px', 
                                             backgroundColor: '#f5f5f5', 
                                             padding: '4px', 
                                             borderRadius: '4px',
                                             margin: '4px 0',
                                             overflow: 'auto',
                                             maxHeight: '100px'
                                           }}>
                                             {JSON.stringify(testCase.testData, null, 2)}
                                           </pre>
                                         </Box>
                                       )}
                                     </Box>
                                   }
                                 />
                               </ListItem>
                             ))}
                           </List>
                         </Box>
                         
                         <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <Typography variant="body2" color="text.secondary">
                             {selectedTestCases.length} of {(Array.isArray(run.proposalsJson) ? run.proposalsJson : JSON.parse(run.proposalsJson || '[]')).length} test cases selected
                           </Typography>
                           <Box sx={{ display: 'flex', gap: 1 }}>
                             <Button
                               size="small"
                               onClick={() => {
                                 const allTestCases = Array.isArray(run.proposalsJson) ? run.proposalsJson : JSON.parse(run.proposalsJson || '[]');
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
                    
                    {run?.errorMessage && run.state === 'failed' && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {run.errorMessage}
                      </Alert>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
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
        {run?.state === 'proposals' && (
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
