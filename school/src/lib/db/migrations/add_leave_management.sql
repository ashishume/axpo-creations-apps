-- ============================================
-- Leave Management: leave types, balances, requests
-- ============================================

-- 1. Leave types configuration (per session)
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  applicable_to VARCHAR(10) NOT NULL CHECK (applicable_to IN ('staff', 'student', 'both')),
  max_days_per_year INTEGER,
  requires_document BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_types_session ON leave_types(session_id);

-- 2. Leave balance for staff
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year VARCHAR(10) NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_staff ON leave_balances(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_leave_type ON leave_balances(leave_type_id);

-- 3. Leave requests (staff and students)
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE SET NULL,
  applicant_type VARCHAR(10) NOT NULL CHECK (applicant_type IN ('staff', 'student')),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (staff_id IS NOT NULL OR student_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_session ON leave_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type ON leave_requests(leave_type_id);

-- 4. Add leave permissions to permissions table (if not exists)
INSERT INTO permissions (id, module, action, description) VALUES
  ('leaves:view', 'leaves', 'view', 'View leave requests and types'),
  ('leaves:create', 'leaves', 'create', 'Apply for leave'),
  ('leaves:approve', 'leaves', 'approve', 'Approve or reject leave requests'),
  ('leaves:manage', 'leaves', 'manage', 'Manage leave types and balances')
ON CONFLICT (id) DO NOTHING;

-- 5. Grant leave permissions to Admin role (id: 00000000-0000-0000-0000-000000000001)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'leaves:view'),
  ('00000000-0000-0000-0000-000000000001', 'leaves:create'),
  ('00000000-0000-0000-0000-000000000001', 'leaves:approve'),
  ('00000000-0000-0000-0000-000000000001', 'leaves:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;
