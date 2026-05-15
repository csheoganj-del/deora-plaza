-- Fix Missing Tables for Bill Generation
-- This script creates the missing businessSettings table and fixes the orders table

-- Create businessSettings table
CREATE TABLE IF NOT EXISTS public.businessSettings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'DEORA Restaurant',
    address TEXT NOT NULL DEFAULT 'Restaurant Address',
    mobile TEXT NOT NULL DEFAULT '1234567890',
    waiterlessMode BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default business settings
INSERT INTO public.businessSettings (id, name, address, mobile, waiterlessMode)
VALUES ('default', 'DEORA Restaurant', 'Plaza Address, City', '1234567890', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Add missing customerCount column to orders table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'customercount'
    ) THEN
        ALTER TABLE orders ADD COLUMN customerCount INTEGER DEFAULT 1;
        RAISE NOTICE 'Added customerCount column to orders table';
    ELSE
        RAISE NOTICE 'customerCount column already exists in orders table';
    END IF;
END $$;

-- Add other commonly missing columns to orders table
DO $$
BEGIN
    -- Add source column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'source'
    ) THEN
        ALTER TABLE orders ADD COLUMN source VARCHAR(50) DEFAULT 'dine-in';
        RAISE NOTICE 'Added source column to orders table';
    END IF;

    -- Add orderNumber column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'ordernumber'
    ) THEN
        ALTER TABLE orders ADD COLUMN orderNumber VARCHAR(50);
        RAISE NOTICE 'Added orderNumber column to orders table';
    END IF;

    -- Add tableNumber column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'tablenumber'
    ) THEN
        ALTER TABLE orders ADD COLUMN tableNumber VARCHAR(10);
        RAISE NOTICE 'Added tableNumber column to orders table';
    END IF;

    -- Add roomNumber column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'roomnumber'
    ) THEN
        ALTER TABLE orders ADD COLUMN roomNumber VARCHAR(10);
        RAISE NOTICE 'Added roomNumber column to orders table';
    END IF;

    -- Add billId column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'billid'
    ) THEN
        ALTER TABLE orders ADD COLUMN billId UUID REFERENCES bills(id);
        RAISE NOTICE 'Added billId column to orders table';
    END IF;

    -- Add isPaid column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'ispaid'
    ) THEN
        ALTER TABLE orders ADD COLUMN isPaid BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added isPaid column to orders table';
    END IF;

    -- Add guestCount column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'guestcount'
    ) THEN
        ALTER TABLE orders ADD COLUMN guestCount INTEGER DEFAULT 1;
        RAISE NOTICE 'Added guestCount column to orders table';
    END IF;

    -- Add timeline column if missing (for order status tracking)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'timeline'
    ) THEN
        ALTER TABLE orders ADD COLUMN timeline JSONB DEFAULT '[]';
        RAISE NOTICE 'Added timeline column to orders table';
    END IF;
END $$;

-- Add missing customerCount column to tables table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tables' AND column_name = 'customercount'
    ) THEN
        ALTER TABLE tables ADD COLUMN customerCount INTEGER DEFAULT 0;
        RAISE NOTICE 'Added customerCount column to tables table';
    ELSE
        RAISE NOTICE 'customerCount column already exists in tables table';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesssettings_id ON businessSettings(id);
CREATE INDEX IF NOT EXISTS idx_orders_billid ON orders(billId);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_ispaid ON orders(isPaid);

-- Enable Row Level Security
ALTER TABLE businessSettings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for businessSettings (allow all authenticated users to read)
DROP POLICY IF EXISTS "Allow authenticated users to read business settings" ON businessSettings;
CREATE POLICY "Allow authenticated users to read business settings"
ON businessSettings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admins to update business settings" ON businessSettings;
CREATE POLICY "Allow admins to update business settings"
ON businessSettings FOR ALL
TO authenticated
USING (true);

-- Update the businessSettings table's updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_businesssettings_updated_at ON businessSettings;
CREATE TRIGGER update_businesssettings_updated_at
    BEFORE UPDATE ON businessSettings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the tables exist
SELECT
    'businessSettings' as table_name,
    COUNT(*) as record_count
FROM businessSettings
UNION ALL
SELECT
    'orders' as table_name,
    COUNT(*) as record_count
FROM orders;

-- Show the structure of businessSettings table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'businesssettings'
ORDER BY ordinal_position;

RAISE NOTICE 'Missing tables fix completed! businessSettings table created and orders/table tables updated.';
RAISE NOTICE 'The cafe manager should now be able to generate bills successfully.';