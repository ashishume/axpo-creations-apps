-- Migration: Add business_type column to separate Shop and Factory data
-- Run this in Supabase SQL Editor to add business_type to all relevant tables

-- Add business_type column to companies (separate company profiles per mode)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to products (separate product catalogs)
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to customers (shop customers)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to suppliers (factory suppliers)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'factory' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to invoices (shop sales invoices)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to purchase_invoices (factory purchases)
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'factory' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to payments (shop payments)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to stock_movements (track per mode)
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'shop' CHECK (business_type IN ('shop', 'factory'));

-- Add business_type column to expenses (factory expenses)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'factory' CHECK (business_type IN ('shop', 'factory'));

-- Create indexes for faster filtering by business_type
CREATE INDEX IF NOT EXISTS idx_companies_business_type ON companies(business_type);
CREATE INDEX IF NOT EXISTS idx_products_business_type ON products(business_type);
CREATE INDEX IF NOT EXISTS idx_customers_business_type ON customers(business_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_type ON suppliers(business_type);
CREATE INDEX IF NOT EXISTS idx_invoices_business_type ON invoices(business_type);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_business_type ON purchase_invoices(business_type);
CREATE INDEX IF NOT EXISTS idx_payments_business_type ON payments(business_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_type ON stock_movements(business_type);
CREATE INDEX IF NOT EXISTS idx_expenses_business_type ON expenses(business_type);
