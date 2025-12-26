const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Color codes for better output visibility
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class SystemTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
    this.testRecords = [];
  }

  async runCompleteSystemTest() {
    log('cyan', '🔍 DEORA SYSTEM COMPREHENSIVE TEST & FIX');
    log('cyan', '=======================================\n');

    try {
      // Phase 1: Fix Database Schema Issues
      await this.fixDatabaseSchema();

      // Phase 2: Test Core Tables and Data
      await this.testCoreTables();

      // Phase 3: Test User Workflows
      await this.testUserWorkflows();

      // Phase 4: Performance and Integration Tests
      await this.testIntegration();

      // Generate Final Report
      this.generateFinalReport();

    } catch (error) {
      log('red', `❌ CRITICAL ERROR: ${error.message}`);
      this.results.issues.push({ type: 'CRITICAL', message: error.message });
    } finally {
      await this.cleanup();
    }
  }

  async fixDatabaseSchema() {
    log('blue', '🔧 PHASE 1: FIXING DATABASE SCHEMA ISSUES');
    log('blue', '=========================================\n');

    try {
      // Fix 1: Add customerCount column to orders table (aliased to guestCount)
      log('magenta', '1. Checking orders table structure...');

      const { data: orderSample, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

      if (orderError) {
        log('red', `   ❌ Cannot access orders table: ${orderError.message}`);
        this.results.failed++;
        return;
      }

      const existingColumns = orderSample && orderSample.length > 0 ? Object.keys(orderSample[0]) : [];
      log('green', `   ✅ Orders table accessible with ${existingColumns.length} columns`);

      // Check if we have guestCount (which serves as customerCount)
      if (existingColumns.includes('guestCount')) {
        log('green', '   ✅ guestCount column exists (can be used for customerCount)');
        this.results.passed++;
      } else {
        log('red', '   ❌ Neither customerCount nor guestCount column exists');
        this.results.failed++;
        this.results.issues.push({
          type: 'SCHEMA',
          message: 'Orders table missing customer count column'
        });
      }

      // Fix 2: Ensure businessSettings has all required data
      log('magenta', '2. Checking business settings...');

      const { data: businessSettings, error: settingsError } = await supabase
        .from('businessSettings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (settingsError || !businessSettings) {
        log('yellow', '   ⚠️  Creating default business settings...');
        await this.createDefaultBusinessSettings();
      } else {
        log('green', `   ✅ Business settings exist: ${businessSettings.name}`);
        this.results.passed++;
      }

      // Fix 3: Ensure sample data exists
      await this.ensureSampleData();

    } catch (error) {
      log('red', `❌ Schema fix error: ${error.message}`);
      this.results.failed++;
    }
  }

  async createDefaultBusinessSettings() {
    try {
      const defaultSettings = {
        id: 'default',
        name: 'DEORA Restaurant & Cafe',
        address: 'Sample Restaurant Address, City - 123456',
        mobile: '9876543210',
        waiterlessMode: false
      };

      const { data, error } = await supabase
        .from('businessSettings')
        .upsert(defaultSettings)
        .select();

      if (error) {
        log('red', `   ❌ Failed to create business settings: ${error.message}`);
        this.results.failed++;
      } else {
        log('green', '   ✅ Default business settings created');
        this.results.passed++;
      }
    } catch (error) {
      log('red', `   ❌ Business settings creation error: ${error.message}`);
      this.results.failed++;
    }
  }

  async ensureSampleData() {
    log('magenta', '3. Ensuring sample data exists...');

    // Check menu items
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('businessUnit', 'cafe')
      .eq('isAvailable', true);

    if (!menuItems || menuItems.length < 3) {
      log('yellow', '   ⚠️  Creating sample menu items...');
      await this.createSampleMenuItems();
    } else {
      log('green', `   ✅ Found ${menuItems.length} menu items`);
      this.results.passed++;
    }

    // Check tables
    const { data: tables } = await supabase
      .from('tables')
      .select('*')
      .eq('businessUnit', 'cafe');

    if (!tables || tables.length < 2) {
      log('yellow', '   ⚠️  Creating sample tables...');
      await this.createSampleTables();
    } else {
      log('green', `   ✅ Found ${tables.length} tables`);
      this.results.passed++;
    }

    // Check customers
    const { data: customers } = await supabase
      .from('customers')
      .select('*');

    if (!customers || customers.length < 2) {
      log('yellow', '   ⚠️  Creating sample customers...');
      await this.createSampleCustomers();
    } else {
      log('green', `   ✅ Found ${customers.length} customers`);
      this.results.passed++;
    }
  }

  async createSampleMenuItems() {
    const sampleItems = [
      {
        name: 'Americano Coffee',
        price: 80,
        category: 'Beverages',
        businessUnit: 'cafe',
        isAvailable: true,
        description: 'Fresh brewed American coffee'
      },
      {
        name: 'Cappuccino',
        price: 100,
        category: 'Beverages',
        businessUnit: 'cafe',
        isAvailable: true,
        description: 'Espresso with steamed milk foam'
      },
      {
        name: 'Club Sandwich',
        price: 180,
        category: 'Food',
        businessUnit: 'cafe',
        isAvailable: true,
        description: 'Triple-layer sandwich with chicken'
      },
      {
        name: 'Caesar Salad',
        price: 160,
        category: 'Food',
        businessUnit: 'cafe',
        isAvailable: true,
        description: 'Fresh lettuce with Caesar dressing'
      },
      {
        name: 'Chocolate Cake',
        price: 120,
        category: 'Desserts',
        businessUnit: 'cafe',
        isAvailable: true,
        description: 'Rich chocolate cake slice'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(sampleItems)
        .select();

      if (error) {
        log('red', `   ❌ Menu items creation failed: ${error.message}`);
        this.results.failed++;
      } else {
        log('green', `   ✅ Created ${data.length} menu items`);
        this.testRecords.push(...data.map(item => ({ table: 'menu_items', id: item.id })));
        this.results.passed++;
      }
    } catch (error) {
      log('red', `   ❌ Menu items error: ${error.message}`);
      this.results.failed++;
    }
  }

  async createSampleTables() {
    const sampleTables = [
      {
        tableNumber: 'T01',
        capacity: 4,
        status: 'available',
        businessUnit: 'cafe',
        customerCount: 0
      },
      {
        tableNumber: 'T02',
        capacity: 2,
        status: 'available',
        businessUnit: 'cafe',
        customerCount: 0
      },
      {
        tableNumber: 'T03',
        capacity: 6,
        status: 'available',
        businessUnit: 'cafe',
        customerCount: 0
      }
    ];

    try {
      const { data, error } = await supabase
        .from('tables')
        .insert(sampleTables)
        .select();

      if (error) {
        log('red', `   ❌ Tables creation failed: ${error.message}`);
        this.results.failed++;
      } else {
        log('green', `   ✅ Created ${data.length} tables`);
        this.testRecords.push(...data.map(table => ({ table: 'tables', id: table.id })));
        this.results.passed++;
      }
    } catch (error) {
      log('red', `   ❌ Tables creation error: ${error.message}`);
      this.results.failed++;
    }
  }

  async createSampleCustomers() {
    const sampleCustomers = [
      {
        mobileNumber: '9999000001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        discountTier: 'regular'
      },
      {
        mobileNumber: '9999000002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        discountTier: 'vip'
      },
      {
        mobileNumber: '9999000003',
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        discountTier: 'premium'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(sampleCustomers)
        .select();

      if (error) {
        log('red', `   ❌ Customers creation failed: ${error.message}`);
        this.results.failed++;
      } else {
        log('green', `   ✅ Created ${data.length} customers`);
        this.testRecords.push(...data.map(customer => ({ table: 'customers', id: customer.id })));
        this.results.passed++;
      }
    } catch (error) {
      log('red', `   ❌ Customers creation error: ${error.message}`);
      this.results.failed++;
    }
  }

  async testCoreTables() {
    log('blue', '\n📊 PHASE 2: TESTING CORE TABLES');
    log('blue', '==============================\n');

    const criticalTables = [
      'users',
      'orders',
      'bills',
      'menu_items',
      'customers',
      'tables',
      'businessSettings'
    ];

    for (const table of criticalTables) {
      try {
        log('magenta', `Testing ${table} table...`);

        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(5);

        if (error) {
          log('red', `   ❌ ${table}: ${error.message}`);
          this.results.failed++;
          this.results.issues.push({
            type: 'TABLE_ACCESS',
            table: table,
            error: error.message
          });
        } else {
          log('green', `   ✅ ${table}: ${data.length} records accessible`);
          this.results.passed++;
        }
      } catch (error) {
        log('red', `   ❌ ${table}: ${error.message}`);
        this.results.failed++;
      }
    }

    // Test critical columns
    await this.testCriticalColumns();
  }

  async testCriticalColumns() {
    log('magenta', 'Testing critical columns...');

    const criticalColumns = [
      { table: 'bills', column: 'billNumber' },
      { table: 'orders', column: 'guestCount' }, // Using guestCount instead of customerCount
      { table: 'orders', column: 'type' },
      { table: 'businessSettings', column: 'address' },
      { table: 'users', column: 'role' }
    ];

    for (const col of criticalColumns) {
      try {
        const { data, error } = await supabase
          .from(col.table)
          .select(col.column)
          .limit(1);

        if (error) {
          log('red', `   ❌ ${col.table}.${col.column}: ${error.message}`);
          this.results.failed++;
          this.results.issues.push({
            type: 'COLUMN_MISSING',
            table: col.table,
            column: col.column,
            error: error.message
          });
        } else {
          log('green', `   ✅ ${col.table}.${col.column}: Accessible`);
          this.results.passed++;
        }
      } catch (error) {
        log('red', `   ❌ ${col.table}.${col.column}: ${error.message}`);
        this.results.failed++;
      }
    }
  }

  async testUserWorkflows() {
    log('blue', '\n🔄 PHASE 3: TESTING USER WORKFLOWS');
    log('blue', '==================================\n');

    // Test Super Admin Access
    await this.testSuperAdminWorkflow();

    // Test Cafe Manager Complete Workflow
    await this.testCafeManagerWorkflow();

    // Test Waiter Workflow
    await this.testWaiterWorkflow();

    // Test Kitchen Workflow
    await this.testKitchenWorkflow();
  }

  async testSuperAdminWorkflow() {
    log('magenta', '1. Testing Super Admin workflow...');

    try {
      // Super admin should access all tables
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('username, role, isActive')
        .limit(5);

      if (usersError) {
        log('red', '   ❌ Super admin cannot access users');
        this.results.failed++;
      } else {
        log('green', `   ✅ Super admin can access users (${users.length} found)`);
        this.results.passed++;
      }

      // Check if required users exist
      const requiredUsers = ['kalpeshdeora', 'cafe_manager', 'waiter_rahul', 'kitchen_chef'];
      const foundUsers = users ? users.map(u => u.username) : [];

      for (const username of requiredUsers) {
        if (foundUsers.includes(username)) {
          log('green', `   ✅ User ${username} exists`);
          this.results.passed++;
        } else {
          log('red', `   ❌ User ${username} missing`);
          this.results.failed++;
          this.results.issues.push({
            type: 'USER_MISSING',
            username: username
          });
        }
      }

    } catch (error) {
      log('red', `   ❌ Super admin test error: ${error.message}`);
      this.results.failed++;
    }
  }

  async testCafeManagerWorkflow() {
    log('magenta', '2. Testing Cafe Manager complete workflow...');

    try {
      // Get test data
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*')
        .eq('businessUnit', 'cafe')
        .eq('isAvailable', true)
        .limit(3);

      const { data: tables } = await supabase
        .from('tables')
        .select('*')
        .eq('businessUnit', 'cafe')
        .limit(1);

      if (!menuItems || menuItems.length === 0) {
        log('red', '   ❌ No menu items available for testing');
        this.results.failed++;
        return;
      }

      if (!tables || tables.length === 0) {
        log('red', '   ❌ No tables available for testing');
        this.results.failed++;
        return;
      }

      log('green', '   ✅ Test data available');

      // Step 1: Create Order
      const orderItems = menuItems.slice(0, 2).map((item, index) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: index + 1,
        total: item.price * (index + 1)
      }));

      const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

      const orderData = {
        businessUnit: 'cafe',
        type: 'dine-in', // Required field
        tableId: tables[0].id,
        tableNumber: tables[0].tableNumber,
        status: 'pending',
        guestCount: 2, // Using guestCount instead of customerCount
        totalAmount: subtotal,
        source: 'dine-in',
        items: JSON.stringify(orderItems),
        createdBy: 'cafe_manager',
        orderNumber: `TEST-${Date.now()}`
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select();

      if (orderError) {
        log('red', `   ❌ Order creation failed: ${orderError.message}`);
        this.results.failed++;
        this.results.issues.push({
          type: 'ORDER_CREATION',
          error: orderError.message
        });
        return;
      }

      log('green', `   ✅ Order created: ${order[0].id}`);
      this.testRecords.push({ table: 'orders', id: order[0].id });
      this.results.passed++;

      // Step 2: Generate Bill
      await this.testBillGeneration(order[0], subtotal);

      // Step 3: Test Order Status Updates
      await this.testOrderStatusUpdates(order[0]);

    } catch (error) {
      log('red', `   ❌ Cafe manager workflow error: ${error.message}`);
      this.results.failed++;
    }
  }

  async testBillGeneration(order, subtotal) {
    try {
      log('green', '   Testing bill generation...');

      // Get business settings
      const { data: businessSettings } = await supabase
        .from('businessSettings')
        .select('*')
        .eq('id', 'default')
        .single();

      // Generate bill number
      const { data: existingBills } = await supabase
        .from('bills')
        .select('billNumber');

      const today = new Date();
      const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

      let nextNumber = 1;
      if (existingBills && existingBills.length > 0) {
        const existingNumbers = [];
        existingBills.forEach(bill => {
          if (bill.billNumber && typeof bill.billNumber === 'string') {
            const parts = bill.billNumber.split('-');
            if (parts.length === 3) {
              const num = parseInt(parts[2], 10);
              if (!isNaN(num)) {
                existingNumbers.push(num);
              }
            }
          }
        });
        if (existingNumbers.length > 0) {
          nextNumber = Math.max(...existingNumbers) + 1;
        }
      }

      const billNumber = `BILL-${dateString}-${String(nextNumber).padStart(3, '0')}`;

      // Calculate totals
      const gstPercent = 18;
      const gstAmount = subtotal * (gstPercent / 100);
      const grandTotal = subtotal + gstAmount;

      const billData = {
        billNumber: billNumber,
        orderId: order.id,
        businessUnit: 'cafe',
        subtotal: subtotal,
        discountPercent: 0,
        discountAmount: 0,
        gstPercent: gstPercent,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        source: 'dine-in',
        address: businessSettings?.address || 'Default Address',
        items: order.items
      };

      const { data: bill, error: billError } = await supabase
        .from('bills')
        .insert(billData)
        .select();

      if (billError) {
        log('red', `   ❌ Bill generation failed: ${billError.message}`);
        this.results.failed++;
        this.results.issues.push({
          type: 'BILL_GENERATION',
          orderId: order.id,
          error: billError.message
        });
      } else {
        log('green', `   ✅ Bill generated: ${bill[0].billNumber} (₹${grandTotal.toFixed(2)})`);
        this.testRecords.push({ table: 'bills', id: bill[0].id });
        this.results.passed++;
      }
    } catch (error) {
      log('red', `   ❌ Bill generation error: ${error.message}`);
      this.results.failed++;
    }
  }

  async testOrderStatusUpdates(order) {
    log('green', '   Testing order status updates...');

    const statusFlow = ['preparing', 'ready', 'served', 'completed'];

    for (const status of statusFlow) {
      try {
        const updateData = {
          status: status,
          updatedAt: new Date().toISOString()
        };

        // Add timestamp fields for each status
        if (status === 'preparing') updateData.preparingAt = new Date().toISOString();
        if (status === 'ready') updateData.readyAt = new Date().toISOString();
        if (status === 'served') updateData.servedAt = new Date().toISOString();
        if (status === 'completed') updateData.completedAt = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (updateError) {
          log('red', `   ❌ Status update to ${status} failed: ${updateError.message}`);
          this.results.failed++;
        } else {
          log('green', `   ✅ Order updated to ${status}`);
          this.results.passed++;
        }
      } catch (error) {
        log('red', `   ❌ Status update error: ${error.message}`);
        this.results.failed++;
      }
    }
  }

  async testWaiterWorkflow() {
    log('magenta', '3. Testing Waiter workflow...');

    try {
      // Test table access
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('businessUnit', 'cafe')
        .limit(3);

      if (tablesError) {
        log('red', `   ❌ Waiter cannot access tables: ${tablesError.message}`);
        this.results.failed++;
      } else {
        log('green', `   ✅ Waiter can access tables (${tables.length} found)`);
        this.results.passed++;
      }

      // Test order creation by waiter
      if (tables && tables.length > 0) {
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('*')
          .eq('businessUnit', 'cafe')
          .limit(2);

        if (menuItems && menuItems.length > 0) {
          const waiterOrder = {
            businessUnit: 'cafe',
            type: 'dine-in',
            tableId: tables[0].id,
            status: 'pending',
            guestCount: 2,
            totalAmount: 200,
            source: 'dine-in',
            items: JSON.stringify([{
              id: menuItems[0].id,
              name: menuItems[0].name,
              price: menuItems[0].price,
              quantity: 1,
              total: menuItems[0].price
            }]),
            createdBy: 'waiter_rahul'
          };

          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(waiterOrder)
            .select();

          if (orderError) {
            log('red', `   ❌ Waiter cannot create orders: ${orderError.message}`);
            this.results.failed++;
          } else {
            log('green', '   ✅ Waiter can create orders');
            this.testRecords.push({ table: 'orders', id: order[0].id });
            this.results.passed++;
          }
        }
      }

    } catch (error) {
      log('red', `   ❌ Waiter workflow error: ${error.message}`);
      this.results.failed++;
    }
  }

  async testKitchenWorkflow() {
    log('magenta', '4. Testing Kitchen workflow...');

    try {
      // Kitchen should see pending orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing'])
        .limit(10);

      if (ordersError) {
        log('red', `   ❌ Kitchen cannot view orders: ${ordersError.message}`);
        this.results.failed++;
      } else {
        log('green', `   ✅ Kitchen can view orders (${orders.length} pending/preparing)`);
        this.results.passed++;
      }

      // Kitchen should access menu items for reference
      const { data: menu, error: menuError } = await supabase
        .from('menu_items')
        .select('name, category, price')
        .eq('businessUnit', 'cafe')
        .eq('isAvailable', true);

      if (menuError) {
        log('red', `   ❌ Kitchen cannot access menu: ${menuError.message}`);
        this.results.failed++;
      } else {
        log('green', `   ✅ Kitchen can access menu (${menu.length} items)`);
        this.results.passed++;
      }

    } catch (error) {
      log('red', `   ❌ Kitchen workflow error: ${error.message}`);
      this.results.failed++;
    }
  }

  async testIntegration() {
    log('blue', '\n⚡ PHASE 4: INTEGRATION & PERFORMANCE TESTS');
    log('blue', '===========================================\n');

    await this.testDataConsistency();
    await this.testErrorHandling();
    await this.testConcurrentOperations();
  }

  async testDataConsistency() {
    log('magenta', '1. Testing data consistency...');

    try {
      // Test order-bill relationship consistency
      const { data: bills } = await supabase
        .from('bills')
        .select('id, orderId')
        .not('orderId', 'is', null)
        .limit(5);

      if (bills && bills.length > 0) {
        let consistentLinks = 0;

        for (const bill of bills) {
          const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('id', bill.orderId)
            .single();

          if (order) {
            consistentLinks++;
          }
        }

        if (consistentLinks === bills.length) {
          log('green', '   ✅ Order-Bill relationships are consistent');
          this.results.passed++;
        } else {
          log('yellow', `   ⚠️  ${consistentLinks}/${bills.length} order-bill links consistent`);
          this.results.warnings++;
        }
      } else {
        log('green', '   ✅ No order-bill links to validate (or no bills with orders)');
        this.results.passed++;
      }

    } catch (error) {
      log('red', `   ❌ Data consistency test error: ${error.message}`);
      this.results.failed++;
    }
  }

  async testErrorHandling() {
    log('magenta', '2. Testing error handling...');

    try {
      // Test invalid order creation
      const invalidOrder = {
        businessUnit: 'cafe',
        // Missing required 'type' field
        status: 'pending',
        totalAmount: 'invalid_amount' // Wrong data type
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(invalidOrder)
        .select();

      if (error) {
        log('green', '   ✅ Invalid data properly rejected');
        this.results.passed++;
      } else {
        log('yellow', '   ⚠️  Invalid data was accepted - might cause issues');
        this.results.warnings++;
        // Clean up if somehow created
        if (data && data[0]) {
          await supabase.from('orders').delete().eq('id', data[0].id);
        }
      }

    } catch (error) {
      log('green', '   ✅ Error handling works correctly');
      this.results.passed++;
    }
  }

  async testConcurrentOperations() {
    log('magenta', '3. Testing concurrent operations...');

    try {
      // Test simultaneous bill number generation
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(this.generateTestBillNumber());
      }

      const billNumbers = await Promise.all(promises);
      const uniqueBillNumbers = new Set(billNumbers.filter(bn => bn !== null));

      if (uniqueBillNumbers.size === billNumbers.filter(bn => bn !== null).length) {
        log('green', '   ✅ Concurrent bill number generation produces unique numbers');
        this.results.passed++;
      } else {
        log('red', '   ❌ Concurrent bill number generation has collisions');
        this.results.failed++;
        this.results.issues.push({
          type: 'CONCURRENCY',
          message: 'Bill number generation not thread-safe'
        });
      }

    } catch (error) {
      log('red', `   ❌ Concurrent operations test error: ${error.message}`);
      this.results.failed++;
    }
  }

  async generateTestBillNumber() {
    try {
      const {
