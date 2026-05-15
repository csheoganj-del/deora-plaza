import * as dotenv from 'dotenv';
import path from 'path';
import { addGardenBookingPayment } from "./src/actions/garden";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const bookingId = "c18a033f-aa25-4ab2-9104-4505a377b266";
    const amount = 1;
    console.log(`Attempting to record payment of ₹${amount} for booking ${bookingId}...`);

    try {
        const result = await addGardenBookingPayment(bookingId, amount, "partial");
        if (result.error) {
            console.error("Error recording payment:", result.error);
        } else {
            console.log("Success! Updated booking:", JSON.stringify(result.booking, null, 2));
        }
    } catch (e) {
        console.error("Caught error:", e);
    }
}

run().catch(console.error);
