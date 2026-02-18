-- 1) Add assistant:use permission (admin-only: Axpo Assistant access)
INSERT INTO school_xx_permissions (id, module, action, description) VALUES
  ('assistant:use', 'assistant', 'use', 'Use Axpo Assistant (AI chat) - premium feature')
ON CONFLICT (id) DO NOTHING;

-- 2) Grant assistant:use to Super Admin and Admin only
INSERT INTO school_xx_role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000000', 'assistant:use'),
  ('00000000-0000-0000-0000-000000000001', 'assistant:use')
ON CONFLICT DO NOTHING;

-- 3) Update plan_id constraint to new plans: starter, ai_assistant
-- Map old values first so existing rows are valid
UPDATE school_xx_schools SET plan_id = 'starter' WHERE plan_id IS NULL OR plan_id = 'free';
UPDATE school_xx_schools SET plan_id = 'ai_assistant' WHERE plan_id IN ('pro', 'enterprise');
UPDATE school_xx_schools SET plan_id = 'starter' WHERE plan_id NOT IN ('starter', 'ai_assistant');

ALTER TABLE school_xx_schools DROP CONSTRAINT IF EXISTS school_xx_schools_plan_id_check;
ALTER TABLE school_xx_schools ADD CONSTRAINT school_xx_schools_plan_id_check
  CHECK (plan_id IN ('starter', 'ai_assistant'));

-- Set default for new schools
ALTER TABLE school_xx_schools ALTER COLUMN plan_id SET DEFAULT 'starter';
