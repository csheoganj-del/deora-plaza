import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoomServiceOrders() {
    console.log('=== Checking Room Service Orders ===\n');

    // Get recent orders
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('type', 'room-service')
        .order('createdAt', { ascending: false })
        .limit(10);

    if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
    }

    console.log(`Found ${orders?.length || 0} room service orders:\n`);
    orders?.forEach((order, idx) => {
        console.log(`${idx + 1}. Order ${order.orderNumber}`);
        console.log(`   ID: ${order.id}`);
        console.log(`   Booking ID: ${order.bookingId || 'NOT LINKED'}`);
        console.log(`   Room: ${order.roomNumber || 'N/A'}`);
        console.log(`   Business Unit: ${order.businessUnit}`);
        console.log(`   Total: ₹${order.totalAmount}`);
        console.log(`   Linked to Booking: ${order.linkedToBooking ? 'YES' : 'NO'}`);
        console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
        console.log('');
    });

    // Get bookings with room service charges
    console.log('\n=== Checking Bookings with Room Service Charges ===\n');

    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, guestName, roomNumber, roomServiceCharges, roomServiceTotal')
        .not('roomServiceCharges', 'is', null)
        .order('createdAt', { ascending: false })
        .limit(10);

    if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
    }

    console.log(`Found ${bookings?.length || 0} bookings with room service charges:\n`);
    bookings?.forEach((booking, idx) => {
        console.log(`${idx + 1}. Booking ${booking.id.slice(0, 8)}`);
        console.log(`   Guest: ${booking.guestName}`);
        console.log(`   Room: ${booking.roomNumber}`);
        console.log(`   Room Service Total: ₹${booking.roomServiceTotal || 0}`);
        console.log(`   Charges: ${JSON.stringify(booking.roomServiceCharges, null, 2)}`);
        console.log('');
    });

    // Check for Room 101 specifically
    console.log('\n=== Checking Room 101 Booking ===\n');

    const { data: room101Booking, error: room101Error } = await supabase
        .from('bookings')
        .select('*')
        .eq('roomNumber', '101')
        .in('status', ['confirmed', 'checked-in'])
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

    if (room101Error) {
        console.error('Error fetching Room 101 booking:', room101Error);
    } else if (room101Booking) {
        console.log(`Booking ID: ${room101Booking.id}`);
        console.log(`Guest: ${room101Booking.guestName}`);
        console.log(`Status: ${room101Booking.status}`);
        console.log(`Room Service Charges:`, room101Booking.roomServiceCharges);
        console.log(`Room Service Total: ₹${room101Booking.roomServiceTotal || 0}`);
    } else {
        console.log('No active booking found for Room 101');
    }
}

checkRoomServiceOrders().then(() => {
    console.log('\n=== Check Complete ===');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
