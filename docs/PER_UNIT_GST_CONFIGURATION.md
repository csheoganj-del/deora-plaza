# Per-Unit GST Configuration Documentation

## Overview
This document explains the new GST configuration workflow that centralizes GST control with administrators while allowing per-dashboard customization of GST rates. This approach ensures compliance with separate GST registrations for each business unit under leased property arrangements.

## New Workflow

### 1. Administrator Control
- Only administrators (super_admin and owner roles) can enable/disable the GST system globally
- When GST is enabled, administrators can configure specific GST settings for each business unit
- Bar managers and other non-administrative roles can no longer directly modify GST settings

### 2. Per-Unit Configuration
When the administrator enables GST, they can configure specific settings for each business unit:

1. **Bar Unit**: Configure GST enablement and percentage rate for the bar dashboard
2. **Cafe Unit**: Configure GST enablement and percentage rate for the cafe dashboard
3. **Hotel Unit**: Configure GST enablement and percentage rate for the hotel dashboard
4. **Garden Unit**: Configure GST enablement and percentage rate for the garden dashboard

### 3. Implementation Details

#### Database Changes
New columns added to the `businessSettings` table:
- `barGstEnabled` (BOOLEAN) - Enable GST for bar unit
- `barGstPercentage` (NUMERIC) - GST percentage for bar unit
- `cafeGstEnabled` (BOOLEAN) - Enable GST for cafe unit
- `cafeGstPercentage` (NUMERIC) - GST percentage for cafe unit
- `hotelGstEnabled` (BOOLEAN) - Enable GST for hotel unit
- `hotelGstPercentage` (NUMERIC) - GST percentage for hotel unit
- `gardenGstEnabled` (BOOLEAN) - Enable GST for garden unit
- `gardenGstPercentage` (NUMERIC) - GST percentage for garden unit

#### UI Changes
1. **Business Settings Form**:
   - Global GST toggle is now admin-only
   - When enabled, shows per-unit configuration options
   - Each unit has its own enable toggle and percentage input

2. **Billing System**:
   - Automatically uses the appropriate GST settings based on the business unit
   - Falls back to global settings if no unit-specific settings are configured

#### Code Changes
1. **BusinessSettings Interface**: Extended to include per-unit GST fields
2. **BusinessSettingsForm Component**: Updated UI to support per-unit configuration
3. **BillGenerator Component**: Modified to use unit-specific GST settings
4. **Database Schema**: Added new columns for per-unit GST configuration

## Benefits
1. **Centralized Control**: Administrators maintain control over GST configuration
2. **Unit-Specific Rates**: Each business unit can have its own GST rate as required by separate registrations
3. **Compliance**: Meets legal requirements for separate GST reporting
4. **Flexibility**: Allows different GST configurations for different business units

## Setup Instructions
1. Run the `add-per-unit-gst-columns.sql` script to update the database schema
2. Restart the development server to refresh the schema cache
3. Log in as an administrator (super_admin or owner)
4. Navigate to Business Settings
5. Enable the GST system
6. Configure GST settings for each business unit as needed

## Usage
1. Only administrators can access GST configuration settings
2. When creating bills, the system automatically applies the appropriate GST rate based on the business unit
3. GST reports will accurately reflect the rates used for each business unit