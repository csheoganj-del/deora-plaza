"use server"

import { createDocument, queryDocuments, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

/**
 * Record a discount in the discount history
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
            createdAt: dateToTimestamp(new Date()),
        }

        const result = await createDocument('discountHistory', discountRecord)
        return { success: result.success, id: result.id }
    } catch (error) {
        console.error('Error recording discount:', error)
        return { success: false, error }
    }
}

/**
 * Get discount history for a specific customer
 */
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
            createdAt: timestampToDate(record.createdAt).toISOString(),
        }))
    } catch (error) {
        console.error('Error fetching discount history:', error)
        return []
    }
}

/**
 * Get discount statistics for analytics
 */
export async function getDiscountStats(businessUnit?: string) {
    try {
        const filters = businessUnit
            ? [{ field: 'businessUnit', operator: '==' as const, value: businessUnit }]
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

/**
 * Get recent discounts across all customers
 */
export async function getRecentDiscounts(limit: number = 20, businessUnit?: string) {
    try {
        const filters = businessUnit
            ? [{ field: 'businessUnit', operator: '==' as const, value: businessUnit }]
            : []

        const discounts = await queryDocuments('discountHistory', filters, 'createdAt', 'desc')

        const limitedDiscounts = discounts.slice(0, limit)

        return limitedDiscounts.map((record: any) => ({
            ...record,
            createdAt: timestampToDate(record.createdAt).toISOString(),
        }))
    } catch (error) {
        console.error('Error fetching recent discounts:', error)
        return []
    }
}
