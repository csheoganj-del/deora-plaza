"use server"

import { queryDocuments, createDocument, updateDocument, getDocument, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"
import { calculateCustomerTier, getDefaultDiscount, type DiscountTier } from "@/lib/discount-utils"

export async function getCustomers() {
    try {
        const customers = await queryDocuments('customers', [], 'name', 'asc')
        return customers.map((customer: any) => ({
            ...customer,
            createdAt: timestampToDate(customer.createdAt).toISOString(),
            updatedAt: customer.updatedAt ? timestampToDate(customer.updatedAt).toISOString() : null,
            lastVisit: customer.lastVisit ? timestampToDate(customer.lastVisit).toISOString() : null
        }))
    } catch (error) {
        console.error('Error fetching customers:', error)
        return []
    }
}

export async function getCustomerByMobile(mobile: string) {
    try {
        const doc = await adminDb.collection('customers').doc(mobile).get()

        if (!doc.exists) {
            return null
        }

        const data = doc.data()
        return {
            id: doc.id,
            ...data,
            discountTier: data?.discountTier || 'regular',
            customDiscountPercent: data?.customDiscountPercent || undefined,
            totalSpent: data?.totalSpent || 0,
            visitCount: data?.visitCount || 0,
            createdAt: timestampToDate(data?.createdAt).toISOString(),
            updatedAt: data?.updatedAt ? timestampToDate(data.updatedAt).toISOString() : null,
            lastVisit: data?.lastVisit ? timestampToDate(data.lastVisit).toISOString() : null
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
        await adminDb.collection('customers').doc(data.mobileNumber).set({
            mobileNumber: data.mobileNumber,
            name: data.name,
            email: data.email || null,
            notes: data.notes || null,
            visitCount: 0,
            totalSpent: 0,
            discountTier: 'regular',
            preferredBusiness: null,
            createdAt: new Date(),
            lastVisit: null
        })

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
        await adminDb.collection('customers').doc(mobile).update(data)
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
            await adminDb.collection('customers').doc(customerId).update({
                discountTier: newTier,
                updatedAt: dateToTimestamp(new Date()),
            })
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

        await adminDb.collection('customers').doc(customerId).update({
            customDiscountPercent: percent,
            updatedAt: dateToTimestamp(new Date()),
        })

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

        await adminDb.collection('customers').doc(customerId).update({
            totalSpent: newTotalSpent,
            visitCount: newVisitCount,
            lastVisit: dateToTimestamp(new Date()),
            updatedAt: dateToTimestamp(new Date()),
        })

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
        await adminDb.collection('customers').doc(customerId).delete()
        return { success: true }
    } catch (error) {
        console.error('Error deleting customer:', error)
        return { success: false, error }
    }
}
