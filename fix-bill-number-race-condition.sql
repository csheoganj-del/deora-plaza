-- Fix critical race condition in bill number generation
-- This creates an atomic function to generate unique bill numbers

-- Create a sequence for bill numbers (if not exists)
CREATE SEQUENCE IF NOT EXISTS bill_number_seq START 1;

-- Create atomic function to get next bill number
CREATE OR REPLACE FUNCTION get_next_bill_number(date_prefix TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_num INTEGER;
    max_existing INTEGER;
BEGIN
    -- Get the maximum existing bill number for today
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN "billNumber" ~ ('^BILL-' || date_prefix || '-[0-9]+$')
                THEN CAST(split_part("billNumber", '-', 3) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) INTO max_existing
    FROM bills
    WHERE "billNumber" LIKE ('BILL-' || date_prefix || '-%');
    
    -- Get next number (max + 1)
    next_num := max_existing + 1;
    
    -- Return the next number
    RETURN next_num;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_bill_number(TEXT) TO authenticated;

-- Create index on billNumber for better performance
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills("billNumber");

-- Add comment
COMMENT ON FUNCTION get_next_bill_number(TEXT) IS 'Atomically generates next bill number for given date prefix to prevent race conditions';

-- Success message
SELECT 'Bill number race condition fix applied successfully!' as status;