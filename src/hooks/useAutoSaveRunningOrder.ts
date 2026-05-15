"use client"

import { useEffect, useRef, useCallback } from 'react'
import { saveRunningOrder, RunningOrderItem } from '@/actions/runningOrders'

interface UseAutoSaveRunningOrderProps {
    tableId: string | null
    businessUnit: string
    items: Record<string, { item: any; qty: number }>
    totals: {
        subtotal: number
        discountPercentage: number
        discountAmount: number
        gstPercentage: number
        gstAmount: number
        total: number
    }
    customerName?: string
    customerMobile?: string
    enabled: boolean
}

/**
 * Auto-saves running order to database with debouncing
 * Saves changes automatically 500ms after last modification
 */
export function useAutoSaveRunningOrder({
    tableId,
    businessUnit,
    items,
    totals,
    customerName,
    customerMobile,
    enabled,
}: UseAutoSaveRunningOrderProps) {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isSavingRef = useRef(false)

    const saveOrder = useCallback(async () => {
        if (!tableId || !enabled || isSavingRef.current) return

        isSavingRef.current = true

        try {
            const orderItems: RunningOrderItem[] = Object.values(items).map((e) => ({
                menuItemId: e.item.id,
                name: e.item.name,
                quantity: e.qty,
                price: e.item.price,
            }))

            await saveRunningOrder({
                tableId,
                businessUnit,
                items: orderItems,
                subtotal: totals.subtotal,
                discountPercent: totals.discountPercentage,
                discountAmount: totals.discountAmount,
                gstPercent: totals.gstPercentage,
                gstAmount: totals.gstAmount,
                total: totals.total,
                customerName,
                customerMobile,
            })

            console.log('✅ Running order auto-saved')
        } catch (error) {
            console.error('Failed to auto-save running order:', error)
        } finally {
            isSavingRef.current = false
        }
    }, [tableId, businessUnit, items, totals, customerName, customerMobile, enabled])

    // Debounced auto-save effect
    useEffect(() => {
        if (!enabled || !tableId) return

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Set new timeout to save after 500ms of inactivity
        saveTimeoutRef.current = setTimeout(() => {
            saveOrder()
        }, 500)

        // Cleanup
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [items, totals, customerName, customerMobile, enabled, tableId, saveOrder])

    // Force save (for manual save button if needed)
    const forceSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        saveOrder()
    }, [saveOrder])

    return { forceSave }
}
