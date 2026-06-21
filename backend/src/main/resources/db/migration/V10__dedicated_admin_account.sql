-- Gỡ quyền ADMIN khỏi mọi tài khoản người dùng ứng dụng
DELETE ur FROM user_roles ur
INNER JOIN roles r ON r.id = ur.role_id
WHERE r.name = 'ADMIN';

-- Tài khoản quản trị riêng: chỉ role ADMIN (không có USER)
INSERT INTO users (email, password_hash, full_name, status)
SELECT 'admin@aiplatform.local',
       '$2a$10$cWWvkG4JdQZmNUotp0fk1.Z8uSXQEp4WqMesL.wl2A39p9ijxf/T2',
       'System Administrator',
       'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@aiplatform.local');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@aiplatform.local'
  AND r.name = 'ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
