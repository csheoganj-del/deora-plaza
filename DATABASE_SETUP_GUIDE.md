# Database Setup Guide for DEORA POS System

## Overview

This guide will help you fix the database schema issues in your DEORA POS system, including the "[object Object]" error and missing "completedAt" column error.

## The Problem

The application was showing errors like:
- `Could not find the 'completedAt' column of 'orders' in the schema cache`
- Error messages displaying `[object Object]` instead of meaningful messages
- Missing database tables and columns that the application expects

## What We Fixed

1. **Error Message Display**: Fixed JavaScript error handling to show proper error messages instead of `[object Object]`
2. **Database Schema**: Added all missing columns to the `orders` table and other required tables
3. **Complete Database Setup**: Created all necessary tables that the application requires

## Database Tables Created/Fixed

### Core Tables
- `users` - User authentication and management
- `orders` - Order management with timeline tracking (FIXED with missing columns)
- `bills` - Billing and payment processing
- `menu_items` - Product catalog
- `customers` - Customer management and loyalty
- `tables` - Restaurant table management
- `rooms` - Hotel room management
- `bookings` - Hotel and event bookings
- `inventory` - Stock management

### Supporting Tables
- `businessSettings` - System configuration
- `counters` - Sequential number generation
- `discounts` - Discount management
- `notifications` - System notifications (NEWLY ADDED)
- `settlements` - Daily cash reconciliation (NEWLY ADDED)
- `department_settlements` - Legacy settlement support
- `transactions` - Financial transaction tracking (NEWLY ADDED)
- `audit_logs` - Security and compliance tracking (NEWLY ADDED)
- `statistics` - Performance analytics (NEWLY ADDED)

## Quick Fix (Recommended)

### Option 1: Automatic Script (Easiest)

1. **For Windows users:**
   ```bash
   # Double-click the batch file
   fix-database.bat
   ```

2. **For Linux/Mac users:**
   ```bash
   # Make executable and run
   chmod +x fix-database.sh
   ./fix-database.sh
   ```

3. **Manual Node.js execution:**
   ```bash
   node run-database-fix.js
   ```

### Option 2: Direct SQL in Supabase (Manual)

1. Go to your Supabase project dashboard
2. Navigate to **Database → SQL Editor**
3. Copy and paste the content from `complete-database-schema.sql`
4. Click **Run**

## Prerequisites

Before running the fix, ensure you have:

1. **Environment Variables**: Create a `.env` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Node.js Dependencies**: Install required packages:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

3. **Supabase Access**: Make sure you have admin access to your Supabase project

## What the Fix Script Does

### 1. Database Schema Creation
- Creates all missing tables with proper structure
- Adds missing columns to existing tables (especially `orders`)
- Sets up proper data types and constraints

### 2. Missing Columns Added to Orders Table
- `orderNumber` - Unique order identifier
- `tableNumber` - Table reference for dine-in orders
- `roomNumber` - Room reference for hotel orders
- `source` - Order source (pos, online, etc.)
- `totalAmount` - Order total amount
- `isPaid` - Payment status flag
- `guestCount` - Number of guests
- `settlementStatus` - For daily reconciliation
- `pendingAt`, `preparingAt`, `readyAt`, `servedAt`, `completedAt` - Timeline tracking
- `timeline` - JSON timeline of order status changes
- `billId`, `bookingId` - Reference links
- `paymentSyncedAt`, `paymentReceipt` - Payment tracking

### 3. Data Migration
- Updates existing orders with proper order numbers
- Sets timeline data for existing orders
- Migrates existing data to new structure

### 4. Performance Optimization
- Creates database indexes for better query performance
- Adds proper constraints for data integrity
- Enables Row Level Security (RLS)

### 5. Initial Configuration
- Sets up basic business settings
- Initializes counter tables for number generation
- Creates default configuration values

## Verification

After running the fix, you can verify success by:

1. **Check Tables**: In Supabase SQL Editor, run:
   ```sql
   SELECT table_name, 
          (SELECT count(*) FROM information_schema.columns 
           WHERE table_name = t.table_name AND table_schema = 'public') as column_count
   FROM information_schema.tables t
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

2. **Check Orders Table**: Verify the orders table has all required columns:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'orders' AND table_schema = 'public'
   ORDER BY ordinal_position;
   ```

3. **Test Application**: Start your application and try placing an order:
   ```bash
   npm run dev
   ```

## Expected Results

After the fix:
- ✅ No more "completedAt column not found" errors
- ✅ Proper error messages instead of "[object Object]"
- ✅ All order functionality working correctly
- ✅ Timeline tracking for orders
- ✅ Better performance with proper indexes
- ✅ Full audit trail capabilities
- ✅ Settlement and reconciliation features

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)
   - Check that RLS policies allow your operations

2. **Environment Variables Not Found**
   ```bash
   # Make sure .env file is in the project root
   # Check variables are correctly named:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-key
   ```

3. **Node.js Module Errors**
   ```bash
   # Reinstall dependencies
   npm install @supabase/supabase-js dotenv
   ```

4. **SQL Execution Errors**
   - Some constraints may already exist (this is normal)
   - Check Supabase logs for specific error details

### Manual Column Addition (If Script Fails)

If the automatic script fails, you can add the missing columns manually:

```sql
-- Add missing columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "timeline" JSONB DEFAULT '[]'::jsonb;

-- Update existing data
UPDATE public.orders
SET "orderNumber" = 'ORD-' || EXTRACT(EPOCH FROM "createdAt")::bigint::text
WHERE "orderNumber" IS NULL;
```

## Files Included

- `complete-database-schema.sql` - Complete database schema
- `run-database-fix.js` - Automated fix script
- `fix-database.bat` - Windows batch file
- `fix-database.sh` - Linux/Mac shell script
- `fix-orders-table-columns.sql` - Orders table specific fixes

## Security Notes

- The fix enables Row Level Security (RLS) on all tables
- Audit logging is implemented for compliance
- Service role key is used only for setup (store securely)
- All financial operations are tracked in audit logs

## Next Steps After Fix

1. **Create Admin User**: Set up your first admin user
2. **Configure Business**: Update business settings (name, address, etc.)
3. **Add Menu Items**: Set up your restaurant/cafe menu
4. **Create Tables/Rooms**: Configure your physical tables and rooms
5. **Test Orders**: Place test orders to verify everything works

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your Supabase connection and permissions
3. Ensure all environment variables are correctly set
4. Check Supabase project logs for detailed error information

The database fix resolves all known schema issues and prepares your system for production use.