# 📄 InsightTestAI – Thiết kế Hệ Thống

## 1. Yêu cầu & Mục tiêu
- Phát hiện bug sớm thông qua phân tích commit và sinh test case tự động.  
- Tích hợp vào GitHub (giai đoạn demo), mở rộng sang GitLab/Bitbucket/Azure DevOps trong tương lai.  
- Cho phép quản lý Project, theo dõi **Agent Run** (quy trình tự động test).  
- Có Dashboard hiển thị số liệu thống kê (7 ngày, 24h, biểu đồ pass/fail).  
- Sử dụng **AWS Bedrock** làm LLM, **MCP Server** làm tool server (get diff, chạy test, report coverage…).  
- Hệ thống có kiến trúc mở, có thể mở rộng sang nhiều provider.  

---

## 2. Các Khái niệm Chính

### 2.1 Agent Run  
- Một lần chạy của Agent khi có commit mới hoặc khi user trigger.  
- Bao gồm nhiều bước: **Planning → Tooling → Observing → Adjusting → Done/Error**.  

### 2.2 FSM (Finite State Machine)  
- Máy trạng thái điều khiển vòng đời của **Agent Run**.  
- Mỗi state có action cụ thể:  
  - **Planning**: LLM phân tích commit/diff, tạo kế hoạch test.  
  - **Tooling**: Gọi MCP để lấy diff, đọc guideline, chuẩn bị test.  
  - **Observing**: Ghi nhận log, kết quả test.  
  - **Adjusting**: Nếu fail → retry hoặc fallback.  
  - **Done/Error**: Lưu kết quả.  

### 2.3 Orchestrator Worker  
- Worker backend chạy liên tục, lắng nghe SQS.  
- Khi có message → bắt đầu một **Agent Run FSM**.  
- FSM sẽ điều phối call Bedrock, MCP, ghi log vào DB.  
- Trạng thái cập nhật để FE hiển thị theo thời gian thực.  

### 2.4 MCP Server  
- Cung cấp các “tool” mà LLM có thể gọi:  
  - `get_diff`: Lấy diff từ GitHub API.  
  - `run_ci`: Chạy test sandbox (Docker).  
  - `notify`: Gửi Slack/GitHub Issue.  
- Có thể tích hợp thêm tool tùy nhu cầu.  

---

## 3. Tổng Quan Hệ Thống

Hệ thống InsightTestAI bao gồm 5 khối chính:

1. **Frontend (React + MUI)**  
   - Hiển thị giao diện Dashboard, Projects, Project Detail, Agent Run Detail.  
   - Người dùng thao tác qua các button (tạo project, trigger run, xem log).  
   - FE chỉ gọi **REST API** từ API Server, không gọi trực tiếp ra ngoài.  

2. **API Server (ExpressJS)**  
   - Là entrypoint cho FE.  
   - Xử lý auth (login/logout), CRUD project, CRUD run.  
   - Lưu & đọc dữ liệu từ **RDS Postgres**.  
   - Khi có request trigger Agent Run → enqueue message vào **SQS** để Orchestrator xử lý.  

3. **Database (Postgres + pgvector)**  
   - Lưu trữ users, projects, agent runs, logs.  
   - Có thể dùng pgvector cho search nội dung (ví dụ tìm test case liên quan).  

4. **Orchestrator Worker (FSM Engine)**  
   - Chạy background, lắng nghe **SQS**.  
   - Khi nhận message → bắt đầu một **Agent Run FSM**.  
   - FSM sẽ điều phối call Bedrock, MCP, ghi log vào DB.  
   - Trạng thái cập nhật để FE hiển thị theo thời gian thực.  

5. **MCP Server + AWS Bedrock**  
   - **MCP Server** đóng vai trò “toolbox”, cung cấp các chức năng: `get_diff`, `run_ci`, `notify`.  
   - **Bedrock LLM** được gọi trong state Planning để sinh test plan/test case.  
   - MCP có thể mở rộng tích hợp GitHub API, Slack, Docker runner.  

**Sơ đồ tổng quan:**

