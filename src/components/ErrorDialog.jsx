import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useError } from '../contexts/ErrorContext';

const ErrorDialog = () => {
  const { error, clearError } = useError();
  return (
    <Dialog open={!!error} onClose={clearError} maxWidth="sm" fullWidth>
      <DialogTitle>Error</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{String(error || '')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={clearError} variant="contained">OK</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorDialog;


