-- Aggregated dashboard API: single RPC that returns all dashboard data in one call.
-- When any financial change is made (payments, expenses, salaries, etc.), the next
-- call to this RPC returns fresh data from the live tables (no separate cache).
--
-- Note: Uses SELECT * for simplicity. For very large datasets consider explicit
-- column lists or adding LIMITs and pagination (would require client changes).
--
-- Consolidated fetches (replaces 11 client calls with 1):
--  1. schools           (schools)
--  2. sessions          (sessions)
--  3. classes           (classes)
--  4. students          (students) + payments (fee_payments)
--  5. staff             (staff) + salary_payments (salary_payments)
--  6. expenses          (expenses)
--  7. stocks            (stocks) + transactions (stock_transactions)
--  8. fixedCosts        (fixed_monthly_costs)
--  9. organizations    (organizations; only for Super Admin: when current_organization_id() IS NULL)
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
    'schools', (SELECT COALESCE(jsonb_agg(to_jsonb(s)), '[]'::jsonb) FROM (SELECT * FROM schools ORDER BY name) s),
    'organizations', CASE
      WHEN auth.uid() IS NOT NULL AND current_organization_id() IS NULL
      THEN (SELECT COALESCE(jsonb_agg(to_jsonb(o)), '[]'::jsonb) FROM (SELECT * FROM organizations ORDER BY name) o)
      ELSE '[]'::jsonb
    END,
    'sessions', (SELECT COALESCE(jsonb_agg(to_jsonb(s)), '[]'::jsonb) FROM (SELECT * FROM sessions ORDER BY start_date DESC) s),
    'classes', (SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb) FROM (SELECT * FROM classes ORDER BY name) c),
    'students', (
      SELECT COALESCE(jsonb_agg(st), '[]'::jsonb)
      FROM (
        SELECT s.*,
          (SELECT COALESCE(jsonb_agg(fp ORDER BY fp.date), '[]'::jsonb) FROM fee_payments fp WHERE fp.student_id = s.id) AS payments
        FROM students s ORDER BY s.name
      ) st
    ),
    'staff', (
      SELECT COALESCE(jsonb_agg(st), '[]'::jsonb)
      FROM (
        SELECT s.*,
          (SELECT COALESCE(jsonb_agg(sp ORDER BY sp.month), '[]'::jsonb) FROM salary_payments sp WHERE sp.staff_id = s.id) AS salary_payments
        FROM staff s ORDER BY s.name
      ) st
    ),
    'expenses', (SELECT COALESCE(jsonb_agg(to_jsonb(e)), '[]'::jsonb) FROM (SELECT * FROM expenses ORDER BY date DESC) e),
    'stocks', (
      SELECT COALESCE(jsonb_agg(st), '[]'::jsonb)
      FROM (
        SELECT s.*,
          (SELECT COALESCE(jsonb_agg(t ORDER BY t.date), '[]'::jsonb) FROM stock_transactions t WHERE t.stock_id = s.id) AS transactions
        FROM stocks s ORDER BY s.purchase_date DESC
      ) st
    ),
    'fixedCosts', (SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb) FROM (SELECT * FROM fixed_monthly_costs ORDER BY name) f)
  ) INTO result;
  RETURN result;
END;
$$;

-- Allow same roles that can read tables to call the RPC
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data() TO anon;

COMMENT ON FUNCTION get_dashboard_data() IS 'Returns all dashboard data (schools, sessions, classes, students+payments, staff+salary_payments, expenses, stocks+transactions, fixedCosts) in one call. Data is always live; refetch after any mutation to see updates.';
