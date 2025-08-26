import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import { GitHub as GitHubIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { gitService } from '../services/git';

const GitHubConnectModal = ({ open, onClose, onSuccess }) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Please enter Personal Access Token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await gitService.connectWithToken(token);
      setGithubData(response);
      setSuccess(true);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error('GitHub connect error:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Unable to connect to GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setToken('');
    setShowToken(false);
    setLoading(false);
    setError('');
    setSuccess(false);
    setGithubData(null);
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
      // Có thể hiển thị thông báo lỗi ở đây nếu cần
    } finally {
      setLoadingBranches(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <GitHubIcon color="primary" />
          <Typography variant="h6">Connect GitHub Repository</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!success ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              To connect with GitHub, you need to provide a Personal Access Token. 
              This token will be used to access your repositories.
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                How to create a Personal Access Token:
              </Typography>
              <Typography variant="body2" component="div" sx={{ pl: 2 }}>
                1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
                <br />
                2. Click "Generate new token (classic)"
                <br />
                3. Select scopes: <strong>repo</strong> (to access private repositories)
                <br />
                4. Copy the token and paste it in the field below
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Personal Access Token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              helperText="Token starts with 'ghp_' and is about 40 characters long"
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={() => setShowToken(!showToken)}
                    startIcon={showToken ? <VisibilityOff /> : <Visibility />}
                    size="small"
                  >
                    {showToken ? 'Hide' : 'Show'}
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
              GitHub connection successful!
            </Alert>
            
            {githubData?.user && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  GitHub User Information
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
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {githubData.repositories.slice(0, 10).map((repo) => (
                    <ListItem 
                      key={repo.id} 
                      divider
                      button
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
                          <Box>
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
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                {githubData.repositories.length > 10 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Showing first 10 of {githubData.repositories.length} repositories
                  </Typography>
                )}

                                 {/* Display branches of selected repository */}
                 {selectedRepo && (
                   <Box sx={{ mt: 3 }}>
                     <Typography variant="h6" sx={{ mb: 2 }}>
                       Branches of {selectedRepo.name}
                     </Typography>
                     
                     {loadingBranches ? (
                       <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                         <CircularProgress size={24} />
                         <Typography variant="body2" sx={{ ml: 2 }}>
                           Loading branches...
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
                               }
                               secondary={
                                 <Box>
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
                                 </Box>
                               }
                             />
                           </ListItem>
                         ))}
                       </List>
                     ) : (
                       <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                         No branches available
                       </Typography>
                     )}
                   </Box>
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
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              variant="contained"
              disabled={loading || !token.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <GitHubIcon />}
            >
              {loading ? 'Connecting...' : 'Connect GitHub'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GitHubConnectModal;
