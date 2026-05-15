@echo off
echo ========================================
echo Database Schema Fix for DEORA
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please make sure you have a .env file with your Supabase credentials
    echo Required variables:
    echo   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    echo   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the DEORA project root directory
    pause
    exit /b 1
)

echo Checking for required dependencies...

REM Check if @supabase/supabase-js is installed
node -e "require('@supabase/supabase-js')" 2>nul
if errorlevel 1 (
    echo Installing @supabase/supabase-js...
    npm install @supabase/supabase-js
)

REM Check if dotenv is installed
node -e "require('dotenv')" 2>nul
if errorlevel 1 (
    echo Installing dotenv...
    npm install dotenv
)

echo.
echo Running simplified database schema analysis...
echo This will:
echo   1. Check current database structure
echo   2. Identify missing columns in orders table
echo   3. Provide SQL commands to run manually
echo   4. Check for missing tables
echo.

pause

REM Run the simplified database check script
node simplified-database-fix.js

if errorlevel 1 (
    echo.
    echo ERROR: Database check failed!
    echo.
    echo MANUAL ALTERNATIVE:
    echo 1. Open Supabase Dashboard
    echo 2. Go to Database - SQL Editor
    echo 3. Copy and paste content from 'complete-database-schema.sql'
    echo 4. Click Run
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database analysis completed!
echo ========================================
echo.
echo Please follow the SQL commands shown above to complete the setup.
echo After running the SQL commands, start your app with:
echo   npm run dev
echo.
pause
