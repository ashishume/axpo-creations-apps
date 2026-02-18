-- =============================================================================
-- Billing schema: full SQL to create all tables from scratch (backend-compatible)
-- Run in Supabase SQL Editor or any Postgres client. Order respects foreign keys.
-- For a fresh DB: run as-is. If tables exist, drop them first (see bottom).
-- =============================================================================

-- UUID generation (Postgres 13+ has gen_random_uuid(); older PG: CREATE EXTENSION pgcrypto;)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Companies
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  gstin TEXT,
  pan TEXT,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  logo_path TEXT,
  financial_year_start INTEGER NOT NULL DEFAULT 2024,
  state_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_type VARCHAR(50) NOT NULL,
  hsn TEXT DEFAULT '6904',
  gst_rate NUMERIC NOT NULL DEFAULT 5,
  unit TEXT DEFAULT 'pieces',
  selling_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC,
  current_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT products_product_type_check CHECK (product_type IN (
    'Red Clay Bricks', 'Fly Ash Bricks', 'Wire Cut Bricks', 'Concrete Blocks'
  ))
);

-- -----------------------------------------------------------------------------
-- Customers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer_type VARCHAR(50) NOT NULL,
  phone TEXT,
  gstin TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  credit_days INTEGER NOT NULL DEFAULT 0,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  state_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT customers_customer_type_check CHECK (customer_type IN (
    'Dealer', 'Contractor', 'Retail', 'Builder'
  ))
);

-- -----------------------------------------------------------------------------
-- Users (local auth; backend sets HTTP-only cookies)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  subscription_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);

-- -----------------------------------------------------------------------------
-- Subscription plans
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------------------------
-- Invoices (depends: customers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC,
  taxable_amount NUMERIC NOT NULL DEFAULT 0,
  cgst_amount NUMERIC,
  sgst_amount NUMERIC,
  igst_amount NUMERIC,
  round_off NUMERIC,
  total NUMERIC NOT NULL DEFAULT 0,
  total_in_words TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'final', 'cancelled'))
);
CREATE UNIQUE INDEX IF NOT EXISTS invoices_number_key ON invoices (number);

-- -----------------------------------------------------------------------------
-- Invoice items (depends: invoices, products)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC,
  discount NUMERIC,
  line_total NUMERIC NOT NULL DEFAULT 0,
  taxable_amount NUMERIC,
  gst_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------------------------
-- Payments (depends: customers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT NOT NULL,
  date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  mode VARCHAR(20) NOT NULL,
  cheque_no TEXT,
  cheque_date DATE,
  bank_name TEXT,
  reference_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT payments_mode_check CHECK (mode IN ('cash', 'cheque', 'online'))
);

-- -----------------------------------------------------------------------------
-- Payment allocations (depends: payments, invoices)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

-- -----------------------------------------------------------------------------
-- Expenses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT expenses_category_check CHECK (category IN (
    'Labour', 'Raw material', 'Fuel', 'Electricity', 'Maintenance', 'Rent', 'Other'
  ))
);

-- -----------------------------------------------------------------------------
-- Stock movements (depends: products)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  reference_id UUID,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT stock_movements_type_check CHECK (type IN (
    'opening', 'production', 'sale', 'adjustment'
  ))
);

-- -----------------------------------------------------------------------------
-- User subscriptions (depends: users, subscription_plans)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT user_subscriptions_status_check CHECK (status IN (
    'active', 'cancelled', 'expired'
  ))
);

-- -----------------------------------------------------------------------------
-- Optional: seed default subscription plans
-- -----------------------------------------------------------------------------
INSERT INTO subscription_plans (id, name, price, features, limits) VALUES
  ('free', 'Free', 0,
   '["Up to 50 invoices/month", "Up to 10 products", "Up to 20 customers", "Basic reports"]'::jsonb,
   '{"invoicesPerMonth": 50, "productsLimit": 10, "customersLimit": 20}'::jsonb),
  ('pro', 'Pro', 999,
   '["Unlimited invoices", "Unlimited products", "Unlimited customers", "All reports", "Priority support", "Data export"]'::jsonb,
   '{}'::jsonb),
  ('enterprise', 'Enterprise', 2999,
   '["Everything in Pro", "Multi-user access", "Custom branding", "API access", "Dedicated support", "Custom integrations"]'::jsonb,
   '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- To recreate from scratch (destructive): uncomment and run before the above.
-- =============================================================================
/*
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
*/
