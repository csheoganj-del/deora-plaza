
import { adminDb } from './admin'
import { Timestamp, WhereFilterOp } from 'firebase-admin/firestore'

// Generic CRUD operations

export async function createDocument(collectionName: string, data: any, docId?: string) {
    try {
        let docRef
        const docData = {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        }

        if (docId) {
            docRef = adminDb.collection(collectionName).doc(docId)
            await docRef.set(docData)
        } else {
            docRef = await adminDb.collection(collectionName).add(docData)
        }
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

// Recursively convert all Firestore Timestamps in an object to ISO strings
export function serializeTimestamps(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj
    }

    // Handle Date objects directly
    if (obj instanceof Date) {
        return obj.toISOString()
    }

    // Handle primitive types (return as is, except BigInt)
    if (typeof obj !== 'object') {
        // Convert BigInt to number (or string if too large, but for timestamps number is usually fine)
        if (typeof obj === 'bigint') {
            return Number(obj)
        }
        return obj
    }

    // Handle Firestore Timestamp (official)
    if (typeof obj.toDate === 'function') {
        try {
            return obj.toDate().toISOString()
        } catch (e) {
            // Fallback if toDate fails
        }
    }

    // Handle object with seconds/_seconds
    // Check for seconds/_seconds property
    const seconds = obj.seconds ?? obj._seconds
    const nanoseconds = obj.nanoseconds ?? obj._nanoseconds

    if (seconds !== undefined) {
        let secondsNum: number | null = null

        if (typeof seconds === 'number') {
            secondsNum = seconds
        } else if (typeof seconds === 'bigint') {
            secondsNum = Number(seconds)
        } else if (typeof seconds === 'string') {
            secondsNum = Number(seconds)
        } else if (typeof seconds === 'object' && seconds && 'toNumber' in seconds) {
            // Handle Long.js or similar objects
            try {
                secondsNum = seconds.toNumber()
            } catch (e) { }
        }

        if (secondsNum !== null) {
            return new Date(secondsNum * 1000).toISOString()
        }
    }

    if (Array.isArray(obj)) {
        return obj.map(item => serializeTimestamps(item))
    }

    // Deep clone object to ensure it's a plain object
    const serialized: any = {}
    for (const key in obj) {
        // Skip prototype properties just in case
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            serialized[key] = serializeTimestamps(obj[key])
        }
    }
    return serialized
}

