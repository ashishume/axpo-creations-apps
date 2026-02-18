-- Aggregated dashboard API: single RPC that returns all dashboard data in one call.
-- When any financial change is made (payments, expenses, salaries, etc.), the next
-- call to this RPC returns fresh data from the live tables (no separate cache).
--
-- Consolidated fetches (replaces 11 client calls with 1):
--  1. schools           (school_xx_schools)
--  2. sessions          (school_xx_sessions)
--  3. classes           (school_xx_classes)
--  4. students          (school_xx_students) + payments (school_xx_fee_payments)
--  5. staff             (school_xx_staff) + salary_payments (school_xx_salary_payments)
--  6. expenses          (school_xx_expenses)
--  7. stocks            (school_xx_stocks) + transactions (school_xx_stock_transactions)
--  8. fixedCosts        (school_xx_fixed_monthly_costs)
--  9. organizations    (school_xx_organizations; only for Super Admin: when school_xx_current_organization_id() IS NULL)
-- No remaining fetch calls; refetchAll uses only the above.

CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'schools', (SELECT COALESCE(jsonb_agg(to_jsonb(s)), '[]'::jsonb) FROM (SELECT * FROM school_xx_schools ORDER BY name) s),
    'organizations', CASE
      WHEN auth.uid() IS NOT NULL AND school_xx_current_organization_id() IS NULL
      THEN (SELECT COALESCE(jsonb_agg(to_jsonb(o)), '[]'::jsonb) FROM (SELECT * FROM school_xx_organizations ORDER BY name) o)
      ELSE '[]'::jsonb
    END,
    'sessions', (SELECT COALESCE(jsonb_agg(to_jsonb(s)), '[]'::jsonb) FROM (SELECT * FROM school_xx_sessions ORDER BY start_date DESC) s),
    'classes', (SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb) FROM (SELECT * FROM school_xx_classes ORDER BY name) c),
    'students', (
      SELECT COALESCE(jsonb_agg(st), '[]'::jsonb)
      FROM (
        SELECT s.*,
          (SELECT COALESCE(jsonb_agg(fp ORDER BY fp.date), '[]'::jsonb) FROM school_xx_fee_payments fp WHERE fp.student_id = s.id) AS payments
        FROM school_xx_students s ORDER BY s.name
      ) st
    ),
    'staff', (
      SELECT COALESCE(jsonb_agg(st), '[]'::jsonb)
      FROM (
        SELECT s.*,
          (SELECT COALESCE(jsonb_agg(sp ORDER BY sp.month), '[]'::jsonb) FROM school_xx_salary_payments sp WHERE sp.staff_id = s.id) AS salary_payments
        FROM school_xx_staff s ORDER BY s.name
      ) st
    ),
    'expenses', (SELECT COALESCE(jsonb_agg(to_jsonb(e)), '[]'::jsonb) FROM (SELECT * FROM school_xx_expenses ORDER BY date DESC) e),
    'stocks', (
      SELECT COALESCE(jsonb_agg(st), '[]'::jsonb)
      FROM (
        SELECT s.*,
          (SELECT COALESCE(jsonb_agg(t ORDER BY t.date), '[]'::jsonb) FROM school_xx_stock_transactions t WHERE t.stock_id = s.id) AS transactions
        FROM school_xx_stocks s ORDER BY s.purchase_date DESC
      ) st
    ),
    'fixedCosts', (SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb) FROM (SELECT * FROM school_xx_fixed_monthly_costs ORDER BY name) f)
  ) INTO result;
  RETURN result;
END;
$$;

-- Allow same roles that can read tables to call the RPC
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO anon;

COMMENT ON FUNCTION get_dashboard_data() IS 'Returns all dashboard data (schools, sessions, classes, students+payments, staff+salary_payments, expenses, stocks+transactions, fixedCosts) in one call. Data is always live; refetch after any mutation to see updates.';
