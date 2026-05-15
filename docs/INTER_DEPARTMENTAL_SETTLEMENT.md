# Inter-Departmental Settlement System

## Overview
The Inter-Departmental Settlement System enables seamless financial tracking and settlement between different business units within the hospitality management system. This system specifically handles scenarios where one department (e.g., Bar) orders items from another department (e.g., Cafe).

## Key Features

### 1. Automatic Detection
- Identifies orders that contain items from different departments
- Tracks revenue distribution between source and target departments
- Maintains detailed records of inter-departmental transactions

### 2. Settlement Processing
- Automatically processes settlements during daily settlement runs
- Creates transaction records for financial tracking
- Updates order statuses to reflect settlement completion

### 3. Reporting & Analytics
- Provides detailed settlement reports
- Shows revenue distribution by department
- Tracks pending vs. settled inter-departmental orders

## Supported Scenarios

### Bar to Cafe Settlement
When a bar customer orders food items:
1. Bar staff creates an order with both drinks (bar) and food (cafe)
2. System automatically splits the order:
   - Drinks order goes to Bar department
   - Food order goes to Cafe Kitchen with special instructions
3. During settlement, revenue for food items is transferred from Bar to Cafe

### Hotel to Restaurant/Cafe Settlement
When hotel guests order room service:
1. Hotel staff creates room service orders
2. Food/drink items are prepared by respective departments
3. Revenue is appropriately allocated during settlement

## Technical Implementation

### Database Schema
The system utilizes the existing database structure with enhancements:

1. **Orders Table**
   - Tracks `businessUnit` for each order
   - Maintains `settlementStatus` field
   - Stores detailed `items` with per-item business unit information

2. **Transactions Table**
   - Records all financial movements
   - Tracks inter-departmental settlements
   - Maintains audit trail of all transactions

3. **Settlements Table**
   - Stores daily settlement reports
   - Aggregates department-wise revenue
   - Tracks settlement status and approvals

### Core Functions

#### `getInterDepartmentalOrders()`
Retrieves all pending orders that require inter-departmental settlement:
- Filters orders from Bar/Hotel departments
- Identifies items belonging to different departments
- Calculates settlement amounts

#### `createInterDepartmentalSettlement()`
Processes all pending inter-departmental settlements:
- Creates transaction records for each settlement
- Updates order settlement statuses
- Maintains audit logs

#### `createDailySettlement()`
Integrated function that processes both regular and inter-departmental settlements:
- Generates daily settlement reports
- Processes inter-departmental settlements first
- Updates all orders as settled

## User Interface

### Settlement Dashboard
Accessible via "Dept. Settlements" in the main navigation, available to Super Admin and Owner roles.

#### Components:
1. **Summary Cards**
   - Daily Revenue
   - Pending Settlements
   - Monthly Revenue
   - Settlement Rate

2. **Daily Settlement Report**
   - Department-wise revenue breakdown
   - Paid vs. pending amounts
   - Order counts by status

3. **Inter-Departmental Settlements**
   - List of pending inter-departmental orders
   - Source/target department identification
   - One-click settlement processing

4. **Department Settlements**
   - Traditional department settlement management
   - Order selection and batch processing

## Workflow

### Daily Process
1. **End of Business Day**
   - Manager initiates daily settlement
   - System automatically processes inter-departmental settlements
   - Regular department settlements are processed
   - Reports are generated and stored

### Manual Intervention
1. **Ad-hoc Settlement**
   - Navigate to Settlements dashboard
   - Review pending inter-departmental orders
   - Process settlements manually if needed

## Security & Permissions

### Role-Based Access
- **Super Admin**: Full access to all settlement features
- **Owner**: View and process settlements
- **Department Managers**: Limited access to their department data

### Audit Trail
All settlement activities are logged:
- Transaction creation
- Order status updates
- User actions and timestamps

## Benefits

### Financial Accuracy
- Ensures proper revenue allocation between departments
- Prevents revenue leakage or misallocation
- Maintains transparent financial records

### Operational Efficiency
- Automates complex settlement processes
- Reduces manual bookkeeping efforts
- Provides real-time settlement status

### Compliance & Reporting
- Maintains detailed audit trails
- Generates comprehensive settlement reports
- Supports financial reconciliation processes

## Future Enhancements

### Advanced Features
1. **Scheduled Settlements**
   - Configure automatic settlement runs
   - Customizable settlement schedules

2. **Settlement Notifications**
   - Email/SMS alerts for pending settlements
   - Manager notifications for settlement completion

3. **Dispute Resolution**
   - Mechanism for handling settlement disputes
   - Approval workflows for disputed amounts

4. **Historical Analysis**
   - Trend analysis of inter-departmental transactions
   - Predictive settlement modeling

This system ensures accurate and automated financial tracking between departments while maintaining the flexibility needed for complex hospitality operations.