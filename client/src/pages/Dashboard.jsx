import React, { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Assignment as ProjectIcon,
  People as TeamIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  GitHub as GitHubIcon,
  AutoAwesome as AiIcon,
  ChangeCircle as ChangeIcon,
  PlayArrow as RunIcon,
} from '@mui/icons-material';
import Logo from '../components/Logo';
import CreateProjectStepperModal from '../components/CreateProjectStepperModal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

// Mini Sparkline component (inline SVG)
const Sparkline = ({ data, width = 160, height = 40, color = '#1976d2' }) => {
  const path = useMemo(() => {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const norm = (v) => (max === min ? 0.5 : (v - min) / (max - min));
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - norm(v) * height;
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [data, width, height]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img">
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};

// Simple bar series using MUI Box
const TinyBars = ({ data, height = 48, color = '#1976d2' }) => (
  <Box sx={{ display: 'flex', alignItems: 'end', gap: 0.75, height }}>
    {data.map((v, i) => (
      <Box key={i} sx={{ width: 8, height: `${Math.max(8, v)}%`, bgcolor: color, borderRadius: 1 }} />
    ))}
  </Box>
);

// Unified KPI Card to keep icon and content aligned
const KpiCard = ({ title, value, icon, iconBg = '#1976d2', rightContent }) => (
  <Card>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 88 }}>
        <Box>
          <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
        {rightContent ? (
          <Box sx={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {rightContent}
          </Box>
        ) : (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: iconBg,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  // KPI demo data (mock)
  const [connectedRepos, setConnectedRepos] = useState(3);
  const [changesToday, setChangesToday] = useState(14);
  const [testsToday, setTestsToday] = useState(62);
  const [coverage, setCoverage] = useState(82);

  const [openConnectModal, setOpenConnectModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const passRateData = [62, 68, 64, 70, 74, 76, 81].map((v, i) => ({ day: days[i], passRate: v }));
  const testsByDayData = [30, 42, 36, 55, 48, 60, 62].map((v, i) => ({ day: days[i], tests: v }));
  const coverageGaugeData = [{ name: 'Coverage', value: coverage }];

  const recentChanges = [
    { id: 'c1', repo: 'insight/fe', branch: 'main', files: 6, lines: '+120/-34', message: 'Refactor AuthContext', status: 'Tests Passed' },
    { id: 'c2', repo: 'insight/fe', branch: 'develop', files: 3, lines: '+48/-12', message: 'Add Git connect stepper', status: 'Tests Passed' },
    { id: 'c3', repo: 'insight/api', branch: 'main', files: 8, lines: '+210/-55', message: 'Fix webhook signature', status: 'Tests Failed' },
    { id: 'c4', repo: 'insight/runner', branch: 'main', files: 2, lines: '+12/-2', message: 'Tune AI test prompts', status: 'Running' },
  ];

  const recentRuns = [
    { id: 'r1', name: 'Nightly - fe/main', result: 'Passed', duration: '4m 12s', coverage: 82 },
    { id: 'r2', name: 'Manual - api/main', result: 'Failed', duration: '2m 07s', coverage: 76 },
    { id: 'r3', name: 'Auto - runner/main', result: 'Running', duration: '—', coverage: null },
  ];

  const handleScanChanges = () => {
    // Simulate scan
    setChangesToday((v) => v + 2);
    setTestsToday((v) => v + 8);
    setCoverage((c) => Math.min(100, c + 1));
    setSnackbar({ open: true, message: 'Scanned changes and triggered AI tests', severity: 'success' });
  };

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Logo size="large" />
        <Box>
          <Typography variant="h4" gutterBottom>
            AI Testing Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Connect Git, detect code changes, auto-run AI tests, and track metrics with rich charts.
          </Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Connected Repos"
            value={connectedRepos}
            icon={<GitHubIcon fontSize="medium" />}
            iconBg="#24292e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Changes Today"
            value={changesToday}
            icon={<ChangeIcon fontSize="medium" />}
            iconBg="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="AI Tests Today"
            value={testsToday}
            icon={<AiIcon fontSize="medium" />}
            iconBg="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Coverage"
            value={`${coverage}%`}
            rightContent={
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  data={coverageGaugeData}
                  startAngle={180}
                  endAngle={180 + (coverage / 100) * 180}
                  innerRadius="70%"
                  outerRadius="100%"
                >
                  <RadialBar dataKey="value" minAngle={15} clockWise fill="#1976d2" background />
                </RadialBarChart>
              </ResponsiveContainer>
            }
          />
        </Grid>
      </Grid>

      {/* Charts + Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Pass rate (last 7 days)</Typography>
              <Chip size="small" label={`${passRateData[passRateData.length - 1].passRate}% today`} color="success" />
            </Box>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={passRateData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <RechartsTooltip formatter={(v) => [`${v}%`, 'Pass rate']} />
                  <Legend />
                  <Line type="monotone" dataKey="passRate" stroke="#1976d2" strokeWidth={2} dot={{ r: 3 }} name="Pass rate" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="h6">Tests by day (last 7 days)</Typography>
            </Box>
            <Box sx={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={testsByDayData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="tests" fill="#ed6c02" name="Tests" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent code changes
            </Typography>
            <List>
              {recentChanges.map((c) => (
                <ListItem key={c.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: c.status === 'Tests Failed' ? 'error.main' : c.status === 'Running' ? 'warning.main' : 'primary.main' }}>
                      <GitHubIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{c.message}</Typography>
                        <Chip size="small" variant="outlined" label={`${c.repo}:${c.branch}`} />
                      </Box>
                    }
                    secondary={`${c.files} files • ${c.lines}`}
                  />
                  <Chip
                    label={c.status}
                    color={c.status === 'Tests Failed' ? 'error' : c.status === 'Running' ? 'warning' : 'success'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" startIcon={<GitHubIcon />} onClick={() => setOpenConnectModal(true)}>
                Connect Git
              </Button>
              <Button variant="outlined" startIcon={<RunIcon />} onClick={handleScanChanges}>
                Scan changes & run AI tests
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="textSecondary">
              Auto-triggers on new commits via webhook. You can also trigger manually here.
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, mb: 3, position: 'relative' }}>
            <Typography variant="h6" gutterBottom>
              Coverage gauge
            </Typography>
            <Box sx={{ width: '100%', height: 220, position: 'relative' }}>
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                  data={[{ name: 'bg', value: 100 }, { name: 'Coverage', value: coverage }]}
                >
                  <RadialBar dataKey="value" background fill="#e0e0e0" cornerRadius={8} />
                  <RadialBar dataKey="value" data={[{ name: 'Coverage', value: coverage }]} fill="#1976d2" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4">{coverage}%</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent runs
            </Typography>
            <List>
              {recentRuns.map((r) => (
                <ListItem key={r.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: r.result === 'Failed' ? 'error.main' : r.result === 'Running' ? 'warning.main' : 'success.main' }}>
                      <AiIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={r.name}
                    secondary={r.duration !== '—' ? `Duration: ${r.duration}` : 'Running...'}
                  />
                  <Chip
                    label={r.result}
                    color={r.result === 'Failed' ? 'error' : r.result === 'Running' ? 'warning' : 'success'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Modals & Snackbar */}
      <CreateProjectStepperModal
        open={openConnectModal}
        onClose={() => setOpenConnectModal(false)}
        onSubmit={() => {
          setConnectedRepos((v) => v + 1);
          setOpenConnectModal(false);
          setSnackbar({ open: true, message: 'Connected Git repository successfully', severity: 'success' });
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
