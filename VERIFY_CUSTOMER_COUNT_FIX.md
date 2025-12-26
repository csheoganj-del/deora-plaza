# Customer Count Column Fix Verification

## Problem
When attempting to create a new table in the bar manager dashboard, users encountered the error: "Could not find the 'customerCount' column of 'tables' in the schema cache". This error prevented successful table creation.

## Root Cause
The `customerCount` column was referenced in the application code but was missing from the `tables` table schema in the database. This inconsistency caused the schema cache to fail when trying to validate queries involving this column.

## Solution
Added the missing `customerCount` column to the `tables` table schema in all relevant database setup and maintenance scripts:

1. **supabase-table-setup.sql** - Main database setup script
2. **setup-complete-database.ts** - TypeScript database setup script
3. **run-database-fix.js** - Database fix script
4. **complete-database-schema.sql** - Complete schema definition
5. **fix-missing-tables.sql** - Script to fix missing tables/columns

Additionally, a standalone script `add-customer-count-column.sql` was created to add the column to existing databases.

## Files Modified

1. `supabase-table-setup.sql` - Added `customerCount INTEGER DEFAULT 0` column
2. `setup-complete-database.ts` - Added `customerCount INTEGER DEFAULT 0` column
3. `run-database-fix.js` - Updated `currentGuestCount` to `customerCount`
4. `complete-database-schema.sql` - Updated `currentGuestCount` to `customerCount`
5. `fix-missing-tables.sql` - Added section to add `customerCount` column if missing
6. `add-customer-count-column.sql` - Standalone script to add the column

## How to Apply the Fix

### Option 1: Run the standalone fix script
Execute `add-customer-count-column.sql` in your Supabase SQL editor:

```sql
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
```

### Option 2: Recreate the database schema
Run the complete database setup scripts to ensure all tables have the correct schema.

## Verification

After applying the fix:

1. The "Could not find the 'customerCount' column of 'tables' in the schema cache" error should no longer occur
2. Table creation in the bar manager dashboard should work correctly
3. The `customerCount` column should be visible in the `tables` table schema
4. All existing functionality related to table management should continue to work

## Expected Behavior After Fix

### Before Fix:
```
Error: Could not find the 'customerCount' column of 'tables' in the schema cache
```

### After Fix:
```
✅ Table created successfully
```

## Technical Details

The `customerCount` column is used to track the number of guests at a table, which is displayed in the UI and used for table management operations. Adding this column with a default value of 0 ensures backward compatibility with existing data.