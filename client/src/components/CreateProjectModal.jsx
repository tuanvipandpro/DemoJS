import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { GitHub as GitHubIcon, CheckCircle as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { projectsService } from '../services/projects';
import GitConnectModal from './GitConnectModal';
import { gitService } from '../services/git';



const CreateProjectModal = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gitProvider: 'github',
    domain: '',
    repository: '',
    notifyChannels: ['email'],
    instructionTemplates: [],
    testingLanguage: '',
    testingFramework: '',
    members: [] // Array of user objects to add as members
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGitSection, setShowGitSection] = useState(false);
  const [showInstructionsSection, setShowInstructionsSection] = useState(false);
  const [gitProviders, setGitProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [gitConnectModalOpen, setGitConnectModalOpen] = useState(false);
  const [gitConnected, setGitConnected] = useState(false);
  const [connectedRepository, setConnectedRepository] = useState(null);
  
  // Instruction templates state
  const [instructionTemplates, setInstructionTemplates] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  
  // New elements state for editing templates
  const [newViewpoints, setNewViewpoints] = useState({});
  const [newTestPatterns, setNewTestPatterns] = useState({});
  const [newExamples, setNewExamples] = useState({});
  const [newCoverages, setNewCoverages] = useState({});
  const [editingDescriptions, setEditingDescriptions] = useState({});

  // User search state
  const [userSearchEmail, setUserSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const { user } = useAuth();

  // Load git providers when modal opens
  useEffect(() => {
    if (open) {
      loadGitProviders();
      loadAvailableLanguages();
    }
  }, [open]);

  const loadGitProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await gitService.getProviders();
      if (response.success) {
        setGitProviders(response.providers || []);
      }
    } catch (error) {
      console.error('Failed to load git providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadAvailableLanguages = async () => {
    try {
      const response = await projectsService.getAvailableLanguages();
      if (response.success) {
        // Chỉ cho phép JavaScript và Jest
        const filteredLanguages = (response.languages || []).filter(
          lang => lang.language === 'javascript' && lang.framework === 'jest'
        );
        setAvailableLanguages(filteredLanguages);
      }
    } catch (error) {
      console.error('Failed to load available languages:', error);
    }
  };

  const loadInstructionTemplates = async (language, framework) => {
    if (!language || !framework) return;
    
    setLoadingTemplates(true);
    try {
      const response = await projectsService.getInstructionTemplates({
        language,
        framework,
        scope: 'unit_testing'
      });
      if (response.success) {
        setInstructionTemplates(response.templates || []);
      }
    } catch (error) {
      console.error('Failed to load instruction templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const getSelectedProvider = () => {
    return gitProviders.find(provider => provider.name === formData.gitProvider);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGitProviderChange = (value) => {
    handleInputChange('gitProvider', value);
    // Reset repository when provider changes
    handleInputChange('repository', '');
  };

  const handleNotifyChannelToggle = (channel, checked) => {
    if (checked) {
      // Add channel if not already present
      if (!formData.notifyChannels.includes(channel)) {
        setFormData(prev => ({
          ...prev,
          notifyChannels: [...prev.notifyChannels, channel]
        }));
      }
    } else {
      // Remove channel
      setFormData(prev => ({
        ...prev,
        notifyChannels: prev.notifyChannels.filter(c => c !== channel)
      }));
    }
  };



  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setSelectedFramework('');
    setInstructionTemplates([]);
    setFormData(prev => ({
      ...prev,
      testingLanguage: language,
      testingFramework: '',
      instructionTemplates: []
    }));
  };

  const handleFrameworkChange = (framework) => {
    setSelectedFramework(framework);
    setFormData(prev => ({
      ...prev,
      testingFramework: framework
    }));
    loadInstructionTemplates(selectedLanguage, framework);
  };

  const handleInstructionTemplateToggle = (templateId) => {
    setFormData(prev => ({
      ...prev,
      instructionTemplates: prev.instructionTemplates.includes(templateId)
        ? prev.instructionTemplates.filter(id => id !== templateId)
        : [...prev.instructionTemplates, templateId]
    }));
  };

  // User search functions
  const handleUserSearch = async (email) => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      setSearchError('');
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setHasSearched(true);
    
    try {
      const response = await projectsService.searchUsersByEmail(email);
      if (response.success) {
        const users = response.users || [];
        setSearchResults(users);
        
        // Nếu không tìm thấy user nào
        if (users.length === 0) {
          setSearchError(`Không tìm thấy user nào với email: ${email}`);
        }
      } else {
        setSearchResults([]);
        setSearchError('Lỗi khi tìm kiếm user. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      setSearchError('Lỗi khi tìm kiếm user. Vui lòng thử lại.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = (user, role = 'member') => {
    // Check if user is already added
    const isAlreadyAdded = formData.members.some(member => member.id === user.id);
    if (!isAlreadyAdded) {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, { ...user, role }]
      }));
    }
    setUserSearchEmail('');
    setSearchResults([]);
    setSearchError('');
    setHasSearched(false);
  };

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== userId)
    }));
  };

  // Functions to handle adding new elements
  const handleNewViewpointChange = (templateId, value) => {
    setNewViewpoints(prev => ({ ...prev, [templateId]: value }));
  };

  const handleAddViewpoint = (templateId) => {
    const newValue = newViewpoints[templateId]?.trim();
    if (!newValue) return;

    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        if (!updatedTemplate.templateData.templates[0].viewpoints) {
          updatedTemplate.templateData.templates[0].viewpoints = [];
        }
        updatedTemplate.templateData.templates[0].viewpoints.push(newValue);
        return updatedTemplate;
      }
      return template;
    }));

    setNewViewpoints(prev => ({ ...prev, [templateId]: '' }));
  };

  const handleRemoveViewpoint = (templateId, index) => {
    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        updatedTemplate.templateData.templates[0].viewpoints.splice(index, 1);
        return updatedTemplate;
      }
      return template;
    }));
  };

  const handleNewTestPatternChange = (templateId, value) => {
    setNewTestPatterns(prev => ({ ...prev, [templateId]: value }));
  };

  const handleAddTestPattern = (templateId) => {
    const newValue = newTestPatterns[templateId]?.trim();
    if (!newValue) return;

    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        if (!updatedTemplate.templateData.templates[0].test_patterns) {
          updatedTemplate.templateData.templates[0].test_patterns = [];
        }
        updatedTemplate.templateData.templates[0].test_patterns.push(newValue);
        return updatedTemplate;
      }
      return template;
    }));

    setNewTestPatterns(prev => ({ ...prev, [templateId]: '' }));
  };

  const handleRemoveTestPattern = (templateId, index) => {
    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        updatedTemplate.templateData.templates[0].test_patterns.splice(index, 1);
        return updatedTemplate;
      }
      return template;
    }));
  };

  const handleNewExampleChange = (templateId, value) => {
    setNewExamples(prev => ({ ...prev, [templateId]: value }));
  };

  const handleAddExample = (templateId) => {
    const newValue = newExamples[templateId]?.trim();
    if (!newValue) return;

    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        if (!updatedTemplate.templateData.templates[0].examples) {
          updatedTemplate.templateData.templates[0].examples = [];
        }
        updatedTemplate.templateData.templates[0].examples.push(newValue);
        return updatedTemplate;
      }
      return template;
    }));

    setNewExamples(prev => ({ ...prev, [templateId]: '' }));
  };

  const handleRemoveExample = (templateId, index) => {
    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        updatedTemplate.templateData.templates[0].examples.splice(index, 1);
        return updatedTemplate;
      }
      return template;
    }));
  };

  const handleNewCoverageChange = (templateId, value) => {
    setNewCoverages(prev => ({ ...prev, [templateId]: value }));
  };

  const handleAddCoverage = (templateId) => {
    const newValue = newCoverages[templateId]?.trim();
    if (!newValue) return;

    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        if (!updatedTemplate.templateData.templates[0].coverage_focus) {
          updatedTemplate.templateData.templates[0].coverage_focus = [];
        }
        updatedTemplate.templateData.templates[0].coverage_focus.push(newValue);
        return updatedTemplate;
      }
      return template;
    }));

    setNewCoverages(prev => ({ ...prev, [templateId]: '' }));
  };

  const handleRemoveCoverage = (templateId, index) => {
    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        const updatedTemplate = { ...template };
        updatedTemplate.templateData.templates[0].coverage_focus.splice(index, 1);
        return updatedTemplate;
      }
      return template;
    }));
  };

  // Functions to handle editing descriptions
  const handleDescriptionEdit = (templateId) => {
    setEditingDescriptions(prev => ({ ...prev, [templateId]: true }));
  };

  const handleDescriptionChange = (templateId, value) => {
    setInstructionTemplates(prev => prev.map(template => {
      if (template.id === templateId) {
        return { ...template, description: value };
      }
      return template;
    }));
  };

  const handleDescriptionSave = (templateId) => {
    setEditingDescriptions(prev => ({ ...prev, [templateId]: false }));
  };

  const handleDescriptionCancel = (templateId) => {
    // Reset description to original value
    setEditingDescriptions(prev => ({ ...prev, [templateId]: false }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (formData.name.length > 255) {
      newErrors.name = 'Project name must be less than 255 characters';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    // Kiểm tra repository chỉ khi đã kết nối Git
    if (showGitSection && gitConnected && !formData.repository) {
      newErrors.repository = 'Repository is required when Git is connected';
    }
    
    // Check domain only for self-hosted providers
    if (showGitSection && gitConnected) {
      const selectedProvider = getSelectedProvider();
      if (selectedProvider && selectedProvider.is_selfhost && !formData.domain) {
        newErrors.domain = 'Domain is required for self-hosted providers';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      
      // Prepare complete instruction data with raw template data
      const instructionData = {
        customInstructions: formData.description || null,
        selectedTemplates: formData.instructionTemplates || [],
        testingLanguage: selectedLanguage,
        testingFramework: selectedFramework,
        templates: (formData.instructionTemplates || []).map(templateId => {
          const template = instructionTemplates.find(t => t.id === templateId);
          return template ? {
            id: template.id,
            name: template.name,
            description: template.description,
            templateData: template.templateData,
            viewpoints: template.templateData?.templates?.[0]?.viewpoints || [],
            testPatterns: template.templateData?.templates?.[0]?.test_patterns || [],
            testCases: template.templateData?.templates?.[0]?.test_cases || []
          } : null;
        }).filter(t => t !== null),
        config: {
          customInstructions: formData.description || null,
          selectedTemplates: formData.instructionTemplates || [],
          testingLanguage: selectedLanguage,
          testingFramework: selectedFramework
        }
      };

      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        gitProvider: showGitSection ? formData.gitProvider : null,
        personalAccessToken: gitConnected && connectedRepository ? connectedRepository.personalAccessToken : null,
        repository: showGitSection ? formData.repository : null,
        notifyChannels: formData.notifyChannels,
        members: formData.members.map(member => member.id), // Chỉ gửi user IDs
        instruction: JSON.stringify(instructionData) // Luôn gửi instruction data
      };
      
      const response = await projectsService.createProject(projectData);
      
      if (response.success) {
        onSubmit(response.project);
        onClose();
        resetForm();
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      gitProvider: 'github',
      domain: '',
      repository: '',
      notifyChannels: ['email'],
      instructionTemplates: [],
      testingLanguage: '',
      testingFramework: '',
      members: []
    });
    setErrors({});
    setShowGitSection(false);
    setShowInstructionsSection(false);
    setGitConnected(false);
    setConnectedRepository(null);
    setSelectedLanguage('');
    setSelectedFramework('');
    setInstructionTemplates([]);
    setNewViewpoints({});
    setNewTestPatterns({});
    setNewExamples({});
    setNewCoverages({});
    setEditingDescriptions({});
    setUserSearchEmail('');
    setSearchResults([]);
    setSearchError('');
    setHasSearched(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGitConnectSuccess = (gitData) => {
    // Cập nhật form data với thông tin từ Git
    setFormData(prev => ({
      ...prev,
      repository: gitData.repository || '',
      domain: gitData.domain || '',
      gitProvider: gitData.gitProvider || 'github'
    }));
    setGitConnected(true);
    // Lưu toàn bộ gitData bao gồm personalAccessToken
    setConnectedRepository(gitData);
    setGitConnectModalOpen(false);
  };

  const handleConnectGit = () => {
    setGitConnectModalOpen(true);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Project</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Basic Information */}
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <TextField
              label="Project Name *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              required
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              fullWidth
              multiline
              rows={3}
            />

            {/* Project Members Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Project Members (Optional)
              </Typography>
              
              {/* User Search */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Search Users by Email"
                  placeholder="Enter email to search for users"
                  value={userSearchEmail}
                  onChange={(e) => {
                    const email = e.target.value;
                    setUserSearchEmail(email);
                    handleUserSearch(email);
                  }}
                  helperText={
                    searchError 
                      ? searchError 
                      : hasSearched && searchResults.length === 0 && !isSearching
                      ? "Không tìm thấy user nào"
                      : "Type email to search and add users as project members"
                  }
                  error={!!searchError || (hasSearched && searchResults.length === 0 && !isSearching && userSearchEmail.length >= 3)}
                  fullWidth
                  InputProps={{
                    endAdornment: isSearching ? <CircularProgress size={20} /> : null
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (userSearchEmail.length >= 3) {
                      handleUserSearch(userSearchEmail);
                    }
                  }}
                  disabled={userSearchEmail.length < 3 || isSearching}
                  sx={{ minWidth: 100, alignSelf: 'flex-start', mt: 1 }}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </Box>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Search Results:
                  </Typography>
                  {searchResults.map((user) => (
                    <Box key={user.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px solid #eee' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2">{user.displayName || user.username}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value="member"
                            onChange={(e) => {
                              const role = e.target.value;
                              handleAddUser(user, role);
                            }}
                            disabled={formData.members.some(member => member.id === user.id)}
                          >
                            <MenuItem value="member">Member</MenuItem>
                            <MenuItem value="viewer">Viewer</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleAddUser(user, 'member')}
                          disabled={formData.members.some(member => member.id === user.id)}
                        >
                          {formData.members.some(member => member.id === user.id) ? 'Added' : 'Add'}
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* No Results Alert */}
              {hasSearched && searchResults.length === 0 && !isSearching && userSearchEmail.length >= 3 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Không tìm thấy user nào với email: <strong>{userSearchEmail}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Vui lòng kiểm tra lại email hoặc thử tìm kiếm với email khác.
                  </Typography>
                </Alert>
              )}

              {/* Selected Members */}
              {formData.members.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Selected Members:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {formData.members.map((member) => (
                      <Chip
                        key={member.id}
                        label={`${member.displayName || member.username} (${member.role})`}
                        onDelete={() => handleRemoveUser(member.id)}
                        color="primary"
                        variant="outlined"
                        deleteIcon={<CloseIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            
            {/* Git Integration Section */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowGitSection(!showGitSection)}
                fullWidth
              >
                {showGitSection ? 'Hide' : 'Show'} Git Integration (Optional)
              </Button>
              
              {showGitSection && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Link to Git Repository (Optional)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    You can create a project without connecting to Git repository
                  </Typography>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Git Provider</InputLabel>
                    <Select
                      value={formData.gitProvider}
                      onChange={(e) => handleGitProviderChange(e.target.value)}
                      label="Git Provider"
                      disabled={loadingProviders}
                    >
                      {loadingProviders ? (
                        <MenuItem value="">Loading providers...</MenuItem>
                      ) : gitProviders.length === 0 ? (
                        <MenuItem value="">No providers available</MenuItem>
                      ) : (
                        gitProviders.map((provider) => (
                          <MenuItem key={provider.name} value={provider.name}>
                            {provider.display_name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  
                  {/* Show domain field only for self-hosted providers */}
                  {getSelectedProvider()?.is_selfhost && (
                    <TextField
                      label="Domain"
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      error={!!errors.domain}
                      helperText={errors.domain || 'Enter your self-hosted domain'}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                  )}
                  
                  {/* Connect Git button */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={gitConnected ? <CheckIcon /> : <GitHubIcon />}
                      onClick={handleConnectGit}
                      color={gitConnected ? 'success' : 'primary'}
                      fullWidth
                    >
                      {gitConnected ? 'Git Connected' : 'Connect Git Repository'}
                    </Button>
                  </Box>
                  
                  {/* Show connected repository info if connected */}
                  {gitConnected && connectedRepository && (
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mb: 2 }}>
                      <Typography variant="subtitle2" color="success.dark" gutterBottom>
                        ✓ Repository Connected
                      </Typography>
                      <Typography variant="body2" color="success.dark">
                        {connectedRepository.repository}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            
                         {/* Notification Channel */}
             <Box sx={{ mt: 2 }}>
               <Typography variant="subtitle2" gutterBottom>
                 Notification Channels
               </Typography>
               <FormControl component="fieldset">
                 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                   <FormControlLabel
                     control={
                       <Checkbox
                         checked={formData.notifyChannels.includes('email')}
                         onChange={(e) => handleNotifyChannelToggle('email', e.target.checked)}
                       />
                     }
                     label="Email"
                   />
                   <FormControlLabel
                     control={
                       <Checkbox
                         checked={formData.notifyChannels.includes('slack')}
                         onChange={(e) => handleNotifyChannelToggle('slack', e.target.checked)}
                       />
                     }
                     label="Slack"
                   />
                   <FormControlLabel
                     control={
                       <Checkbox
                         checked={formData.notifyChannels.includes('discord')}
                         onChange={(e) => handleNotifyChannelToggle('discord', e.target.checked)}
                       />
                     }
                     label="Discord"
                   />
                   <FormControlLabel
                     control={
                       <Checkbox
                         checked={formData.notifyChannels.includes('none')}
                         onChange={(e) => handleNotifyChannelToggle('none', e.target.checked)}
                       />
                     }
                     label="None"
                   />
                 </Box>
               </FormControl>
               
               {/* Selected Channels Display */}
               {formData.notifyChannels.length > 0 && (
                 <Box sx={{ mt: 1 }}>
                   <Typography variant="caption" color="text.secondary" gutterBottom>
                     Selected channels:
                   </Typography>
                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                     {formData.notifyChannels.map((channel) => (
                       <Chip
                         key={channel}
                         label={channel}
                         size="small"
                         variant="outlined"
                         onDelete={() => handleNotifyChannelToggle(channel, false)}
                         sx={{ fontSize: '0.75rem' }}
                       />
                     ))}
                   </Box>
                 </Box>
               )}
             </Box>
            
            {/* Instructions Section */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowInstructionsSection(!showInstructionsSection)}
                fullWidth
              >
                {showInstructionsSection ? 'Hide' : 'Show'} Test Instructions (Optional)
              </Button>
              
              {showInstructionsSection && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  {/* Instruction Templates Selection */}
                  <Typography variant="subtitle2" gutterBottom>
                    Instruction Templates
                  </Typography>
                  
                  {/* Language Selection */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Testing Language</InputLabel>
                    <Select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      label="Testing Language"
                    >
                      <MenuItem value="">Select Language</MenuItem>
                      {availableLanguages
                        .filter(lang => lang.language === 'javascript')
                        .map((lang) => (
                          <MenuItem key={`${lang.language}-${lang.framework}`} value={lang.language}>
                            {lang.language.charAt(0).toUpperCase() + lang.language.slice(1)} ({lang.framework})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  {/* Framework Selection */}
                  {selectedLanguage && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Testing Framework</InputLabel>
                      <Select
                        value={selectedFramework}
                        onChange={(e) => handleFrameworkChange(e.target.value)}
                        label="Testing Framework"
                        disabled={!selectedLanguage}
                      >
                        <MenuItem value="">Select Framework</MenuItem>
                        {availableLanguages
                          .filter(lang => lang.language === selectedLanguage && lang.framework === 'jest')
                          .map((lang) => (
                            <MenuItem key={lang.framework} value={lang.framework}>
                              {lang.framework}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Instruction Templates */}
                  {selectedLanguage && selectedFramework && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Available Templates:
                      </Typography>
                      {loadingTemplates ? (
                        <Box display="flex" justifyContent="center" p={2}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          {instructionTemplates.map((template) => (
                            <Chip
                              key={template.id}
                              label={template.name}
                              onClick={() => handleInstructionTemplateToggle(template.id)}
                              color={formData.instructionTemplates.includes(template.id) ? 'primary' : 'default'}
                              variant={formData.instructionTemplates.includes(template.id) ? 'filled' : 'outlined'}
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                      
                                             {formData.instructionTemplates.length > 0 && (
                         <Box sx={{ mb: 2 }}>
                           <Typography variant="caption" color="textSecondary" gutterBottom>
                             Selected instruction templates:
                           </Typography>
                           {formData.instructionTemplates.map((templateId) => {
                             const template = instructionTemplates.find(t => t.id === templateId);
                             return (
                                                               <Box key={templateId} sx={{ mt: 1, p: 1, borderRadius: 1, border: '1px solid #ddd' }}>
                                                                   <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                                    {template?.name}
                                  </Typography>
                                  
                                  {/* Editable Description */}
                                  <Box sx={{ mb: 1 }}>
                                    {editingDescriptions[templateId] ? (
                                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                        <TextField
                                          size="small"
                                          value={template?.description || ''}
                                          onChange={(e) => handleDescriptionChange(templateId, e.target.value)}
                                          multiline
                                          rows={2}
                                          sx={{ flexGrow: 1 }}
                                        />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => handleDescriptionSave(templateId)}
                                            sx={{ minWidth: '60px' }}
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleDescriptionCancel(templateId)}
                                            sx={{ minWidth: '60px' }}
                                          >
                                            Cancel
                                          </Button>
                                        </Box>
                                      </Box>
                                    ) : (
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="body2" color="primary.dark" sx={{ flexGrow: 1 }}>
                                          {template?.description || 'No description'}
                                        </Typography>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleDescriptionEdit(templateId)}
                                          sx={{ ml: 1, minWidth: '60px' }}
                                        >
                                          Edit
                                        </Button>
                                      </Box>
                                    )}
                                  </Box>
                                 
                                                                   {/* Template Details */}
                                  <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                                      Template Details:
                                    </Typography>
                                    
                                    {/* Viewpoints */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" color="primary.dark" fontWeight="bold" gutterBottom>
                                        Viewpoints:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        {template?.templateData?.templates?.[0]?.viewpoints?.map((viewpoint, index) => (
                                          <Chip
                                            key={index}
                                            label={viewpoint}
                                            size="small"
                                            variant="outlined"
                                            onDelete={() => handleRemoveViewpoint(templateId, index)}
                                            sx={{ fontSize: '0.75rem' }}
                                          />
                                        )) || []}
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                          size="small"
                                          placeholder="Add new viewpoint..."
                                          value={newViewpoints[templateId] || ''}
                                          onChange={(e) => handleNewViewpointChange(templateId, e.target.value)}
                                          sx={{ flexGrow: 1 }}
                                        />
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleAddViewpoint(templateId)}
                                          disabled={!newViewpoints[templateId]?.trim()}
                                        >
                                          Add
                                        </Button>
                                      </Box>
                                    </Box>
                                    
                                    {/* Test Patterns */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" color="primary.dark" fontWeight="bold" gutterBottom>
                                        Test Patterns:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        {template?.templateData?.templates?.[0]?.test_patterns?.map((pattern, index) => (
                                          <Chip
                                            key={index}
                                            label={pattern}
                                            size="small"
                                            variant="outlined"
                                            onDelete={() => handleRemoveTestPattern(templateId, index)}
                                            sx={{ fontSize: '0.75rem' }}
                                          />
                                        )) || []}
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                          size="small"
                                          placeholder="Add new test pattern..."
                                          value={newTestPatterns[templateId] || ''}
                                          onChange={(e) => handleNewTestPatternChange(templateId, e.target.value)}
                                          sx={{ flexGrow: 1 }}
                                        />
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleAddTestPattern(templateId)}
                                          disabled={!newTestPatterns[templateId]?.trim()}
                                        >
                                          Add
                                        </Button>
                                      </Box>
                                    </Box>
                                    
                                    {/* Examples */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" color="primary.dark" fontWeight="bold" gutterBottom>
                                        Examples:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        {template?.templateData?.templates?.[0]?.examples?.map((example, index) => (
                                          <Chip
                                            key={index}
                                            label={example}
                                            size="small"
                                            variant="outlined"
                                            onDelete={() => handleRemoveExample(templateId, index)}
                                            sx={{ fontSize: '0.75rem' }}
                                          />
                                        )) || []}
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                          size="small"
                                          placeholder="Add new example..."
                                          value={newExamples[templateId] || ''}
                                          onChange={(e) => handleNewExampleChange(templateId, e.target.value)}
                                          sx={{ flexGrow: 1 }}
                                        />
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleAddExample(templateId)}
                                          disabled={!newExamples[templateId]?.trim()}
                                        >
                                          Add
                                        </Button>
                                      </Box>
                                    </Box>
                                    
                                    {/* Coverage Focus */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" color="primary.dark" fontWeight="bold" gutterBottom>
                                        Coverage Focus:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        {template?.templateData?.templates?.[0]?.coverage_focus?.map((coverage, index) => (
                                          <Chip
                                            key={index}
                                            label={coverage}
                                            size="small"
                                            variant="outlined"
                                            onDelete={() => handleRemoveCoverage(templateId, index)}
                                            sx={{ fontSize: '0.75rem' }}
                                          />
                                        )) || []}
                                      </Box>
                                      <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                          size="small"
                                          placeholder="Add new coverage focus..."
                                          value={newCoverages[templateId] || ''}
                                          onChange={(e) => handleNewCoverageChange(templateId, e.target.value)}
                                          sx={{ flexGrow: 1 }}
                                        />
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => handleAddCoverage(templateId)}
                                          disabled={!newCoverages[templateId]?.trim()}
                                        >
                                          Add
                                        </Button>
                                      </Box>
                                    </Box>
                                    
                                    {/* Raw JSON Data */}
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="body2" color="primary.dark" fontWeight="bold" gutterBottom>
                                        Raw Template Data:
                                      </Typography>
                                      <Box
                                        sx={{
                                          p: 1,
                                          borderRadius: 1,
                                          fontFamily: 'monospace',
                                          fontSize: '0.75rem',
                                          maxHeight: '200px',
                                          overflow: 'auto',
                                          border: '1px solid rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                          {JSON.stringify(template?.templateData, null, 2)}
                                        </pre>
                                      </Box>
                                    </Box>
                                  </Box>
                               </Box>
                             );
                           })}
                         </Box>
                       )}
                    </Box>
                  )}

                  
                </Box>
              )}
            </Box>
            
            {errors.submit && (
              <Alert severity="error">
                {errors.submit}
              </Alert>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !formData.name.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
      
      {/* GitHub Connect Modal */}
              <GitConnectModal
        open={gitConnectModalOpen}
        onClose={() => setGitConnectModalOpen(false)}
        onSuccess={handleGitConnectSuccess}
      />
    </Dialog>
  );
};

export default CreateProjectModal;
