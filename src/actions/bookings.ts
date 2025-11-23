"use server"

import { queryDocuments, createDocument, updateDocument, getDocument, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

export async function getAvailableRooms(startDate: Date, endDate: Date) {
    try {
        // Get all rooms
        const allRooms = await queryDocuments('rooms', [
            { field: 'status', operator: '==' as const, value: 'available' }
        ])

        // Get bookings that overlap with requested dates
        const bookingsSnapshot = await adminDb.collection('bookings')
            .where('type', '==', 'hotel')
            .where('status', 'in', ['confirmed', 'checked_in'])
            .get()

        const bookedRoomIds = new Set()
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data()
            const bookingStart = booking.startDate.toDate()
            const bookingEnd = booking.endDate.toDate()

            // Check if dates overlap
            if (bookingStart <= endDate && bookingEnd >= startDate) {
                if (booking.roomId) {
                    bookedRoomIds.add(booking.roomId)
                }
            }
        })

        // Filter out booked rooms
        return allRooms.filter((room: any) => !bookedRoomIds.has(room.id))
    } catch (error) {
        console.error('Error fetching available rooms:', error)
        return []
    }
}

export async function createBooking(data: {
    customerMobile: string
    type: 'hotel' | 'garden'
    startDate: Date
    endDate: Date
    roomId?: string
    notes?: string
    totalAmount: number
    eventType?: string
    guestCount?: number
    eventTime?: string
    advancePayment?: number
}) {
    try {
        // Check if customer exists, create if not
        const customerDoc = await adminDb.collection('customers').doc(data.customerMobile).get()

        if (!customerDoc.exists) {
            await adminDb.collection('customers').doc(data.customerMobile).set({
                mobileNumber: data.customerMobile,
                name: 'Guest',
                visitCount: 0,
                totalSpent: 0,
                discountTier: 'regular',
                createdAt: dateToTimestamp(new Date())
            })
        }

        const bookingData = {
            customerMobile: data.customerMobile,
            type: data.type,
            startDate: dateToTimestamp(data.startDate),
            endDate: dateToTimestamp(data.endDate),
            roomId: data.roomId || null,
            notes: data.notes || null,
            totalAmount: data.totalAmount,
            status: 'confirmed',
            eventType: data.eventType || null,
            guestCount: data.guestCount || null,
            eventTime: data.eventTime || null,
            advancePayment: data.advancePayment || 0
        }

        const result = await createDocument('bookings', bookingData)
        return { success: true, booking: result }
    } catch (error) {
        console.error('Error creating booking:', error)
        return { success: false, error }
    }
}

export async function getBookings(type: 'hotel' | 'garden') {
    try {
        const bookings = await queryDocuments('bookings', [
            { field: 'type', operator: '==' as const, value: type }
        ], 'startDate', 'asc')

        // Fetch customer data for each booking
        const bookingsWithCustomers = await Promise.all(
            bookings.map(async (booking: any) => {
                const customerDoc = await adminDb.collection('customers').doc(booking.customerMobile).get()
                const customer = customerDoc.exists ? customerDoc.data() : { name: 'Unknown', mobileNumber: booking.customerMobile }

                return {
                    ...booking,
                    customer,
                    startDate: timestampToDate(booking.startDate),
                    endDate: timestampToDate(booking.endDate),
                    createdAt: timestampToDate(booking.createdAt)
                }
            })
        )

        return bookingsWithCustomers
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return []
    }
}

export async function updateBookingStatus(id: string, status: string) {
    try {
        await updateDocument('bookings', id, { status })
        return { success: true }
    } catch (error) {
        console.error('Error updating booking status:', error)
        return { success: false, error }
    }
}
