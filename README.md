# AI Platform MVP

Nền tảng AI SaaS với Angular 20 + Spring Boot 3.4 + Spring AI 1.0.

## Tính năng

- Authentication (JWT + Refresh Token)
- Chat AI với SSE streaming
- Multi Model (Gemini Flash — free tier)
- Upload & đọc tài liệu (PDF, DOCX, TXT)
- Prompt Library
- Agent Mode với tool calling
- Markdown Generator
- PPT Generator

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

### API key (Gemini free)

Lấy key miễn phí tại [Google AI Studio](https://aistudio.google.com/apikey), rồi thêm vào `application-local.yml`:

```yaml
spring:
  ai:
    openai:
      api-key: your-google-api-key
```

Hoặc export biến môi trường:

```bash
export GOOGLE_API_KEY=your-google-api-key
export JWT_SECRET=your-long-secret-key
```

Chỉ hỗ trợ **2 model miễn phí**: Gemini 2.0 Flash và Gemini 1.5 Flash.

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

## Giao diện

ChatGPT-like: sidebar trái, light/dark mode, streaming response, markdown render.
