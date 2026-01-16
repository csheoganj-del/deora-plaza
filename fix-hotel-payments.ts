
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key to bypass RLS

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPaymentData() {
    console.log("Checking hotel bookings payment data...");
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('type', 'hotel');

    if (error) {
        console.error("Error fetching bookings:", error);
        return;
    }

    console.log(`Found ${bookings.length} hotel bookings.`);

    for (const booking of bookings) {
        let shouldUpdate = false;
        let updates: any = {};

        // Check payments array
        const payments = booking.payments || [];
        const advance = Number(booking.advancePayment || 0);

        // Ensure payments array logic is consistent with paidAmount
        let calculatedTotalPaid = 0;

        // If payments array is empty but there is an advance payment, migrate it (double check)
        if (payments.length === 0 && advance > 0) {
            console.log(`Booking ${booking.id} has advance ${advance} but empty payments. Migrating...`);
            const newPayment = {
                id: `advance_${booking.id}`,
                amount: advance,
                type: 'advance',
                method: 'cash', // Default
                date: booking.createdAt,
                createdAt: booking.createdAt
            };
            updates.payments = [newPayment];
            calculatedTotalPaid = advance;
            shouldUpdate = true;
        } else {
            // Calculate total from existing payments
            calculatedTotalPaid = payments.reduce((sum: any, p: any) => sum + (Number(p.amount) || 0), 0);
        }

        const currentPaidAmount = Number(booking.paidAmount || 0);

        // Check if paidAmount matches calculated total
        if (Math.abs(currentPaidAmount - calculatedTotalPaid) > 0.1) {
            console.log(`Booking ${booking.id}: paidAmount (${currentPaidAmount}) != calculated (${calculatedTotalPaid}). Fixing...`);
            updates.paidAmount = calculatedTotalPaid;
            updates.remainingBalance = (booking.totalAmount || 0) - calculatedTotalPaid;

            if (updates.remainingBalance <= 0) {
                updates.paymentStatus = 'completed';
            } else if (calculatedTotalPaid > 0) {
                updates.paymentStatus = 'partial';
            } else {
                updates.paymentStatus = 'pending';
            }

            shouldUpdate = true;
        }

        if (shouldUpdate) {
            if (!updates.payments && payments.length > 0) {
                // If we're updating paidAmount but not payments locally, keep existing payments
                // No need to set updates.payments unless we changed it
            }

            const { error: updateError } = await supabase
                .from('bookings')
                .update(updates)
                .eq('id', booking.id);

            if (updateError) {
                console.error(`Error updating booking ${booking.id}:`, updateError);
            } else {
                console.log(`Fixed booking ${booking.id}`);
            }
        } else {
            console.log(`Booking ${booking.id} is correct.`);
        }
    }
}

fixPaymentData();
