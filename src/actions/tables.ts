"use server"

import { queryDocuments, createDocument, updateDocument, getDocument, deleteDocument, serializeTimestamps } from "@/lib/firebase/firestore"

export async function getTables(businessUnit?: string): Promise<any[]> {
    try {
        const filters = businessUnit ? [
            { field: 'businessUnit', operator: '==' as const, value: businessUnit }
        ] : []

        const tables = await queryDocuments('tables', filters)

        // Sort in-memory to avoid missing index error on composite query
        tables.sort((a: any, b: any) => String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true }));

        // Serialize timestamps to avoid passing non-plain objects to client components
        const serializedTables = serializeTimestamps(tables);

        return serializedTables.map((t: any) => ({
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

        if (result.success && result.id) {
            const newTable = await getDocument('tables', result.id);
            return { success: true, table: serializeTimestamps(newTable) };
        }

        return { success: false, error: 'Failed to create table or get ID' }
    } catch (error) {
        console.error('Error creating table:', error)
        return { success: false, error: 'Failed to create table' }
    }
}

export async function updateTable(tableId: string, data: { tableNumber?: string; capacity?: number }) {
    try {
        await updateDocument('tables', tableId, data)
        return { success: true }
    } catch (error) {
        console.error('Error updating table:', error)
        return { success: false, error: 'Failed to update table' }
    }
}

export async function deleteTable(tableId: string, password?: string) {
    try {
        const DELETION_PASSWORD = 'KappuLokuHimu#1006'
        if (password !== DELETION_PASSWORD) {
            return { success: false, error: 'Invalid password' }
        }

        await deleteDocument('tables', tableId)
        return { success: true }
    } catch (error) {
        console.error('Error deleting table:', error)
        return { success: false, error: 'Failed to delete table' }
    }
}
