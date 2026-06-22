CREATE TABLE plugin_installations (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    editor_type  VARCHAR(32) NOT NULL,
    version      VARCHAR(64) NULL,
    installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plugin_install_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_install_user ON plugin_installations(user_id);
CREATE INDEX idx_plugin_install_editor ON plugin_installations(editor_type);

CREATE TABLE plugin_sessions (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id              BIGINT NOT NULL,
    editor_type          VARCHAR(32) NOT NULL,
    project_name         VARCHAR(512) NULL,
    workspace_path_hash  VARCHAR(128) NULL,
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_plugin_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_session_user ON plugin_sessions(user_id);
CREATE INDEX idx_plugin_session_editor ON plugin_sessions(editor_type);

CREATE TABLE plugin_usage (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    editor_type  VARCHAR(32) NOT NULL,
    endpoint     VARCHAR(128) NOT NULL,
    model_name   VARCHAR(128) NULL,
    tokens       INT NOT NULL DEFAULT 0,
    cost         DECIMAL(12, 6) NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plugin_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_plugin_usage_user ON plugin_usage(user_id);
CREATE INDEX idx_plugin_usage_created ON plugin_usage(created_at);

CREATE TABLE plugin_device_codes (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    code       VARCHAR(8) NOT NULL,
    user_id    BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plugin_device_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_plugin_device_code UNIQUE (code)
);

CREATE INDEX idx_plugin_device_user ON plugin_device_codes(user_id);
