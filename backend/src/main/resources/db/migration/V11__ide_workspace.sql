-- Repair partial run if previous attempt failed mid-migration (MySQL DDL auto-commits)
DROP TABLE IF EXISTS project_files;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS workspaces;

CREATE TABLE workspaces (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_workspace_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE projects (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    user_id      BIGINT NOT NULL,
    name         VARCHAR(255) NOT NULL,
    description  VARCHAR(500) NULL,
    root_path    VARCHAR(1024) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE project_files (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id   BIGINT NOT NULL,
    parent_id    BIGINT NULL,
    name         VARCHAR(512) NOT NULL,
    path         VARCHAR(2048) NOT NULL,
    is_directory BOOLEAN NOT NULL DEFAULT FALSE,
    mime_type    VARCHAR(128) NULL,
    size_bytes   BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pf_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pf_parent FOREIGN KEY (parent_id) REFERENCES project_files(id) ON DELETE CASCADE,
    -- utf8mb4 index limit 3072 bytes: prefix 766 chars * 4 + project_id(8) = 3072
    UNIQUE KEY uk_project_path (project_id, path(766))
);

CREATE INDEX idx_workspaces_user ON workspaces(user_id);
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_project_files_project ON project_files(project_id);
