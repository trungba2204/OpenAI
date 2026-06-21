CREATE TABLE project_indexes (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id    BIGINT NOT NULL,
    file_id       BIGINT NULL,
    file_path     VARCHAR(2048) NOT NULL,
    symbol_type   VARCHAR(50) NOT NULL,
    symbol_name   VARCHAR(512) NOT NULL,
    parent_symbol VARCHAR(512) NULL,
    line_number   INT NOT NULL DEFAULT 1,
    signature     TEXT NULL,
    CONSTRAINT fk_pi_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_file FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE SET NULL
);

CREATE TABLE project_chunks (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id  BIGINT NOT NULL,
    file_id     BIGINT NOT NULL,
    file_path   VARCHAR(2048) NOT NULL,
    chunk_index INT NOT NULL,
    content     TEXT NOT NULL,
    keywords    TEXT NULL,
    CONSTRAINT fk_pc_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_file FOREIGN KEY (file_id) REFERENCES project_files(id) ON DELETE CASCADE
);

CREATE TABLE git_connections (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT NOT NULL,
    provider        VARCHAR(50) NOT NULL,
    remote_url      VARCHAR(1024) NOT NULL,
    branch          VARCHAR(255) NOT NULL DEFAULT 'main',
    username        VARCHAR(255) NULL,
    access_token    TEXT NULL,
    last_sync_at    TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_git_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY uk_git_project (project_id)
);

CREATE TABLE ide_agent_runs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id  BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    prompt      TEXT NOT NULL,
    status      VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    steps_json  TEXT NULL,
    result      TEXT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_iar_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_iar_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_pi_project ON project_indexes(project_id);
CREATE INDEX idx_pi_symbol ON project_indexes(symbol_name);
CREATE INDEX idx_pi_path ON project_indexes(file_path(766));
CREATE INDEX idx_pc_project ON project_chunks(project_id);
CREATE INDEX idx_pc_file ON project_chunks(file_id);
CREATE INDEX idx_iar_project ON ide_agent_runs(project_id);
