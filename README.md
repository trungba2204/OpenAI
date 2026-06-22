# AI Platform MVP

Nền tảng AI SaaS với Angular 20 + Spring Boot 3.4 + Spring AI 1.0.

## Tính năng

- Authentication (JWT + Refresh Token)
- Chat AI với SSE streaming
- Multi Model (Groq, OpenRouter)
- Upload & đọc tài liệu (PDF, DOCX, TXT)
- Prompt Library
- Agent Mode với tool calling
- Markdown Generator
- PPT Generator
- **AI IDE Workspace** (Monaco Editor, upload ZIP, AI chat theo code)
- **AI Knowledge Training** (upload tài liệu, huấn luyện RAG, chat theo bộ kiến thức)
- **Admin Portal** (Dashboard, Users, AI Usage, Conversations, Analytics) — chỉ `ROLE_ADMIN`

## Cấu trúc

```
ai-platform/
├── frontend/     # Angular 20
├── backend/      # Spring Boot 3.4 + Spring AI 1.0
└── README.md
```

## Yêu cầu

- Node.js 22+
- Java 17+
- Maven (hoặc dùng `./mvnw`)
- MySQL 8+

## Chạy Backend

### 1. Tạo database MySQL (nếu chưa có)

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Hoặc để Spring tự tạo DB qua `createDatabaseIfNotExist=true` (mặc định dev).

### 2. Chạy server

```bash
cd backend
./mvnw spring-boot:run
```

Backend chạy tại `http://localhost:8080`

Cấu hình DB mặc định (dev):

| Biến | Mặc định |
|------|----------|
| `DB_URL` | `jdbc:mysql://localhost:3306/ai_platform?...` |
| `DB_USERNAME` | `root` |
| `DB_PASSWORD` | Xem `application-local.yml` (copy từ `application-local.yml.example`) |

Nếu MySQL của bạn dùng mật khẩu khác:

```bash
export DB_PASSWORD=your_password
./mvnw spring-boot:run
```

### API key

Thêm key vào `application-local.yml` (copy từ `application-local.yml.example`):

```yaml
app:
  ai:
    providers:
      groq:
        api-key: gsk_your_groq_key
      openrouter:
        api-key: sk-or-v1_your_openrouter_key
```

Hoặc export biến môi trường:

```bash
export GROQ_API_KEY=your-groq-key
export OPENROUTER_API_KEY=your-openrouter-key
export JWT_SECRET=your-long-secret-key
```

Hỗ trợ **Groq** (miễn phí) và **OpenRouter** (có model free + trả phí).

Dev profile dùng MySQL tại `localhost:3306/ai_platform`. Flyway tự chạy migration khi khởi động.

### Production

```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:mysql://your-host:3306/ai_platform?useSSL=true&serverTimezone=Asia/Ho_Chi_Minh
export DB_USERNAME=your_user
export DB_PASSWORD=your_password
./mvnw spring-boot:run
```

## Chạy Frontend

```bash
cd frontend
npm install
npm start
```

Frontend chạy tại `http://localhost:4200`

## AI IDE Workspace (Phase 1)

Theo `AgentIDE.md` — MVP gồm:

| Tính năng | Route |
|-----------|-------|
| Danh sách workspace | `/workspaces` |
| Quản lý project (upload ZIP) | `/workspaces/:id` |
| Monaco Editor + AI Chat | `/projects/:id` |

**Luồng sử dụng:**

1. Sidebar → **AI IDE** → tạo workspace
2. Upload file `.zip` source code hoặc tạo project trống
3. Mở project → chọn file cây thư mục → chỉnh sửa trong Monaco
4. Panel **AI Assistant** bên phải — hỏi về code (có context file đang mở)

**API chính:** `/api/workspaces`, `/api/projects/upload`, `/api/projects/{id}/tree`, `/api/files/{id}`, `/api/ai/chat`

> Restart backend để Flyway chạy migration `V11__ide_workspace.sql`.

## AI Knowledge Training (MVP Phase 1)

Theo `AgentKnowledge.md` — huấn luyện AI từ tài liệu riêng và chat RAG.

