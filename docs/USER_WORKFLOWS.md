# **DEORA PLAZA MANAGEMENT SYSTEM - Complete User Workflows & Relationships**

## **USER RELATIONSHIP MAP**

```
SUPER ADMIN (Kalpesh)
    ↓
OWNER (Business Partner)
    ↓
MANAGERS (Cafe, Bar, Hotel, Garden)
    ↓
STAFF (Waiters, Kitchen, Reception, Bartenders)
    ↓
CUSTOMERS
```

## **1. SUPER ADMIN WORKFLOW (Kalpesh Deora)**

### **Daily Activities:**
**Morning (9:00 AM):**
```
1. SYSTEM HEALTH CHECK:
   - Login: kalpeshdeora / Kalpesh!1006
   - Check dashboard: All systems green? ✅
   - Review overnight activities
   - Check error logs

2. USER MANAGEMENT:
   - New staff joined? Create user account
   - Staff left? Deactivate account
   - Password reset requests

EXAMPLE: 
   New waiter "Rohan" joins cafe
   → Create: username: waiter_rohan, password: ServeTables123
   → Assign role: waiter, business: cafe
```

**Afternoon (2:00 PM):**
```
3. FINANCIAL OVERSIGHT:
   - View all business revenues
   - Check settlement status
   - Export reports for accounting

EXAMPLE:
   Restaurant January revenue: ₹285,000
   → Owner share (40%): ₹114,000
   → Manager share (60%): ₹171,000
   → Mark settlement as "completed"
```

**Evening (6:00 PM):**
```
4. SYSTEM CONFIGURATION:
   - Update GST rates if needed
   - Modify discount tiers
   - Backup system data
   - Monitor performance
```

### **Interactions with Other Users:**
- **With Owner**: Provides financial reports, updates partnership percentages
- **With Managers**: User account management, system support
- **With All**: System-wide announcements, policy updates

---

## **2. OWNER WORKFLOW**

### **Daily Activities:**
**Morning (10:00 AM):**
```
1. REVENUE DASHBOARD:
   - Login to owner dashboard
   - View yesterday's revenue across all businesses
   - Check real-time current day earnings

EXAMPLE:
   Dashboard shows:
   Cafe: ₹15,200 | Bar: ₹8,500 | Hotel: ₹12,300 | Garden: ₹5,000
   Total: ₹41,000
```

**Afternoon (3:00 PM):**
```
2. SETTLEMENT TRACKING:
   - Monitor restaurant partnership (40%)
   - Track monthly settlement progress
   - View customer loyalty analytics

EXAMPLE:
   January Restaurant Settlement:
   Total: ₹285,000 | Owner Share: ₹114,000 | Status: Pending
```

**Relationships:**
- **Reports to**: Super Admin (for system access)
- **Monitors**: All managers' performance
- **Focus**: Financial outcomes only (no operations)

---

## **COMPLETE CROSS-USER WORKFLOW EXAMPLE**

### **Scenario: Regular Customer VIP Treatment**

**Characters:**
- Customer: Mr. Raj (Mobile: 9876543210, 15 visits - Gold tier)
- Waiter: Rahul
- Cafe Manager: Priya
- Kitchen: Chef Arjun
- Owner: Mr. Gupta
- Super Admin: Kalpesh

**Step-by-Step Flow:**

```
1. CUSTOMER ARRIVAL (6:30 PM):
   → Waiter Rahul: "Welcome back Mr. Raj! Your usual table?"
   → System: Auto-recognizes mobile, applies 10% discount
   → Table 4 assigned (preferred table)

2. ORDER TAKING:
   → Rahul: Takes order - 2 Cold Coffee, 1 Paneer Tikka
   → Special: "Extra spicy as usual"
   → System: Gold tier - 10% auto discount shown

3. KITCHEN PREPARATION:
   → Chef Arjun: Sees "VIP Customer - Gold Tier" note
   → Priority preparation
   → Extra attention to "extra spicy" request

4. SERVICE:
   → Rahul: Personal attention, frequent check-ins
   → Mr. Raj: "Can we add 1 Butter Naan?"
   → Rahul: Updates order instantly

5. BILLING:
   → Manager Priya: Generates bill
   → Subtotal: ₹857
   → Auto Discount (10%): ₹86
   → Manual Discount (VIP): ₹50
   → GST 18%: ₹129
   → Final: ₹850
   → WhatsApp bill sent automatically

6. LOYALTY UPDATE:
   → System: Visit count now 16
   → Still Gold tier (needs 20 for upgrade)

7. OWNER VIEW:
   → Mr. Gupta: Sees ₹850 revenue added
   → Restaurant share: ₹340 (40%)
   → Manager share: ₹510 (60%)

8. SUPER ADMIN VIEW:
   → Kalpesh: Sees complete transaction log
   → Customer loyalty pattern recorded
   → System performance monitored
```

---

## **KEY INTERACTION PATTERNS**

### **Communication Flow:**
```
CUSTOMERS → WAITERS → KITCHEN
    ↓          ↓         ↓
MANAGERS ←→ OWNER ←→ SUPER ADMIN
    ↓
BAR/HOTEL/GARDEN
```

### **Data Flow:**
```
ORDERS → KITCHEN → SERVICE → BILLING → SETTLEMENT
  ↓         ↓         ↓         ↓         ↓
LOYALTY → REPORTS → OWNER → ADMIN → BACKUP
```

### **Permission Hierarchy:**
```
SUPER ADMIN (All Access)
    ↓
OWNER (Financial View Only)
    ↓
MANAGERS (Business Unit Full Access)
    ↓
STAFF (Role-specific Limited Access)
    ↓
CUSTOMERS (Service Receivers)
```
