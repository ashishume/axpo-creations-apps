-- Grant Super Admin full access: ensure the Super Admin role has every permission in school_xx_permissions.
-- Run this after adding new permissions or to fix a Super Admin that's missing permissions.
--
-- Super Admin role id: 00000000-0000-0000-0000-000000000000

INSERT INTO school_xx_role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000000', id
FROM school_xx_permissions
ON CONFLICT DO NOTHING;
