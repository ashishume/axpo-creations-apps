-- Supabase Schema for Axpo Billing
-- Run this in Supabase SQL Editor to replace existing tables and add new ones.
-- Part 1: Drop existing tables (replace). Part 2: Create all tables (add/updated).

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PART 1: REPLACE — Drop existing tables (reverse dependency order)
-- Run this to clear old definitions before recreating. Safe to run if tables don't exist.
-- =============================================================================

DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS purchase_invoice_items CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
-- users references auth.users; drop only if you want to replace it
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- PART 2: ADD — Create all tables (updated definitions)
-- =============================================================================

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (product_type free-form; hsn nullable)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  hsn TEXT DEFAULT NULL,
  gst_rate NUMERIC NOT NULL DEFAULT 5,
  unit TEXT DEFAULT 'pieces',
  selling_price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('Dealer', 'Contractor', 'Retail', 'Builder')),
  phone TEXT,
  gstin TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  opening_balance NUMERIC DEFAULT 0,
  credit_days INTEGER DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  state_code TEXT,
  business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  gstin TEXT,
  address TEXT,
  state_code TEXT,
  opening_balance NUMERIC DEFAULT 0,
  credit_days INTEGER DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  business_type TEXT NOT NULL DEFAULT 'factory' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  taxable_amount NUMERIC NOT NULL DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  round_off NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  total_in_words TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'cancelled')),
  cancel_reason TEXT,
  business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  taxable_amount NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase invoices table
CREATE TABLE purchase_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  taxable_amount NUMERIC NOT NULL DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  round_off NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  total_in_words TEXT,
  status TEXT NOT NULL DEFAULT 'final' CHECK (status IN ('draft', 'final', 'cancelled')),
  business_type TEXT NOT NULL DEFAULT 'factory' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase invoice items table
CREATE TABLE purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0,
  taxable_amount NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_no TEXT NOT NULL,
  date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  mode TEXT NOT NULL CHECK (mode IN ('cash', 'cheque', 'online')),
  cheque_no TEXT,
  cheque_date DATE,
  bank_name TEXT,
  reference_no TEXT,
  business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment allocations table
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements table (includes 'purchase' type)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('opening', 'production', 'purchase', 'sale', 'adjustment')),
  reference_id UUID,
  remarks TEXT,
  business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Labour', 'Raw material', 'Fuel', 'Electricity', 'Maintenance', 'Rent', 'Other')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  business_type TEXT NOT NULL DEFAULT 'factory' CHECK (business_type IN ('shop', 'factory')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  subscription_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, price, features, limits) VALUES
  ('free', 'Free', 0, '["Up to 50 invoices/month", "Up to 10 products", "Up to 20 customers", "Basic reports"]', '{"invoicesPerMonth": 50, "productsLimit": 10, "customersLimit": 20}'),
  ('pro', 'Pro', 999, '["Unlimited invoices", "Unlimited products", "Unlimited customers", "All reports", "Priority support", "Data export"]', '{}'),
  ('enterprise', 'Enterprise', 2999, '["Everything in Pro", "Multi-user access", "Custom branding", "API access", "Dedicated support", "Custom integrations"]', '{}')
ON CONFLICT (id) DO NOTHING;

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock(product_id UUID, quantity_change INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET current_stock = current_stock + quantity_change
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Row Level Security (RLS) policies
-- =============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON purchase_invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON purchase_invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON payment_allocations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow read subscription plans" ON subscription_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Anon access for development (remove in production)
CREATE POLICY "Allow anon access" ON companies FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON products FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON customers FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON suppliers FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON invoices FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON invoice_items FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON purchase_invoices FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON purchase_invoice_items FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON payments FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON payment_allocations FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON stock_movements FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon access" ON expenses FOR ALL TO anon USING (true);
CREATE POLICY "Allow anon read subscription plans" ON subscription_plans FOR SELECT TO anon USING (true);
