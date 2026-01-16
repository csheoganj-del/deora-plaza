#!/usr/bin/env tsx

/**
 * Test script to verify order flow fixes
 * This script tests the waiter dashboard filtering and waiterless mode logic
 */

import { getOrders } from './src/actions/orders';

async function testOrderFlow() {
  console.log('🧪 Testing Order Flow Fixes...\n');

  try {
    // Test 1: Get all orders to see what's in the database
    console.log('📋 Fetching all orders...');
    const allOrders = await getOrders();
    console.log(`Found ${allOrders.length} total orders`);

    if (allOrders.length > 0) {
      // Group orders by type and status
      const ordersByType = allOrders.reduce((acc: any, order: any) => {
        const type = order.type || 'unknown';
        const status = order.status || 'unknown';
        
        if (!acc[type]) acc[type] = {};
        if (!acc[type][status]) acc[type][status] = 0;
        acc[type][status]++;
        
        return acc;
      }, {});

      console.log('\n📊 Orders by Type and Status:');
      Object.entries(ordersByType).forEach(([type, statuses]: [string, any]) => {
        console.log(`  ${type}:`);
        Object.entries(statuses).forEach(([status, count]) => {
          console.log(`    ${status}: ${count}`);
        });
      });

      // Test 2: Check for ready orders that should be visible to waiters
      const readyOrders = allOrders.filter((order: any) => {
        const status = (order.status || "").toLowerCase();
        const type = (order.type || "").toLowerCase();
        
        // Apply the new filtering logic
        const statusMatch = ['pending', 'preparing', 'ready'].includes(status);
        const typeMatch = type === 'dine-in' || (type === 'takeaway' && status === 'ready');
        
        return statusMatch && typeMatch;
      });

      console.log(`\n✅ Orders that should be visible to waiters: ${readyOrders.length}`);
      
      if (readyOrders.length > 0) {
        console.log('📝 Waiter-visible orders:');
        readyOrders.forEach((order: any) => {
          console.log(`  - ${order.orderNumber}: ${order.type} (${order.status}) - ${order.businessUnit}`);
        });
      }

      // Test 3: Check for takeaway orders specifically
      const takeawayOrders = allOrders.filter((order: any) => 
        (order.type || "").toLowerCase() === 'takeaway'
      );
      
      console.log(`\n🥡 Takeaway orders: ${takeawayOrders.length}`);
      if (takeawayOrders.length > 0) {
        takeawayOrders.forEach((order: any) => {
          const shouldBeVisible = order.status === 'ready';
          console.log(`  - ${order.orderNumber}: ${order.status} ${shouldBeVisible ? '✅ (visible to waiter)' : '❌ (not visible)'}`);
        });
      }

    } else {
      console.log('ℹ️  No orders found in database');
    }

  } catch (error) {
    console.error('❌ Error testing order flow:', error);
  }
}

// Run the test
testOrderFlow().then(() => {
  console.log('\n🎉 Order flow test completed!');
}).catch(console.error);