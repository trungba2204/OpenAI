# AI IDE Workspace Requirements

## Overview

AI IDE Workspace là môi trường lập trình trực tuyến cho phép người dùng:

* Upload source code
* Quản lý project
* Mở và chỉnh sửa file
* Chat với AI dựa trên source code
* Sinh code bằng AI
* Refactor code bằng AI
* Generate Unit Test
* Generate Documentation
* Multi-file AI Editing
* Agent-based Code Generation

Mục tiêu là xây dựng sản phẩm tương tự:

* Cursor
* Windsurf
* Claude Code
* GitHub Copilot Workspace

---

# Technology Stack

## Frontend

* Angular
* Monaco Editor
* RxJS
* WebSocket

## Backend

* Spring Boot
* Spring AI
* LangChain4j
* WebSocket
* JPA / Hibernate

## Storage

* MySQL
* File Storage

---

# Module 1: Workspace Management

## Chức năng

* Tạo Workspace
* Xóa Workspace
* Đổi tên Workspace
* Clone Workspace

## API

```http
POST /api/workspaces

GET /api/workspaces

GET /api/workspaces/{id}

PUT /api/workspaces/{id}

DELETE /api/workspaces/{id}
```

---

# Module 2: Project Management

## Chức năng

* Upload ZIP Project
* Import Source Code
* Tạo Project mới
* Xóa Project
* Đổi tên Project

## Supported

* Java
* Spring Boot
* Angular
* React
* NodeJS
* Python
* C#
* Go

## API

```http
POST /api/projects/upload

GET /api/projects

GET /api/projects/{id}

DELETE /api/projects/{id}
```

---

# Module 3: File Explorer

## Chức năng

* Xem cây thư mục
* Tạo file
* Tạo folder
* Rename
* Delete

## API

```http
GET /api/projects/{id}/tree

POST /api/files

PUT /api/files/{id}

DELETE /api/files/{id}
```

---

# Module 4: Monaco IDE

## Chức năng

* Syntax Highlight
* Multi Tab
* Auto Save
* Search
* Replace
* Split View

## Languages

* Java
* TypeScript
* JavaScript
* HTML
* CSS
* SCSS
* SQL
* Python
* YAML
* Markdown

---

# Module 5: AI Chat

## Chức năng

Chat với AI dựa trên source code hiện tại.

Ví dụ:

User:

```text
Giải thích service này
```

AI:

```text
Phân tích file hiện tại
```

## API

```http
POST /api/ai/chat
```

Request

```json
{
  "projectId": 1,
  "fileId": 10,
  "message": "Explain this service"
}
```

---

# Module 6: Context Aware AI

## Chức năng

AI hiểu:

* File hiện tại
* Folder hiện tại
* Toàn bộ project

Ví dụ:

```text
Refactor authentication flow
```

AI sẽ đọc:

* SecurityConfig
* JwtFilter
* AuthService
* UserService

---

# Module 7: Inline AI

## Chức năng

Chọn đoạn code.

Ví dụ:

```java
UserService
```

Click:

```text
Ask AI
```

AI thực hiện:

* Explain
* Refactor
* Optimize
* Generate Test

---

# Module 8: Code Generation

## Chức năng

Generate source code.

Ví dụ:

```text
Create User CRUD
```

AI sinh:

* Entity
* DTO
* Repository
* Service
* Controller

---

## API

```http
POST /api/ai/generate
```

---

# Module 9: Multi File Editing

## Chức năng

AI sửa nhiều file cùng lúc.

Ví dụ:

```text
Add Role Management
```

AI chỉnh:

* User
* Role
* SecurityConfig
* JwtFilter
* Controller

---

# Module 10: AI Refactor

## Chức năng

Refactor toàn bộ project.

Ví dụ:

```text
Convert field injection to constructor injection
```

AI tự động sửa nhiều file.

---

# Module 11: AI Agent

## Chức năng

Agent thực hiện nhiều bước.

Ví dụ:

```text
Add Login Feature
```

Agent:

```text
1. Analyze project

2. Design database

3. Create entities

4. Create repositories

5. Create services

6. Create controllers

7. Generate tests
```

---

# Module 12: Project Indexing

## Chức năng

Phân tích source code.

Index:

* Class
* Interface
* Method
* Annotation
* Import

## Database

```sql
project_index
```

---

# Module 13: Semantic Search

## Chức năng

Tìm kiếm bằng AI.

Ví dụ:

```text
Where is JWT validation implemented?
```

AI trả về:

```text
JwtAuthenticationFilter.java
line 42
```

---

# Module 14: Codebase RAG

## Chức năng

Embedding source code.

Luồng:

```text
Project

↓

Chunk

↓

Embedding

↓

Vector Database

↓

AI
```

---

# Module 15: Unit Test Generator

## Chức năng

Generate:

* JUnit
* Mockito
* Jasmine
* Jest

---

# Module 16: Documentation Generator

## Chức năng

Generate:

* README.md
* API Documentation
* Technical Specification
* Architecture Diagram Description

---

# Module 17: Git Integration

## Chức năng

* Connect GitHub
* Connect GitLab
* Connect Bitbucket

### API

```http
POST /api/git/connect

POST /api/git/pull

POST /api/git/push
```

---

# Module 18: AI Commit Message

## Chức năng

Generate commit message.

Ví dụ:

```text
feat(auth): add JWT authentication
```

---

# Module 19: AI Code Review

## Chức năng

Review source code.

Phân tích:

* Bug
* Security
* Performance
* Best Practice

---

# Module 20: AI Architecture Generator

## Chức năng

Từ source code sinh:

* System Design
* ERD
* API Flow
* Sequence Flow

---

# Database Tables

```sql
workspaces

projects

project_files

file_versions

project_indexes

chat_sessions

chat_messages

ai_usage

agent_executions

git_connections
```

---

# Angular Pages

```text
/workspaces

/workspaces/:id

/projects/:id

/editor

/ai-chat

/git

/settings
```

---

# MVP Phase

## Phase 1

* Workspace
* Upload ZIP
* File Explorer
* Monaco Editor
* AI Chat

## Phase 2

* Context Aware AI
* Inline AI
* Code Generation
* Refactor

## Phase 3

* RAG
* Multi File Editing
* Semantic Search
* Agent

## Phase 4

* Git Integration
* AI Code Review
* Architecture Generator

---

# Long-Term Vision

Mục tiêu cuối cùng:

```text
ChatGPT
+
Cursor
+
Claude Code
+
GitHub Copilot
+
NotebookLM
```

trong cùng một nền tảng Angular + Spring Boot.
