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
  Code as GitLabIcon,
  Storage as BitbucketIcon,
  Cloud as AzureDevOpsIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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
  { name: 'GitLab', icon: <GitLabIcon />, color: '#fc6d26', enabled: false },
  { name: 'Bitbucket', icon: <BitbucketIcon />, color: '#0052cc', enabled: false },
  { name: 'Azure DevOps', icon: <AzureDevOpsIcon />, color: '#0078d4', enabled: false },
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
    // Step 1: Metadata
    name: '',
    description: '',
    
    // Step 2: Git Integration
    gitProvider: '',
    selectedRepository: '',
    branch: '',
    isConnecting: false,
    isConnected: false,
    
    // Step 3: Notifications
    selectedNotifications: [],
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open]);

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
      gitProvider: '',
      selectedRepository: '',
      branch: '',
      isConnecting: false,
      isConnected: false,
      selectedNotifications: [],
    });
    setErrors({});
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      if (!formData.name.trim()) newErrors.name = 'Project name is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
    } else if (activeStep === 1) {
      if (!formData.gitProvider) newErrors.gitProvider = 'Please select a Git provider';
      if (formData.isConnected && !formData.selectedRepository) newErrors.selectedRepository = 'Please select a repository';
      if (formData.isConnected && !formData.branch) newErrors.branch = 'Please select a branch';
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

  const handleGitConnect = () => {
    setFormData(prev => ({ ...prev, isConnecting: true }));
    
    // Simulate API call and redirect
    setTimeout(() => {
      // Simulate redirect to OAuth
      console.log('Redirecting to OAuth for', formData.gitProvider);
      
      // After successful OAuth, simulate connection
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: true,
          selectedRepository: 'user/project-1',
          branch: 'main',
        }));
      }, 1000);
    }, 2000);
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
      };
      onSubmit(projectData);
      handleReset();
      onClose();
    }
  };

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
                   setFormData(prev => ({ ...prev, gitProvider: provider.name }));
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
      
      {/* Connect Button - Only show when Git provider is selected */}
      {formData.gitProvider && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={formData.isConnecting ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleGitConnect}
            disabled={formData.isConnecting}
          >
            {formData.isConnecting ? 'Connecting...' : 'Connect Repository'}
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
      {formData.isConnected && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Repository & Branch Selection
          </Typography>
          
          {/* Repository Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Repository</InputLabel>
            <Select
              value={formData.selectedRepository || ''}
              onChange={handleChange('selectedRepository')}
              label="Repository"
            >
              <MenuItem value="user/project-1">user/project-1</MenuItem>
              <MenuItem value="user/project-2">user/project-2</MenuItem>
              <MenuItem value="user/project-3">user/project-3</MenuItem>
            </Select>
          </FormControl>
          
          {/* Branch Selection */}
          <FormControl fullWidth>
            <InputLabel>Branch</InputLabel>
            <Select
              value={formData.branch}
              onChange={handleChange('branch')}
              label="Branch"
            >
              <MenuItem value="main">main</MenuItem>
              <MenuItem value="develop">develop</MenuItem>
              <MenuItem value="feature/new-feature">feature/new-feature</MenuItem>
            </Select>
          </FormControl>
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
