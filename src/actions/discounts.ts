"use server"

import { revalidatePath } from "next/cache"
import { createDocument, updateDocument, deleteDocument, queryDocuments, getDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"

export type DiscountType = 'percentage' | 'fixed'

export interface Discount {
    id: string
    code: string
    type: DiscountType
    value: number
    description?: string
    isActive: boolean
    validFrom: string
    validUntil?: string | null
    usageCount: number
    maxUsage?: number | null
    minOrderValue?: number
    applicableBusinessUnits: string[] | 'all'
    createdAt?: string
    updatedAt?: string
}

const COLLECTION = 'discounts'

export async function getDiscounts(activeOnly: boolean = false) {
    try {
        const filters: any[] = []
        if (activeOnly) {
            filters.push({ field: 'isActive', operator: '==', value: true })
        }

        const discounts = await queryDocuments(COLLECTION, filters, 'createdAt', 'desc') as any[]

        return discounts.map(d => ({
            ...d,
            validFrom: d.validFrom ? new Date(d.validFrom).toISOString() : new Date().toISOString(),
            validUntil: d.validUntil ? new Date(d.validUntil).toISOString() : null,
        })) as Discount[]
    } catch (error) {
        console.error("Error fetching discounts:", error)
        return []
    }
}

export async function createDiscount(data: Omit<Discount, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
    try {
        // Validate code uniqueness
        const existing = await queryDocuments(COLLECTION, [{ field: 'code', operator: '==', value: data.code.toUpperCase() }])
        if (existing.length > 0) {
            return { success: false, error: 'Discount code already exists' }
        }

        const payload = {
            ...data,
            code: data.code.toUpperCase(),
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        const result = await createDocument(COLLECTION, payload)
        revalidatePath('/dashboard/discounts')
        return result
    } catch (error) {
        console.error("Error creating discount:", error)
        return { success: false, error }
    }
}

export async function updateDiscount(id: string, data: Partial<Discount>) {
    try {
        const payload = {
            ...data,
            updatedAt: new Date().toISOString()
        }
        if (payload.code) payload.code = payload.code.toUpperCase()

        const result = await updateDocument(COLLECTION, id, payload)
        revalidatePath('/dashboard/discounts')
        return result
    } catch (error) {
        console.error("Error updating discount:", error)
        return { success: false, error }
    }
}

export async function deleteDiscount(id: string) {
    try {
        const result = await deleteDocument(COLLECTION, id)
        revalidatePath('/dashboard/discounts')
        return result
    } catch (error) {
        console.error("Error deleting discount:", error)
        return { success: false, error }
    }
}

export async function validateDiscount(code: string, orderTotal: number, businessUnit: string) {
    try {
        const discounts = await queryDocuments(COLLECTION, [
            { field: 'code', operator: '==', value: code.toUpperCase() },
            { field: 'isActive', operator: '==', value: true }
        ])

        if (!discounts || discounts.length === 0) {
            return { valid: false, error: 'Invalid or inactive discount code' }
        }

        const discount = discounts[0] as unknown as Discount

        // Check Business Unit
        if (discount.applicableBusinessUnits && discount.applicableBusinessUnits.length > 0) {
            // Handle 'all' separately if it's not in an array, or if array contains 'all'
            const units = Array.isArray(discount.applicableBusinessUnits) ? discount.applicableBusinessUnits : [discount.applicableBusinessUnits];
            if (!units.includes(businessUnit) && !units.includes('all')) {
                return { valid: false, error: 'Discount not applicable for this service' }
            }
        } else if (discount.applicableBusinessUnits === 'all') {
            // Pass
        }

        // Check Expiry
        const now = new Date()
        if (discount.validUntil && new Date(discount.validUntil) < now) {
            return { valid: false, error: 'Discount code has expired' }
        }
        if (discount.validFrom && new Date(discount.validFrom) > now) {
            return { valid: false, error: 'Discount not active yet' }
        }

        // Check Usage Limit
        if (discount.maxUsage && discount.usageCount >= discount.maxUsage) {
            return { valid: false, error: 'Discount usage limit exceeded' }
        }

        // Check Min Order Value
        if (discount.minOrderValue && orderTotal < discount.minOrderValue) {
            return { valid: false, error: `Minimum order value of ₹${discount.minOrderValue} required` }
        }

        // Calculate Discount Amount
        let discountAmount = 0
        if (discount.type === 'percentage') {
            discountAmount = (orderTotal * discount.value) / 100
        } else {
            discountAmount = discount.value
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, orderTotal)

        return {
            valid: true,
            discount: {
                ...discount,
                amount: discountAmount
            }
        }

    } catch (error) {
        console.error("Error validating discount:", error)
        return { valid: false, error: 'Error validating discount' }
    }
}

/**
 * Record a discount usage
 */
export async function recordDiscountUsage(discountId: string) {
    try {
        const discount = await getDocument(COLLECTION, discountId) as any
        if (!discount) return

        await updateDocument(COLLECTION, discountId, {
            usageCount: (discount.usageCount || 0) + 1
        })
    } catch (error) {
        console.error("Error recording discount usage:", error)
    }
}

/**
 * Legacy Support: Record discount history for reporting 
 * (This keeps compatibility with existing billing code that calls this function)
 */
export async function recordDiscount(data: {
    customerId: string
    customerName: string
    billId: string
    businessUnit: string
    originalAmount: number
    discountPercent: number
    discountAmount: number
    finalAmount: number
    appliedBy?: string
    reason?: string
}) {
    try {
        const discountRecord = {
            customerId: data.customerId,
            customerName: data.customerName,
            billId: data.billId,
            businessUnit: data.businessUnit,
            originalAmount: data.originalAmount,
            discountPercent: data.discountPercent,
            discountAmount: data.discountAmount,
            finalAmount: data.finalAmount,
            appliedBy: data.appliedBy || null,
            reason: data.reason || null,
            createdAt: new Date().toISOString(),
        }

        const result = await createDocument('discountHistory', discountRecord)
        return { success: result.success, id: result.data?.id }
    } catch (error) {
        console.error('Error recording discount history:', error)
        return { success: false, error }
    }
}

export async function getDiscountHistory(customerId: string, limit: number = 10) {
    try {
        const history = await queryDocuments(
            'discountHistory',
            [{ field: 'customerId', operator: '==', value: customerId }],
            'createdAt',
            'desc'
        )
        // Limit results
        const limitedHistory = history.slice(0, limit)

        return limitedHistory.map((record: any) => ({
            ...record,
            createdAt: new Date(record.createdAt).toISOString(),
        }))
    } catch (error) {
        console.error('Error fetching discount history:', error)
        return []
    }
}

export async function getDiscountStats(businessUnit?: string) {
    try {
        const filters = businessUnit
            ? [{ field: 'businessUnit', operator: '==', value: businessUnit }]
            : []

        const discounts = await queryDocuments('discountHistory', filters)

        const totalDiscounts = discounts.length
        const totalDiscountAmount = discounts.reduce(
            (sum: number, d: any) => sum + (d.discountAmount || 0),
            0
        )
        const averageDiscountPercent =
            totalDiscounts > 0
                ? discounts.reduce((sum: number, d: any) => sum + (d.discountPercent || 0), 0) /
                totalDiscounts
                : 0

        return {
            totalDiscounts,
            totalDiscountAmount,
            averageDiscountPercent: Math.round(averageDiscountPercent * 100) / 100,
        }
    } catch (error) {
        console.error('Error fetching discount stats:', error)
        return {
            totalDiscounts: 0,
            totalDiscountAmount: 0,
            averageDiscountPercent: 0,
        }
    }
}

export async function getRecentDiscounts(limit: number = 20, businessUnit?: string) {
    try {
        const filters = businessUnit
            ? [{ field: 'businessUnit', operator: '==', value: businessUnit }]
            : []

        const discounts = await queryDocuments('discountHistory', filters, 'createdAt', 'desc')

        const limitedDiscounts = discounts.slice(0, limit)

        return limitedDiscounts.map((record: any) => ({
            ...record,
            createdAt: new Date(record.createdAt).toISOString(),
        }))
    } catch (error) {
        console.error('Error fetching recent discounts:', error)
        return []
    }
}

