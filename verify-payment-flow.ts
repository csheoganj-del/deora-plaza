
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSimulation() {
    console.log("🚀 Starting Booking & Payment Simulation...");

    const roomId = "sim_room_" + Date.now();
    const roomNumber = "999-TEST";

    // 1. Create a Test Room (if needed, or just insert booking with mock roomId)
    // We'll trust the foreign key isn't strict or we'll assume a room exists. 
    // Actually, let's just inspect an existing room or create a dummy one.
    // To be safe, we'll try to find an existing room first.

    const { data: existingRooms } = await supabase.from('rooms').select('id, number').limit(1);
    const targetRoomId = existingRooms?.[0]?.id || roomId;
    const targetRoomNumber = existingRooms?.[0]?.number || roomNumber;

    console.log(`Using Room: ${targetRoomNumber} (${targetRoomId})`);

    // 2. Create a Booking (Advance Only)
    const bookingId = crypto.randomUUID();
    const totalAmount = 1000;
    const advanceAmount = 200;

    const newBooking = {
        id: bookingId,
        type: 'hotel',
        guestName: 'Simulation Guest',
        totalAmount: totalAmount,
        advancePayment: advanceAmount,
        paidAmount: advanceAmount, // Logic usually sets this on creation
        remainingBalance: totalAmount - advanceAmount,
        paymentStatus: 'partial',
        status: 'confirmed',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        roomId: targetRoomId,
        roomNumber: targetRoomNumber,
        customerMobile: "9999999999",
        createdAt: new Date().toISOString(),
        payments: [
            {
                id: 'payment_init',
                amount: advanceAmount,
                type: 'advance',
                date: new Date().toISOString()
            }
        ]
    };

    console.log("\n1️⃣ Creating Booking with Advance Payment...");
    const { error: createError } = await supabase.from('bookings').insert(newBooking);

    if (createError) {
        console.error("❌ Creation Failed:", createError);
        return;
    }
    console.log("✅ Booking Created.");

    // 3. Verify Initial State
    let { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    console.log(`   Initial State -> Paid: ${booking.paidAmount}, Bal: ${booking.remainingBalance}, Payments: ${booking.payments?.length}`);

    if (booking.paidAmount !== 200) console.warn("   ⚠️ WARNING: Initial paidAmount mismatch!");

    // 4. Simulate 'addHotelPayment' Logic (Recording Final Payment)
    console.log("\n2️⃣ Recording Final Payment (₹800)...");

    const finalPaymentAmount = 800;
    const newPayment = {
        id: `payment_final_${Date.now()}`,
        amount: finalPaymentAmount,
        type: 'full',
        method: 'cash',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    // Re-fetch current arrays to simulate concurrent safety
    const currentPayments = booking.payments || [];
    const updatedPayments = [...currentPayments, newPayment];

    // Recalculate Totals
    const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const remainingBalance = booking.totalAmount - totalPaid;
    const paymentStatus = remainingBalance <= 0 ? 'completed' : 'partial';
    const isFullyPaid = remainingBalance <= 0;

    const updates: any = {
        payments: updatedPayments,
        paidAmount: totalPaid,
        remainingBalance,
        paymentStatus,
        updatedAt: new Date().toISOString()
    };

    if (isFullyPaid) {
        updates.status = 'checked-out';
        updates.checkOut = new Date().toISOString();
    }

    const { error: updateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

    if (updateError) {
        console.error("❌ Update Failed:", updateError);
    } else {
        console.log("✅ Update Success.");
    }

    // 5. Verify Final State
    console.log("\n3️⃣ Verifying Final Database State...");
    const { data: finalBooking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();

    console.log(`   Final State -> Paid: ${finalBooking.paidAmount}, Bal: ${finalBooking.remainingBalance}, Payments: ${finalBooking.payments?.length}, Status: ${finalBooking.status}`);

    if (finalBooking.paidAmount === 1000 && finalBooking.remainingBalance === 0) {
        console.log("🎉 SUCCESS: Database updated correctly!");
    } else {
        console.error("❌ FAILURE: Database values are wrong!");
        console.log("   Expected Paid: 1000, Got:", finalBooking.paidAmount);
    }

    // 6. Cleanup
    console.log("\n🧹 Cleaning up...");
    await supabase.from('bookings').delete().eq('id', bookingId);
    console.log("Done.");
}

runSimulation();
