-- Migration: Add authentication columns to users table
-- This adds the columns needed for the custom authentication system

-- Add authMethod column (password or phone)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "authMethod" TEXT DEFAULT 'password';

-- Add password column for password-based authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Update database validation - you'll need to manually update:
-- src/lib/database-validation.ts to include 'authMethod' and 'password' in the users array

-- After running this migration, you can run create_admin_user.sql
