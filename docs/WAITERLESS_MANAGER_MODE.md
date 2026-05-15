# Waiterless Manager Mode - Feature Documentation

## Overview

The **Waiterless Manager Mode** is a streamlined billing workflow designed for scenarios where managers need to handle table orders directly without relying on waiters or kitchen staff. This is particularly useful when:

- Waiters and kitchen staff have connectivity issues
- Operating in a simplified service model
- The manager needs complete control over the order-to-bill process

## Key Features

### 1. **Direct Table-to-Bill Workflow**
When waiterless mode is enabled and a manager clicks on a table:
- Manager can add items to the order
- **Manager can lookup customer and apply tier-based discounts**
- **Manager can enable GST and set GST percentage**
- Upon placing the order, the system **immediately generates a bill**
- Manager can **print the bill instantly** without navigating to billing history

### 2. **Customer Lookup & Discounts**
- Click "Show Customer & Discounts" button in order dialog
- Search for customer by name or mobile number
- System auto-applies tier-based discount:
  - Regular: 0%
  - Silver: 5%
  - Gold: 10%
  - Platinum: 15%
- Manager can manually adjust discount percentage
- Customer information saved with the bill

### 3. **GST Management**
- Toggle GST on/off for each order
- Adjust GST percentage (default: 5%)
- GST calculated on discounted amount
- GST details included in printed invoice

### 4. **Immediate Payment & Print**
- After order placement, a payment screen appears automatically
- Manager selects payment method (Cash/UPI/Card)
- Clicking "Pay & Print Bill" triggers:
  - Payment processing
  - Automatic bill printing
  - Table refresh

### 5. **Bypass Kitchen/Waiter Flow**
- Orders are still created for record-keeping
- But the manager handles billing directly
- No dependency on kitchen or waiter confirmation
- Ideal for low-connectivity environments

## How to Enable

### Step 1: Enable Waiterless Mode
1. Go to **Dashboard** → **Business Settings**
2. Toggle **"Waiter-less Mode"** ON
3. Save settings

### Step 2: Manager Login
Ensure you're logged in with one of these roles:
- `manager`
- `cafe_manager`
- `bar_manager`
- `super_admin`
- `owner`

## User Flow

### Normal Mode (Waiterless OFF)
```
Manager clicks table → Adds items → Places order → Order sent to kitchen → 
Manager navigates to Billing → Generates bill → Prints bill
```

### Waiterless Manager Mode (Waiterless ON)
```
Manager clicks table → Adds items → [Optional: Select customer & apply discount] → 
[Optional: Enable GST] → Places order & Bill → Select payment method → Pay & Print immediately ✓
```

## Technical Implementation

### Modified Components

#### 1. **DineInOrderDialog.tsx**
- Detects waiterless mode from business settings
- Checks if user has manager role
- Automatically triggers billing after order creation
- Shows payment screen inline
- Integrates print functionality

#### 2. **BusinessSettingsForm.tsx**
- Updated description for waiterless mode toggle
- Reflects new manager billing workflow

### Key Functions

```typescript
// Check if waiterless mode is active for managers
const isWaiterlessMode = businessSettings?.waiterlessMode && isManagerRole

// After order creation, generate bill immediately
if (isWaiterlessMode) {
    await handleGenerateBill(orderId, orderItemsPayload)
}

// Process payment and print
const handlePaymentAndPrint = async () => {
    await processPayment(billId, paymentMethod, grandTotal)
    handlePrint() // Triggers browser print dialog
    onClose()
    router.refresh()
}
```

### Data Flow

1. **Order Creation**
   - Order is created in database
   - Table status updated to "occupied"
   - Kitchen notification sent (ignored if no connectivity)

2. **Bill Generation**
   - Bill generated with default values (no discount, no GST)
   - Bill number assigned
   - Bill linked to order

3. **Payment & Print**
   - Payment processed with selected method
   - Bill status updated to "paid"
   - Invoice template rendered
   - Browser print dialog triggered

## UI Indicators

### Manager Mode Badge
When in waiterless manager mode, the order dialog shows:
```
New Order - Table 5 [Manager Mode] [Show Customer & Discounts]
```

### Customer Panel (Collapsible)
Click "Show Customer & Discounts" to reveal:
- Customer name and mobile search
- Customer tier badge (Silver/Gold/Platinum)
- Discount percentage input
- GST toggle and percentage

### Billing Summary
When discount or GST is applied, shows:
```
Subtotal: ₹500.00
Discount (10%): -₹50.00
GST (5%): ₹22.50
Grand Total: ₹472.50
```