```Overview
+-------------------+
|    Frontend       |
|  (React + MUI)    |
+-------------------+
         |
         |  HTTP/JSON
         v
+-------------------+
|   Express API     |
|   (REST API)      |
+-------------------+
     |       |
     |       |-- enqueue 
     |                 |
     |                 v
     |         +-------------------+
     |         |      AWS SQS      |
     |         |(agent-runs-queue) |
     |         +-------------------+
     |                 ^
     |                 |
     |                 |  poll/check
     |                 |
     |                 v
     |         +-------------------+      +-------------------+
     |         | Orchestrator FSM  |  --> |   Notification    |
     |         |     Engine        |      |                   |
     |         +-------------------+      +-------------------+
     |            |             |
     |            |             |
     |         LLM call     invoke MCP
     |            |             |
     |            v             v
     |    +------------+   +-------------------+
     |    | AWS Bedrock|   | MCP Server - Tools|
     |    |  (LLM)     |   | - get_diff        |
     |    +------------+   | - run_ci          |
     |                     | - notify          |
     |                     +-------------------+
     |                        |    |    |
     |                       REST exec HTTP
     |                        v    v    v
     |                    +-------+-------+
     |                    |GitHub | run_ci|
     |                    | API   |       |
     |                    +-------+-------+
     |                             
     |                       
     |                        
     |                        
     |                       
     |
     |
     v
+-----------+
| Database  |
| (Postgres |
|  pgvector)|
+-----------+
```

---

## 4. Chức Năng Frontend (FE)

### 4.1 Dashboard
- Hiển thị tổng quan theo user login.  
- Biểu đồ: số lượng Agent Run 24h, 7 ngày, pass/fail.  
- API gọi:  
  - `GET /api/stats/summary?range=7d`  
  - `GET /api/stats/summary?range=24h`  

### 4.2 Projects
- **Project List**: Hiển thị danh sách project user tạo/tham gia.  
- **Create Project Wizard**:  
  1. Nhập `projectName`, `description`  
  2. Chọn Git Provider (GitHub demo)  
  3. Chọn Channel notify (Slack/GitHub Issue)  
- API gọi:  
  - `GET /api/projects`  
  - `POST /api/projects`  

### 4.3 Project Detail
- Hiển thị danh sách Agent Run của Project.  
- Button `Trigger Run`.  
- API gọi:  
  - `GET /api/projects/:id/runs`  
  - `POST /api/projects/:id/runs`  

### 4.4 Agent Run Detail
- Hiển thị log/state của FSM.  
- Polling API để cập nhật trạng thái.  
- API gọi:  
  - `GET /api/runs/:id`  
  - `GET /api/runs/:id/logs`  

---

## 5. API List (REST)

- `POST /api/auth/login`  
- `POST /api/auth/logout`  
- `GET /api/projects`  
- `POST /api/projects`  
- `GET /api/projects/:id`  
- `PUT /api/projects/:id`  
- `DELETE /api/projects/:id`  
- `GET /api/projects/:id/runs`  
- `POST /api/projects/:id/runs`  
- `GET /api/runs/:id`  
- `GET /api/runs/:id/logs`  
- `GET /api/stats/summary?range=7d`  
---

## 6. MCP List (Tools)

- `get_diff(repo, commitId)` → gọi GitHub API.  
- `run_ci(projectId, testPlan)` → chạy test trong Docker.  
- `notify(channel, message)` → gửi Slack/GitHub Issue.  
- (Optional) `get_coverage(reportId)`  

---

## 7. Database Design (Postgres + pgvector)

- **Users**(id, username, passwordHash, email)  
- **Projects**(id, ownerId, name, description, provider, repoUrl, notifyChannel)  
- **Runs**(id, projectId, state, createdAt, finishedAt, logs, metricsJSON)  
- **RunLogs**(id, runId, timestamp, message, level)  

---

## 8. Demo Flow

### 8.1 Live Demo Flow (User tạo Project và Trigger Agent Run)

1. **User login**  
   - FE gọi `POST /api/auth/login`.  
   - API xác thực user, trả về token.  

2. **Tạo Project mới**  
   - User nhấn **Create Project** → mở wizard.  
   - FE gọi `POST /api/projects` với thông tin (tên, git provider = GitHub, channel notify = Slack).  
   - API lưu project vào DB.  
   - Dashboard cập nhật danh sách project qua `GET /api/projects`.  

3. **Trigger Agent Run**  
   - User click **Run** trong Project Detail.  
   - FE gọi `POST /api/projects/:id/runs`.  
   - API tạo record run ở DB (state=QUEUED), enqueue message lên SQS.  

4. **Orchestrator Worker xử lý**  
   - Nhận message từ SQS.  
   - Khởi chạy FSM:  
     - **Planning**: gọi Bedrock → sinh test plan.  
     - **Tooling**: gọi MCP `get_diff` → lấy diff code.  
     - **Tooling**: gọi MCP `run_ci` → chạy test container.  
     - **Observing**: lưu log, đọc kết quả test.  
     - **Adjusting**: nếu fail, retry hoặc fallback.  
     - **Done/Error**: cập nhật state DB.  

5. **Thông báo**  
   - Worker gọi MCP `notify` → gửi Slack/GitHub Issue nếu có lỗi.  

6. **FE cập nhật**  
   - Dashboard và Project Detail gọi `GET /api/runs/:id` và `GET /api/runs/:id/logs`.  
   - Hiển thị chart 24h, 7d pass/fail.  

---
 