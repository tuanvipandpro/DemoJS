import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, AccessTime, Percent } from '@mui/icons-material';

const SummaryItem = ({ label, value, icon, color = 'default' }) => (
  <Paper sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Box>
        <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Box>
  </Paper>
);

const TestReportModal = ({ open, onClose, report, projectName }) => {
  if (!report) return null;

  const statusColor = report.status === 'Failed' ? 'error' : report.status === 'Running' ? 'warning' : 'success';
  const coverageDelta = report.coverageAfter - report.coverageBefore;
  const deltaLabel = `${coverageDelta >= 0 ? '+' : ''}${coverageDelta}%`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Test report — {projectName}</Typography>
          <Chip label={report.status} color={statusColor} size="small" />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Summary */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <SummaryItem label="Total" value={report.total} icon={<Percent sx={{ color: 'text.secondary' }} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryItem label="Passed" value={report.passed} icon={<CheckCircle color="success" />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryItem label="Failed" value={report.failed} icon={<ErrorIcon color="error" />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryItem label="Duration" value={report.duration} icon={<AccessTime sx={{ color: 'text.secondary' }} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryItem label="Coverage (before)" value={`${report.coverageBefore}%`} icon={<Percent sx={{ color: 'text.secondary' }} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryItem label="Coverage (after)" value={`${report.coverageAfter}%`} icon={<Percent sx={{ color: 'text.secondary' }} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <SummaryItem label="Coverage Δ" value={deltaLabel} icon={<Percent sx={{ color: coverageDelta >= 0 ? 'success.main' : 'error.main' }} />} />
          </Grid>
        </Grid>

        {/* Failed tests */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Failed tests ({report.failedTests?.length || 0})
          </Typography>
          {report.failedTests && report.failedTests.length > 0 ? (
            <Paper variant="outlined">
              <List dense>
                {report.failedTests.map((t, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem>
                      <ListItemText
                        primary={t.name}
                        secondary={t.error}
                      />
                    </ListItem>
                    {idx < report.failedTests.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Typography variant="body2" color="textSecondary">No failed tests.</Typography>
          )}
        </Box>

        {/* Logs */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Logs
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.default', maxHeight: 240, overflow: 'auto' }}>
            <pre style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12 }}>
{report.logs}
            </pre>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestReportModal;


