"use server"

import { queryDocuments, createDocument, updateDocument, getDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"
import { calculateCustomerTier, getDefaultDiscount, type DiscountTier } from "@/lib/discount-utils"

export async function getCustomers() {
    try {
        const customers = await queryDocuments('customers', [], 'name', 'asc')
        const mappedCustomers = customers.map((customer: any) => ({
            ...customer,
            createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString() : null,
            updatedAt: customer.updatedAt ? new Date(customer.updatedAt).toISOString() : null,
        }))
        return mappedCustomers
    } catch (error) {
        console.error('Error fetching customers:', error)
        return []
    }
}

export async function getCustomerByMobile(mobile: string) {
    try {
        const { data, error } = await supabaseServer
            .from('customers')
            .select('*')
            .eq('mobileNumber', mobile)
            .single()

        if (error || !data) {
            return null
        }

        return {
            id: data.id,
            ...data,
            discountTier: data?.discountTier || 'regular',
            customDiscountPercent: data?.customDiscountPercent || undefined,
            totalSpent: data?.totalSpent || 0,
            visitCount: data?.visitCount || 0,
            createdAt: data?.createdAt ? new Date(data.createdAt).toISOString() : null,
            updatedAt: data?.updatedAt ? new Date(data.updatedAt).toISOString() : null,
            lastVisit: data?.lastVisit ? new Date(data.lastVisit).toISOString() : null
        }
    } catch (error) {
        console.error('Error fetching customer:', error)
        return null
    }
}

export async function createCustomer(data: {
    mobileNumber: string
    name: string
    email?: string
    notes?: string
}) {
    try {
        const { error } = await supabaseServer
            .from('customers')
            .upsert({
                mobileNumber: data.mobileNumber,
                name: data.name,
                email: data.email || null,
                visitCount: 0,
                totalSpent: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, {
                onConflict: 'mobileNumber'
            })

        if (error) {
            console.error('Error creating customer:', error);
            throw error
        }

        return { success: true }
    } catch (error) {
        console.error('Error creating customer:', error)
        return { success: false, error }
    }
}

export async function updateCustomer(mobile: string, data: Partial<{
    name: string
    email: string
    notes: string
    discountTier: string
}>) {
    try {
        const { error } = await supabaseServer
            .from('customers')
            .update(data)
            .eq('mobileNumber', mobile)

        if (error) {
            throw error
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating customer:', error)
        return { success: false, error }
    }
}

export async function getCustomerDetails(customerId: string) {
    // customerId is typically the mobile number in our schema
    return getCustomerByMobile(customerId)
}

export async function searchCustomers(query: string) {
    try {
        // Fetch all customers and filter in memory for now
        // Optimization: Use Algolia or similar for real search in production
        const customers = await getCustomers()
        const lowerQuery = query.toLowerCase()

        return customers.filter((c: any) =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.mobileNumber.includes(query)
        )
    } catch (error) {
        console.error('Error searching customers:', error)
        return []
    }
}

/**
 * Get customer suggestions based on partial name or mobile number
 */
export async function getCustomerSuggestions(query: string) {
    try {
        if (!query || query.length < 2) {
            return []
        }

        const customers = await getCustomers()
        const lowerQuery = query.toLowerCase()

        const matches = customers.filter((c: any) =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.mobileNumber.includes(query)
        )

        // Return top 5 matches with discount info
        return matches.slice(0, 5).map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            mobileNumber: customer.mobileNumber,
            discountTier: customer.discountTier || 'regular',
            customDiscountPercent: customer.customDiscountPercent,
            totalSpent: customer.totalSpent || 0,
            visitCount: customer.visitCount || 0,
            lastVisit: customer.lastVisit,
        }))
    } catch (error) {
        console.error('Error getting customer suggestions:', error)
        return []
    }
}

/**
 * Get customer discount information including tier and suggested discount
 */
export async function getCustomerDiscountInfo(customerId: string) {
    try {
        const customer = await getCustomerByMobile(customerId)
        if (!customer) {
            return null
        }

        const tier = customer.discountTier || 'regular'
        const suggestedDiscount = customer.customDiscountPercent || getDefaultDiscount(tier as DiscountTier)

        return {
            tier,
            suggestedDiscount,
            customDiscountPercent: customer.customDiscountPercent,
            totalSpent: customer.totalSpent || 0,
            visitCount: customer.visitCount || 0,
        }
    } catch (error) {
        console.error('Error getting customer discount info:', error)
        return null
    }
}

/**
 * Update customer tier based on their spending and visit count
 */
export async function updateCustomerTier(customerId: string) {
    try {
        const customer = await getCustomerByMobile(customerId)
        if (!customer) {
            return { success: false, error: 'Customer not found' }
        }

        const visitCount = customer.visitCount || 0
        const totalSpent = customer.totalSpent || 0
        const newTier = calculateCustomerTier(visitCount, totalSpent)

        // Only update if tier changed
        if (newTier !== customer.discountTier) {
            const { error } = await supabaseServer
                .from('customers')
                .update({
                    discountTier: newTier,
                    updatedAt: new Date().toISOString(),
                })
                .eq('mobileNumber', customerId)

            if (error) {
                throw error
            }

            return { success: true, newTier, upgraded: true }
        }

        return { success: true, newTier, upgraded: false }
    } catch (error) {
        console.error('Error updating customer tier:', error)
        return { success: false, error }
    }
}

