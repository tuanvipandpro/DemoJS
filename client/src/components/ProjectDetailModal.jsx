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
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { projectsService } from '../services/projects';
import ConfirmDialog from './ConfirmDialog';

const ProjectDetailModal = ({ open, onClose, project, onProjectUpdated, onProjectDeleted }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ userId: '', role: 'member', userInfo: null });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [error, setError] = useState(null);
  
  // Instruction editing state
  const [showInstructionsSection, setShowInstructionsSection] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(false);
  const [instructionText, setInstructionText] = useState(project?.instruction || '');
  const [savingInstruction, setSavingInstruction] = useState(false);
  
  // Instruction templates state
  const [instructionTemplates, setInstructionTemplates] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  
  // Parsed instruction data
  const [parsedInstructionData, setParsedInstructionData] = useState(null);
  
  // Document import state
  const [showDocumentImport, setShowDocumentImport] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  
  // User search state
  const [userSearchEmail, setUserSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [confirmRunOpen, setConfirmRunOpen] = useState(false);
  const [runningProject, setRunningProject] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  useEffect(() => {
    if (open && project) {
      fetchMembers();
      fetchAvailableUsers();
      setInstructionText(project.instruction || '');
      loadAvailableLanguages();
      
      // Parse existing instruction data if available
      if (project.instruction) {
        try {
          const instructionData = JSON.parse(project.instruction);
          setParsedInstructionData(instructionData);
          if (instructionData.customInstructions) {
            setInstructionText(instructionData.customInstructions);
          }
        } catch (error) {
          // If not JSON, treat as plain text
          setParsedInstructionData(null);
          setInstructionText(project.instruction);
        }
      } else {
        setParsedInstructionData(null);
      }
    }
  }, [open, project]); // Remove token dependency

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      
      const response = await projectsService.getProjectMembers(project.id);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error.message);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      // TODO: Implement API to fetch available users
      // For now, use mock data
      setAvailableUsers([
        { id: 1, username: 'developer1', displayName: 'Developer One', email: 'dev1@example.com' },
        { id: 2, username: 'developer2', displayName: 'Developer Two', email: 'dev2@example.com' },
        { id: 3, username: 'tester1', displayName: 'Tester One', email: 'tester1@example.com' }
      ]);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      const response = await projectsService.addProjectMember(project.id, newMember);
      await fetchMembers();
      setShowAddMember(false);
      setNewMember({ userId: '', role: 'member', userInfo: null });
      setUserSearchEmail('');
      setSearchResults([]);
      setSearchError('');
      setHasSearched(false);
      setError(null);
    } catch (error) {
      console.error('Error adding member:', error);
      setError(error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const response = await projectsService.removeProjectMember(project.id, memberId);
      await fetchMembers();
      setError(null);
    } catch (error) {
      console.error('Error removing member:', error);
      setError(error.message);
    }
  };

  const handleRunProject = () => {
    setConfirmRunOpen(true);
  };

  const handleConfirmRun = async () => {
    try {
      setRunningProject(true);
      // TODO: Implement project run functionality

      // Có thể gọi API để chạy project
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConfirmRunOpen(false);
      // TODO: Show success message
    } catch (error) {
      console.error('Error running project:', error);
      // TODO: Show error message
    } finally {
      setRunningProject(false);
    }
  };

  const handleDeleteProject = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeletingProject(true);
      const response = await projectsService.deleteProject(project.id);
      if (response.success) {
        onProjectDeleted(project.id);
        setConfirmDeleteOpen(false);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.message || 'Failed to delete project');
    } finally {
      setDeletingProject(false);
    }
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
        // Filter out users who are already members
        const filteredResults = (response.users || []).filter(
          u => !members.some(m => m.userId === u.id)
        );
        setSearchResults(filteredResults);
        
        // Nếu không tìm thấy user nào
        if (filteredResults.length === 0) {
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

  const handleAddUserFromSearch = (user) => {
    setNewMember(prev => ({
      ...prev,
      userId: user.id,
      userInfo: user // Lưu thông tin user đầy đủ
    }));
    setUserSearchEmail('');
    setSearchResults([]);
    setSearchError('');
    setHasSearched(false);
  };

  const handleSaveInstruction = async () => {
    try {
      setSavingInstruction(true);
      const response = await projectsService.updateProject(project.id, {
        instruction: instructionText
      });
      
      // Update project in parent component
      if (onProjectUpdated) {
        onProjectUpdated({ ...project, instruction: instructionText });
      }
      
      setEditingInstruction(false);
      setError(null);
    } catch (error) {
      console.error('Error updating instruction:', error);
      setError(error.message);
    } finally {
      setSavingInstruction(false);
    }
  };

  const handleCancelEditInstruction = () => {
    setInstructionText(project.instruction || '');
    setEditingInstruction(false);
  };

  // Instruction templates functions
  const loadInstructionTemplates = async (language, framework) => {
    try {
      setLoadingTemplates(true);
      const response = await projectsService.getInstructionTemplates({
        language,
        framework
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

  const loadAvailableLanguages = async () => {
    try {
      const response = await projectsService.getAvailableLanguages();
      if (response.success) {
        setAvailableLanguages(response.languages || []);
      }
    } catch (error) {
      console.error('Failed to load available languages:', error);
    }
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setSelectedFramework('');
    setInstructionTemplates([]);
    if (language) {
      loadInstructionTemplates(language, 'jest'); // Default to jest
    }
  };

  const handleFrameworkChange = (framework) => {
    setSelectedFramework(framework);
    if (selectedLanguage && framework) {
      loadInstructionTemplates(selectedLanguage, framework);
    }
  };

  // Document import functions
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleDocumentImport = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one document to import');
      return;
    }

    setUploadingDocuments(true);
    setImportProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('projectId', project.id);
      
      selectedFiles.forEach((file, index) => {
        formData.append(`documents`, file);
      });

      // Call API to process documents
      const response = await fetch('/api/projects/import-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to import documents');
      }

      const result = await response.json();
      
      if (result.success) {
        setImportProgress(100);
        setSelectedFiles([]);
        setShowDocumentImport(false);
        setError(null);
        // Show success message
        alert(`Successfully imported ${result.importedCount} documents`);
      } else {
        throw new Error(result.error || 'Failed to import documents');
      }
    } catch (error) {
      console.error('Error importing documents:', error);
      setError(error.message);
    } finally {
      setUploadingDocuments(false);
      setImportProgress(0);
    }
  };

  const handleCancelDocumentImport = () => {
    setSelectedFiles([]);
    setShowDocumentImport(false);
    setError(null);
    setImportProgress(0);
  };

  const getNotificationIcon = (channel) => {
    switch (channel) {
      case 'email': return <EmailIcon />;
      case 'slack': return <ChatIcon />;
      case 'discord': return <ChatIcon />;
      default: return null;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'error';
      case 'admin': return 'warning';
      case 'member': return 'primary';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };

  const isOwner = project?.ownerId === user?.id;
  const isAdmin = members.some(m => m.userId === user?.id && ['owner', 'admin'].includes(m.role));

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      BackdropProps={{
        'aria-hidden': false,
        inert: false,
        onClick: onClose
      }}
      disableEnforceFocus={false}
      disableAutoFocus={false}
      disableRestoreFocus={false}
      keepMounted={false}
      hideBackdrop={false}
      disablePortal={false}
      disableScrollLock={false}
      disableEscapeKeyDown={false}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{project?.name}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Project Information
            </Typography>
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {project?.description || 'No description provided'}
                </Typography>
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={project?.status || 'active'}
                  color={project?.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Owner
                </Typography>
                <Typography variant="body1">
                  {project?.ownerDisplayName || project?.ownerUsername}
                </Typography>
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Git Repository */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Git Repository
            </Typography>
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Git Provider
                </Typography>
                <Box>
                  {project?.gitProvider ? (
                    <Chip 
                      label={project.gitProvider} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      icon={<GitHubIcon />}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not connected
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Repository URL
                </Typography>
                <Typography variant="body1">
                  {project?.repository ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GitHubIcon />
                      <Typography 
                        variant="body1" 
                        component="a" 
                        href={project.repository} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ textDecoration: 'none', color: 'primary.main' }}
                      >
                        {project.repository}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not connected
                    </Typography>
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Notification Settings */}
          {project?.notifyChannel && project.notifyChannel !== 'none' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Channel
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getNotificationIcon(project.notifyChannel)}
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {project.notifyChannel}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Test Instructions */}
          {project?.configJson?.templateInstructions?.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Test Instructions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {project.configJson.templateInstructions.map((instruction, index) => (
                  <Chip
                    key={index}
                    label={instruction}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {project?.configJson?.customInstructions && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Custom Instructions
              </Typography>
              <Typography variant="body1">
                {project.configJson.customInstructions}
              </Typography>
            </Box>
          )}

          <Divider />

            {/* Add Member Form */}
            {showAddMember && (isOwner || isAdmin) && (
              <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Add New Member
                </Typography>
                
                {/* User Search by Email */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
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
                          : "Type email to search and select users"
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
                    <Box sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
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
                                value={newMember.role}
                                onChange={(e) => {
                                  setNewMember(prev => ({ ...prev, role: e.target.value }));
                                }}
                              >
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="viewer">Viewer</MenuItem>
                                {isOwner && <MenuItem value="admin">Admin</MenuItem>}
                      </Select>
                    </FormControl>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAddUserFromSearch(user)}
                              disabled={newMember.userId === user.id}
                            >
                              {newMember.userId === user.id ? 'Selected' : 'Select'}
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* No Results Alert */}
                  {hasSearched && searchResults.length === 0 && !isSearching && userSearchEmail.length >= 3 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Không tìm thấy user nào với email: <strong>{userSearchEmail}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Vui lòng kiểm tra lại email hoặc thử tìm kiếm với email khác.
                      </Typography>
                    </Alert>
                  )}
                </Box>

                {/* Selected User Display */}
                {newMember.userId && (
                  <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected User:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                          {newMember.userInfo?.displayName || 
                           newMember.userInfo?.username || 
                           'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {newMember.userInfo?.email || 'No email'}
                        </Typography>
                      </Box>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={newMember.role}
                        onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                        label="Role"
                      >
                        <MenuItem value="member">Member</MenuItem>
                        <MenuItem value="viewer">Viewer</MenuItem>
                        {isOwner && <MenuItem value="admin">Admin</MenuItem>}
                      </Select>
                    </FormControl>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setNewMember({ userId: '', role: 'member', userInfo: null });
                        }}
                        size="small"
                      >
                        Clear
                      </Button>
                    <Button
                      variant="contained"
                      onClick={handleAddMember}
                      disabled={!newMember.userId}
                      >
                        Add Member
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            

            {/* Members List */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  Project Members ({members.length})
                </Typography>
                {(isOwner || isAdmin) && (
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setShowAddMember(!showAddMember)}
                    size="small"
                  >
                    {showAddMember ? 'Cancel' : 'Add Member'}
                  </Button>
                )}
              </Box>
              
              {members.length === 0 ? (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  border: '1px dashed #ccc', 
                  borderRadius: 1,
                  bgcolor: 'grey.50'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    No members added to this project yet.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              {members.map((member) => (
                <ListItem key={member.id} divider>
                  <ListItemText
                    primary={
                      <Typography variant="body1" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{member.displayName || member.username}</span>
                        <Chip
                          label={member.role}
                          color={getRoleColor(member.role)}
                          size="small"
                        />
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="textSecondary" component="div">
                        <div>{member.email}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                          Added by: {member.addedByUsername || 'Unknown'}
                        </div>
                        </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    {(isOwner || isAdmin) && member.role !== 'owner' && (
                      <Tooltip title="Remove Member">
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveMember(member.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
                            )}
            </Box>

            {/* Instructions Section */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setShowInstructionsSection(!showInstructionsSection)}
                fullWidth
              >
                {showInstructionsSection ? 'Hide' : 'Show'} Test Instructions (Optional)
              </Button>
              
              {showInstructionsSection && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  {/* Current Instructions Display */}
                  {project.instruction && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current Project Instructions
                      </Typography>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #2196f3', 
                        borderRadius: 1, 
                        bgcolor: '#e3f2fd'
                      }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          This project has the following instructions:
                        </Typography>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'white', 
                          border: '1px solid #ddd', 
                          borderRadius: 1,
                          maxHeight: 200,
                          overflow: 'auto'
                        }}>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {typeof project.instruction === 'string' ? project.instruction : JSON.stringify(project.instruction, null, 2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

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
                              onClick={() => {
                                // Handle template selection if needed
                              }}
                              color="default"
                              variant="outlined"
                              sx={{ m: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Current Instruction Data */}
                  {parsedInstructionData && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Current Instruction Data
                      </Typography>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #4caf50', 
                        borderRadius: 1, 
                        bgcolor: '#f1f8e9'
                      }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          This project has existing instruction data:
                        </Typography>
                        
                        {/* Show selected templates if available */}
                        {parsedInstructionData.selectedTemplates && parsedInstructionData.selectedTemplates.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              Selected Templates:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {parsedInstructionData.selectedTemplates.map((templateId, index) => (
                                <Chip
                                  key={index}
                                  label={`Template ${templateId}`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                        
                        {/* Show language/framework if available */}
                        {(parsedInstructionData.language || parsedInstructionData.framework) && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              Testing Environment:
                            </Typography>
                            <Typography variant="body2">
                              Language: {parsedInstructionData.language || 'Not specified'} | 
                              Framework: {parsedInstructionData.framework || 'Not specified'}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Show instruction JSON structure */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Instruction Structure:
                          </Typography>
                          <Box sx={{ 
                            p: 1, 
                            bgcolor: 'white', 
                            border: '1px solid #ddd', 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            maxHeight: 150,
                            overflow: 'auto'
                          }}>
                            <pre>{JSON.stringify(parsedInstructionData, null, 2)}</pre>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Custom Instructions */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Custom Instructions
                    </Typography>
                    {(isOwner || isAdmin) && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                        <Tooltip title={editingInstruction ? "Cancel Edit" : "Edit Instructions"}>
                          <IconButton
                            onClick={() => editingInstruction ? handleCancelEditInstruction() : setEditingInstruction(true)}
                            color="primary"
                            size="small"
                          >
                            {editingInstruction ? <CancelIcon /> : <EditIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}

                    {editingInstruction ? (
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          value={typeof instructionText === 'string' ? instructionText : JSON.stringify(instructionText, null, 2)}
                          onChange={(e) => setInstructionText(e.target.value)}
                          placeholder="Enter project instructions..."
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            onClick={handleCancelEditInstruction}
                            disabled={savingInstruction}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSaveInstruction}
                            disabled={savingInstruction}
                            startIcon={savingInstruction ? <CircularProgress size={16} /> : <SaveIcon />}
                          >
                            {savingInstruction ? 'Saving...' : 'Save'}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1, 
                        bgcolor: 'grey.50',
                        minHeight: 100
                      }}>
                        {instructionText ? (
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {typeof instructionText === 'string' ? instructionText : JSON.stringify(instructionText, null, 2)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No custom instructions provided for this project.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Document Import Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  Document Import for AI
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setShowDocumentImport(!showDocumentImport)}
                  size="small"
                  disabled={!isOwner && !isAdmin}
                >
                  {showDocumentImport ? 'Cancel' : 'Import Documents'}
                </Button>
              </Box>

              {showDocumentImport && (
                <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  {!isOwner && !isAdmin ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Only project owners and admins can import documents.
                    </Alert>
                  ) : (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Import Documents for AI Context
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload documents (PDF, TXT, MD) to provide context for AI test generation. 
                        Documents will be processed and embedded using local RAG (LM Studio).
                      </Typography>
                    </>
                  )}

                  {/* File Upload */}
                  {(isOwner || isAdmin) && (
                    <Box sx={{ mb: 2 }}>
                      <input
                        accept=".pdf,.txt,.md,.docx"
                        style={{ display: 'none' }}
                        id="document-upload"
                        multiple
                        type="file"
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="document-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<DocumentIcon />}
                          disabled={uploadingDocuments}
                          sx={{ mb: 2 }}
                        >
                          Select Documents
                        </Button>
                      </label>

                      {/* Selected Files */}
                      {selectedFiles.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Selected Files ({selectedFiles.length}):
                          </Typography>
                          <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                            {selectedFiles.map((file, index) => (
                              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <DocumentIcon fontSize="small" />
                                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Progress Bar */}
                      {uploadingDocuments && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Processing documents... {importProgress}%
                          </Typography>
                          <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}>
                            <Box
                              sx={{
                                width: `${importProgress}%`,
                                height: 8,
                                bgcolor: 'primary.main',
                                borderRadius: 1,
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </Box>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          onClick={handleCancelDocumentImport}
                          disabled={uploadingDocuments}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleDocumentImport}
                          disabled={selectedFiles.length === 0 || uploadingDocuments}
                          startIcon={uploadingDocuments ? <CircularProgress size={16} /> : <UploadIcon />}
                        >
                          {uploadingDocuments ? 'Processing...' : 'Import Documents'}
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Supported Formats */}
                  {(isOwner || isAdmin) && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Supported formats: PDF, TXT, MD, DOCX (Max 10MB per file)
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {(isOwner || isAdmin) && (
          <Button variant="outlined" startIcon={<RunIcon />} onClick={handleRunProject}>
            Run Project
          </Button>
        )}
        {isOwner && (
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteProject}
            startIcon={<DeleteIcon />}
          >
            Delete Project
          </Button>
        )}
      </DialogActions>

      {/* Confirm Run Dialog */}
      <ConfirmDialog
        open={confirmRunOpen}
        onClose={() => setConfirmRunOpen(false)}
        onConfirm={handleConfirmRun}
        title="Xác nhận chạy Project"
        message={`Bạn có chắc chắn muốn chạy project "${project?.name}"? Hành động này sẽ bắt đầu quá trình test automation.`}
        confirmText="Chạy Project"
        cancelText="Hủy"
        severity="warning"
        loading={runningProject}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa Project"
        message={`Bạn có chắc chắn muốn xóa project "${project?.name}"? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.`}
        confirmText="Xóa Project"
        cancelText="Hủy"
        severity="error"
        loading={deletingProject}
      />
    </Dialog>
  );
};

export default ProjectDetailModal;


