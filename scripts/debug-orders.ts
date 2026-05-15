
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseServer } from '../src/lib/supabase/server';

async function testOrders() {
    console.log('Testing Orders Query...');

    // Query all orders to see what exists
    const { data: allOrders, error } = await supabaseServer
        .from('orders')
        .select('*');

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log(`Found ${allOrders.length} orders total.`);

    allOrders.forEach(order => {
        console.log(`Order ${order.orderNumber} (ID: ${order.id}):`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Business Unit: ${order.businessUnit}`);
        console.log(`  Table: ${order.tableNumber}`);
        console.log(`  Is Paid: ${order.isPaid}`);
        console.log(`  Created At: ${order.createdAt}`);
    });
}

testOrders().catch(console.error);
