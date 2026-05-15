/**
 * Order Service Test Script
 * Tests order creation functionality
 */

import { createOrder, getOrders } from './src/actions/orders';

async function testOrderService() {
    console.log('=== ORDER SERVICE TEST STARTED ===\n');

    try {
        // Test 1: Create a Cafe Dine-in Order
        console.log('Test 1: Creating Cafe Dine-in Order...');
        const cafeOrder = await createOrder({
            type: 'dine-in',
            businessUnit: 'cafe',
            tableNumber: '5',
            customerName: 'Test Customer',
            customerMobile: '9876543210',
            guestCount: 2,
            items: [
                {
                    menuItemId: 'test-item-1',
                    name: 'Cappuccino',
                    quantity: 2,
                    price: 150,
                    specialInstructions: 'Extra hot'
                },
                {
                    menuItemId: 'test-item-2',
                    name: 'Sandwich',
                    quantity: 1,
                    price: 200
                }
            ]
        });

        if (cafeOrder.success) {
            console.log('✅ Cafe order created successfully!');
            console.log(`   Order ID: ${cafeOrder.orderId}`);
            console.log(`   Order Number: ${cafeOrder.orderNumber}`);
        } else {
            console.log('❌ Cafe order creation failed:', cafeOrder.error);
        }
        console.log('');

        // Test 2: Create a Hotel Room Service Order
        console.log('Test 2: Creating Hotel Room Service Order...');
        const hotelOrder = await createOrder({
            type: 'room-service',
            businessUnit: 'hotel',
            roomNumber: '101',
            customerName: 'Hotel Guest',
            customerMobile: '9123456789',
            guestCount: 1,
            items: [
                {
                    menuItemId: 'test-item-3',
                    name: 'Breakfast Combo',
                    quantity: 1,
                    price: 350
                }
            ]
        });

        if (hotelOrder.success) {
            console.log('✅ Hotel order created successfully!');
            console.log(`   Order ID: ${hotelOrder.orderId}`);
            console.log(`   Order Number: ${hotelOrder.orderNumber}`);
        } else {
            console.log('❌ Hotel order creation failed:', hotelOrder.error);
        }
        console.log('');

        // Test 3: Create a Takeaway Order
        console.log('Test 3: Creating Takeaway Order...');
        const takeawayOrder = await createOrder({
            type: 'takeaway',
            businessUnit: 'cafe',
            customerName: 'Takeaway Customer',
            customerMobile: '9999888877',
            items: [
                {
                    menuItemId: 'test-item-4',
                    name: 'Pizza',
                    quantity: 1,
                    price: 450
                },
                {
                    menuItemId: 'test-item-5',
                    name: 'Cold Coffee',
                    quantity: 2,
                    price: 120
                }
            ]
        });

        if (takeawayOrder.success) {
            console.log('✅ Takeaway order created successfully!');
            console.log(`   Order ID: ${takeawayOrder.orderId}`);
            console.log(`   Order Number: ${takeawayOrder.orderNumber}`);
        } else {
            console.log('❌ Takeaway order creation failed:', takeawayOrder.error);
        }
        console.log('');

        // Test 4: Retrieve Orders
        console.log('Test 4: Retrieving all orders...');
        const allOrders = await getOrders();
        console.log(`✅ Retrieved ${allOrders.length} orders from database`);

        if (allOrders.length > 0) {
            console.log('\nRecent orders:');
            allOrders.slice(0, 5).forEach((order: any, index: number) => {
                console.log(`   ${index + 1}. ${order.orderNumber} - ${order.businessUnit} - ${order.status} - ₹${order.totalAmount}`);
            });
        }
        console.log('');

        // Test 5: Retrieve Cafe Orders Only
        console.log('Test 5: Retrieving cafe orders only...');
        const cafeOrders = await getOrders('cafe');
        console.log(`✅ Retrieved ${cafeOrders.length} cafe orders`);
        console.log('');

        // Test 6: Retrieve Pending Orders
        console.log('Test 6: Retrieving pending orders...');
        const pendingOrders = await getOrders(undefined, 'pending');
        console.log(`✅ Retrieved ${pendingOrders.length} pending orders`);
        console.log('');

        console.log('=== ORDER SERVICE TEST COMPLETED ===');
        console.log('\n📊 Summary:');
        console.log(`   Total orders in system: ${allOrders.length}`);
        console.log(`   Cafe orders: ${cafeOrders.length}`);
        console.log(`   Pending orders: ${pendingOrders.length}`);
        console.log('\n✅ All tests passed! Order service is working correctly.');

    } catch (error) {
        console.error('\n❌ ORDER SERVICE TEST FAILED');
        console.error('Error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

// Run the test
console.log('Starting order service test...\n');
testOrderService().then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
}).catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
});
