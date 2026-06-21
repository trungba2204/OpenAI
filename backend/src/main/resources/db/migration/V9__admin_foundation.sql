ALTER TABLE users
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE ai_usage (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    conversation_id  BIGINT NULL,
    model_name       VARCHAR(100) NOT NULL,
    prompt           TEXT NULL,
    response         TEXT NULL,
    input_tokens     INT NOT NULL DEFAULT 0,
    output_tokens    INT NOT NULL DEFAULT 0,
    total_tokens     INT NOT NULL DEFAULT 0,
    estimated_cost   DECIMAL(12, 6) NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_usage_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
);

CREATE TABLE audit_log (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NULL,
    action     VARCHAR(100) NOT NULL,
    resource   VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ai_usage_user_created ON ai_usage(user_id, created_at);
CREATE INDEX idx_ai_usage_model ON ai_usage(model_name);
CREATE INDEX idx_ai_usage_created ON ai_usage(created_at);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Promote first user to ADMIN if no admin exists yet
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE r.name = 'ADMIN'
  AND u.id = (SELECT MIN(id) FROM users)
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles ro ON ro.id = ur.role_id
      WHERE ro.name = 'ADMIN'
  );
