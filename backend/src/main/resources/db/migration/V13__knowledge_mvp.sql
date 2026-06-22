CREATE TABLE knowledge_bases (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id      BIGINT NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   VARCHAR(2000) NULL,
    system_prompt TEXT NULL,
    persona       VARCHAR(500) NULL,
    status        VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_kb_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_kb_owner ON knowledge_bases(owner_id);

CREATE TABLE knowledge_documents (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    knowledge_base_id BIGINT NOT NULL,
    file_name         VARCHAR(512) NOT NULL,
    file_path         VARCHAR(2048) NOT NULL,
    file_size         BIGINT NOT NULL DEFAULT 0,
    mime_type         VARCHAR(128) NULL,
    status            VARCHAR(32) NOT NULL DEFAULT 'UPLOADED',
    error_message     VARCHAR(2000) NULL,
    extracted_text    LONGTEXT NULL,
    uploaded_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kd_kb FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
);

CREATE INDEX idx_kd_kb ON knowledge_documents(knowledge_base_id);

CREATE TABLE knowledge_chunks (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    chunk_index INT NOT NULL,
    content     TEXT NOT NULL,
    CONSTRAINT fk_kc_doc FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_kc_doc ON knowledge_chunks(document_id);

CREATE TABLE knowledge_embeddings (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    chunk_id  BIGINT NOT NULL,
    vector_id VARCHAR(255) NULL,
    CONSTRAINT fk_ke_chunk FOREIGN KEY (chunk_id) REFERENCES knowledge_chunks(id) ON DELETE CASCADE
);

CREATE INDEX idx_ke_chunk ON knowledge_embeddings(chunk_id);

CREATE TABLE knowledge_chat_sessions (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    knowledge_base_id BIGINT NOT NULL,
    user_id           BIGINT NOT NULL,
    title             VARCHAR(500) NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kcs_kb FOREIGN KEY (knowledge_base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    CONSTRAINT fk_kcs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_kcs_kb ON knowledge_chat_sessions(knowledge_base_id);
CREATE INDEX idx_kcs_user ON knowledge_chat_sessions(user_id);

CREATE TABLE knowledge_chat_messages (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id   BIGINT NOT NULL,
    role         VARCHAR(32) NOT NULL,
    content      TEXT NOT NULL,
    sources_json TEXT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kcm_session FOREIGN KEY (session_id) REFERENCES knowledge_chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_kcm_session ON knowledge_chat_messages(session_id);