### Button Labels
- Normal: "Place Order"
- Manager Mode: "Place Order & Bill"

### Processing States
- Normal: "Placing Order..."
- Manager Mode: "Processing..."

## Benefits

1. **Speed** - Immediate billing without navigation
2. **Simplicity** - Single-click order-to-bill flow
3. **Reliability** - No dependency on kitchen/waiter connectivity
4. **Control** - Manager has full oversight of the process
5. **Customer Experience** - Faster service and billing
6. **Customer Loyalty** - Tier-based discounts encourage repeat business
7. **Accurate Billing** - Proper discount and GST calculations
8. **Record Keeping** - Customer data linked to bills for analytics

## Limitations & Considerations

1. **Record Keeping** - Orders are still created for audit trail
2. **Kitchen Notifications** - Still sent but may be ignored
3. **Role Restriction** - Only managers can use this mode
4. **Customer Panel** - Collapsible to save screen space
5. **Table Status** - Table remains "occupied" until manually cleared
6. **Discount Tiers** - Based on customer's total spend history

## Future Enhancements

- [ ] Discount approval workflow for high percentages
- [ ] Add customer creation from order dialog
- [ ] Multiple GST rates for different item categories
- [ ] Automatic table clearing after payment
- [ ] Print configuration (thermal vs A4)
- [ ] Split bill functionality

## Troubleshooting

### Issue: "Manager Mode" badge not showing
**Solution:** Ensure waiterless mode is enabled in Business Settings AND user has manager role

### Issue: Bill not printing
**Solution:** Check browser print settings. Ensure pop-up blocker allows print dialog

### Issue: Payment fails but order created
**Solution:** Navigate to Billing → Find the order → Complete payment manually

### Issue: Discount not applying
**Solution:** Ensure customer is selected. Tier discount auto-applies but can be manually adjusted

### Issue: GST not calculating
**Solution:** Enable GST checkbox first, then set percentage

### Issue: Customer panel not visible
**Solution:** Click "Show Customer & Discounts" button in the header

## Related Files

- `/src/components/orders/DineInOrderDialog.tsx` - Main order dialog
- `/src/components/dashboard/BusinessSettingsForm.tsx` - Settings toggle
- `/src/actions/billing.ts` - Billing actions
- `/src/actions/orders.ts` - Order creation
- `/src/components/billing/InvoiceTemplate.tsx` - Print template
- `/src/components/billing/CustomerAutocomplete.tsx` - Customer search
- `/src/components/billing/DiscountPanel.tsx` - Discount management
- `/src/lib/discount-utils.ts` - Discount calculation utilities

## Configuration

Business settings document structure:
```typescript
{
  name: string,
  address: string,
  mobile: string,
  waiterlessMode: boolean, // Toggle this to enable
  enablePasswordProtection: boolean, // Admin-only control for password protection
  gstEnabled: boolean, // Enable GST calculations
  gstPercentage: number // Default GST percentage for billing
}
```

## Version History

- **v1.1** (Dec 2025) - Customer & Discount Integration
  - Customer lookup with autocomplete
  - Tier-based discount auto-application
  - Manual discount override
  - GST toggle and percentage control
  - Collapsible customer panel
  - Real-time billing summary
- **v1.0** (Dec 2025) - Initial implementation
  - Waiterless mode toggle
  - Manager role detection
  - Immediate billing and printing
  - Payment method selection

## Discount Tiers

Customer discount tiers are automatically assigned based on total spending:

| Tier | Total Spent | Default Discount |
|------|-------------|------------------|
| Regular | < ₹5,000 | 0% |
| Silver | ₹5,000 - ₹24,999 | 5% |
| Gold | ₹25,000 - ₹49,999 | 10% |
| Platinum | ≥ ₹50,000 | 15% |

Managers can override these defaults with custom percentages.

## Billing Calculation

```typescript
1. Calculate Subtotal = Sum of (Item Price × Quantity)
2. Calculate Discount Amount = Subtotal × (Discount % / 100)
3. Calculate Discounted Amount = Subtotal - Discount Amount
4. Calculate GST Amount = Discounted Amount × (GST % / 100)
5. Grand Total = Discounted Amount + GST Amount
```

Example (using default GST percentage from business settings):
- Subtotal: ₹1,000
- Discount (10%): -₹100 → Discounted: ₹900
- GST (configured default %): +₹[calculated amount]
- **Grand Total: ₹[final amount]**

---

**Note:** This feature is designed to complement, not replace, the existing order flow. Normal waiter-based operations continue to work when waiterless mode is disabled.
