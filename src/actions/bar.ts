"use server"

import { queryDocuments, createDocument, updateDocument, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function getBarMenu() {
    try {
        const drinks = await queryDocuments('menuItems', [
            { field: 'businessUnit', operator: '==' as const, value: 'bar' }
        ], 'name', 'asc')

        const food = await queryDocuments('menuItems', [
            { field: 'businessUnit', operator: '==' as const, value: 'cafe' }
        ], 'name', 'asc')

        return { drinks, food }
    } catch (error) {
        console.error('Error fetching bar menu:', error)
        return { drinks: [], food: [] }
    }
}

export async function createBarOrder(data: {
    items: Array<{
        menuItemId: string
        name: string
        quantity: number
        price: number
        businessUnit: string
        specialInstructions?: string
    }>
    customerMobile?: string
}) {
    try {
        const timestamp = Date.now()
        const hasDrinks = data.items.some(item => item.businessUnit === 'bar')
        const hasFood = data.items.some(item => item.businessUnit === 'cafe')

        const orders = []

        // Create drink order if has drinks
        if (hasDrinks) {
            const drinkItems = data.items.filter(item => item.businessUnit === 'bar')
            const drinkTotal = drinkItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            const drinkOrder = await createDocument('orders', {
                orderNumber: `BAR-${timestamp}`,
                type: 'bar',
                businessUnit: 'bar',
                customerMobile: data.customerMobile || null,
                status: 'pending',
                totalAmount: drinkTotal,
                items: drinkItems,
                createdAt: dateToTimestamp(new Date())
            })
            orders.push(drinkOrder)
        }

        // Create food order if has food
        if (hasFood) {
            const foodItems = data.items.filter(item => item.businessUnit === 'cafe')
            const foodTotal = foodItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            const foodOrder = await createDocument('orders', {
                orderNumber: `BAR-FOOD-${timestamp}`,
                type: 'takeaway',
                businessUnit: 'cafe',
                customerMobile: data.customerMobile || null,
                status: 'pending',
                totalAmount: foodTotal,
                items: foodItems.map(item => ({
                    ...item,
                    specialInstructions: item.specialInstructions || 'For Bar Table Counter'
                })),
                createdAt: dateToTimestamp(new Date())
            })
            orders.push(foodOrder)
        }

        return { success: true, orders }
    } catch (error) {
        console.error('Error creating bar order:', error)
        return { success: false, error }
    }
}

export async function getBarOrders() {
    try {
        const orders = await queryDocuments('orders', [
            { field: 'businessUnit', operator: '==' as const, value: 'bar' },
            { field: 'status', operator: 'in' as const, value: ['pending', 'preparing', 'ready'] }
        ], 'createdAt', 'desc')

        return orders.map((order: any) => ({
            ...order,
            createdAt: timestampToDate(order.createdAt)
        }))
    } catch (error) {
        console.error('Error fetching bar orders:', error)
        return []
    }
}

export async function updateBarOrderStatus(orderId: string, status: string) {
    try {
        await updateDocument('orders', orderId, { status })
        return { success: true }
    } catch (error) {
        console.error('Error updating bar order status:', error)
        return { success: false, error }
    }
}
