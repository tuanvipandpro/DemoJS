import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Refresh as RefreshIcon,
  CloudDownload as DownloadIcon,
  Code as CodeIcon,
  Storage as GitLabIcon,
  Storage as BitbucketIcon,
  Cloud as AzureDevOpsIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { api } from '../services/auth/apiClient.js';

const steps = [
  {
    label: 'Project Metadata',
    description: 'Enter basic project information',
    icon: <ProjectIcon />,
  },
  {
    label: 'Git Integration',
    description: 'Connect your repository',
    icon: <GitHubIcon />,
  },
  {
    label: 'Notifications',
    description: 'Configure notification channels',
    icon: <NotificationsIcon />,
  },
];

const gitProviders = [
  { name: 'GitHub', icon: <GitHubIcon />, color: '#24292e', enabled: true },
  // Các provider khác sẽ được thêm sau khi implement
  // { name: 'GitLab', icon: <GitLabIcon />, color: '#fc6d26', enabled: false },
  // { name: 'Bitbucket', icon: <BitbucketIcon />, color: '#0052cc', enabled: false },
  // { name: 'Azure DevOps', icon: <AzureDevOpsIcon />, color: '#0078d4', enabled: false },
];

const notificationEngines = [
  {
    name: 'Email',
    description: 'Send notifications via email',
    icon: <EmailIcon />,
    color: '#1976d2',
    enabled: true,
  },
  {
    name: 'GitHub Issues',
    description: 'Create GitHub issues automatically',
    icon: <GitHubIcon />,
    color: '#24292e',
    enabled: true,
  },
  {
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    icon: <NotificationsIcon />,
    color: '#4a154b',
    enabled: false,
  },
  {
    name: 'Jira',
    description: 'Create and update Jira issues',
    icon: <ProjectIcon />,
    color: '#0052cc',
    enabled: false,
  },
  {
    name: 'Discord',
    description: 'Send notifications to Discord',
    icon: <NotificationsIcon />,
    color: '#5865f2',
    enabled: false,
  },
  {
    name: 'Teams',
    description: 'Send notifications to Microsoft Teams',
    icon: <NotificationsIcon />,
    color: '#6264a7',
    enabled: false,
  },
];

