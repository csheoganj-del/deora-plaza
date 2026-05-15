-- Migration: Add running_orders table for persistent table order management
-- This allows tables to maintain their orders until final bill is generated

CREATE TABLE IF NOT EXISTS running_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  business_unit TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  gst_percent DECIMAL(5, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  customer_name TEXT,
  customer_mobile TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'billed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster table lookups
CREATE INDEX IF NOT EXISTS idx_running_orders_table_id ON running_orders(table_id);
CREATE INDEX IF NOT EXISTS idx_running_orders_status ON running_orders(status);

-- Add unique constraint: only one active running order per table
CREATE UNIQUE INDEX IF NOT EXISTS idx_running_orders_active_table 
ON running_orders(table_id) 
WHERE status = 'active';

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_running_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_running_orders_updated_at
BEFORE UPDATE ON running_orders
FOR EACH ROW
EXECUTE FUNCTION update_running_orders_updated_at();

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'running_orders'
ORDER BY ordinal_position;
