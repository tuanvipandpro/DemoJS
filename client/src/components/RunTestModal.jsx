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
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { PlayArrow as PlayIcon, CheckCircle as CheckIcon, Error as ErrorIcon, GitHub as GitHubIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { runsService } from '../services/runs';
import { gitService } from '../services/git';
import { projectsService } from '../services/projects';
import GitConnectModal from './GitConnectModal';
import RunPipelineModal from './RunPipelineModal';

const RunTestModal = ({ open, onClose, project, onRunCreated }) => {
  const [formData, setFormData] = useState({
    branch: 'main',
    mode: 'manual'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [showGitConnect, setShowGitConnect] = useState(false);
  const [gitConnected, setGitConnected] = useState(false);
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [createdRunId, setCreatedRunId] = useState(null);

  // Load branches khi modal mở
  useEffect(() => {
    if (open && project) {
      checkGitConnection();
    }
  }, [open, project]);

  const checkGitConnection = async () => {
    if (!project?.id) {
      setGitConnected(false);
      return;
    }

    try {
      // Kiểm tra trạng thái Git từ backend
      const response = await projectsService.getGitStatus(project.id);
      
      if (response.success && response.gitStatus) {
        const { isConnected, hasGitProvider, hasToken, hasRepository } = response.gitStatus;
        
        // Chỉ kết nối nếu có đủ gitProvider và token
        if (hasGitProvider && hasToken) {
          setGitConnected(true);
          // Nếu đã kết nối, load branches
          if (isConnected) {
            await loadBranches();
          }
        } else {
          setGitConnected(false);
        }
      } else {
        setGitConnected(false);
      }
    } catch (error) {
      console.error('Git connection check failed:', error);
      setGitConnected(false);
    }
  };

  const loadBranches = async () => {
    if (!project?.id) {
      setBranches([]);
      return;
    }

    setLoadingBranches(true);
    try {
      // Sử dụng API mới để lấy branches cho project
      const response = await gitService.getProjectBranches(project.id);
      
      if (response.success && response.branches) {
        setBranches(response.branches);
        
        // Tự động chọn default branch nếu có
        const defaultBranch = response.branches.find(b => b.name === project.defaultBranch) || response.branches[0];
        if (defaultBranch) {
          setFormData(prev => ({ 
            ...prev, 
            branch: defaultBranch.name
          }));
        }
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setBranches([]);
      setErrors({ git: 'Không thể tải branches. Vui lòng kiểm tra kết nối Git.' });
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch is required';
    }
    
    if (!gitConnected) {
      newErrors.git = 'Git connection is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkTokenValidity = async () => {
    try {
      // Test git connection bằng cách load branches
      await loadBranches();
      return branches.length > 0;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check token validity trước khi run
      if (gitConnected) {
        const isTokenValid = await checkTokenValidity();
        if (!isTokenValid) {
          setErrors({ 
            submit: 'Git token đã hết hạn hoặc không hợp lệ. Vui lòng kết nối lại Git repository.' 
          });
          setGitConnected(false);
          return;
        }
      }
      
      // Nếu đã kết nối git và chưa có branches, load branches trước
      if (gitConnected && branches.length === 0) {
        await loadBranches();
      }
      
      const response = await runsService.createRun(project.id, {
        branch: formData.branch.trim(),
        mode: formData.mode
      });
      
      if (response.success) {
        setCreatedRunId(response.run.id);
        setPipelineModalOpen(true);
        onRunCreated(response.run);
        // Không đóng modal ngay, để user có thể thấy pipeline
        // onClose();
        // resetForm();
      } else {
        throw new Error(response.error || 'Failed to create test run');
      }
    } catch (error) {
      console.error('Error creating test run:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      branch: 'main',
      mode: 'manual'
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlayIcon color="primary" />
          Run Test for {project?.name}
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Project Info */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Project Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Name:</strong> {project?.name}
              </Typography>
              {project?.repository && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Repository:</strong> {project.repository}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                <strong>Git Provider:</strong> {project?.gitProvider || 'N/A'}
              </Typography>
            </Box>

            <Divider />

            {/* Git Connection Status */}
            {!gitConnected ? (
              <Alert 
                severity="warning" 
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={() => setShowGitConnect(true)}
                    startIcon={<GitHubIcon />}
                    disabled={isSubmitting}
                  >
                    Kết nối Git
                  </Button>
                }
              >
                <Typography variant="body2">
                  <strong>Chưa kết nối Git:</strong> Bạn cần kết nối Git repository để chạy test.
                </Typography>
              </Alert>
            ) : (
              <Alert 
                severity="success" 
                sx={{ mb: 2 }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={loadBranches}
                    disabled={loadingBranches || isSubmitting}
                    startIcon={<RefreshIcon />}
                  >
                    Refresh
                  </Button>
                }
              >
                <Typography variant="body2">
                  <strong>Đã kết nối Git:</strong> Repository {project?.repository}
                </Typography>
              </Alert>
            )}

            {/* Branch Selection */}
            {gitConnected && (
              <FormControl fullWidth>
                <InputLabel>Chọn Branch *</InputLabel>
                <Select
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  label="Chọn Branch *"
                  disabled={loadingBranches || isSubmitting || !gitConnected}
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.name} value={branch.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                          <Typography variant="body2">{branch.name}</Typography>
                          {branch.name === project?.defaultBranch && (
                            <Chip label="Default" size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {branch.commitSha?.substring(0, 8) || 'N/A'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {loadingBranches && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Đang tải branches...</Typography>
                  </Box>
                )}
              </FormControl>
            )}

            {/* Branch Selection (only when git connected) */}
            {!gitConnected && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Kết nối Git để chọn branch:</strong> Bạn cần kết nối Git repository để chọn branch và chạy test.
                </Typography>
              </Alert>
            )}
            
            {/* Mode */}
            <FormControl fullWidth>
              <InputLabel>Run Mode</InputLabel>
              <Select
                value={formData.mode}
                onChange={(e) => handleInputChange('mode', e.target.value)}
                label="Run Mode"
                disabled={isSubmitting}
              >
                <MenuItem value="manual">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayIcon fontSize="small" />
                    Manual - Start processing immediately
                  </Box>
                </MenuItem>
                <MenuItem value="automatic">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon fontSize="small" />
                    Automatic - Queue for later processing
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Mode Description */}
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="info.dark">
                <strong>{formData.mode === 'manual' ? 'Manual Mode:' : 'Automatic Mode:'}</strong>
                {formData.mode === 'manual' 
                  ? ' The test run will start processing immediately after creation. You can monitor the progress in real-time.'
                  : ' The test run will be queued and processed automatically when resources are available.'
                }
              </Typography>
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
            disabled={isSubmitting || !formData.branch.trim() || !gitConnected}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <PlayIcon />}
          >
            {isSubmitting ? 'Creating...' : 'Start Test Run'}
          </Button>
        </DialogActions>
      </form>

      {/* Git Connect Modal */}
      <GitConnectModal
        open={showGitConnect}
        onClose={() => setShowGitConnect(false)}
        project={project}
        onSuccess={(updatedProject) => {
          // Cập nhật project với thông tin git mới (không tắt dialog)
          setShowGitConnect(false);
          // Reload branches sau khi kết nối thành công
          setTimeout(() => {
            checkGitConnection();
          }, 1000);
        }}
      />

      {/* Run Pipeline Modal */}
      <RunPipelineModal
        open={pipelineModalOpen}
        onClose={() => {
          setPipelineModalOpen(false);
          // Đóng RunTestModal khi pipeline modal đóng
          onClose();
          resetForm();
        }}
        runId={createdRunId}
      />
    </Dialog>
  );
};

export default RunTestModal;