const CreateProjectStepperModal = ({ open, onClose, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    gitProvider: 'GitHub',
    isConnecting: false,
    isConnected: false,
    availableRepos: [],
    availableBranches: [],
    selectedRepository: '',
    branch: '',
    selectedNotifications: ['Email'],
    emailNotifications: true,
    slackNotifications: false,
    githubIssues: true,
    slackWebhook: '',
    emailRecipients: '',
    personalAccessToken: '', // Thêm field cho Personal Access Token
    showTokenInput: false, // Thêm field để kiểm soát việc hiển thị input token
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open]);

  // Debug form data changes
  useEffect(() => {
    console.log('Form data changed:', {
      gitProvider: formData.gitProvider,
      isConnected: formData.isConnected,
      showTokenInput: formData.showTokenInput,
      availableRepos: formData.availableRepos,
      reposLength: formData.availableRepos?.length,
      selectedRepository: formData.selectedRepository,
      branch: formData.branch
    });
  }, [formData.gitProvider, formData.isConnected, formData.showTokenInput, formData.availableRepos, formData.selectedRepository, formData.branch]);

  // Function to save project state
  const saveProjectState = () => {
    const stateToSave = {
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      gitProvider: formData.gitProvider,
      selectedRepository: formData.selectedRepository,
      branch: formData.branch,
      selectedNotifications: formData.selectedNotifications,
      emailNotifications: formData.emailNotifications,
      slackNotifications: formData.slackNotifications,
      githubIssues: formData.githubIssues,
      slackWebhook: formData.slackWebhook,
      emailRecipients: formData.emailRecipients,
      // Save current step to resume from where user left off
      currentStep: activeStep,
      // Note: personalAccessToken is NOT saved for security reasons
      showTokenInput: formData.showTokenInput,
      // Note: connection state and repos are NOT saved to prevent stale data
    };
    
    localStorage.setItem('createProjectState', JSON.stringify(stateToSave));
    console.log('Modal: Project state saved to localStorage:', stateToSave);
  };

  // Function to clear saved project state
  const clearSavedProjectState = () => {
    localStorage.removeItem('createProjectState');
    console.log('Modal: Saved project state cleared');
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      gitProvider: 'GitHub',
      selectedRepository: '',
      branch: '',
      isConnecting: false,
      isConnected: false,
      branchLoading: false,
      availableRepos: [],
      availableBranches: [],
      selectedNotifications: ['Email'],
      emailNotifications: true,
      slackNotifications: false,
      githubIssues: true,
      slackWebhook: '',
      emailRecipients: '',
      personalAccessToken: '', // Reset token
      showTokenInput: false, // Reset token input visibility
    });
    setErrors({});
    // Clear any saved project state
    clearSavedProjectState();
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      if (!formData.name.trim()) newErrors.name = 'Project name is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
    } else if (activeStep === 1) {
      if (!formData.gitProvider) newErrors.gitProvider = 'Please select a Git provider';
      if (formData.gitProvider === 'GitHub' && formData.showTokenInput && !formData.personalAccessToken.trim()) {
        newErrors.personalAccessToken = 'Personal Access Token is required for GitHub';
      }
      if (formData.isConnected && !formData.selectedRepository) {
        newErrors.selectedRepository = 'Please select a repository';
      }
      if (formData.isConnected && formData.selectedRepository && !formData.branch) {
        newErrors.branch = 'Please select a branch';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData({
      ...formData,
      [field]: date,
    });
  };

  const handleGitConnect = async () => {
    if (!formData.gitProvider) return;
    
    // Nếu chưa hiển thị input token, hiển thị nó
    if (!formData.showTokenInput) {
      setFormData(prev => ({ ...prev, showTokenInput: true }));
      return;
    }
    
    // Nếu đã hiển thị input token và có token, thực hiện connect
    if (!formData.personalAccessToken.trim()) {
      setErrors({ ...errors, personalAccessToken: 'Personal Access Token is required' });
      return;
    }
    
    setFormData(prev => ({ ...prev, isConnecting: true }));
    try {
      if (formData.gitProvider === 'GitHub') {
        // Gửi token về backend để xác thực và lấy repos
        const response = await api.post('/git/repos', {
          token: formData.personalAccessToken
        });
        
        if (response.status !== 200) {
          const errorData = response.data;
          throw new Error(errorData.message || 'Failed to connect with token');
        }
        
        const data = response.data;
        
        console.log('GitHub API response:', data);
        console.log('Repositories loaded:', data.repositories);
        
        // Cập nhật form với dữ liệu GitHub
        setFormData(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: true,
          availableRepos: data.repositories || [],
          availableBranches: [],
          selectedRepository: '',
          branch: '',
          showTokenInput: false, // Ẩn input token sau khi connect thành công
        }));
        
        console.log(`Modal: GitHub connected with ${data.repositories?.length || 0} repositories`);
        console.log('Updated form data:', {
          isConnected: true,
          availableRepos: data.repositories || [],
          availableBranches: [],
          selectedRepository: '',
          branch: '',
          showTokenInput: false
        });
      } else {
        // Các provider khác chưa được hỗ trợ
        throw new Error(`${formData.gitProvider} is not supported yet. Only GitHub is currently supported.`);
      }
    } catch (err) {
      console.error('Git connect error:', err);
      setFormData(prev => ({ 
        ...prev, 
        isConnecting: false, 
        isConnected: false,
        showTokenInput: false 
      }));
      setErrors({ ...errors, personalAccessToken: err.message || 'Connection failed' });
    }
  };

  const handleRepositorySelect = async (event) => {
    const fullName = event.target.value;
    
    // Reset branch selection when repository changes
    setFormData(prev => ({ 
      ...prev, 
      selectedRepository: fullName, 
      branchLoading: true, 
      availableBranches: [], 
      branch: '' 
    }));
    
    // Clear branch error when repository changes
    if (errors.branch) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.branch;
        return newErrors;
      });
    }
    
    if (!fullName) {
      setFormData(prev => ({ ...prev, branchLoading: false }));
      return;
    }
    
    try {
      const [owner, repo] = fullName.split('/');
      
      // Gọi API để lấy branches của repository
      const branchesRes = await api.post(`/git/repos/${owner}/${repo}/branches`, {
        githubToken: formData.personalAccessToken
      });
      
      if (branchesRes.status !== 200) {
        const errorData = branchesRes.data;
        throw new Error(errorData.message || 'Failed to fetch branches');
      }
      
      const branches = branchesRes.data.branches || [];
      const branchNames = (branches || []).map(b => b.name || b);
      
      setFormData(prev => ({ 
        ...prev, 
        availableBranches: branchNames, 
        branch: branchNames[0] || '', // Auto-select first branch
        branchLoading: false 
      }));
      
      console.log(`Loaded ${branchNames.length} branches for repository: ${fullName}`);
      
    } catch (e) {
      console.error('Fetch branches error:', e);
      setFormData(prev => ({ 
        ...prev, 
        branchLoading: false,
        availableBranches: [],
        branch: ''
      }));
      
      // Hiển thị error message
      setErrors({ ...errors, selectedRepository: `Failed to load branches: ${e.message}` });
    }
  };

  const handleNotificationToggle = (notification) => {
    setFormData(prev => {
      const updated = prev.selectedNotifications.includes(notification.name)
        ? prev.selectedNotifications.filter(n => n !== notification.name)
        : [...prev.selectedNotifications, notification.name];
      
      return {
        ...prev,
        selectedNotifications: updated,
      };
    });
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      const projectData = {
        ...formData,
        id: Date.now(),
        progress: 0,
        createdAt: new Date().toISOString(),
        // Include personalAccessToken for secure storage in database
        personalAccessToken: formData.personalAccessToken || null
      };
      onSubmit(projectData);
      handleReset();
      onClose();
    }
  };

  // Handle modal open/close and state restoration
  useEffect(() => {
    if (open) {
      // When modal opens, check if we have saved state to restore
      const savedProjectState = localStorage.getItem('createProjectState');
      if (savedProjectState) {
        try {
          const restoredState = JSON.parse(savedProjectState);
          console.log('Modal: Restoring project state on modal open:', restoredState);
          
          setFormData(prev => ({
            ...prev,
            ...restoredState,
            isConnecting: false,
            isConnected: false, // Reset connection state
            availableRepos: [],
            availableBranches: [],
            selectedRepository: '',
            branch: '',
            personalAccessToken: '', // Reset token for security
            showTokenInput: false, // Reset token input visibility
            branchLoading: false,
          }));
          
          // Restore step if it was saved
          if (restoredState.currentStep !== undefined) {
            setActiveStep(restoredState.currentStep);
            console.log('Modal: Restored to step:', restoredState.currentStep);
          }
          
          // Clear saved state after restoration
          localStorage.removeItem('createProjectState');
          console.log('Modal: Project state restored and localStorage cleared');
        } catch (error) {
          console.error('Modal: Failed to restore project state:', error);
          clearSavedProjectState();
        }
      }
    } else {
      // When modal closes, clear any saved project state
      clearSavedProjectState();
    }
  }, [open]);

  const renderStep1 = () => (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Project Information
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          fullWidth
          label="Project Name"
          value={formData.name}
          onChange={handleChange('name')}
          error={!!errors.name}
          helperText={errors.name}
          required
          size="medium"
        />
        
        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={handleChange('description')}
          error={!!errors.description}
          helperText={errors.description}
          multiline
          rows={3}
          required
          size="medium"
        />
      </Box>
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Git Repository Integration
      </Typography>
      
      {/* Git Provider Selection */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Select Git Provider
      </Typography>
             <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 3 }}>
         <List sx={{ p: 0 }}>
           {gitProviders.map((provider) => (
             <ListItem
               key={provider.name}
               sx={{
                 border: formData.gitProvider === provider.name ? 2 : 1,
                 borderColor: formData.gitProvider === provider.name ? 'primary.main' : 'divider',
                 borderRadius: 1,
                 mb: 1,
                 cursor: provider.enabled ? 'pointer' : 'not-allowed',
                 opacity: provider.enabled ? 1 : 0.5,
                 '&:hover': provider.enabled ? { 
                   borderColor: 'primary.main',
                   bgcolor: 'action.hover'
                 } : {},
                 bgcolor: formData.gitProvider === provider.name ? 'action.selected' : 'transparent',
               }}
               onClick={() => {
                 if (provider.enabled) {
                   setFormData(prev => ({ 
                     ...prev, 
                     gitProvider: provider.name,
                     showTokenInput: false, // Reset token input khi thay đổi provider
                     personalAccessToken: '', // Reset token
                     isConnected: false, // Reset connection state
                     availableRepos: [], // Reset repositories
                     availableBranches: [], // Reset branches
                     selectedRepository: '', // Reset selected repo
                     branch: '', // Reset selected branch
                   }));
                   
                   // Clear errors related to repository and branch
                   setErrors(prev => {
                     const newErrors = { ...prev };
                     delete newErrors.selectedRepository;
                     delete newErrors.branch;
                     delete newErrors.personalAccessToken;
                     return newErrors;
                   });
                 }
               }}
             >
               <ListItemIcon sx={{ minWidth: 40 }}>
                 <Box sx={{ color: provider.enabled ? provider.color : 'grey.400' }}>
                   {provider.icon}
                 </Box>
               </ListItemIcon>
               <ListItemText
                 primary={
                   <Typography 
                     variant="subtitle2" 
                     sx={{ 
                       fontWeight: 'bold',
                       fontSize: '0.875rem',
                       lineHeight: 1.2,
                       color: provider.enabled ? 'text.primary' : 'text.disabled',
                     }}
                   >
                     {provider.name}
                     {!provider.enabled && (
                       <Typography 
                         component="span" 
                         variant="caption" 
                         sx={{ 
                           ml: 1, 
                           color: 'text.disabled',
                           fontStyle: 'italic'
                         }}
                       >
                         (Coming Soon)
                       </Typography>
                     )}
                   </Typography>
                 }
               />
             </ListItem>
           ))}
         </List>
       </Box>
      
      {errors.gitProvider && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.gitProvider}
        </Alert>
      )}
      
      {/* Personal Access Token Input */}
      {formData.gitProvider === 'GitHub' && formData.showTokenInput && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Personal Access Token
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enter your {formData.gitProvider} Personal Access Token to connect your repositories.
            <br />
            <strong>Note:</strong> Your token will be securely stored and used only for repository access.
          </Typography>
          <TextField
            fullWidth
            label="Personal Access Token"
            type="password"
            value={formData.personalAccessToken}
            onChange={handleChange('personalAccessToken')}
            error={!!errors.personalAccessToken}
            helperText={errors.personalAccessToken || 'Enter your Personal Access Token'}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            size="medium"
          />
        </Box>
      )}
      
      {/* Connect Button - Only show when GitHub provider is selected */}
      {formData.gitProvider === 'GitHub' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={formData.isConnecting ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleGitConnect}
            disabled={formData.isConnecting}
          >
            {formData.isConnecting ? 'Connecting...' : 
             formData.showTokenInput ? 'Connect with Token' : 'Connect Repository'}
          </Button>
          
          {formData.isConnected && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon color="success" />
              <Typography variant="body2" color="success.main">
                Connected successfully
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      {/* Repository and Branch Selection - Only show after successful connection */}
      {formData.gitProvider === 'GitHub' && formData.isConnected && (
        <Box sx={{ mt: 3 }}>
          {/* Debug info */}
          <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.8rem' }}>
            <Typography variant="caption" color="textSecondary">
              Debug: Provider={formData.gitProvider}, Connected={formData.isConnected.toString()}, 
              Repos={formData.availableRepos?.length || 0}
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Repository & Branch Selection
          </Typography>
          
          {/* Repository Selection */}
          <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.selectedRepository}>
            <InputLabel id="repository-select-label" shrink={true}>Select Repository</InputLabel>
            <Select
              labelId="repository-select-label"
              value={formData.selectedRepository || ''}
              onChange={handleRepositorySelect}
              label="Select Repository"
              displayEmpty
              notched={true}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              <MenuItem value="" disabled>
                <em>Choose a repository...</em>
              </MenuItem>
              {formData.availableRepos && formData.availableRepos.length > 0 ? (
                formData.availableRepos.map((repo) => (
                  <MenuItem key={repo.id || repo.full_name} value={repo.full_name}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
                      <GitHubIcon fontSize="small" sx={{ mt: 0.5 }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {repo.full_name}
                        </Typography>
                        {repo.description && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                            {repo.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {repo.language && (
                            <Chip 
                              label={repo.language} 
                              size="small" 
                              variant="outlined" 
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          {repo.private && (
                            <Chip 
                              label="Private" 
                              size="small" 
                              variant="outlined" 
                              color="warning"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    No repositories available
                  </Typography>
                </MenuItem>
              )}
            </Select>
            {errors.selectedRepository && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.selectedRepository}
              </Typography>
            )}
            {formData.availableRepos && formData.availableRepos.length === 0 && !errors.selectedRepository && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                No repositories found. Please check your token permissions.
              </Typography>
            )}
          </FormControl>
          
          {/* Branch Selection - Only show after repository is selected */}
          {formData.selectedRepository && (
            <FormControl fullWidth error={!!errors.branch}>
              <InputLabel id="branch-select-label" shrink={true}>Select Branch</InputLabel>
              <Select
                labelId="branch-select-label"
                value={formData.branch}
                onChange={handleChange('branch')}
                label="Select Branch"
                disabled={formData.branchLoading || (formData.availableBranches || []).length === 0}
                displayEmpty
                notched={true}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200
                    }
                  }
                }}
              >
                <MenuItem value="" disabled>
                  <em>Choose a branch...</em>
                </MenuItem>
                {formData.availableBranches && formData.availableBranches.length > 0 ? (
                  formData.availableBranches.map((branch) => (
                    <MenuItem key={branch} value={branch}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <CodeIcon fontSize="small" />
                        <Typography variant="body2">{branch}</Typography>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="textSecondary">
                      No branches available
                    </Typography>
                  </MenuItem>
                )}
              </Select>
              {errors.branch && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {errors.branch}
                </Typography>
              )}
              {formData.branchLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="textSecondary">Loading branches...</Typography>
                </Box>
              )}
              {!formData.branchLoading && formData.availableBranches && formData.availableBranches.length === 0 && !errors.branch && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  No branches found for this repository.
                </Typography>
              )}
            </FormControl>
          )}
          
          {/* Summary of selected repository and branch */}
          {formData.selectedRepository && formData.branch && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.contrastText" gutterBottom>
                ✅ Repository Connected Successfully
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" color="success.contrastText">
                  <strong>Repository:</strong> {formData.selectedRepository}
                </Typography>
                <Typography variant="body2" color="success.contrastText">
                  <strong>Branch:</strong> {formData.branch}
                </Typography>
                <Typography variant="body2" color="success.contrastText">
                  <strong>Total Branches:</strong> {formData.availableBranches?.length || 0}
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* Debug info for repository and branch */}
          <Box sx={{ mt: 2, p: 1, bgcolor: 'yellow.100', borderRadius: 1, fontSize: '0.8rem' }}>
            <Typography variant="caption" color="textSecondary">
              Debug Repo/Branch: SelectedRepo={formData.selectedRepository || 'none'}, 
              SelectedBranch={formData.branch || 'none'}, 
              AvailableBranches={formData.availableBranches?.length || 0}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Notification Channels
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Select the notification channels you want to integrate with your project
      </Typography>
      
             <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
         <List sx={{ p: 0 }}>
           {notificationEngines.map((notification) => (
             <ListItem
               key={notification.name}
               sx={{
                 border: formData.selectedNotifications.includes(notification.name) ? 2 : 1,
                 borderColor: formData.selectedNotifications.includes(notification.name) ? 'primary.main' : 'divider',
                 borderRadius: 1,
                 mb: 1,
                 cursor: notification.enabled ? 'pointer' : 'not-allowed',
                 opacity: notification.enabled ? 1 : 0.5,
                 '&:hover': notification.enabled ? { 
                   borderColor: 'primary.main',
                   bgcolor: 'action.hover'
                 } : {},
                 bgcolor: formData.selectedNotifications.includes(notification.name) ? 'action.selected' : 'transparent',
               }}
               onClick={() => {
                 if (notification.enabled) {
                   handleNotificationToggle(notification);
                 }
               }}
             >
               <ListItemIcon sx={{ minWidth: 40 }}>
                 <Checkbox
                   checked={formData.selectedNotifications.includes(notification.name)}
                   icon={<UncheckedIcon />}
                   checkedIcon={<CheckIcon />}
                   sx={{ color: notification.enabled ? notification.color : 'grey.400' }}
                   disabled={!notification.enabled}
                 />
               </ListItemIcon>
               <ListItemIcon sx={{ minWidth: 40 }}>
                 <Box sx={{ color: notification.enabled ? notification.color : 'grey.400' }}>
                   {notification.icon}
                 </Box>
               </ListItemIcon>
               <ListItemText
                 primary={
                   <Typography 
                     variant="subtitle2" 
                     sx={{ 
                       fontWeight: 'bold',
                       fontSize: '0.875rem',
                       lineHeight: 1.2,
                       color: notification.enabled ? 'text.primary' : 'text.disabled',
                     }}
                   >
                     {notification.name}
                     {!notification.enabled && (
                       <Typography 
                         component="span" 
                         variant="caption" 
                         sx={{ 
                           ml: 1, 
                           color: 'text.disabled',
                           fontStyle: 'italic'
                         }}
                       >
                         (Coming Soon)
                       </Typography>
                     )}
                   </Typography>
                 }
                 secondary={
                   <Typography 
                     variant="body2" 
                     color="textSecondary"
                     sx={{ 
                       fontSize: '0.75rem',
                       lineHeight: 1.3
                     }}
                   >
                     {notification.description}
                   </Typography>
                 }
               />
             </ListItem>
           ))}
         </List>
       </Box>
      
      {formData.selectedNotifications.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Channels:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {formData.selectedNotifications.map((notification) => (
              <Chip
                key={notification}
                label={notification}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ProjectIcon color="primary" />
          <Typography variant="h6">Create New Project</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ color: activeStep >= index ? 'primary.main' : 'grey.400' }}>
                    {step.icon}
                  </Box>
                )}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {step.label}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {getStepContent(index)}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
        >
          {activeStep === steps.length - 1 ? 'Create Project' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectStepperModal;
