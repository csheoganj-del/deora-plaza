# Bar Measurement Feature Documentation

## Overview
This feature enhances the bar ordering system to support portion-based serving options that distinguish between full-bottle servings and measured milliliter servings for different beverage types. This reflects real-world bar operations where alcoholic beverages are typically served in standard measurements while some beers and soft drinks are served in full bottles.

## Key Features

### 1. Measurement-Based Menu Items
- **Full Unit Servings**: Items served as complete units (bottles, cans)
- **Measured Servings**: Items served in specific measurements (ml, oz)
- **Flexible Configuration**: Support for custom measurements

### 2. Enhanced Bar Menu Management
- **Serving Type Selection**: Choose between full unit or measured servings when creating/editing items
- **Measurement Details**: Specify measurement amount, unit, and base container size
- **Visual Indicators**: Clear display of measurement information in the menu management interface

### 3. Improved Ordering Experience
- **Smart Measurement Selection**: Automatic prompt for measurement selection when ordering measured items
- **Predefined Options**: Quick selection of common measurements for alcoholic beverages
- **Custom Measurements**: Ability to enter custom measurement amounts

## Implementation Details

### Database Schema Changes
Added three new columns to the `menu_items` table:
- `measurement` (TEXT): The measurement for this item (e.g., "30ml", "150ml")
- `measurementUnit` (TEXT): The unit of measurement (e.g., "ml", "oz")
- `baseMeasurement` (NUMERIC): The base measurement size for the container (e.g., 750 for a 750ml bottle)

### Common Measurements for Alcoholic Beverages
The system includes predefined measurements commonly used in bar operations:
- 30ml (Single Shot)
- 60ml (Double Shot)
- 90ml (Triple Shot)
- 150ml (Small Glass)
- 250ml (Medium Glass)
- 330ml (Large Glass)
- 500ml (Pitcher)
- 750ml (Bottle)

### User Workflow

#### Creating/Editing Menu Items
1. Navigate to Bar Menu Management (`/dashboard/bar/menu`)
2. Click "Add Item" or "Edit" for an existing item
3. Select "Serving Type":
   - **Full Unit (Bottle/Can)**: For items served as complete units
   - **Measured (ml)**: For items served in specific measurements
4. If "Measured" is selected, provide:
   - Measurement amount (e.g., "30ml")
   - Measurement unit (e.g., "ml")
   - Base container size (e.g., "750" for a 750ml bottle)
5. Save the item

#### Ordering Items with Measurements
1. Open a bar table order
2. Select an item that has measurement configuration
3. Measurement selection modal automatically appears
4. Choose from predefined measurements or enter a custom measurement
5. Item is added to the cart with measurement information displayed

## Benefits

### For Business Operations
- **Realistic Pricing**: Charge appropriate amounts based on actual serving sizes
- **Inventory Tracking**: Better tracking of alcohol consumption by measurement
- **Compliance**: Meet legal requirements for alcohol serving measurements
- **Flexibility**: Support various serving styles for different beverage types

### For Staff
- **Intuitive Interface**: Simple selection of serving types and measurements
- **Reduced Errors**: Clear indication of serving sizes prevents over-pouring
- **Efficiency**: Quick selection of common measurements speeds up ordering

### For Customers
- **Transparency**: Clear understanding of serving sizes and pricing
- **Choice**: Option to select different serving sizes for the same beverage
- **Consistency**: Standardized serving sizes ensure fair pricing

## Technical Implementation

### Frontend Components
- **BarMenuItemDialog**: Enhanced with measurement configuration options
- **DineInOrderDialog**: Updated with measurement selection modal
- **BarMenuManagement**: Modified to display measurement information

### Backend Functions
- **createBarOrder**: Updated to handle measurement data in order items
- **getBarMenu**: Retrieves measurement information with menu items

### Database Queries
- Measurement columns are included in menu item queries
- Indexes added for improved performance on measurement-related queries

## Future Enhancements
- **Inventory Deduction**: Automatically deduct from base containers when measured servings are sold
- **Happy Hour Pricing**: Time-based pricing for different measurement options
- **Recipe Management**: Define ingredients and preparation steps for measured cocktails
- **Loyalty Points**: Award points based on measurement sizes for premium offerings