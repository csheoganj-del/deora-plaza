# Supabase Setup Instructions

This document provides step-by-step instructions for setting up your Supabase database and migrating from Firebase.

## Prerequisites

1. You should have already completed the Firebase to Supabase migration in your codebase
2. Your `.env` file should be configured with Supabase credentials

## Step 1: Verify Supabase Connection

First, let's verify that your Supabase connection is working:

```bash
npx tsx test-supabase-connection.ts
```

You should see a message confirming that the Supabase client is initialized successfully.

## Step 2: Create Database Tables

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com/project/wjqsqwitgxqypzbaayos
2. Navigate to **Database > SQL Editor** in the left sidebar
3. Copy the contents of `supabase-table-setup.sql` and paste it into the SQL editor
4. Click **Run** to execute all commands

This will create all necessary tables:
- `users` - User accounts and profiles
- `orders` - Order information
- `bills` - Billing and payment records
- `menu_items` - Menu items and pricing
- `customers` - Customer information
- `tables` - Restaurant table management
- `inventory` - Inventory tracking
- `bookings` - Hotel and event bookings
- `counters` - Counters for generating unique IDs
- `businessSettings` - Business configuration settings
- `discounts` - Discount codes and promotions
- `department_settlements` - Daily settlement records for departments

### Option 2: Using Table Editor

If you prefer to create tables manually:
1. Go to **Table Editor** in the left sidebar
2. Click **New Table** for each table
3. Use the schema defined in `supabase-table-setup.sql`

## Step 3: Verify Database Tables

After creating the tables, verify they were created successfully:

```bash
npx tsx verify-tables.ts
```

This script will check that all expected tables exist in your database.

## Step 4: Initialize Default Data

Run the master initialization script to set up all default data:

```bash
npx tsx initialize-all-data.ts
```

This script will initialize:
- Counters for generating unique IDs
- Business settings with default values
- Sample discount codes
- Sample menu items for all business units
- Restaurant tables for cafe, bar, and garden
- Sample customers
- Sample inventory items
- Bloom Cafe complete menu (67 items)
- Predefined user accounts with specific roles

Alternatively, you can run individual initialization scripts:
- `npx tsx initialize-counters.ts`
- `npx tsx initialize-business-settings.ts`
- `npx tsx initialize-menu-items.ts`
- `npx tsx initialize-tables.ts`
- `npx tsx initialize-customers.ts`
- `npx tsx initialize-inventory.ts`
- `npx tsx initialize-bloom-cafe-menu.ts` (Bloom Cafe menu only)
- `npx tsx create-predefined-users.ts`

## Predefined User Accounts

The system includes the following predefined user accounts with specific roles and access levels:

### 1. SUPER ADMIN (System Owner)
- **Username**: kalpeshdeora
- **Password**: Kalpesh!1006
- **Role**: super_admin
- **Business Unit**: all
- **Access**: Full System Access

### 2. OWNER (Business Partner)
- **Username**: business_owner
- **Password**: OwnerPass123
- **Role**: owner
- **Business Unit**: all
- **Access**: Financial View Only

### 3. CAFE & RESTAURANT TEAM
- **Cafe Manager**:
  - **Username**: cafe_manager
  - **Password**: ManageCafe123
  - **Role**: cafe_manager
  - **Business Unit**: cafe

- **Waiter 1**:
  - **Username**: waiter_rahul
  - **Password**: ServeTables123
  - **Role**: waiter
  - **Business Unit**: cafe

- **Waiter 2**:
  - **Username**: waiter_priya
  - **Password**: ServeTables123
  - **Role**: waiter
  - **Business Unit**: cafe

- **Kitchen Staff**:
  - **Username**: kitchen_chef
  - **Password**: CookFood123
  - **Role**: kitchen
  - **Business Unit**: cafe

### 4. BAR TEAM
- **Bar Manager**:
  - **Username**: bar_manager
  - **Password**: ManageBar123
  - **Role**: bar_manager
  - **Business Unit**: bar

- **Bartender**:
  - **Username**: bartender_sam
  - **Password**: ServeDrinks123
  - **Role**: bartender
  - **Business Unit**: bar

### 5. HOTEL TEAM
- **Hotel Manager**:
  - **Username**: hotel_manager
  - **Password**: ManageHotel123
  - **Role**: hotel_manager
  - **Business Unit**: hotel

- **Reception Staff**:
  - **Username**: hotel_reception
  - **Password**: CheckIn123
  - **Role**: hotel_reception
  - **Business Unit**: hotel

### 6. GARDEN TEAM
- **Garden Manager**:
  - **Username**: garden_manager
  - **Password**: ManageGarden123
  - **Role**: garden_manager
  - **Business Unit**: garden

## Step 5: Verify User Accounts

After initializing the data, verify that all user accounts were created:

```bash
npx tsx verify-users.ts
```

## Step 6: Test Login

1. Start your development server:
```bash
npm run dev
```

2. Navigate to http://localhost:3000/login
3. Log in with any of the predefined user accounts

## Security Notes

1. **Change Default Passwords**: Please change these default passwords after first login
2. **Store Securely**: Store these credentials securely
3. **Password Policies**: Consider implementing password expiration policies

## Troubleshooting

### Common Issues:

1. **"Invalid login credentials"**: Make sure the users table exists and contains the user data
2. **"Could not find table"**: Verify that all tables were created successfully
3. **"Connection refused"**: Check your Supabase URL and keys in the `.env` file

### Checking Database Connection:

You can verify your Supabase connection by running:
```bash
npx tsx test-supabase-connection.ts
```

## Next Steps

1. Configure Row Level Security policies for your specific business needs
2. Set up email templates for password reset and confirmation emails
3. Configure storage buckets if you were using Firebase Storage
4. Set up any necessary database functions or triggers
5. Test all application features to ensure proper functionality