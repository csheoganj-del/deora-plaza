"use server"

import { queryDocuments, createDocument, updateDocument, getDocument } from "@/lib/firebase/firestore"

export async function getTables(businessUnit: string): Promise<any[]> {
    try {
        const filters = [
            { field: 'businessUnit', operator: '==' as const, value: businessUnit }
        ]

        const tables = await queryDocuments('tables', filters, 'tableNumber', 'asc')
        return tables.map((t: any) => ({
            id: t.id,
            tableNumber: t.tableNumber,
            businessUnit: t.businessUnit,
            capacity: t.capacity,
            status: t.status,
            customerCount: t.customerCount
        }))
    } catch (error) {
        console.error('Error fetching tables:', error)
        return []
    }
}

export async function updateTableStatus(tableId: string, status: string, customerCount?: number) {
    try {
        const updateData: any = { status }
        if (customerCount !== undefined) {
            updateData.customerCount = customerCount
        }

        await updateDocument('tables', tableId, updateData)
        return { success: true }
    } catch (error) {
        console.error('Error updating table status:', error)
        return { success: false, error }
    }
}

export async function createTable(data: {
    tableNumber: string
    businessUnit: string
    capacity: number
}) {
    try {
        const result = await createDocument('tables', {
            ...data,
            status: 'available',
            customerCount: 0
        })
        return result
    } catch (error) {
        console.error('Error creating table:', error)
        return { success: false, error }
    }
}
