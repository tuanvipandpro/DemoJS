# ConfirmDialog - Dialog Xác nhận cho Button Run

## Tổng quan
Đã thêm component `ConfirmDialog` để hiển thị dialog xác nhận khi người dùng click vào button run project. Điều này giúp tránh việc chạy project một cách vô tình.

## Các file đã được cập nhật

### 1. `client/src/components/ConfirmDialog.jsx` (Mới)
- Component dialog xác nhận có thể tái sử dụng
- Hỗ trợ các props: `title`, `message`, `confirmText`, `cancelText`, `severity`, `loading`
- Sử dụng Material-UI components và icons

### 2. `client/src/pages/ProjectDetail.jsx`
- Thêm state: `confirmRunOpen`, `runningProject`
- Cập nhật `handleRunProject` để mở dialog xác nhận
- Thêm `handleConfirmRun` để xử lý logic chạy project
- Thêm `ConfirmDialog` component

### 3. `client/src/pages/Projects.jsx`
- Thêm state: `confirmRunOpen`, `selectedProjectToRun`, `runningProject`
- Cập nhật `handleRunProject` để mở dialog xác nhận
- Thêm `handleConfirmRun` để xử lý logic chạy project
- Thêm `ConfirmDialog` component

### 4. `client/src/components/ProjectDetailModal.jsx`
- Thêm state: `confirmRunOpen`, `runningProject`
- Cập nhật `handleRunProject` để mở dialog xác nhận
- Thêm `handleConfirmRun` để xử lý logic chạy project
- Thêm `ConfirmDialog` component

### 5. `client/src/pages/Dashboard.jsx`
- Thêm state: `confirmScanOpen`, `scanningChanges`
- Cập nhật `handleScanChanges` để mở dialog xác nhận
- Thêm `handleConfirmScan` để xử lý logic quét thay đổi
- Thêm `ConfirmDialog` component cho button "Quét thay đổi & chạy AI tests"

## Cách hoạt động

1. **Khi click button run**: Thay vì chạy project ngay lập tức, sẽ mở dialog xác nhận
2. **Dialog xác nhận**: Hiển thị thông tin project và yêu cầu xác nhận
3. **Xác nhận**: Người dùng click "Chạy Project" để tiếp tục
4. **Hủy**: Người dùng click "Hủy" để đóng dialog

## Tính năng

- **Loading state**: Hiển thị loading khi đang xử lý
- **Customizable**: Có thể tùy chỉnh title, message, button text
- **Severity levels**: Hỗ trợ các mức độ cảnh báo khác nhau (info, warning, error)
- **Responsive**: Tự động điều chỉnh kích thước theo màn hình

## Sử dụng

```jsx
<ConfirmDialog
  open={confirmRunOpen}
  onClose={() => setConfirmRunOpen(false)}
  onConfirm={handleConfirmRun}
  title="Xác nhận chạy Project"
  message={`Bạn có chắc chắn muốn chạy project "${project?.name}"?`}
  confirmText="Chạy Project"
  cancelText="Hủy"
  severity="warning"
  loading={runningProject}
/>
```

## Lưu ý

- Tất cả các button run đều đã được cập nhật để sử dụng ConfirmDialog
- Logic chạy project thực tế vẫn cần được implement (hiện tại chỉ là simulation)
- Dialog sử dụng tiếng Việt theo yêu cầu của người dùng
