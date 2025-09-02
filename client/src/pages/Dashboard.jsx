import React, { useMemo, useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import Logo from '../components/Logo';
import CreateProjectModal from '../components/CreateProjectModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { statsService } from '../services/index.js';
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
  PieChart,
  Pie,
  Cell,
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
  // State cho stats
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  const [openConnectModal, setOpenConnectModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmScanOpen, setConfirmScanOpen] = useState(false);
  const [scanningChanges, setScanningChanges] = useState(false);

  // Fetch stats data
  const fetchStats = async (range = timeRange) => {
    try {
      setLoading(true);
      setError(null);
      const data = await statsService.getSummary(range);
      setStatsData(data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu thống kê');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTimeRangeChange = (event) => {
    const newRange = event.target.value;
    setTimeRange(newRange);
    fetchStats(newRange);
  };

  const handleRefresh = () => {
    fetchStats();
  };

  // Format data for charts
  const formatChartData = (dailyData) => {
    if (!dailyData || dailyData.length === 0) return [];
    
    return dailyData.map(item => ({
      date: new Date(item.date).toLocaleDateString('vi-VN', { 
        month: 'short', 
        day: 'numeric' 
      }),
      total: item.total_runs,
      success: item.successful_runs,
      failed: item.failed_runs,
      successRate: item.total_runs > 0 
        ? Math.round((item.successful_runs / item.total_runs) * 100) 
        : 0
    }));
  };

  const chartData = formatChartData(statsData?.daily_runs || []);
  const projectPerformance = statsData?.project_performance || [];
  const recentActivity = statsData?.recent_activity || [];

  const handleScanChanges = () => {
    setConfirmScanOpen(true);
  };

  const handleConfirmScan = async () => {
    try {
      setScanningChanges(true);
      // Simulate scan
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSnackbar({ open: true, message: 'Đã quét thay đổi và kích hoạt AI tests', severity: 'success' });
      setConfirmScanOpen(false);
    } catch (error) {
      console.error('Error scanning changes:', error);
      setSnackbar({ open: true, message: 'Có lỗi xảy ra khi quét thay đổi', severity: 'error' });
    } finally {
      setScanningChanges(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Logo size="large" />
          <Box>
            <Typography variant="h4" gutterBottom>
              AI Testing Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Kết nối Git, phát hiện thay đổi code, tự động chạy AI tests và theo dõi metrics với biểu đồ phong phú.
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Thời gian</InputLabel>
            <Select
              value={timeRange}
              label="Thời gian"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="24h">24 giờ</MenuItem>
              <MenuItem value="7d">7 ngày</MenuItem>
              <MenuItem value="30d">30 ngày</MenuItem>
              <MenuItem value="90d">90 ngày</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box sx={{ p: 2, mb: 3 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* KPI Cards */}
      {statsData && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Tổng số Runs"
              value={statsData.summary.total_runs}
              icon={<RunIcon fontSize="medium" />}
              iconBg="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Tỷ lệ thành công"
              value={`${statsData.summary.success_rate}%`}
              icon={<TrendingIcon fontSize="medium" />}
              iconBg="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Runs đang chạy"
              value={statsData.summary.running_runs}
              icon={<ScheduleIcon fontSize="medium" />}
              iconBg="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Dự án hoạt động"
              value={statsData.summary.active_projects}
              icon={<ProjectIcon fontSize="medium" />}
              iconBg="#9c27b0"
            />
          </Grid>
        </Grid>
      )}

      {/* Charts + Lists */}
      {statsData && (
        <Grid container spacing={3}>
          {/* Left Column - Charts */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Tỷ lệ thành công theo ngày</Typography>
                <Chip 
                  size="small" 
                  label={`${chartData.length > 0 ? chartData[chartData.length - 1].successRate : 0}% hôm nay`} 
                  color="success" 
                />
              </Box>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <RechartsTooltip formatter={(v) => [`${v}%`, 'Tỷ lệ thành công']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="#1976d2" 
                      strokeWidth={2} 
                      dot={{ r: 3 }} 
                      name="Tỷ lệ thành công" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Số lượng runs theo ngày</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#ed6c02" name="Tổng runs" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="success" fill="#2e7d32" name="Thành công" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" fill="#d32f2f" name="Thất bại" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Hoạt động gần đây
              </Typography>
              <List>
                {recentActivity.length > 0 ? (
                  recentActivity.map((run) => (
                    <ListItem key={run.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: run.state === 'FAILED' ? 'error.main' : 
                                   run.state === 'RUNNING' ? 'warning.main' : 
                                   run.state === 'SUCCESS' ? 'success.main' : 'primary.main' 
                        }}>
                          <RunIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {run.project_name}
                            </Typography>
                            <Chip size="small" variant="outlined" label={`Run #${run.id}`} />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(run.created_at).toLocaleString('vi-VN')}
                            </Typography>
                            {run.duration_minutes && (
                              <Typography variant="body2" color="textSecondary">
                                Thời gian: {run.duration_minutes} phút
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Chip
                        label={run.state === 'SUCCESS' ? 'Thành công' : 
                               run.state === 'FAILED' ? 'Thất bại' : 
                               run.state === 'RUNNING' ? 'Đang chạy' : 
                               run.state === 'QUEUED' ? 'Đang chờ' : run.state}
                        color={run.state === 'FAILED' ? 'error' : 
                               run.state === 'RUNNING' ? 'warning' : 
                               run.state === 'SUCCESS' ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Không có hoạt động nào trong khoảng thời gian này
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Right Column - Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Thao tác nhanh
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="contained" startIcon={<GitHubIcon />} onClick={() => setOpenConnectModal(true)}>
                  Kết nối Git
                </Button>
                <Button variant="outlined" startIcon={<RunIcon />} onClick={handleScanChanges}>
                  Quét thay đổi & chạy AI tests
                </Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="textSecondary">
                Tự động kích hoạt khi có commit mới qua webhook. Bạn cũng có thể kích hoạt thủ công tại đây.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hiệu suất dự án
              </Typography>
              {projectPerformance.length > 0 ? (
                <Box sx={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={projectPerformance.slice(0, 5)}
                        dataKey="total_runs"
                        nameKey="project_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ project_name, total_runs }) => `${project_name}: ${total_runs}`}
                      >
                        {projectPerformance.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'][index % 5]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    Không có dữ liệu hiệu suất dự án
                  </Typography>
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Thống kê tổng quan
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Thời gian trung bình:</Typography>
                  <Typography variant="h6" color="primary">
                    {statsData?.summary.avg_duration_minutes || 0} phút
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Runs đang chờ:</Typography>
                  <Typography variant="h6" color="warning.main">
                    {statsData?.summary.queued_runs || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Tổng dự án:</Typography>
                  <Typography variant="h6" color="success.main">
                    {statsData?.summary.active_projects || 0}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Modals & Snackbar */}
      <CreateProjectModal
        open={openConnectModal}
        onClose={() => setOpenConnectModal(false)}
        onSubmit={() => {
          setOpenConnectModal(false);
          setSnackbar({ open: true, message: 'Đã kết nối Git repository thành công', severity: 'success' });
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm Scan Changes Dialog */}
      <ConfirmDialog
        open={confirmScanOpen}
        onClose={() => setConfirmScanOpen(false)}
        onConfirm={handleConfirmScan}
        title="Xác nhận quét thay đổi"
        message="Bạn có chắc chắn muốn quét thay đổi và chạy AI tests? Hành động này sẽ kiểm tra repository và kích hoạt quá trình test automation."
        confirmText="Quét thay đổi"
        cancelText="Hủy"
        severity="info"
        loading={scanningChanges}
      />
    </Box>
  );
};

export default Dashboard;
