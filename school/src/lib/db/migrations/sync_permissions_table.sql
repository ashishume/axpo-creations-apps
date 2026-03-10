-- ============================================
-- Migration: Sync school_xx_permissions only
-- ============================================
-- Run this to ensure all permission rows exist.
-- Does NOT touch school_xx_role_permissions or any other table.
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================

INSERT INTO school_xx_permissions (id, module, action, description) VALUES
  ('dashboard:view', 'dashboard', 'view', 'View dashboard'),
  ('students:view', 'students', 'view', 'View students'),
  ('students:create', 'students', 'create', 'Create students'),
  ('students:edit', 'students', 'edit', 'Edit students'),
  ('students:delete', 'students', 'delete', 'Delete students'),
  ('staff:view', 'staff', 'view', 'View staff'),
  ('staff:create', 'staff', 'create', 'Create staff'),
  ('staff:edit', 'staff', 'edit', 'Edit staff'),
  ('staff:delete', 'staff', 'delete', 'Delete staff'),
  ('salary:manage', 'salary', 'manage', 'Manage salary payments, leaves, and attendance data'),
  ('expenses:view', 'expenses', 'view', 'View expenses'),
  ('expenses:create', 'expenses', 'create', 'Create expenses'),
  ('expenses:edit', 'expenses', 'edit', 'Edit expenses'),
  ('expenses:delete', 'expenses', 'delete', 'Delete expenses'),
  ('stocks:view', 'stocks', 'view', 'View stocks'),
  ('stocks:create', 'stocks', 'create', 'Create stocks'),
  ('stocks:edit', 'stocks', 'edit', 'Edit stocks'),
  ('stocks:delete', 'stocks', 'delete', 'Delete stocks'),
  ('reports:view', 'reports', 'view', 'View reports'),
  ('settings:view', 'settings', 'view', 'View settings'),
  ('settings:edit', 'settings', 'edit', 'Edit settings'),
  ('users:view', 'users', 'view', 'View users'),
  ('users:create', 'users', 'create', 'Create users'),
  ('users:edit', 'users', 'edit', 'Edit users'),
  ('users:delete', 'users', 'delete', 'Delete users'),
  ('roles:manage', 'roles', 'manage', 'Manage roles and permissions'),
  ('schools:view', 'schools', 'view', 'View schools'),
  ('schools:create', 'schools', 'create', 'Create schools (Super Admin only)'),
  ('schools:edit', 'schools', 'edit', 'Edit schools'),
  ('schools:delete', 'schools', 'delete', 'Delete schools'),
  ('sessions:create', 'sessions', 'create', 'Create sessions (school admins)'),
  ('app:lock', 'app', 'lock', 'Lock/unlock school for all users (Super Admin only)'),
  ('plans:manage', 'plans', 'manage', 'Change subscription plan for a school (Super Admin only)'),
  ('assistant:use', 'assistant', 'use', 'Use Axpo Assistant (AI chat) - premium, admin only'),
  ('leaves:view', 'leaves', 'view', 'View leave requests and types'),
  ('leaves:create', 'leaves', 'create', 'Apply for leave'),
  ('leaves:approve', 'leaves', 'approve', 'Approve or reject leave requests'),
  ('leaves:manage', 'leaves', 'manage', 'Manage leave types and balances')
ON CONFLICT (id) DO NOTHING;
