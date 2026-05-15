# Per-Unit Waiterless Mode Configuration - Feature Documentation

## Overview

The **Per-Unit Waiterless Mode Configuration** implements a centralized administration system where only administrators can enable or disable waiterless mode at the system level. When enabled, administrators can selectively activate waiterless mode for specific business units (dashboards), providing granular control over this functionality.

This approach centralizes waiterless mode control with administrators while allowing per-dashboard activation, ensuring that managers cannot toggle waiterless mode themselves but can use the feature when enabled for their specific dashboard by an administrator.

## Key Features

### 1. **Centralized Administrative Control**
- Only administrators (`super_admin`, `owner`) can enable/disable the global waiterless system
- Managers (`cafe_manager`, `bar_manager`, etc.) cannot modify waiterless mode settings
- Provides enterprise-level control over business workflows

### 2. **Per-Dashboard Activation**
- When global waiterless mode is enabled, administrators can select specific business units
- Each unit (bar, cafe, hotel, garden) can be independently configured
- Managers only see waiterless mode functionality when enabled for their unit

### 3. **Role-Based Access Control**
- Administrators: Full access to all waiterless mode settings
- Managers: View-only access to waiterless mode status for their unit
- Other users: No access to waiterless mode configuration

### 4. **Backward Compatibility**
- Existing global waiterless mode setting preserved as fallback
- Systems without per-unit configuration continue to work normally
- Smooth transition from global to per-unit configuration

## How It Works

### Administrator Workflow
1. **Enable Global System**
   - Navigate to **Dashboard** → **Business Settings**
   - Toggle **"Enable Waiterless System"** ON
   - Save settings

2. **Configure Per-Unit Settings**
   - Once global system is enabled, per-dashboard configuration section appears
   - Select which business units should operate in waiterless mode:
     - Bar Unit Waiterless Mode
     - Cafe Unit Waiterless Mode
     - Hotel Unit Waiterless Mode
     - Garden Unit Waiterless Mode
   - Save configuration

### Manager Workflow
1. **Access Dashboard**
   - Log in with manager credentials (`cafe_manager`, `bar_manager`, etc.)
   - Navigate to their specific dashboard

2. **Use Waiterless Mode**
   - When waiterless mode is enabled for their unit by an administrator:
     - "Manager Mode" badge appears in order dialogs
     - Customer panel is automatically shown
     - Direct billing without kitchen/waiter flow is available
   - When waiterless mode is disabled for their unit:
     - Standard workflow continues
     - No waiterless mode indicators or functionality

## Technical Implementation

### Modified Components

#### 1. **BusinessSettings Interface** (`src/actions/businessSettings.ts`)
Added per-unit waiterless mode fields:
```typescript
interface BusinessSettings {
  // ... existing fields
  waiterlessMode?: boolean;        // Global setting (backward compatibility)
  barWaiterlessMode?: boolean;     // Bar unit specific
  cafeWaiterlessMode?: boolean;    // Cafe unit specific
  hotelWaiterlessMode?: boolean;   // Hotel unit specific
  gardenWaiterlessMode?: boolean;  // Garden unit specific
  // ... other fields
}
```

#### 2. **BusinessSettingsForm Component** (`src/components/dashboard/BusinessSettingsForm.tsx`)
- Restructured waiterless mode configuration UI
- Made global waiterless toggle admin-only
- Added per-unit configuration when global waiterless is enabled
- Each unit has its own enable toggle

#### 3. **DineInOrderDialog Component** (`src/components/orders/DineInOrderDialog.tsx`)
- Modified waiterless mode detection logic
- Now checks unit-specific settings based on business unit
- Falls back to global setting if unit-specific setting not configured

### Database Schema Changes

#### New Columns in `businessSettings` Table
```sql
-- Per-unit waiterless mode settings
"barWaiterlessMode" BOOLEAN DEFAULT false,
"cafeWaiterlessMode" BOOLEAN DEFAULT false,
"hotelWaiterlessMode" BOOLEAN DEFAULT false,
"gardenWaiterlessMode" BOOLEAN DEFAULT false,
```

#### Migration Script
The `add-per-unit-waiterless-columns.sql` script adds the required columns to existing installations.

### Data Flow

1. **Configuration**
   - Administrator enables global waiterless mode
   - Administrator selects specific units for waiterless activation
   - Settings saved to `businessSettings` table

2. **Detection**
   - Order dialog loads business settings on opening
   - Checks unit-specific waiterless mode setting based on business unit
   - Falls back to global setting if unit-specific not found
   - Only enables waiterless mode if user has manager role

3. **Activation**
   - When waiterless mode is active for unit:
     - "Manager Mode" badge displayed
     - Customer panel automatically shown
     - Direct billing workflow enabled
   - When inactive:
     - Standard workflow continues
     - No waiterless mode indicators

## Benefits

1. **Centralized Control** - Administrators maintain oversight of business workflows
2. **Granular Configuration** - Different units can have different modes
3. **Security** - Managers cannot modify system-level settings
4. **Flexibility** - Mix of waiterless and standard operations across units
5. **Compliance** - Controlled rollout of features across organization
6. **Scalability** - Supports multi-location businesses with varied needs

## Configuration

Business settings document structure:
```typescript
{
  name: string,
  address: string,
  mobile: string,
  waiterlessMode: boolean,           // Global waiterless mode toggle
  barWaiterlessMode: boolean,        // Bar unit waiterless setting
  cafeWaiterlessMode: boolean,       // Cafe unit waiterless setting
  hotelWaiterlessMode: boolean,      // Hotel unit waiterless setting
  gardenWaiterlessMode: boolean,     // Garden unit waiterless setting
  enablePasswordProtection: boolean, // Admin-only control for password protection
  gstEnabled: boolean,               // Enable GST calculations
  gstPercentage: number              // Default GST percentage for billing
}
```

## Version History

- **v1.0** (Dec 2025) - Initial implementation
  - Centralized administrative control for waiterless mode
  - Per-unit waiterless mode configuration
  - Unit-specific waiterless mode detection in order dialogs
  - Database schema updates for per-unit settings
  - Backward compatibility with global waiterless mode

## Related Files

- `/src/actions/businessSettings.ts` - Business settings interface and actions
- `/src/components/dashboard/BusinessSettingsForm.tsx` - Settings configuration UI
- `/src/components/orders/DineInOrderDialog.tsx` - Order dialog with waiterless detection
- `/setup-business-settings-table.ts` - Database schema definition
- `/add-per-unit-waiterless-columns.sql` - Migration script for existing installations
- `/src/test-per-unit-waiterless.ts` - Test script for verification