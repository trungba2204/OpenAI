# AI Knowledge Training Module Requirements

## Overview

AI Knowledge Training là hệ thống cho phép người dùng:

* Upload tài liệu
* Huấn luyện AI bằng dữ liệu riêng
* Tạo AI Assistant riêng
* Chat với AI dựa trên dữ liệu đã học
* Quản lý nhiều bộ kiến thức
* Cập nhật kiến thức theo thời gian

Mục tiêu:

Tạo một AI có thể trả lời dựa trên bộ tài liệu của người dùng thay vì chỉ dựa vào kiến thức mặc định của model.

Ví dụ:

* AI Luật Việt Nam
* AI Logistics
* AI Công ty nội bộ
* AI Hướng dẫn sản phẩm
* AI Quy trình nghiệp vụ

---

# Technology Stack

## Frontend

* Angular
* Angular Material
* Monaco Editor
* WebSocket

## Backend

* Spring Boot
* Spring AI
* LangChain4j

## Database

* MySQL

## Vector Database

* Qdrant
* Weaviate
* Milvus

---

# Module 1: Knowledge Base

## Chức năng

Tạo bộ kiến thức.

Ví dụ:

```text
Vietnam Law Assistant

Company Internal Assistant

Logistics Expert

Spring Boot Expert
```

---

## API

```http
POST /api/knowledge-bases

GET /api/knowledge-bases

GET /api/knowledge-bases/{id}

PUT /api/knowledge-bases/{id}

DELETE /api/knowledge-bases/{id}
```

---

# Module 2: Knowledge Upload

## Chức năng

Upload tài liệu.

### Hỗ trợ

* PDF
* DOCX
* TXT
* Markdown
* Excel
* CSV

---

## API

```http
POST /api/knowledge-bases/{id}/documents
```

---

# Module 3: Knowledge Processing

## Chức năng

Sau khi upload:

```text
Document

↓

Extract Text

↓

Chunking

↓

Embedding

↓

Vector Database
```

---

## Service

```java
DocumentParserService

ChunkingService

EmbeddingService

VectorStoreService
```

---

# Module 4: Knowledge Training

## Chức năng

Xây dựng AI Profile từ tài liệu.

Ví dụ:

User upload:

```text
Nội quy công ty

Quy trình tuyển dụng

Quy trình mua hàng
```

AI tạo:

```text
HR Assistant
```

---

## Kết quả

AI hiểu:

* Quy trình
* Thuật ngữ
* Chính sách
* Tài liệu nội bộ

---

# Module 5: System Prompt Builder

## Chức năng

Định nghĩa cách AI trả lời.

Ví dụ:

```text
Bạn là chuyên gia Logistics.

Chỉ trả lời dựa trên dữ liệu đã huấn luyện.

Nếu không có thông tin thì trả lời:
"Tôi không tìm thấy dữ liệu phù hợp."
```

---

## API

```http
PUT /api/knowledge-bases/{id}/prompt
```

---

# Module 6: Knowledge Chat

## Chức năng

Chat với AI dựa trên bộ kiến thức.

---

## API

```http
POST /api/knowledge-bases/{id}/chat
```

### Request

```json
{
  "message": "Quy trình tuyển dụng của công ty là gì?"
}
```

---

## Response

```json
{
  "answer": "...",
  "sources": [
    "QuyTrinhTuyenDung.pdf"
  ]
}
```

---

# Module 7: Citation & Source Tracking

## Chức năng

AI phải chỉ rõ nguồn.

Ví dụ:

```text
Nguồn:

QuyTrinhTuyenDung.pdf

Trang 15
```

---

# Module 8: Multi Knowledge Search

## Chức năng

Chat trên nhiều bộ kiến thức.

Ví dụ:

```text
HR Knowledge

+

Legal Knowledge

+

Sales Knowledge
```

---

## API

```http
POST /api/multi-knowledge/chat
```

---

# Module 9: Knowledge Versioning

## Chức năng

Quản lý phiên bản dữ liệu.

Ví dụ:

```text
Version 1

Version 2

Version 3
```

---

## API

```http
GET /api/knowledge-bases/{id}/versions
```

---

# Module 10: Knowledge Re-Training

## Chức năng

Tự động cập nhật khi có tài liệu mới.

Luồng:

```text
Upload

↓

Re-Index

↓

Re-Embedding

↓

Ready
```

---

# Module 11: Knowledge Analytics

## Chức năng

Theo dõi:

* Tổng số tài liệu
* Tổng chunk
* Tổng embeddings
* Tổng câu hỏi
* Tổng token

---

## API

```http
GET /api/knowledge-bases/{id}/analytics
```

---

# Module 12: Knowledge Permission

## Chức năng

Phân quyền.

### Private

Chỉ chủ sở hữu.

### Team

Chia sẻ trong nhóm.

### Public

Công khai.

---

# Module 13: AI Persona

## Chức năng

Tạo tính cách AI.

Ví dụ:

```text
Luật sư

Giảng viên

Kế toán

Logistics Expert

Java Architect
```

---

## API

```http
PUT /api/knowledge-bases/{id}/persona
```

---

# Module 14: Knowledge Agent

## Chức năng

Agent sử dụng dữ liệu đã huấn luyện.

Ví dụ:

```text
Đọc toàn bộ tài liệu.

↓

Tạo quy trình.

↓

Xuất Markdown.

↓

Sinh PowerPoint.
```

---

# Module 15: Knowledge Export

## Chức năng

Xuất dữ liệu.

### Export

* Markdown
* PDF
* Word

---

# Database Design

## knowledge_bases

```sql
id

name

description

owner_id

system_prompt

persona

status

created_at
```

---

## knowledge_documents

```sql
id

knowledge_base_id

file_name

file_size

uploaded_at
```

---

## knowledge_chunks

```sql
id

document_id

chunk_index

content
```

---

## knowledge_embeddings

```sql
id

chunk_id

vector_id
```

---

## knowledge_chat_sessions

```sql
id

knowledge_base_id

user_id
```

---

## knowledge_chat_messages

```sql
id

session_id

role

content

created_at
```

---

# Angular Pages

```text
/knowledge

/knowledge/create

/knowledge/:id

/knowledge/:id/documents

/knowledge/:id/chat

/knowledge/:id/settings

/knowledge/:id/analytics
```

---

# MVP Phase

## Phase 1

* Knowledge Base
* Upload Documents
* Embedding
* Chat With Knowledge

## Phase 2

* Citations
* Multi Knowledge Search
* Persona
* Analytics

## Phase 3

* Agent
* Re-Training
* Team Collaboration
* Knowledge Export

---

# Long-Term Vision

Mục tiêu cuối cùng:

```text
Upload tài liệu

↓

AI học dữ liệu

↓

Tạo AI chuyên gia

↓

Chat

↓

Agent

↓

Sinh tài liệu

↓

Sinh code

↓

Sinh PowerPoint
```

Tương tự sự kết hợp giữa:

* NotebookLM
* GPTs
* Claude Projects
* Perplexity Spaces
* Custom AI Agents
