# AI Platform - Admin Portal Requirements

## 1. Overview

Admin Portal là hệ thống quản trị dành cho quản trị viên để giám sát toàn bộ hoạt động của nền tảng AI.

Mục tiêu:

* Theo dõi người dùng
* Theo dõi lịch sử sử dụng AI
* Theo dõi token usage
* Theo dõi chi phí AI
* Theo dõi các model AI
* Theo dõi tài liệu upload
* Theo dõi Agent Workflow
* Theo dõi Audit Log

---

# 2. Technology Stack

## Frontend

* Angular
* Angular Material
* Chart.js hoặc ECharts

## Backend

* Java Spring Boot
* Spring Security
* Spring AI
* JPA / Hibernate
* Flyway

## Database

* MySQL

---

# 3. Admin Modules

## Dashboard

### Chức năng

Hiển thị tổng quan hệ thống.

### Thông tin

* Total Users
* Total Conversations
* Total Requests
* Total Tokens
* Total Cost
* Active Users Today

### API

```http
GET /admin/dashboard
```

### Response

```json
{
  "totalUsers": 500,
  "totalChats": 12500,
  "totalRequests": 45000,
  "totalTokens": 15000000,
  "totalCost": 125.75
}
```

---

## User Management

### Chức năng

* Danh sách người dùng
* Xem chi tiết
* Khóa tài khoản
* Mở khóa tài khoản

### API

```http
GET /admin/users
```

```http
GET /admin/users/{id}
```

```http
PUT /admin/users/{id}/lock
```

```http
PUT /admin/users/{id}/unlock
```

### Thông tin hiển thị

* Email
* Full Name
* Status
* Total Requests
* Total Tokens
* Created Date

---

## AI Usage Tracking

### Chức năng

Theo dõi toàn bộ request gửi đến AI.

### API

```http
GET /admin/usages
```

### Bộ lọc

```http
GET /admin/usages?
model=gemini
&userId=1
&from=2026-01-01
&to=2026-01-31
```

### API chi tiết

```http
GET /admin/usages/{id}
```

### Thông tin hiển thị

* User
* Conversation
* Model
* Prompt
* Response
* Input Tokens
* Output Tokens
* Total Tokens
* Cost
* Created Time

---

## Conversation Monitoring

### Chức năng

Theo dõi các cuộc hội thoại.

### API

```http
GET /admin/conversations
```

```http
GET /admin/conversations/{id}
```

### Filter

```http
GET /admin/conversations?keyword=angular
```

### Thông tin hiển thị

* User
* Question
* Answer
* Model
* Tokens
* Time

---

## Model Analytics

### Chức năng

Thống kê mức độ sử dụng từng model.

### API

```http
GET /admin/models/statistics
```

### Response

```json
[
  {
    "model": "gemini",
    "requests": 5000
  },
  {
    "model": "gpt-4o",
    "requests": 2500
  }
]
```

### Dashboard

* Pie Chart
* Bar Chart

---

## Token Analytics

### Chức năng

Theo dõi token theo ngày, tháng, năm.

### API

```http
GET /admin/analytics/tokens
```

### Dashboard

* Tokens Per Day
* Tokens Per Model
* Tokens Per User

---

## Cost Analytics

### Chức năng

Theo dõi chi phí AI.

### API

```http
GET /admin/analytics/cost
```

### Response

```json
{
  "today": 3.5,
  "month": 125.7,
  "year": 1540.9
}
```

### Dashboard

* Cost Per Day
* Cost Per Month
* Cost Per Model

---

## Prompt Analytics

### Chức năng

Theo dõi Prompt được sử dụng nhiều nhất.

### API

```http
GET /admin/prompts/statistics
```

### Response

```json
[
  {
    "prompt": "Generate Angular Component",
    "count": 500
  }
]
```

---

## Document Analytics

### Chức năng

Theo dõi file upload.

### API

```http
GET /admin/documents
```

### Thông tin hiển thị

* File Name
* User
* Size
* Type
* Upload Time

---

## Agent Monitoring

### Chức năng

Theo dõi Agent Workflow.

### API

```http
GET /admin/agent-executions
```

### Thông tin hiển thị

* Workflow Name
* User
* Execution Time
* Status
* Tool Calls

---

## Audit Log

### Chức năng

Theo dõi toàn bộ hành động hệ thống.

### API

```http
GET /admin/audit-logs
```

### Thông tin hiển thị

* User
* Action
* Resource
* IP Address
* Time

---

# 4. Database Design

## users

```sql
id
email
password
status
created_at
updated_at
```

## conversations

```sql
id
user_id
title
created_at
updated_at
```

## messages

```sql
id
conversation_id
role
content
created_at
```

## ai_usage

```sql
id
user_id
conversation_id

model_name

prompt

response

input_tokens

output_tokens

total_tokens

estimated_cost

created_at
```

## documents

```sql
id
user_id

file_name

file_size

file_type

uploaded_at
```

## agent_execution

```sql
id
user_id

workflow_name

execution_time

status

created_at
```

## audit_log

```sql
id
user_id

action

resource

ip_address

created_at
```

---

# 5. Angular Admin Pages

```text
/admin

├── dashboard
├── users
├── conversations
├── usages
├── models
├── tokens
├── costs
├── prompts
├── documents
├── agents
├── audit-logs
└── settings
```

---

# 6. Spring Boot Package Structure

```text
com.ai.platform.admin

├── dashboard
├── user
├── usage
├── conversation
├── model
├── analytics
├── prompt
├── document
├── agent
├── audit
└── common
```

---

# 7. Priority APIs

Các API cần triển khai đầu tiên:

```http
GET /admin/dashboard

GET /admin/users

GET /admin/usages

GET /admin/conversations

GET /admin/models/statistics

GET /admin/analytics/tokens

GET /admin/analytics/cost
```

---

# 8. Future Enhancements

* Real-time Monitoring
* AI Cost Forecast
* User Quota Management
* Subscription Management
* AI Provider Health Check
* API Usage Limitation
* Export Excel/PDF Reports
* Alert & Notification System
