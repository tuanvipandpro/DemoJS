import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Chip,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';

const Field = ({ label, children }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
      {label}
    </Typography>
    <Box>{children}</Box>
  </Box>
);

const ProjectDetailModal = ({ open, onClose, project, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', team: '', branch: '' });

  useEffect(() => {
    if (open && project) {
      setIsEditing(false);
      setForm({
        name: project.name || '',
        description: project.description || '',
        team: project.team || '',
        branch: project.branch || '',
      });
    }
  }, [open, project]);

  const handleSave = () => {
    if (!onUpdate || !project) return;
    onUpdate({ ...project, ...form });
    setIsEditing(false);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Project details — {project.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => setIsEditing((v) => !v)}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => onDelete && onDelete(project.id)}>
              Delete
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                  <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={3} />
                  <TextField label="Team" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} fullWidth />
                  <TextField label="Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} fullWidth />
                </Box>
              ) : (
                <>
                  <Field label="Description">
                    <Typography variant="body2" color="textSecondary">{project.description || '—'}</Typography>
                  </Field>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Field label="Status">
                        <Chip size="small" label={project.status} color={project.status === 'Completed' ? 'success' : project.status === 'Planning' ? 'warning' : 'primary'} />
                      </Field>
                    </Grid>
                    <Grid item xs={6}>
                      <Field label="Progress">
                        <Typography variant="body2">{project.progress}%</Typography>
                      </Field>
                    </Grid>
                    <Grid item xs={6}>
                      <Field label="Coverage">
                        <Typography variant="body2">{project.coverage ?? 0}%</Typography>
                      </Field>
                    </Grid>
                    <Grid item xs={6}>
                      <Field label="Last run">
                        <Chip size="small" label={project.lastRun || 'Not run'} color={project.lastRun === 'Failed' ? 'error' : project.lastRun === 'Running' ? 'warning' : 'success'} />
                      </Field>
                    </Grid>
                  </Grid>
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Field label="Git Provider">
                {project.gitProvider ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GitHubIcon fontSize="small" />
                    <Typography variant="body2">{project.gitProvider}</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">Not connected</Typography>
                )}
              </Field>
              <Field label="Repository">
                <Typography variant="body2">{project.repository || project.selectedRepository || '—'}</Typography>
              </Field>
              <Field label="Branch">
                {isEditing ? (
                  <TextField size="small" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
                ) : (
                  <Typography variant="body2">{project.branch || '—'}</Typography>
                )}
              </Field>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Field label="Notifications">
                {project.notifications && project.notifications.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {project.notifications.map((n) => (
                      <Chip key={n} size="small" label={n} variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">None</Typography>
                )}
              </Field>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {isEditing ? (
          <Button variant="contained" onClick={handleSave}>Save</Button>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDetailModal;


