-- Grant leave permissions to the role of user c6f31c63-447c-4578-86d7-2b71368a8db1
-- Run after add_leave_management.sql (so leaves:* permissions exist in school_xx_permissions)

INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT u.role_id, p.permission_id
FROM school_xx_users u
CROSS JOIN (
  VALUES
    ('leaves:view'),
    ('leaves:create'),
    ('leaves:approve'),
    ('leaves:manage')
) AS p(permission_id)
WHERE u.id = '00000000-0000-0000-0000-000000000010'
ON CONFLICT (role_id, permission_id) DO NOTHING;
