"use server"

import { adminDb } from "@/lib/firebase/admin"
import { revalidatePath } from "next/cache"

async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = adminDb.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        return resolve(0);
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}


/**
 * DANGER: This function deletes ALL transaction data from Firebase
 * Use with extreme caution - this action cannot be undone
 */
export async function resetAllData(password: string) {
    // Password protection
    const RESET_PASSWORD = "KappuLokuHimu#1006" // Same as delete password

    if (password !== RESET_PASSWORD) {
        return { success: false, error: "Invalid password" }
    }

    try {
        const collectionsToDelete = ['bookings', 'bills', 'orders', 'customers', 'counters'];
        
        for (const collectionName of collectionsToDelete) {
            await deleteCollection(collectionName, 500);
        }

        // Revalidate all dashboard paths
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/garden')
        revalidatePath('/dashboard/hotel')
        revalidatePath('/dashboard/bar')
        revalidatePath('/dashboard/customers')
        revalidatePath('/dashboard/billing')
        revalidatePath('/dashboard/owner')

        return {
            success: true,
            message: `Successfully deleted all records.`,
        }
    } catch (error) {
        console.error('Error resetting data:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * DANGER: This function deletes ALL garden bookings from Firebase
 * Use with extreme caution - this action cannot be undone
 */
export async function deleteAllGardenBookings(password: string) {
    // Password protection
    const DELETE_PASSWORD = "KappuLokuHimu#1006"

    if (password !== DELETE_PASSWORD) {
        return { success: false, error: "Invalid password" }
    }

    try {
        const bookingsRef = adminDb.collection('bookings').where('type', '==', 'garden');
        const snapshot = await bookingsRef.get();
        let deleteCount = 0;

        if (!snapshot.empty) {
            const batch = adminDb.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            deleteCount = snapshot.size;
        }

        // also delete garden counters
        const countersRef = adminDb.collection('counters');
        const countersSnapshot = await countersRef.get();
        if(!countersSnapshot.empty){
            const batch = adminDb.batch();
            countersSnapshot.docs.forEach(doc => {
                if (doc.id.startsWith('garden-receipts-')) {
                    batch.delete(doc.ref);
                }
            });
            await batch.commit();
        }

        revalidatePath('/dashboard/garden')
        revalidatePath('/dashboard/owner')

        return {
            success: true,
            message: `Successfully deleted ${deleteCount} garden bookings`,
            deletedCount: deleteCount
        }
    } catch (error) {
        console.error('Error deleting garden bookings:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * DANGER: This function deletes ALL bookings from Firebase
 * Use with extreme caution - this action cannot be undone
 */
export async function deleteAllBookings(password: string) {
    // Password protection
    const DELETE_PASSWORD = "KappuLokuHimu#1006"

    if (password !== DELETE_PASSWORD) {
        return { success: false, error: "Invalid password" }
    }

    try {
        const bookingsRef = adminDb.collection('bookings');
        const snapshot = await bookingsRef.get();
        let deleteCount = 0;

        if(!snapshot.empty){
            const batch = adminDb.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            deleteCount = snapshot.size;
        }
        
        // also delete all counters
        await deleteCollection('counters', 500);
        
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/owner');
        revalidatePath('/dashboard/garden');
        revalidatePath('/dashboard/hotel');

        return {
            success: true,
            message: `Successfully deleted ${deleteCount} bookings`,
            deletedCount: deleteCount
        }
    } catch (error) {
        console.error('Error deleting all bookings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}


/**
 * Get statistics about data that will be deleted
 */
export async function getDataStats() {
    try {
        const stats = {
            allBookings: 0,
            gardenBookings: 0,
            hotelBookings: 0,
            bills: 0,
            orders: 0,
            customers: 0,
            total: 0
        }
        
        const allBookingsSnapshot = await adminDb.collection('bookings').get();
        stats.allBookings = allBookingsSnapshot.size;

        const gardenSnapshot = await adminDb.collection('bookings').where('type', '==', 'garden').get();
        stats.gardenBookings = gardenSnapshot.size;

        const hotelSnapshot = await adminDb.collection('bookings').where('type', '==', 'hotel').get();
        stats.hotelBookings = hotelSnapshot.size;

        const billsSnapshot = await adminDb.collection('bills').get();
        stats.bills = billsSnapshot.size;

        const ordersSnapshot = await adminDb.collection('orders').get();
        stats.orders = ordersSnapshot.size;

        const customersSnapshot = await adminDb.collection('customers').get();
        stats.customers = customersSnapshot.size;
        
        stats.total = stats.allBookings + stats.bills + stats.orders + stats.customers;

        return stats
    } catch (error) {
        console.error('Error getting data stats:', error)
        return null
    }
}
