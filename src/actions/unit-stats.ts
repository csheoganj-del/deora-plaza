"use server";

import { supabaseServer } from "@/lib/supabase/server";

export interface UnitMetrics {
    dailyRevenue: number;
    ordersToday: number;
    activeTables: number;
    totalTables: number;
    averageOrderValue: number;
    popularItems: Array<{ name: string; count: number; revenue: number }>;
}

/**
 * Safely parses the items field from a bill.
 * The field can be a JSON string, an array, or a single object.
 */
function parseItems(items: any): any[] {
    if (!items) return [];

    let parsed = items;
    if (typeof items === 'string') {
        try {
            parsed = JSON.parse(items);
        } catch (e) {
            console.error("Failed to parse items string:", e);
            return [];
        }
    }

    if (Array.isArray(parsed)) {
        return parsed;
    }

    if (typeof parsed === 'object' && parsed !== null) {
        return [parsed];
    }

    return [];
}

export async function getUnitMetrics(unit: string, startDate?: string, endDate?: string): Promise<UnitMetrics> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const start = startDate || today.toISOString();
        const end = endDate || tomorrow.toISOString();

        // 1. Fetch Paid Bills for the period
        let query = supabaseServer
            .from('bills')
            .select('grandTotal, items')
            .eq('paymentStatus', 'paid')
            .gte('createdAt', start)
            .lt('createdAt', end);

        if (unit.toLowerCase() !== 'all') {
            query = query.eq('businessUnit', unit.toLowerCase());
        }

        const { data: bills, error: billsError } = await query;

        if (billsError) throw billsError;

        const dailyRevenue = bills?.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0) || 0;
        const ordersToday = bills?.length || 0;
        const averageOrderValue = ordersToday > 0 ? dailyRevenue / ordersToday : 0;

        // 2. Calculate popular items
        const itemMap = new Map<string, { count: number; revenue: number }>();
        bills?.forEach(bill => {
            const items = parseItems(bill.items);
            items.forEach(item => {
                const name = item.name || 'Unknown Item';
                const price = item.price || 0;
                const qty = item.quantity || 1;
                const existing = itemMap.get(name) || { count: 0, revenue: 0 };
                itemMap.set(name, {
                    count: existing.count + qty,
                    revenue: existing.revenue + (price * qty)
                });
            });
        });

        const popularItems = Array.from(itemMap.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 3. Fetch active tables if it's a dine-in unit (Simplified for now)
        let activeTables = 0;
        let totalTables = 0;

        if (unit.toLowerCase() === 'cafe' || unit.toLowerCase() === 'restaurant' || unit.toLowerCase() === 'all') {
            const { count: activeCount } = await supabaseServer
                .from('tables')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'occupied');

            const { count: totalCount } = await supabaseServer
                .from('tables')
                .select('*', { count: 'exact', head: true });

            activeTables = activeCount || 0;
            totalTables = totalCount || 0;
        }

        return {
            dailyRevenue,
            ordersToday,
            activeTables,
            totalTables,
            averageOrderValue,
            popularItems
        };

    } catch (error) {
        console.error(`Error in getUnitMetrics for ${unit}:`, error);
        return {
            dailyRevenue: 0,
            ordersToday: 0,
            activeTables: 0,
            totalTables: 0,
            averageOrderValue: 0,
            popularItems: []
        };
    }
}

export async function getUnitDailyReport(unit: string, startDate: string, endDate: string) {
    try {

        let query = supabaseServer
            .from('bills')
            .select('*')
            .eq('paymentStatus', 'paid')
            .gte('createdAt', startDate)
            .lte('createdAt', endDate);

        if (unit.toLowerCase() !== 'all') {
            query = query.eq('businessUnit', unit.toLowerCase());
        }

        const { data: bills, error } = await query;


        if (error) {
            console.error('[getUnitDailyReport] Query Error:', error);
            throw error;
        }


        const totalRevenue = bills?.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0) || 0;
        const totalOrders = bills?.length || 0;
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        // Calculate popular items for the report summary
        const itemMap = new Map<string, number>();
        bills?.forEach(bill => {
            const items = parseItems(bill.items);
            items.forEach(item => {
                const name = item.name || 'Unknown Item';
                const qty = item.quantity || 1;
                itemMap.set(name, (itemMap.get(name) || 0) + qty);
            });
        });

        const topSellingItem = Array.from(itemMap.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No Data';

        return {
            summary: {
                totalRevenue,
                totalOrders,
                totalCustomers: totalOrders, // Simplified
                avgOrderValue,
                topSellingItem,
                peakHour: 'Calculated from items'
            },
            staff: {
                totalStaff: 0,
                avgEfficiency: 0,
                topPerformer: 'N/A'
            },
            inventory: {
                lowStockItems: 0,
                autoDeductions: 0,
                reorderAlerts: 0
            },
            issues: {
                cancelledOrders: 0,
                complaints: 0,
                systemDowntime: 0
            }
        };
    } catch (error) {
        console.error(`Error in getUnitDailyReport for ${unit}:`, error);
        throw error;
    }
}
