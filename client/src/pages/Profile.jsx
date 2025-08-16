import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Divider, TextField, Button, Alert, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/auth/apiClient';

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.status === 200) {
          const data = res.data;
          setForm({
            displayName: data.profile?.display_name || data.profile?.displayName || '',
            email: data.profile?.email || '',
            phone: data.profile?.phone || '',
            address: data.profile?.address || '',
          });
        }
      } catch (_e) {}
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      if (res.status !== 200) {
        const data = res.data;
        setError(data.error || 'Update failed');
      } else {
        setSuccess('Profile updated');
      }
    } catch (_e) {
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 640 }}>
        <Typography variant="h5" gutterBottom>
          Profile
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField label="Username" value={user?.username || ''} InputProps={{ readOnly: true }} />
          <TextField label="Display name" name="displayName" value={form.displayName} onChange={handleChange} />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
          <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          <TextField label="Address" name="address" value={form.address} onChange={handleChange} multiline minRows={2} />
          <Box>
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Profile;


