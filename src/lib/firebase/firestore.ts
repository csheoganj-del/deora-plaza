
import { adminDb } from './admin'
import { Timestamp, WhereFilterOp } from 'firebase-admin/firestore'

// Generic CRUD operations

export async function createDocument(collectionName: string, data: any) {
    try {
        const docRef = await adminDb.collection(collectionName).add({
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        })
        return { success: true, id: docRef.id }
    } catch (error) {
        console.error(`Error creating document in ${collectionName}: `, error)
        return { success: false, error }
    }
}

export async function getDocument(collectionName: string, docId: string) {
    try {
        const docRef = adminDb.collection(collectionName).doc(docId)
        const docSnap = await docRef.get()

        if (!docSnap.exists) {
            return null
        }

        return {
            id: docSnap.id,
            ...docSnap.data()
        }
    } catch (error) {
        console.error(`Error getting document from ${collectionName}: `, error)
        return null
    }
}

export async function updateDocument(collectionName: string, docId: string, data: any) {
    try {
        const docRef = adminDb.collection(collectionName).doc(docId)
        await docRef.update({
            ...data,
            updatedAt: Timestamp.now()
        })
        return { success: true }
    } catch (error) {
        console.error(`Error updating document in ${collectionName}: `, error)
        return { success: false, error }
    }
}

export async function deleteDocument(collectionName: string, docId: string) {
    try {
        await adminDb.collection(collectionName).doc(docId).delete()
        return { success: true }
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}: `, error)
        return { success: false, error }
    }
}

export async function queryDocuments(
    collectionName: string,
    filters: Array<{ field: string; operator: WhereFilterOp; value: any }> = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
) {
    try {
        let query: any = adminDb.collection(collectionName)

        // Apply filters
        filters.forEach(filter => {
            query = query.where(filter.field, filter.operator, filter.value)
        })

        // Apply ordering
        if (orderByField) {
            query = query.orderBy(orderByField, orderDirection)
        }

        // Apply limit
        if (limitCount) {
            query = query.limit(limitCount)
        }

        const snapshot = await query.get()

        return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error(`Error querying ${collectionName}: `, error)
        return []
    }
}

// Convert Firestore Timestamp to Date
export function timestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date()
    if (timestamp.toDate) return timestamp.toDate()
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000)
    return new Date(timestamp)
}

// Convert Date to Firestore Timestamp
export function dateToTimestamp(date: Date) {
    return Timestamp.fromDate(date)
}

