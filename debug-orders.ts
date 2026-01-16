
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrders() {
    console.log('=== DEBUGGING RECENT ORDERS ===');

    // Get last 5 orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    console.log(`Found ${orders.length} recent orders.`);

    orders.forEach(order => {
        console.log('------------------------------------------------');
        console.log(`Order #${order.orderNumber}`);
        console.log(`ID: ${order.id}`);
        console.log(`Business Unit: '${order.businessUnit}'`); // Quotes to see valid string
        console.log(`Type: '${order.type}'`);
        console.log(`Status: '${order.status}'`);
        console.log(`Room: ${order.roomNumber}`);

        // Check against filter criteria
        const isHotel = order.businessUnit === 'hotel';
        const isRoomService = order.type === 'room-service';
        const isActive = ['pending', 'preparing', 'ready', 'served'].includes(order.status);

        console.log(`Matches 'hotel'? ${isHotel}`);
        console.log(`Matches 'room-service'? ${isRoomService}`);
        console.log(`Is active status? ${isActive}`);
        console.log(`SHOULD SHOW IN DASHBOARD? ${isHotel && isRoomService && isActive ? '✅ YES' : '❌ NO'}`);
    });
}

debugOrders();
