import * as dotenv from 'dotenv';
import path from 'path';
import { getGardenBookings } from "./src/actions/garden";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    console.log("Fetching garden bookings...");
    const result = await getGardenBookings();
    if ('error' in result) {
        console.error("Error:", result.error);
    } else {
        console.log("Bookings found:", result.bookings.length);
        result.bookings.forEach(b => {
            console.log(`ID: ${b.id}, Customer: ${b.customerName}, Balance: ${b.remainingBalance}, Status: ${b.status}`);
        });
    }
}

run().catch(console.error);
