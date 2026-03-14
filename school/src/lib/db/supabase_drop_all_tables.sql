-- =============================================================================
-- School Management – Drop all app tables and objects
-- =============================================================================
-- Run this in Supabase SQL Editor to remove all tables, triggers, and functions
-- created by supabase_full_schema_with_rls.sql. Use when you want to reset the
-- schema (e.g. before re-running the full schema script).
-- =============================================================================

-- ============================================
-- 1. DROP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS calculate_salary_late_days ON salary_payments;
DROP TRIGGER IF EXISTS assistant_chat_set_org_trigger ON assistant_chat_messages;
DROP TRIGGER IF EXISTS update_stock_transactions_updated_at ON stock_transactions;
DROP TRIGGER IF EXISTS update_stocks_updated_at ON stocks;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_salary_payments_updated_at ON salary_payments;
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
DROP TRIGGER IF EXISTS update_fee_payments_updated_at ON fee_payments;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_fixed_monthly_costs_updated_at ON fixed_monthly_costs;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_student_enrollments_updated_at ON student_enrollments;
DROP TRIGGER IF EXISTS update_leave_types_updated_at ON leave_types;
DROP TRIGGER IF EXISTS update_leave_balances_updated_at ON leave_balances;
DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;

-- ============================================
-- 2. DROP TABLES (reverse dependency order)
-- ============================================

DROP TABLE IF EXISTS coupon_redemptions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS premium_coupons CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS fixed_monthly_costs CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS student_enrollments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS assistant_chat_messages CASCADE;

-- ============================================
-- 3. DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS assistant_chat_set_org();
DROP FUNCTION IF EXISTS calculate_salary_late_days();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS current_organization_id();

-- =============================================================================
SELECT 'All app tables and objects dropped.' AS status;
