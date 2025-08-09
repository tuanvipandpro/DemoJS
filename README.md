## InsightTestAI

InsightTestAI là ứng dụng quan sát và kiểm thử tự động bởi AI dành cho codebase:
- Kết nối Git repo (GitHub), phát hiện thay đổi code (webhook/giả lập)
- Tự động kích hoạt AI tests và tạo báo cáo
- Dashboard hiển thị KPI, biểu đồ (Line, Bar, Radial) và danh sách thay đổi/runs
- Tab Projects quản lý dự án, lọc theo trạng thái/provider, xem Report, chỉnh sửa trong Detail modal

### Tech stack
- React 19 + Vite 7
- Material UI (MUI)
- Recharts

### Cấu trúc chính
- `src/components`
  - `Sidebar.jsx`, `Header.jsx`, `Layout.jsx`, `Logo.jsx`
  - `CreateProjectStepperModal.jsx`: tạo project + kết nối Git + cấu hình notifications
  - `TestReportModal.jsx`: xem báo cáo test (summary, failed tests, logs)
  - `ProjectDetailModal.jsx`: chi tiết project, Edit/Delete
- `src/pages`
  - `Dashboard.jsx`: KPI, biểu đồ nâng cao (Line, Bar, Radial), danh sách thay đổi và runs
  - `ProjectsNew.jsx`: bảng dự án với Provider/Repository/Branch/Connected/Status/Progress/Coverage/Last Run và actions (Report, Detail)
  - `ProjectDetail.jsx`: trang chi tiết (tham khảo)
- `src/contexts`
  - `ThemeContext.jsx`: Dark/Light, lưu `localStorage`
  - `AuthContext.jsx`: đăng nhập giả lập, lưu trạng thái

### Cài đặt và chạy
1) Cài dependencies
```
npm i
```
2) Chạy dev
```
npm run dev
```
3) Build production
```
npm run build
```
4) Preview build
```
npm run preview
```

### Tính năng chính
- Dashboard:
  - KPI: Connected Repos, Changes Today, AI Tests Today, Coverage
  - Biểu đồ: Pass rate 7 ngày (LineChart), Tests by day (BarChart), Coverage gauge (Radial)
  - Recent code changes, Recent runs, Quick actions (Connect Git, Scan changes)
- Projects:
  - Bộ lọc: Search, Status, Provider
  - Bảng dữ liệu: Provider/Repository/Branch/Connected/Notifications/Status/Progress/Coverage/Last Run
  - Auto-scan: Sau khi connect hoặc tạo project, hệ thống giả lập webhook và tự động chạy test; cập nhật `lastReport`, `coverage`, `lastRun`
  - Report: Nút View Report mở `TestReportModal`; nếu chưa có report, tạo report tạm thời từ trạng thái hiện tại
  - Detail: Nút View Details mở `ProjectDetailModal`, có thể Edit/Save/Delete

### Ghi chú triển khai
- Ứng dụng hiện mô phỏng webhook/AI test/report bằng timeout và dữ liệu mock
- Có thể tích hợp thật webhook GitHub, hàng đợi chạy test, và API backend để thay thế mock

### License
MIT
