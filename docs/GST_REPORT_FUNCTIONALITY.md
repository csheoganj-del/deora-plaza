# GST Report Functionality Documentation

## Overview
This document explains the implementation of the GST report functionality for each business unit in the Deora system. Each business unit (bar, cafe, hotel, garden) now has its own dedicated GST report tab that displays only data relevant to that specific unit.

## Implementation Details

### 1. Backend Actions
The GST actions in `src/actions/gst.ts` have been enhanced to properly filter data by business unit:

- `getGSTReport(startDate, endDate, businessUnit)` - Retrieves bills filtered by date range and business unit
- `getGSTSummary(startDate, endDate, businessUnit)` - Calculates GST summary statistics for a specific unit
- `exportGSTData(startDate, endDate, businessUnit)` - Exports GST data to CSV format with unit-specific filenames

### 2. Frontend Components
A reusable `GSTReportComponent` was created in `src/components/gst/GSTReportComponent.tsx` that can be used by all business units. This component includes:

- Date range filtering capabilities
- Summary cards showing total GST collected, sales, bill count, and average GST per bill
- Detailed breakdown by GST rate
- Export to CSV functionality
- Print functionality

### 3. Dedicated Pages
Individual GST report pages were created for each business unit:

- `src/app/dashboard/bar/gst-report/page.tsx` - Bar unit GST report
- `src/app/dashboard/billing/gst-report/page.tsx` - Cafe unit GST report
- `src/app/dashboard/hotel/gst-report/page.tsx` - Hotel unit GST report
- `src/app/dashboard/garden/gst-report/page.tsx` - Garden unit GST report

Each page includes proper role-based access control to ensure only authorized users can view the reports.

### 4. Navigation
New navigation links were added to the sidebar for easy access to each unit's GST report:

- Bar GST Report (accessible by bar_manager, bartender, super_admin, owner)
- Cafe GST Report (accessible by cafe_manager, waiter, super_admin, owner)
- Hotel GST Report (accessible by hotel_manager, hotel_reception, super_admin, owner)
- Garden GST Report (accessible by garden_manager, super_admin, owner)

## Data Isolation
The system ensures complete data isolation between business units:

1. Each unit's GST report only displays bills from that specific business unit
2. Database queries are filtered by the `businessUnit` field
3. Role-based access control prevents unauthorized access to reports
4. Exported CSV files include the business unit name in the filename

## Testing
A test script `src/test-gst-isolation.ts` is available to verify that data isolation is working correctly.

## Compliance
This implementation meets the requirement for separate GST reporting for each business unit due to their separate GST registrations under leased property arrangements.