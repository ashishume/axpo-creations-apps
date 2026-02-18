-- Migration: add plans:manage permission and assign to Super Admin only (for existing databases)

INSERT INTO school_xx_permissions (id, module, action, description) VALUES
  ('plans:manage', 'plans', 'manage', 'Change subscription plan for a school (Super Admin only)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000000', 'plans:manage')
ON CONFLICT DO NOTHING;
