import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { GitHub as GitHubIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { gitService } from '../services/git';
import { projectsService } from '../services/projects';

const GitConnectModal = ({ open, onClose, onSuccess, project = null }) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  // Load git providers khi modal mở
  useEffect(() => {
    if (open) {
      loadGitProviders();
    }
  }, [open]);

  const loadGitProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await gitService.getProviders();
      if (response.success) {
        setProviders(response.providers);
        if (response.providers.length > 0) {
          setSelectedProvider(response.providers[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading git providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedProvider || !token.trim()) {
      setError('Vui lòng chọn Git Provider và nhập Personal Access Token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await gitService.connectWithToken(token, selectedProvider);
      setGithubData(response);
      setSuccess(true);
    } catch (error) {
      console.error('Git connect error:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Không thể kết nối với Git Provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!selectedRepo) {
      setError('Vui lòng chọn một repository');
      return;
    }

    setSavingProject(true);
    setError('');

    try {
      // Prepare instruction data - chỉ gửi instruction JSON hoàn chỉnh
      const instructionData = {
        customInstructions: null,
        testingLanguage: null,
        testingFramework: null,
        config: {
          customInstructions: null
        }
      };

      if (project) {
        // Update project hiện có
        const updateData = {
          gitProvider: selectedProvider,
          personalAccessToken: token,
          repository: selectedRepo.html_url
        };

        const response = await projectsService.updateProject(project.id, updateData);
        
        if (response.success) {
          if (onSuccess) {
            onSuccess({
              ...response.project,
              personalAccessToken: token // Thêm token vào response
            });
          }
          handleClose();
        }
      } else {
        // Không tạo project mới, chỉ trả về thông tin git để parent component xử lý
        const gitData = {
          name: selectedRepo.name,
          description: selectedRepo.description || `Repository: ${selectedRepo.full_name}`,
          gitProvider: selectedProvider,
          personalAccessToken: token,
          repository: selectedRepo.html_url,
          notifyChannel: 'email',
          members: [], // No additional members for GitConnectModal
          instruction: instructionData
        };

        // Gọi callback với thông tin git (không tạo project)
        if (onSuccess) {
          onSuccess(gitData);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError(error.response?.data?.error || 'Không thể lưu project');
    } finally {
      setSavingProject(false);
    }
  };

  const handleClose = () => {
    setSelectedProvider('');
    setToken('');
    setShowToken(false);
    setLoading(false);
    setError('');
    setSuccess(false);
    setGithubData(null);
    setSelectedRepo(null);
    setBranches([]);
    setSavingProject(false);
    onClose();
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
  };

  const handleRepoClick = async (repo) => {
    if (selectedRepo?.id === repo.id) {
      // Nếu click vào repo đã chọn thì bỏ chọn
      setSelectedRepo(null);
      setBranches([]);
      return;
    }

    setSelectedRepo(repo);
    setLoadingBranches(true);
    
    try {
      // Lấy branches từ GitHub API cho repository cụ thể
      const [owner, repoName] = repo.full_name.split('/');
      const branchesData = await gitService.getBranches(owner, repoName, token);
      
      if (branchesData.success && branchesData.branches) {
        setBranches(branchesData.branches);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GitHubIcon color="primary" />
          <Typography variant="h6">
            {project ? 'Cập nhật Git Repository' : 'Kết nối Git Repository'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!success ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Để kết nối với Git Provider, bạn cần cung cấp Personal Access Token. 
              Token này sẽ được sử dụng để truy cập repositories của bạn.
            </Typography>
            
            {/* Git Provider Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chọn Git Provider</InputLabel>
              <Select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                disabled={loadingProviders}
                label="Chọn Git Provider"
              >
                {providers.map((provider) => (
                  <MenuItem key={provider.id} value={provider.name}>
                    {provider.display_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Cách tạo Personal Access Token:
              </Typography>
              <Typography variant="body2" component="div" sx={{ pl: 2 }}>
                1. Vào GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
                <br />
                2. Click "Generate new token (classic)"
                <br />
                3. Chọn scopes: <strong>repo</strong> (để truy cập private repositories)
                <br />
                4. Copy token và paste vào ô bên dưới
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Personal Access Token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              helperText="Token bắt đầu với 'ghp_' và có độ dài khoảng 40 ký tự"
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => setShowToken(!showToken)}
                    startIcon={showToken ? <VisibilityOff /> : <Visibility />}
                    size="small"
                  >
                    {showToken ? 'Ẩn' : 'Hiện'}
                  </Button>
                )
              }}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Kết nối Git thành công!
            </Alert>
            
            {githubData?.user && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Thông tin Git User
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar src={githubData.user.avatar_url} sx={{ width: 64, height: 64 }} />
                  <Box>
                    <Typography variant="h6">{githubData.user.name || githubData.user.login}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{githubData.user.login}
                    </Typography>
                    {githubData.user.email && (
                      <Typography variant="body2" color="text.secondary">
                        {githubData.user.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {githubData?.repositories && githubData.repositories.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Repositories ({githubData.repositories.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Chọn một repository để tiếp tục:
                </Typography>
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {githubData.repositories.slice(0, 10).map((repo) => (
                    <ListItem 
                      key={repo.id} 
                      divider
                      component="button"
                      onClick={() => handleRepoClick(repo)}
                      selected={selectedRepo?.id === repo.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light'
                          }
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <GitHubIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={repo.name}
                        secondary={
                          <Typography component="div">
                            <Typography variant="body2" color="text.secondary">
                              {repo.description || 'Không có mô tả'}
                            </Typography>
                            <Box display="flex" gap={1} sx={{ mt: 1 }}>
                              {repo.language && (
                                <Chip label={repo.language} size="small" variant="outlined" />
                              )}
                              {repo.private && (
                                <Chip label="Private" size="small" color="warning" variant="outlined" />
                              )}
                              <Chip 
                                label={`⭐ ${repo.stargazers_count || 0}`} 
                                size="small" 
                                variant="outlined" 
                              />
                              <Chip 
                                label={`🌿 ${repo.branches?.length || 0} branches`} 
                                size="small" 
                                variant="outlined" 
                                color="info"
                              />
                            </Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                {githubData.repositories.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Hiển thị 10 repositories đầu tiên trong tổng số {githubData.repositories.length}
                  </Typography>
                )}

                {/* Display branches of selected repository */}
                {selectedRepo && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Branches của {selectedRepo.name}
                    </Typography>
                    
                    {loadingBranches ? (
                      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Đang tải branches...
                        </Typography>
                      </Box>
                    ) : branches.length > 0 ? (
                      <List sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1 }}>
                        {branches.map((branch, index) => (
                          <ListItem 
                            key={index} 
                            divider
                            sx={{
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                  {branch.name.charAt(0).toUpperCase() }
                                </Typography>
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography component="span">
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {branch.name}
                                    {branch.name === selectedRepo.default_branch && (
                                      <Chip 
                                        label="Default" 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined"
                                      />
                                    )}
                                  </Box>
                                </Typography>
                              }
                              secondary={
                                <Typography component="div">
                                  <Typography variant="body2" color="text.secondary">
                                    Commit: {branch.commitSha?.substring(0, 8) || 'N/A'}
                                  </Typography>
                                  {branch.protection && (
                                    <Chip 
                                      label="Protected" 
                                      size="small" 
                                      color="warning" 
                                      variant="outlined"
                                      sx={{ mt: 0.5 }}
                                    />
                                  )}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                        Không có branches nào
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Error message for repository selection */}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {!success ? (
          <>
            <Button onClick={handleClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              onClick={handleConnect}
              variant="contained"
              disabled={loading || !token.trim() || !selectedProvider}
              startIcon={loading ? <CircularProgress size={20} /> : <GitHubIcon />}
            >
              {loading ? 'Đang kết nối...' : 'Kết nối Git'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveProject}
              variant="contained"
              disabled={!selectedRepo || savingProject}
              startIcon={savingProject ? <CircularProgress size={20} /> : null}
            >
              {savingProject ? 'Đang lưu...' : 'Hoàn tất'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GitConnectModal;
