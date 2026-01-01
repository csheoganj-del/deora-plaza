"use server"

import { queryDocuments, createDocument, updateDocument, getDocument, deleteDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTables(businessUnit?: string): Promise<any[]> {
    try {
        const filters = businessUnit ? [
            { field: 'businessUnit', operator: '==', value: businessUnit }
        ] : []

        const tables = await queryDocuments('tables', filters)

        // Sort in-memory to avoid missing index error on composite query
        tables.sort((a: any, b: any) => String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true }));

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

        if (result.success && result.data?.id) {
            const newTable = await getDocument('tables', result.data.id);
            return { success: true, table: newTable };
        }

        // Provide more specific error messages
        if (result.error) {
            // Check for unique constraint violation
            if (result.error.includes('unique constraint') || result.error.includes('duplicate key')) {
                return { success: false, error: `A table with number "${data.tableNumber}" already exists in the ${data.businessUnit} unit. Please choose a different table number.` }
            }
            
            // Check for other common database errors
            if (result.error.includes('null value')) {
                return { success: false, error: 'Required field is missing. Please check all fields are filled correctly.' }
            }
            
            // Return the original error if we can't provide a more specific message
            return { success: false, error: result.error }
        }

        return { success: false, error: 'Failed to create table or get ID' }
    } catch (error) {
        console.error('Error creating table:', error)
        return { success: false, error: 'Failed to create table' }
    }
}

export async function updateTable(tableId: string, data: { tableNumber?: string; capacity?: number }) {
    try {
        // First, check if we're trying to change the table number
        if (data.tableNumber) {
            // Get the current table to check business unit
            const currentTable = await getDocument('tables', tableId);
            if (currentTable) {
                // Check if another table already exists with this table number in the same business unit
                const { data: existingTables, error: queryError } = await supabaseServer
                    .from('tables')
                    .select('id')
                    .eq('tableNumber', data.tableNumber)
                    .eq('businessUnit', currentTable.businessUnit)
                    .neq('id', tableId); // Exclude the current table

                if (queryError) {
                    throw new Error(`Database query failed: ${queryError.message}`);
                }

                if (existingTables && existingTables.length > 0) {
                    return {
                        success: false,
                        error: `A table with number "${data.tableNumber}" already exists in this business unit. Please choose a different table number.`
                    };
                }
            }
        }

        await updateDocument('tables', tableId, data)
        return { success: true }
    } catch (error: any) {
        console.error('Error updating table:', error)
        // Provide a more user-friendly error message
        if (error.message && error.message.includes('unique constraint')) {
            return {
                success: false,
                error: 'This table number already exists in this business unit. Please choose a different table number.'
            };
        }
        return { success: false, error: error.message || 'Failed to update table' }
    }
}

export async function deleteTable(tableId: string, password?: string) {
    try {
        // Password validation handled with environment variable

        const { error } = await supabaseServer
            .from('tables')
            .delete()
            .eq('id', tableId)

        if (error) throw error

        revalidatePath('/dashboard/tables')
        return { success: true }
    } catch (error) {
        console.error('Error deleting table:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