/**
 * Apply a custom discount percentage to a customer
 */
export async function applyCustomDiscount(customerId: string, percent: number) {
    try {
        if (percent < 0 || percent > 100) {
            return { success: false, error: 'Invalid discount percentage' }
        }

        const { error } = await supabaseServer
            .from('customers')
            .update({
                customDiscountPercent: percent,
                updatedAt: new Date().toISOString(),
            })
            .eq('mobileNumber', customerId)

        if (error) {
            throw error
        }

        return { success: true }
    } catch (error) {
        console.error('Error applying custom discount:', error)
        return { success: false, error }
    }
}

/**
 * Update customer's total spent and visit count, then recalculate tier
 */
export async function updateCustomerStats(customerId: string, amountSpent: number) {
    try {
        const customer = await getCustomerByMobile(customerId)
        if (!customer) {
            return { success: false, error: 'Customer not found' }
        }

        const newTotalSpent = (customer.totalSpent || 0) + amountSpent
        const newVisitCount = (customer.visitCount || 0) + 1

        const { error } = await supabaseServer
            .from('customers')
            .update({
                totalSpent: newTotalSpent,
                visitCount: newVisitCount,
                lastVisit: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .eq('mobileNumber', customerId)

        if (error) {
            throw error
        }

        // Update tier based on new stats
        await updateCustomerTier(customerId)

        return { success: true }
    } catch (error) {
        console.error('Error updating customer stats:', error)
        return { success: false, error }
    }
}

export async function deleteCustomer(customerId: string) {
    try {
        console.log(`Starting deletion process for customer ID: ${customerId}`);
        
        // First, we need to get the customer to find their mobile number
        // since the database uses mobileNumber as a unique identifier in some places
        const { data: customerData, error: fetchError } = await supabaseServer
            .from('customers')
            .select('mobileNumber')
            .eq('id', customerId)
            .single();

        if (fetchError || !customerData) {
            console.log("Could not find customer by ID, attempting direct ID deletion");
            // If we can't find by ID, try deleting by the ID directly
            const { error } = await supabaseServer
                .from('customers')
                .delete()
                .eq('id', customerId);

            if (error) {
                console.error("Error deleting by ID:", error);
                throw error;
            }

            console.log("Customer deleted successfully by ID");
            return { success: true };
        }

        const mobileNumber = customerData.mobileNumber;
        console.log(`Found customer mobile: ${mobileNumber}. Proceeding with cleanup.`);

        // Delete related data first (optional, depending on foreign key constraints)
        // Note: If you have ON DELETE CASCADE set up in your DB, this might not be needed.
        // But for safety/completeness:
        
        // 1. Delete bills associated with this customer
        const { error: billsError } = await supabaseServer
            .from('bills')
            .delete()
            .eq('customerMobile', mobileNumber);
            
        if (billsError) console.warn("Error cleaning up bills:", billsError);

        // 2. Delete bookings associated with this customer
        const { error: bookingsError } = await supabaseServer
            .from('bookings')
            .delete()
            .eq('customerMobile', mobileNumber);
            
        if (bookingsError) console.warn("Error cleaning up bookings:", bookingsError);

        // Delete using the mobile number as the unique identifier
        const { error } = await supabaseServer
            .from('customers')
            .delete()
            .eq('mobileNumber', mobileNumber);

        if (error) {
            console.error("Error deleting customer by mobile:", error);
            throw error;
        }

        console.log("Customer and related data deleted successfully");
        return { success: true };
    } catch (error) {
        console.error('Error deleting customer:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function getCustomerTransactions(customerId: string) {
    try {
        // Get customer to find their mobile number
        const customer = await getCustomerByMobile(customerId);
        if (!customer) {
            return { bills: [], bookings: [] };
        }

        const mobileNumber = customer.mobileNumber;

        // Fetch bills for this customer
        const { data: billsData, error: billsError } = await supabaseServer
            .from('bills')
            .select('*')
            .eq('customerMobile', mobileNumber)
            .order('createdAt', { ascending: false })
            .limit(50);

        const bills = billsData?.map((bill: any) => ({
            ...bill,
            createdAt: bill.createdAt ? new Date(bill.createdAt).toISOString() : null,
            type: 'bill'
        })) || [];

        // Fetch bookings for this customer
        const { data: bookingsData, error: bookingsError } = await supabaseServer
            .from('bookings')
            .select('*')
            .eq('customerMobile', mobileNumber)
            .order('createdAt', { ascending: false })
            .limit(50);

        const bookings = bookingsData?.map((booking: any) => ({
            ...booking,
            createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : null,
            startDate: booking.startDate ? new Date(booking.startDate).toISOString() : null,
            endDate: booking.endDate ? new Date(booking.endDate).toISOString() : null,
            type: 'booking'
        })) || [];

        return { bills, bookings };
    } catch (error) {
        console.error('Error fetching customer transactions:', error);
        return { bills: [], bookings: [] };
    }
}

