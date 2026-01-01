-- Fix Bills Table: Add missing billNumber column and other required fields
-- This script adds the missing columns that are causing "Failed to generate bill" error

-- Add billNumber column (required for bill generation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'billnumber') THEN
        ALTER TABLE bills ADD COLUMN billNumber VARCHAR(50) UNIQUE;
        RAISE NOTICE 'Added billNumber column to bills table';
    ELSE
        RAISE NOTICE 'billNumber column already exists';
    END IF;
END $$;

-- Add orderId column (for linking bills to orders)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'orderid') THEN
        ALTER TABLE bills ADD COLUMN orderId UUID REFERENCES orders(id);
        RAISE NOTICE 'Added orderId column to bills table';
    ELSE
        RAISE NOTICE 'orderId column already exists';
    END IF;
END $$;

-- Add customerName column (if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'customername') THEN
        ALTER TABLE bills ADD COLUMN customerName VARCHAR(255);
        RAISE NOTICE 'Added customerName column to bills table';
    ELSE
        RAISE NOTICE 'customerName column already exists';
    END IF;
END $$;

-- Add discountPercent column (if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'discountpercent') THEN
        ALTER TABLE bills ADD COLUMN discountPercent DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE 'Added discountPercent column to bills table';
    ELSE
        RAISE NOTICE 'discountPercent column already exists';
    END IF;
END $$;

-- Add discountAmount column (if missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'discountamount') THEN
        ALTER TABLE bills ADD COLUMN discountAmount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added discountAmount column to bills table';
    ELSE
        RAISE NOTICE 'discountAmount column already exists';
    END IF;
END $$;

-- Add amountPaid column (for tracking partial payments)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'amountpaid') THEN
        ALTER TABLE bills ADD COLUMN amountPaid DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added amountPaid column to bills table';
    ELSE
        RAISE NOTICE 'amountPaid column already exists';
    END IF;
END $$;

-- Update paymentStatus column to have proper default
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'paymentstatus') THEN
        ALTER TABLE bills ALTER COLUMN paymentStatus SET DEFAULT 'pending';
        RAISE NOTICE 'Updated paymentStatus default value';
    END IF;
END $$;

-- Create an index on billNumber for faster lookups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bills_billnumber') THEN
        CREATE INDEX idx_bills_billnumber ON bills(billNumber);
        RAISE NOTICE 'Created index on billNumber';
    ELSE
        RAISE NOTICE 'Index on billNumber already exists';
    END IF;
END $$;

-- Create an index on orderId for faster lookups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bills_orderid') THEN
        CREATE INDEX idx_bills_orderid ON bills(orderId);
        RAISE NOTICE 'Created index on orderId';
    ELSE
        RAISE NOTICE 'Index on orderId already exists';
    END IF;
END $$;

-- Create an index on createdAt for date-based queries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bills_createdat') THEN
        CREATE INDEX idx_bills_createdat ON bills(createdAt);
        RAISE NOTICE 'Created index on createdAt';
    ELSE
        RAISE NOTICE 'Index on createdAt already exists';
    END IF;
END $$;

-- Verify the table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bills'
ORDER BY ordinal_position;

RAISE NOTICE 'Bills table fix completed! The cafe manager should now be able to generate bills.';
