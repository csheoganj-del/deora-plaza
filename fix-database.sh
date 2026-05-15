#!/bin/bash

echo "========================================"
echo "Database Schema Fix for DEORA"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Please make sure you have a .env file with your Supabase credentials"
    echo "Required variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found"
    echo "Please run this script from the DEORA project root directory"
    exit 1
fi

echo "Checking for required dependencies..."

# Check if @supabase/supabase-js is installed
if ! node -e "require('@supabase/supabase-js')" 2>/dev/null; then
    echo "Installing @supabase/supabase-js..."
    npm install @supabase/supabase-js
fi

# Check if dotenv is installed
if ! node -e "require('dotenv')" 2>/dev/null; then
    echo "Installing dotenv..."
    npm install dotenv
fi

echo ""
echo "Running database schema fix..."
echo "This will:"
echo "  1. Add missing columns to the orders table"
echo "  2. Create necessary indexes"
echo "  3. Update existing data"
echo "  4. Add constraints"
echo "  5. Create notifications table if needed"
echo ""

read -p "Press Enter to continue..."

# Run the database fix script
node run-database-fix.js

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Database fix failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi

echo ""
echo "========================================"
echo "Database fix completed successfully!"
echo "========================================"
echo ""
echo "Your DEORA application should now work without the"
echo '"completedAt column not found" error.'
echo ""
echo "You can now start your application with:"
echo "  npm run dev"
echo ""
