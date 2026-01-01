"use server"

import { revalidatePath } from "next/cache"
import { requireDeletePermission } from '@/lib/auth-helpers'
import { validateInput, deletePasswordSchema } from '@/lib/validation'
import { auditSystemReset } from '@/lib/audit'
import { supabaseServer } from "@/lib/supabase/server"

/**
 * DANGER: This function deletes ALL transaction data from Supabase
 * Use with extreme caution - this action cannot be undone
 */
export async function resetAllData(password: string) {
    try {
        // SECURITY: Only super_admin can reset data
        await requireDeletePermission()
        
        // Delete all transactions
        const { error: transactionsError } = await supabaseServer
            .from('transactions')
            .delete()
            .neq('id', ''); // Delete all records
            
        if (transactionsError) {
            throw transactionsError;
        }

        // Delete all bills
        const { error: billsError } = await supabaseServer
            .from('bills')
            .delete()
            .neq('id', '');
            
        if (billsError) {
            throw billsError;
        }

        // Delete all orders
        const { error: ordersError } = await supabaseServer
            .from('orders')
            .delete()
            .neq('id', '');
            
        if (ordersError) {
            throw ordersError;
        }

        // Delete all customers
        const { error: customersError } = await supabaseServer
            .from('customers')
            .delete()
            .neq('id', '');
            
        if (customersError) {
            throw customersError;
        }

        // Delete all counters
        const { error: countersError } = await supabaseServer
            .from('counters')
            .delete()
            .neq('id', '');
            
        if (countersError) {
            throw countersError;
        }

        await auditSystemReset(true)
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/owner')

        return {
            success: true,
            message: `Successfully reset all data`,
        }
    } catch (error) {
        await auditSystemReset(false, error instanceof Error ? error.message : 'Unknown error')
        console.error('Error resetting data:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * DANGER: This function deletes ALL garden bookings from Supabase
 * Use with extreme caution - this action cannot be undone
 */
export async function deleteAllGardenBookings(password: string) {
    try {
        // SECURITY: Only super_admin can delete data
        await requireDeletePermission()
        
        // Delete garden bookings
        const { error: bookingsError } = await supabaseServer
            .from('bookings')
            .delete()
            .eq('type', 'garden');
            
        if (bookingsError) {
            throw bookingsError;
        }

        // Delete garden counters
        const { error: countersError } = await supabaseServer
            .from('counters')
            .delete()
            .ilike('id', 'garden-receipts-%');
            
        if (countersError) {
            throw countersError;
        }

        revalidatePath('/dashboard/garden')
        revalidatePath('/dashboard/owner')

        return {
            success: true,
            message: `Successfully deleted garden bookings`,
        }
    } catch (error) {
        console.error('Error deleting garden bookings:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * DANGER: This function deletes ALL bookings from Supabase
 * Use with extreme caution - this action cannot be undone
 */
export async function deleteAllBookings(password: string) {
    try {
        // SECURITY: Only super_admin can delete data
        await requireDeletePermission()
        
        // Delete all bookings
        const { error: bookingsError } = await supabaseServer
            .from('bookings')
            .delete()
            .neq('id', '');
            
        if (bookingsError) {
            throw bookingsError;
        }
        
        // Delete all counters
        const { error: countersError } = await supabaseServer
            .from('counters')
            .delete()
            .neq('id', '');
            
        if (countersError) {
            throw countersError;
        }
        
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/owner');
        revalidatePath('/dashboard/garden');
        revalidatePath('/dashboard/hotel');

        return {
            success: true,
            message: `Successfully deleted all bookings`,
        }
    } catch (error) {
        console.error('Error deleting all bookings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

