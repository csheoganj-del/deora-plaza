"use server";

import { supabaseServer } from "../lib/supabase/server";

export async function diagnoseReport(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🔍 Diagnosing reports for ${date}...`);
    console.log(`Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    try {
        // 1. Fetch ALL bills for the day regardless of unit or status
        const { data: allBills, error } = await supabaseServer
            .from('bills')
            .select('*')
            .gte('createdAt', startOfDay.toISOString())
            .lte('createdAt', endOfDay.toISOString());

        if (error) throw error;

        console.log(`Total bills found: ${allBills?.length || 0}`);

        // 2. Break down by businessUnit
        const unitCounts: Record<string, number> = {};
        const unitRevenue: Record<string, number> = {};

        allBills?.forEach(bill => {
            const unit = bill.businessUnit || 'undefined';
            unitCounts[unit] = (unitCounts[unit] || 0) + 1;
            if (bill.paymentStatus === 'paid') {
                unitRevenue[unit] = (unitRevenue[unit] || 0) + (bill.grandTotal || 0);
            }
        });

        console.log('--- Breakdown by Business Unit ---');
        Object.entries(unitCounts).forEach(([unit, count]) => {
            console.log(`${unit}: ${count} bills, Paid Revenue: ₹${unitRevenue[unit] || 0}`);
        });

        // 3. Check for case sensitivity
        const uniqueUnits = [...new Set(allBills?.map(b => b.businessUnit))];
        console.log('Unique businessUnit values in DB:', uniqueUnits);

        // 4. Sample a few bills
        if (allBills && allBills.length > 0) {
            console.log('--- Sample Bill (First One) ---');
            console.log(JSON.stringify(allBills[0], null, 2));
        }

    } catch (error) {
        console.error('Diagnosis failed:', error);
    }
}