### Chế độ ứng dụng

Nút **Chat | Knowledge | IDE** góc trên phải (có animation chuyển mode). Knowledge hiển thị trên `/knowledge`, `/knowledge/create` và các trang quản lý; ẩn khi vào chat fullscreen `/knowledge/:id/chat`.

### Routes

| Route | Mô tả |
|-------|-------|
| `/knowledge` | Danh sách bộ kiến thức |
| `/knowledge/create` | Tạo bộ kiến thức mới |
| `/knowledge/:id/documents` | Upload tài liệu (PDF, DOCX, TXT, MD, CSV, XLSX) |
| `/knowledge/:id/chat` | Chat với AI dựa trên tài liệu |
| `/knowledge/:id/settings` | System prompt |
| `/knowledge/:id/analytics` | Placeholder Phase 2 |

### Luồng sử dụng

1. Chuyển sang **Knowledge** mode → tạo bộ kiến thức
2. Upload tài liệu → hệ thống tự chunk và index (trạng thái PROCESSING → READY)
3. Vào **Chat** → hỏi đáp; AI trả lời kèm danh sách nguồn tài liệu
4. Tùy chỉnh **System prompt** trong Settings

### API Knowledge

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/knowledge-bases` | Tạo bộ kiến thức |
| GET | `/api/knowledge-bases` | Danh sách |
| GET | `/api/knowledge-bases/{id}` | Chi tiết |
| PUT | `/api/knowledge-bases/{id}` | Cập nhật |
| PUT | `/api/knowledge-bases/{id}/prompt` | System prompt |
| DELETE | `/api/knowledge-bases/{id}` | Xóa |
| POST | `/api/knowledge-bases/{id}/documents` | Upload tài liệu |
| GET | `/api/knowledge-bases/{id}/documents` | Danh sách tài liệu |
| POST | `/api/knowledge-bases/{id}/chat` | Chat RAG |

### Migration

Restart backend để Flyway chạy `V13__knowledge_mvp.sql`.

### Phase 2 (sắp tới)

- Qdrant vector store + embedding API
- Citations chi tiết (trang/số), Multi-KB search, Analytics

## API chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/conversations` | Danh sách chat |
| POST | `/api/chat/stream` | Chat SSE |
| POST | `/api/documents/upload` | Upload file |
| GET | `/api/prompts` | Prompt library |
| POST | `/api/agent/chat` | Agent mode |
| POST | `/api/generate/markdown` | Sinh Markdown |
| POST | `/api/generate/ppt` | Sinh PPT |
| GET | `/api/admin/dashboard` | Admin dashboard (ROLE_ADMIN) |
| GET | `/api/admin/users` | Quản lý users |
| GET | `/api/admin/usages` | Lịch sử AI usage |
| GET | `/api/admin/conversations` | Giám sát hội thoại |
| GET | `/api/admin/models/statistics` | Thống kê model |
| GET | `/api/admin/analytics/tokens` | Phân tích token |
| GET | `/api/admin/analytics/cost` | Phân tích chi phí |

## Admin Portal

Tài khoản **admin** và **user** tách biệt hoàn toàn:

| Loại | Role | Đăng nhập | Không thể |
|------|------|-----------|-----------|
| User app | `USER` only | `/login` | Vào Admin Portal |
| Admin | `ADMIN` only | `/admin/login` | Vào app user (`/login`) |

**Tài khoản admin mặc định** (tạo bởi migration `V10__dedicated_admin_account.sql`):

| Email | Mật khẩu |
|-------|----------|
| `admin@aiplatform.local` | `Admin@123456` |

> Đổi mật khẩu sau khi deploy production.

1. Restart backend để Flyway chạy migration mới nhất.
2. Truy cập **`http://localhost:4200/admin/login`**.
3. Đăng nhập bằng tài khoản admin ở trên → vào `/admin/dashboard`.
4. Tài khoản đăng ký qua `/register` chỉ là user thường, **không thể** đăng nhập admin.

## Giao diện

ChatGPT-like: sidebar trái, light/dark mode, streaming response, markdown render.
