
import { createClient } from '../src/lib/supabase/client';
import "dotenv/config";

async function checkTables() {
    const supabase = createClient();

    console.log("Checking tables C01 and C02...");
    const { data: tables, error } = await supabase
        .from('tables')
        .select('*')
        .in('tableNumber', ['C01', 'C02']);

    if (error) {
        console.error("Error fetching tables:", error);
        return;
    }

    console.log("Tables Data:", JSON.stringify(tables, null, 2));

    for (const table of tables) {
        if (table.currentOrderId) {
            console.log(`Checking order ${table.currentOrderId} for table ${table.tableNumber}...`);
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', table.currentOrderId)
                .single();

            if (orderError) {
                console.error(`Error fetching order ${table.currentOrderId}:`, orderError);
            } else {
                console.log(`Order Data for ${table.tableNumber}:`, JSON.stringify(order, null, 2));
            }
        } else {
            console.log(`Table ${table.tableNumber} has NO currentOrderId.`);
        }
    }
}

checkTables();
