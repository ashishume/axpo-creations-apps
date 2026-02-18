-- Run this in Supabase SQL Editor to create the get_store_data RPC.
-- This fetches all store data in one round-trip (respects RLS).

CREATE OR REPLACE FUNCTION get_store_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company', (SELECT to_jsonb(c) FROM companies c LIMIT 1),
    'products', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM products p), '[]'::jsonb),
    'customers', COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.created_at DESC) FROM customers c), '[]'::jsonb),
    'invoices', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.created_at DESC) FROM invoices i), '[]'::jsonb),
    'invoice_items', COALESCE((SELECT jsonb_agg(to_jsonb(ii)) FROM invoice_items ii), '[]'::jsonb),
    'payments', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM payments p), '[]'::jsonb),
    'payment_allocations', COALESCE((SELECT jsonb_agg(to_jsonb(pa)) FROM payment_allocations pa), '[]'::jsonb),
    'stock_movements', COALESCE((SELECT jsonb_agg(to_jsonb(sm) ORDER BY sm.created_at DESC) FROM stock_movements sm), '[]'::jsonb),
    'expenses', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC) FROM expenses e), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

-- Grant execute to authenticated and anon (adjust as per your RLS)
GRANT EXECUTE ON FUNCTION get_store_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_store_data() TO anon;
