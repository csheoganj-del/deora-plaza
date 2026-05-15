-- Simple fix to add billNumber column to bills table
-- This is the minimal fix needed to resolve "Failed to generate bill" error

ALTER TABLE bills ADD COLUMN billNumber VARCHAR(50) UNIQUE;

-- Create index for better performance
CREATE INDEX idx_bills_billnumber ON bills(billNumber);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bills' AND column_name = 'billNumber';
