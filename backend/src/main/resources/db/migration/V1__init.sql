CREATE TABLE roles (
    id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    token      VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked    BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE conversations (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    title      VARCHAR(500) NOT NULL DEFAULT 'New Chat',
    model      VARCHAR(100) NOT NULL DEFAULT 'GEMINI_FLASH',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    role            VARCHAR(50) NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE prompt_templates (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NULL,
    title      VARCHAR(255) NOT NULL,
    content    TEXT NOT NULL,
    category   VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
    is_public  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prompt_templates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE documents (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    filename       VARCHAR(500) NOT NULL,
    mime_type      VARCHAR(100) NOT NULL,
    file_path      VARCHAR(1000) NOT NULL,
    extracted_text LONGTEXT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE conversation_documents (
    conversation_id BIGINT NOT NULL,
    document_id     BIGINT NOT NULL,
    PRIMARY KEY (conversation_id, document_id),
    CONSTRAINT fk_conv_docs_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_docs_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE agent_runs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    conversation_id BIGINT NULL,
    tool_name       VARCHAR(255) NOT NULL,
    `input`         TEXT NULL,
    `output`        TEXT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agent_runs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_agent_runs_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);

CREATE TABLE generated_files (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    type         VARCHAR(50) NOT NULL,
    source_input TEXT NULL,
    output_path  VARCHAR(1000) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_generated_files_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_prompt_templates_user ON prompt_templates(user_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

INSERT INTO roles (name) VALUES ('USER'), ('ADMIN');

INSERT INTO prompt_templates (user_id, title, content, category, is_public) VALUES
(NULL, 'Generate Java Code', 'Generate clean, production-ready Java code with proper error handling and comments for the following requirement:', 'CODE', TRUE),
(NULL, 'Generate Angular Code', 'Generate Angular standalone component code following best practices for:', 'CODE', TRUE),
(NULL, 'Generate Test Case', 'Generate comprehensive unit test cases covering edge cases for:', 'TEST', TRUE),
(NULL, 'Summarize Document', 'Please provide a concise summary of the attached document, highlighting key points and actionable insights.', 'DOCUMENT', TRUE),
(NULL, 'Generate PPT Outline', 'Create a detailed PowerPoint presentation outline with slide titles and bullet points for:', 'PRESENTATION', TRUE);
