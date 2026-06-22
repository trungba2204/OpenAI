# AI Editor Plugin Platform Requirements

# Overview

Mục tiêu:

Xây dựng hệ thống AI Coding Assistant có thể hoạt động trên:

* VS Code
* IntelliJ IDEA
* Android Studio
* Eclipse
* Cursor
* Windsurf
* Web IDE

Sử dụng chung:

* AI Backend
* Knowledge Base
* Agent
* Chat
* Code Generation
* RAG
* Workspace

Người dùng chỉ cần cài Plugin.

---

# Architecture

```text
VS Code Plugin
IntelliJ Plugin
Eclipse Plugin

        ↓

Plugin SDK

        ↓

Gateway API

        ↓

Spring Boot AI Platform

        ↓

AI Models

Gemini
GPT
Claude
Groq
DeepSeek
```

---

# Module 1: Plugin SDK

## Mục tiêu

Xây dựng SDK chung.

```text
AI Plugin SDK
```

Tất cả IDE sẽ gọi qua SDK này.

---

## Chức năng

* Authentication
* API Client
* WebSocket Client
* Context Extraction
* Project Scanner

---

# Module 2: User Authentication

## Chức năng

Đăng nhập từ IDE.

### Flow

```text
Plugin

↓

Login

↓

Browser

↓

OAuth

↓

Access Token

↓

Plugin
```

---

## API

```http
POST /api/plugin/auth/login

POST /api/plugin/auth/refresh

POST /api/plugin/auth/logout
```

---

# Module 3: Project Context Extraction

## Chức năng

Plugin đọc project hiện tại.

### Thu thập

* Project Name
* Folder Structure
* Open Files
* Selected Code
* Active File
* Language

---

## API

```http
POST /api/plugin/context
```

---

# Module 4: AI Chat

## Chức năng

Chat trực tiếp trong IDE.

Ví dụ:

```text
Explain this code

Create Unit Test

Optimize Service
```

---

## API

```http
POST /api/plugin/chat
```

---

# Module 5: Inline AI

## Chức năng

Highlight code.

Chuột phải.

```text
Ask AI

Refactor

Explain

Fix Bug

Generate Test
```

---

## API

```http
POST /api/plugin/inline
```

---

# Module 6: Code Completion

## Chức năng

Tự động gợi ý code.

Tương tự:

* Cursor
* Copilot

---

## API

```http
POST /api/plugin/completion
```

---

# Module 7: AI Edit

## Chức năng

AI sửa code.

Ví dụ:

```text
Convert to Stream API
```

AI trả về patch.

---

## API

```http
POST /api/plugin/edit
```

---

# Module 8: Multi File Edit

## Chức năng

AI sửa nhiều file.

Ví dụ:

```text
Add Role Management
```

AI trả về:

```text
User.java

Role.java

SecurityConfig.java

JwtFilter.java
```

---

## API

```http
POST /api/plugin/multi-edit
```

---

# Module 9: Agent Mode

## Chức năng

Tương tự Cursor Agent.

Ví dụ:

```text
Implement Login Feature
```

Agent:

```text
Analyze Project

↓

Create Entity

↓

Create Repository

↓

Create Service

↓

Create Controller

↓

Generate Test
```

---

## API

```http
POST /api/plugin/agent
```

---

# Module 10: Knowledge Base Integration

## Chức năng

Plugin sử dụng Knowledge Base đã train.

Ví dụ:

```text
Use Company Coding Standard
```

---

## API

```http
POST /api/plugin/knowledge-chat
```

---

# Module 11: Project Indexing

## Chức năng

Index source code.

### Hỗ trợ

* Java
* Angular
* React
* NodeJS
* Python
* Go
* C#

---

## API

```http
POST /api/plugin/index
```

---

# Module 12: Semantic Search

## Chức năng

Ví dụ:

```text
Where is JWT implemented?
```

AI trả về:

```text
JwtFilter.java

Line 52
```

---

## API

```http
POST /api/plugin/search
```

---

# Module 13: Git Integration

## Chức năng

* Commit
* Pull
* Push
* Branch

AI hỗ trợ.

---

## API

```http
POST /api/plugin/git/review

POST /api/plugin/git/commit
```

---

# Module 14: AI Code Review

## Chức năng

Review Pull Request.

### Phân tích

* Security
* Performance
* Bugs
* Best Practices

---

## API

```http
POST /api/plugin/review
```

---

# Module 15: AI Documentation

## Chức năng

Generate:

* README
* API Docs
* Technical Docs

---

## API

```http
POST /api/plugin/documentation
```

---

# Module 16: Terminal AI

## Chức năng

Giải thích terminal command.

Ví dụ:

```bash
docker compose up
```

AI giải thích.

---

## API

```http
POST /api/plugin/terminal
```

---

# Module 17: Usage Tracking

## Chức năng

Theo dõi:

* Requests
* Tokens
* Models
* Cost

---

## API

```http
POST /api/plugin/usage
```

---

# VS Code Extension

## Chức năng

* Sidebar Chat
* Inline AI
* Agent Mode
* Code Completion
* Multi File Edit

---

# IntelliJ Plugin

## Chức năng

* Tool Window
* Context Menu
* Agent
* Refactor

---

# Eclipse Plugin

## Chức năng

* AI View
* Context Menu
* Chat Window

---

# Database

## plugin_installations

```sql
id

user_id

editor_type

version

installed_at
```

---

## plugin_sessions

```sql
id

user_id

project_id

editor_type

created_at
```

---

## plugin_usage

```sql
id

user_id

editor_type

model_name

tokens

cost

created_at
```

---

# Supported Editors

## Phase 1

* VS Code

## Phase 2

* IntelliJ IDEA
* Android Studio

## Phase 3

* Eclipse

## Phase 4

* Cursor
* Windsurf

## Phase 5

* Theia
* Monaco

---

# MVP

## Bắt buộc

* VS Code Extension
* Login
* Chat
* Inline AI
* Agent
* Code Completion

## Nâng cao

* Multi File Edit
* Semantic Search
* Knowledge Base
* Git Review

---

# Long-Term Vision

```text
Một AI Platform

↓

Web Chat

↓

Web IDE

↓

VS Code Plugin

↓

IntelliJ Plugin

↓

Eclipse Plugin

↓

Agent Platform

↓

Knowledge Base

↓

Custom Models
```

Người dùng ở bất kỳ IDE nào cũng sử dụng cùng một AI Engine, Knowledge Base, Agent và tài khoản.
