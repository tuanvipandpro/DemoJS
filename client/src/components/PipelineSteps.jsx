import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudDownload as PullCodeIcon,
  Psychology as GenerateTestsIcon,
  Approval as TestApprovalIcon,
  Code as GenerateScriptsIcon,
  PlayArrow as RunTestsIcon,
  Assessment as GenerateReportIcon,
  CheckCircle as ReportApprovalIcon,
  Done as CompletedIcon,
  Error as FailedIcon,
  HourglassEmpty as LoadingIcon,
  HourglassEmpty as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { runsService } from '../services/runs';

const PipelineSteps = ({ currentState, progress = 0, errorMessage = null, isFailed = false, run = null, onRunUpdate = null }) => {
  const [testCases, setTestCases] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState(new Set());
  const [testCasesPage, setTestCasesPage] = useState(0);
  const [testCasesPerPage, setTestCasesPerPage] = useState(10);
  const [stepHistory, setStepHistory] = useState([]);

  const toggleStepExpansion = (stepId) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const fetchTestCases = useCallback(async () => {
    if (!run?.id) return;
    
    setLoadingTestCases(true);
    try {
      // First try to get test cases from run.proposals_json
      if (run.proposals_json) {
        let proposals = [];
        if (Array.isArray(run.proposals_json)) {
          proposals = run.proposals_json;
        } else if (typeof run.proposals_json === 'string') {
          try {
            proposals = JSON.parse(run.proposals_json);
          } catch (e) {
            console.warn('Failed to parse proposals_json:', e);
          }
        }
        
        if (proposals.length > 0) {
          setTestCases(proposals);
          setLoadingTestCases(false);
          return;
        }
      }
      
      // Fallback to API
      const response = await runsService.getTestCases(run.id);
      if (response.success) {
        setTestCases(response.testCases || []);
      } else {
        console.error('Failed to fetch test cases:', response.error);
        setTestCases([]);
      }
    } catch (error) {
      console.error('Error fetching test cases:', error);
      setTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  }, [run?.id, run?.proposals_json]);

  const fetchStepHistory = useCallback(async () => {
    if (!run?.id) return;
    
    try {
      const response = await runsService.getStepHistory(run.id);
      if (response.success) {
        setStepHistory(response.stepHistory || []);
      } else {
        console.error('Failed to fetch step history:', response.error);
        setStepHistory([]);
      }
    } catch (error) {
      console.error('Error fetching step history:', error);
      setStepHistory([]);
    }
  }, [run?.id]);

  // Calculate pagination
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

  // Fetch test cases when state changes to test_approval or when run changes
  useEffect(() => {
    if (currentState === 'test_approval' && run?.id && testCases.length === 0) {
      fetchTestCases();
    }
  }, [currentState, run?.id, testCases.length, fetchTestCases]);

  // Fetch step history when run changes
  useEffect(() => {
    if (run?.id) {
      fetchStepHistory();
    }
  }, [run?.id, fetchStepHistory]);



  const steps = [
    {
      id: 'queued',
      label: 'Queued',
      description: 'Test run is queued and waiting to start',
      icon: <CompletedIcon />
    },
    {
      id: 'pull_code_generate_test',
      label: 'Pull Code & Generate Tests',
      description: 'Downloading source code and generating test cases with AI',
      icon: <GenerateTestsIcon />
    },
    {
      id: 'test_approval',
      label: 'Test Approval',
      description: 'Waiting for user approval of test cases',
      icon: <TestApprovalIcon />
    },
    {
      id: 'generate_scripts',
      label: 'Generate Scripts',
      description: 'Creating executable test scripts',
      icon: <GenerateScriptsIcon />
    },
    {
      id: 'create_mr',
      label: 'Create MR',
      description: 'Creating merge request with test scripts',
      icon: <GenerateScriptsIcon />
    },
    {
      id: 'pull_new_branch',
      label: 'Pull New Branch',
      description: 'Pulling code from the new branch with test scripts',
      icon: <PullCodeIcon />
    },
    {
      id: 'run_test',
      label: 'Run Tests',
      description: 'Executing tests and checking coverage',
      icon: <RunTestsIcon />
    },
    {
      id: 'generate_report',
      label: 'Generate Report',
      description: 'Creating comprehensive test report',
      icon: <GenerateReportIcon />
    },
    {
      id: 'report_approval',
      label: 'Report Approval',
      description: 'Waiting for user approval of test report',
      icon: <ReportApprovalIcon />
    },
    {
      id: 'completed',
      label: 'Completed',
      description: 'Test run completed successfully',
      icon: <CompletedIcon />
    }
  ];

  const getStepStatus = (stepId) => {
    // First check if we have step history data
    if (stepHistory.length > 0) {
      const stepData = stepHistory.find(step => step.step_name === stepId);
      if (stepData) {
        // Return the actual status from step history
        switch (stepData.status) {
          case 'completed':
            return 'completed';
          case 'failed':
            return 'error';
          case 'running':
            return 'active';
          case 'pending':
          default:
            // Special case: queued step should default to completed
            if (stepId === 'queued') {
              return 'completed';
            }
            return 'pending';
        }
      }
    }
    
    // Fallback to old logic if no step history
    const stepIndex = steps.findIndex(step => step.id === stepId);
    
    // Special case: queued step should default to completed
    if (stepId === 'queued') {
      return 'completed';
    }
    
    // Map current state to step index
    const stateToStepMap = {
      'queued': 0,
      'pulling_code': 1,
      'generating_tests': 1,
      'test_approval': 2,
      'generating_scripts': 3,
      'running_tests': 4,
      'generating_report': 5,
      'report_approval': 6,
      'completed': 7,
      'failed': 7
    };
    
    const currentStepIndex = stateToStepMap[currentState] || 0;
    
    // Special handling for pull_code_generate_test step
    if (stepId === 'pull_code_generate_test') {
      if (['pulling_code', 'generating_tests'].includes(currentState)) {
        return 'active';
      }
      if (['test_approval', 'generating_scripts', 'running_tests', 'generating_report', 'report_approval', 'completed'].includes(currentState)) {
        return 'completed';
      }
      return 'pending';
    }
    
    // Determine status based on step position relative to current step
    if (stepIndex < currentStepIndex) {
      return 'completed';
    } else if (stepIndex === currentStepIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'error': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStepIcon = (step, status) => {
    if (status === 'error') return <FailedIcon />;
    if (status === 'active') return <LoadingIcon />;
    if (status === 'pending') return <PendingIcon />;
    return step.icon;
  };

  const getLoadingMessage = (stepId) => {
    // Check if this step is actually running based on step history
    if (stepHistory.length > 0) {
      const stepData = stepHistory.find(step => step.step_name === stepId);
      if (stepData && stepData.status === 'running') {
        switch (stepId) {
          case 'queued':
            return 'Đang chờ xử lý...';
          case 'pull_code_generate_test':
            if (currentState === 'pulling_code') {
              return `Đang tải source code từ branch ${run?.branch || 'main'}...`;
            } else {
              return 'Đang sử dụng AI để tạo test cases...';
            }
          case 'generate_scripts':
            return 'Đang tạo test scripts từ approved test cases...';
          case 'run_test':
            return 'Đang chạy tests và kiểm tra coverage...';
          case 'generate_report':
            return 'Đang tạo báo cáo test...';
          case 'test_approval':
            return 'Đang chờ phê duyệt test cases từ người dùng...';
          case 'report_approval':
            return 'Đang chờ phê duyệt báo cáo test từ người dùng...';
          case 'completed':
            return 'Test run đã hoàn thành thành công!';
          default:
            return 'Processing...';
        }
      }
    }
    
    // Fallback to old logic
    switch (stepId) {
      case 'queued':
        return 'Đang chờ xử lý...';
      case 'pull_code_generate_test':
        if (currentState === 'pulling_code') {
          return `Đang tải source code từ branch ${run?.branch || 'main'}...`;
        } else {
          return 'Đang sử dụng AI để tạo test cases...';
        }
      case 'generate_scripts':
        return 'Đang tạo test scripts từ approved test cases...';
      case 'run_test':
        return 'Đang chạy tests và kiểm tra coverage...';
      case 'generate_report':
        return 'Đang tạo báo cáo test...';
      case 'test_approval':
        return 'Đang chờ phê duyệt test cases từ người dùng...';
      case 'report_approval':
        return 'Đang chờ phê duyệt báo cáo test từ người dùng...';
      case 'completed':
        return 'Test run đã hoàn thành thành công!';
      default:
        return 'Processing...';
    }
  };

  // Get active step index based on current state
  const getActiveStepIndex = () => {
    // If we have step history, find the first step that's running or pending
    if (stepHistory.length > 0) {
      const runningStep = stepHistory.find(step => step.status === 'running');
      if (runningStep) {
        return steps.findIndex(step => step.id === runningStep.step_name);
      }
      
      // If no running step, find the first pending step
      const pendingStep = stepHistory.find(step => step.status === 'pending');
      if (pendingStep) {
        return steps.findIndex(step => step.id === pendingStep.step_name);
      }
    }
    
    if (isFailed || currentState === 'failed') {
      // If failed, try to find which step should be active based on current state
      if (['pulling_code', 'generating_tests'].includes(currentState)) {
        return steps.findIndex(step => step.id === 'pull_code_generate_test');
      }
      return steps.findIndex(step => step.id === currentState);
    }
    
    // Handle special states that don't have direct step mapping
    if (currentState === 'test_approval') {
      return steps.findIndex(step => step.id === 'test_approval');
    }
    
    // Map current state to step
    const stateToStepMap = {
      'queued': 'queued',
      'pulling_code': 'pull_code_generate_test',
      'generating_tests': 'pull_code_generate_test',
      'test_approval': 'test_approval',
      'generating_scripts': 'generate_scripts',
      'running_tests': 'run_test',
      'generating_report': 'generate_report',
      'report_approval': 'report_approval',
      'completed': 'completed',
      'failed': 'failed'
    };
    
    const mappedStep = stateToStepMap[currentState];
    if (mappedStep) {
      return steps.findIndex(step => step.id === mappedStep);
    }
    
    return steps.findIndex(step => step.id === currentState);
  };

  // Map current state to step
  const stateToStepMap = {
    'queued': 'queued',
    'pulling_code': 'pull_code_generate_test',
    'generating_tests': 'pull_code_generate_test',
    'test_approval': 'test_approval',
    'generating_scripts': 'generate_scripts',
    'running_tests': 'run_test',
    'generating_report': 'generate_report',
    'report_approval': 'report_approval',
    'completed': 'completed',
    'failed': 'failed'
  };

  // Get steps to display based on current state
  const getStepsToDisplay = () => {
    // Always show all steps in the pipeline
    return steps;
  };

  const stepsToDisplay = getStepsToDisplay();
  

  return (
    <Box sx={{ width: '100%' }}>
      {stepsToDisplay.map((step, index) => {
        const status = getStepStatus(step.id);
        const isActive = status === 'active';
        const isCompleted = status === 'completed';
        const isError = status === 'error';
        const isExpanded = expandedSteps.has(step.id);
        
        return (
          <Accordion 
            key={step.id} 
            expanded={isExpanded}
            onChange={() => toggleStepExpansion(step.id)}
            sx={{ 
              mb: 1,
              '&:before': { display: 'none' },
              boxShadow: isActive ? '0 0 0 2px #1976d2' : 'none',
              border: isError ? '1px solid #d32f2f' : '1px solid #e0e0e0',
              borderRadius: '8px !important'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                  gap: 2
                }
              }}
            >
              <Chip
                icon={getStepIcon(step, status)}
                label={step.label}
                color={getStepColor(status)}
                variant={isActive ? 'filled' : 'outlined'}
                size="small"
              />
              <Typography variant="subtitle2" color={isError ? 'error' : 'text.primary'} sx={{ ml: 1 }}>
                {step.label}
              </Typography>
              {isActive && (
                <CircularProgress size={16} sx={{ ml: 'auto' }} />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color={isError ? 'error' : 'text.secondary'} sx={{ mb: 1 }}>
                {isActive ? getLoadingMessage(step.id) : isError ? (stepHistory.find(s => s.step_name === step.id)?.error_message || 'Step failed') : step.description}
              </Typography>
                
                {/* Status message cho từng step */}
                {isActive && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Alert severity="info">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2">
                          {getLoadingMessage(step.id)}
                        </Typography>
                      </Box>
                    </Alert>
                  </Box>
                )}
                
                {isError && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Alert severity="error">
                      <Typography variant="body2">
                        {stepHistory.find(s => s.step_name === step.id)?.error_message || 'Step failed'}
                      </Typography>
                    </Alert>
                  </Box>
                )}
                
                {isCompleted && step.id === 'test_approval' && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Alert severity="warning">
                      <Typography variant="body2">
                        Đang chờ phê duyệt test cases từ người dùng...
                      </Typography>
                    </Alert>
                  </Box>
                )}
                
                {isCompleted && step.id === 'report_approval' && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Alert severity="warning">
                      <Typography variant="body2">
                        Đang chờ phê duyệt báo cáo test từ người dùng...
                      </Typography>
                    </Alert>
                  </Box>
                )}
                
                {isCompleted && step.id === 'completed' && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Alert severity="success">
                      <Typography variant="body2">
                        Test run đã hoàn thành thành công!
                      </Typography>
                    </Alert>
                  </Box>
                )}
                
                {/* Test Cases Approval Section - Show when in test_approval state */}
                {step.id === 'test_approval' && (
                  <Box sx={{ mt: 2 }}>
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
                    {loadingTestCases ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">Loading test cases...</Typography>
                      </Box>
                    ) : testCases.length > 0 ? (
                      <Box>
                        <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                          <List dense>
                            {paginatedTestCases.map((testCase, index) => (
                          <ListItem key={testCase.id || index} dense sx={{ borderBottom: '1px solid #f0f0f0', flexDirection: 'column', alignItems: 'stretch' }}>
                            <Box sx={{ width: '100%' }}>
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
                      </Box>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="body2">No test cases available</Typography>
                      </Box>
                    )}
                    
                    {/* Test Cases Approval Buttons */}
                    {testCases.length > 0 && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={async () => {
                            if (run?.id) {
                              try {
                                await runsService.approveTestCases(run.id);
                                // API approve-test-cases automatically triggers execution
                                // Update run state to show progress
                                if (onRunUpdate) {
                                  onRunUpdate({
                                    ...run,
                                    state: 'generating_scripts'
                                  });
                                }
                                // If no callback provided, fallback to reload
                                if (!onRunUpdate) {
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 1000);
                                }
                              } catch (error) {
                                console.error('Error approving test cases:', error);
                              }
                            }
                          }}
                          sx={{ minWidth: 120 }}
                        >
                          Approve Test Cases
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Error />}
                          onClick={async () => {
                            if (run?.id) {
                              try {
                                await runsService.rejectTestCases(run.id);
                                // Update run state to show failure
                                if (onRunUpdate) {
                                  onRunUpdate({
                                    ...run,
                                    state: 'failed',
                                    error_message: 'Test cases rejected by user'
                                  });
                                }
                                // If no callback provided, fallback to reload
                                if (!onRunUpdate) {
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 1000);
                                }
                              } catch (error) {
                                console.error('Error rejecting test cases:', error);
                              }
                            }
                          }}
                          sx={{ minWidth: 120 }}
                        >
                          Reject Test Cases
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
                
                {/* Report Approval Section - Show when in report_approval state */}
                {step.id === 'report_approval' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Test Report
                    </Typography>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#f9f9f9' }}>
                      <Typography variant="body2" color="text.secondary">
                        Test report is ready for approval. Please review the generated report and approve or reject it.
                      </Typography>
                    </Box>
                    
                    {/* Report Approval Buttons */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          if (run?.id) {
                            runsService.approveReport(run.id)
                              .then(() => {
                                // Refresh run details
                                window.location.reload();
                              })
                              .catch(error => {
                                console.error('Error approving report:', error);
                              });
                          }
                        }}
                        sx={{ minWidth: 120 }}
                      >
                        Approve Report
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Error />}
                        onClick={() => {
                          if (run?.id) {
                            runsService.rejectReport(run.id)
                              .then(() => {
                                // Refresh run details
                                window.location.reload();
                              })
                              .catch(error => {
                                console.error('Error rejecting report:', error);
                              });
                          }
                        }}
                        sx={{ minWidth: 120 }}
                      >
                        Reject Report
                      </Button>
                    </Box>
                  </Box>
                )}
                
                
                {isActive && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="primary">
                        {getLoadingMessage(step.id)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="indeterminate"
                      color="primary"
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                )}
                {isError && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {(() => {
                      // Get error message from step history if available
                      if (stepHistory.length > 0) {
                        const stepData = stepHistory.find(step => step.step_name === step.id);
                        if (stepData && stepData.error_message) {
                          return stepData.error_message;
                        }
                      }
                      // Fallback to general error message
                      return errorMessage || 'Step failed';
                    })()}
                  </Alert>
                )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default PipelineSteps;
