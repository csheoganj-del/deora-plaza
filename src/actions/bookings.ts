"use server"

import { queryDocuments, createDocument, updateDocument, getDocument, timestampToDate, dateToTimestamp } from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"

// Get the next sequential receipt number for hotel bookings
async function getNextHotelReceiptNumber(): Promise<number> {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const counterName = `hotel-receipts-${dateString}`;
    const counterRef = adminDb.collection('counters').doc(counterName);

    return adminDb.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        if (!counterDoc.exists) {
            transaction.set(counterRef, { value: 1 });
            return 1;
        } else {
            const newValue = (counterDoc.data()?.value || 0) + 1;
            transaction.update(counterRef, { value: newValue });
            return newValue;
        }
    });
}

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

        // Filter out booked rooms and convert Firestore Timestamps to ISO strings
        return allRooms
            .filter((room: any) => !bookedRoomIds.has(room.id))
            .map((room: any) => ({
                ...room,
                createdAt: room.createdAt ? timestampToDate(room.createdAt).toISOString() : null,
                updatedAt: room.updatedAt ? timestampToDate(room.updatedAt).toISOString() : null
            }))
    } catch (error) {
        console.error('Error fetching available rooms:', error)
        return []
    }
}


export async function createBooking(data: {
    customerMobile: string
    customerName?: string
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
    basePrice?: number
    discountPercent?: number
    gstEnabled?: boolean
    gstPercentage?: number
    checkInTime?: string
    checkOutTime?: string
}) {
    try {
        // Check if customer exists, create if not
        const customerDoc = await adminDb.collection('customers').doc(data.customerMobile).get()

        if (!customerDoc.exists) {
            await adminDb.collection('customers').doc(data.customerMobile).set({
                mobileNumber: data.customerMobile,
                name: data.customerName || 'Guest',
                email: null,
                visitCount: 1,
                totalSpent: data.totalAmount,
                discountTier: 0,
                notes: null,
                preferredBusiness: data.type,
                createdAt: dateToTimestamp(new Date()),
                updatedAt: dateToTimestamp(new Date()),
                lastVisit: dateToTimestamp(new Date())
            })
        }

        // Reset hotel receipt counters if no hotel bookings exist
        if (data.type === 'hotel') {
            const allHotelBookings = await adminDb.collection('bookings').where('type', '==', 'hotel').limit(1).get();
            if (allHotelBookings.empty) {
                const countersSnapshot = await adminDb.collection('counters').get();
                if (!countersSnapshot.empty) {
                    const batch = adminDb.batch();
                    countersSnapshot.docs.forEach(doc => {
                        if (doc.id.startsWith('hotel-receipts-')) {
                            batch.delete(doc.ref);
                        }
                    });
                    await batch.commit();
                }
            }
        }

        const basePrice = data.basePrice ?? data.totalAmount ?? 0
        const discountPercent = data.discountPercent ? Number(data.discountPercent) : 0
        const discountAmount = basePrice * (discountPercent / 100)
        const discountedSubtotal = basePrice - discountAmount
        const gstEnabled = Boolean(data.gstEnabled)
        const gstPercentage = gstEnabled ? (data.gstPercentage ? Number(data.gstPercentage) : 0) : 0
        const gstAmount = gstEnabled ? discountedSubtotal * (gstPercentage / 100) : 0
        const computedTotal = discountedSubtotal + gstAmount
        const advancePayment = data.advancePayment ? Number(data.advancePayment) : 0
        const totalPaid = Math.min(Math.max(advancePayment, 0), computedTotal)
        const remainingBalance = Math.max(computedTotal - totalPaid, 0)
        const paymentStatus = remainingBalance <= 0 ? 'completed' : (totalPaid > 0 ? 'partial' : 'pending')

        const payments = totalPaid > 0 ? [{
            id: adminDb.collection('payments').doc().id,
            amount: totalPaid,
            date: dateToTimestamp(new Date()),
            type: 'advance',
            receiptNumber: data.type === 'hotel' ? await getNextHotelReceiptNumber() : 0
        }] : []

        const bookingData = {
            customerMobile: data.customerMobile,
            type: data.type,
            startDate: dateToTimestamp(data.startDate),
            endDate: dateToTimestamp(data.endDate),
            roomId: data.roomId || null,
            notes: data.notes || null,
            basePrice,
            discountPercent,
            discountAmount,
            gstEnabled,
            gstPercentage,
            gstAmount,
            totalAmount: computedTotal,
            totalPaid,
            remainingBalance,
            paymentStatus,
            payments,
            status: 'confirmed',
            eventType: data.eventType || null,
            guestCount: data.guestCount || null,
            eventTime: data.eventTime || null,
            advancePayment: advancePayment,
            checkInTime: data.checkInTime || null,
            checkOutTime: data.checkOutTime || null,
            createdAt: dateToTimestamp(new Date()),
            updatedAt: dateToTimestamp(new Date())
        }

        const result = await createDocument('bookings', bookingData)

        // Return only necessary serializable data
        return {
            success: true,
            booking: {
                id: result.id,
                ...bookingData,
                startDate: timestampToDate(bookingData.startDate).toISOString(),
                endDate: timestampToDate(bookingData.endDate).toISOString(),
                createdAt: timestampToDate(bookingData.createdAt).toISOString(),
                updatedAt: timestampToDate(bookingData.updatedAt).toISOString(),
                payments: payments.map(p => ({
                    ...p,
                    date: timestampToDate(p.date).toISOString()
                }))
            }
        }
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
                const customerData = customerDoc.exists ? customerDoc.data() : null

                const customer = customerData ? {
                    name: customerData.name || 'Unknown',
                    mobileNumber: customerData.mobileNumber || booking.customerMobile,
                    email: customerData.email || null,
                    visitCount: customerData.visitCount || 0,
                    totalSpent: customerData.totalSpent || 0,
                    discountTier: customerData.discountTier || 0,
                    notes: customerData.notes || null,
                    preferredBusiness: customerData.preferredBusiness || null,
                    createdAt: customerData.createdAt ? timestampToDate(customerData.createdAt).toISOString() : null,
                    updatedAt: customerData.updatedAt ? timestampToDate(customerData.updatedAt).toISOString() : null,
                    lastVisit: customerData.lastVisit ? timestampToDate(customerData.lastVisit).toISOString() : null
                } : {
                    name: 'Unknown',
                    mobileNumber: booking.customerMobile
                }

                const paymentsWithDates = booking.payments?.map((payment: any) => ({
                    ...payment,
                    date: payment.date ? timestampToDate(payment.date).toISOString() : new Date().toISOString()
                })) || []

                return {
                    ...booking,
                    payments: paymentsWithDates,
                    totalPaid: booking.totalPaid || 0,
                    remainingBalance: booking.remainingBalance ?? Math.max((booking.totalAmount || 0) - (booking.totalPaid || 0), 0),
                    paymentStatus: booking.paymentStatus || 'pending',
                    customer,
                    checkInTime: booking.checkInTime || null,
                    checkOutTime: booking.checkOutTime || null,
                    startDate: timestampToDate(booking.startDate).toISOString(),
                    endDate: timestampToDate(booking.endDate).toISOString(),
                    createdAt: timestampToDate(booking.createdAt).toISOString(),
                    updatedAt: booking.updatedAt ? timestampToDate(booking.updatedAt).toISOString() : null,
                    roomServiceCharges: booking.roomServiceCharges?.map((charge: any) => ({
                        ...charge,
                        createdAt: charge.createdAt ? timestampToDate(charge.createdAt).toISOString() : null
                    })) || []
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

export async function deleteBooking(id: string, password: string) {
    try {
        // Verify password
        const DELETION_PASSWORD = 'KappuLokuHimu#1006'
        if (password !== DELETION_PASSWORD) {
            return { success: false, error: 'Invalid password' }
        }

        // Delete the booking
        await adminDb.collection('bookings').doc(id).delete()
        return { success: true }
    } catch (error) {
        console.error('Error deleting booking:', error)
        return { success: false, error }
    }
}

// Add a payment to a hotel booking
export async function addHotelBookingPayment(
    bookingId: string,
    amount: number,
    paymentMethod: "cash" | "card" | "upi" | "online" = "cash",
    paymentType: "advance" | "partial" | "final" | "refund" = "partial"
) {
    try {
        const bookingRef = adminDb.collection("bookings").doc(bookingId)
        const bookingDoc = await bookingRef.get()

        if (!bookingDoc.exists) {
            return { error: "Booking not found" }
        }

        const booking = bookingDoc.data()
        if (!booking) {
            return { error: "Booking data is empty" }
        }

        const receiptNumber = await getNextHotelReceiptNumber();

        const currentPayments = booking.payments || []
        const newPayment = {
            id: adminDb.collection("payments").doc().id,
            amount: amount,
            date: dateToTimestamp(new Date()),
            type: paymentType,
            method: paymentMethod,
            receiptNumber: receiptNumber,
        }

        const updatedPayments = [...currentPayments, newPayment]
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
        const remainingBalance = booking.totalAmount - totalPaid
        const newPaymentStatus =
            remainingBalance <= 0
                ? "completed"
                : totalPaid > 0
                    ? "partial"
                    : "pending"

        const result = await updateDocument("bookings", bookingId, {
            payments: updatedPayments,
            totalPaid,
            remainingBalance,
            paymentStatus: newPaymentStatus,
            status: newPaymentStatus,
            updatedAt: dateToTimestamp(new Date()),
        })

        // Sync payment status to all linked room service orders
        if (newPaymentStatus === "completed") {
            const linkedOrders = await queryDocuments('orders', [
                { field: 'bookingId', operator: '==', value: bookingId },
                { field: 'businessUnit', operator: '==', value: 'hotel' }
            ])

            const batch = adminDb.batch()
            for (const order of linkedOrders) {
                const orderRef = adminDb.collection('orders').doc(order.id)
                batch.update(orderRef, {
                    isPaid: true,
                    paymentSyncedAt: dateToTimestamp(new Date()),
                    paymentReceipt: receiptNumber
                })
            }
            await batch.commit()

            // Create notification for restaurant manager
            await createDocument('notifications', {
                type: 'payment_received',
                bookingId,
                businessUnit: 'hotel',
                message: `Guest booking ${bookingId} fully paid - room service orders updated`,
                title: 'Payment Received - Orders Updated',
                recipient: 'restaurant_manager',
                metadata: {
                    amount: totalPaid,
                    receiptNumber,
                    linkedOrderCount: linkedOrders.length
                },
                isRead: false,
                createdAt: dateToTimestamp(new Date()),
                expiresAt: dateToTimestamp(new Date(Date.now() + 24 * 60 * 60 * 1000))
            })
        }

        if (result.success) {
            const finalPayments = updatedPayments.map((p: any) => ({
                ...p,
                date: p.date ? timestampToDate(p.date).toISOString() : new Date().toISOString()
            }));

            // Fetch customer data
            const customerDoc = await adminDb.collection('customers').doc(booking.customerMobile).get()
            const customerData = customerDoc.exists ? customerDoc.data() : null

            const customer = customerData ? {
                name: customerData.name || 'Unknown',
                mobileNumber: customerData.mobileNumber || booking.customerMobile,
            } : {
                name: 'Unknown',
                mobileNumber: booking.customerMobile
            }

            const serializedBooking = {
                id: bookingId,
                customerMobile: booking.customerMobile,
                customer,
                type: booking.type,
                startDate: booking.startDate ? timestampToDate(booking.startDate).toISOString() : null,
                endDate: booking.endDate ? timestampToDate(booking.endDate).toISOString() : null,
                checkInTime: booking.checkInTime || null,
                checkOutTime: booking.checkOutTime || null,
                createdAt: booking.createdAt ? timestampToDate(booking.createdAt).toISOString() : null,
                updatedAt: timestampToDate(dateToTimestamp(new Date())).toISOString(),
                status: newPaymentStatus,
                basePrice: booking.basePrice,
                discountPercent: booking.discountPercent || 0,
                discountAmount: booking.discountAmount || 0,
                gstEnabled: booking.gstEnabled,
                gstPercentage: booking.gstPercentage,
                gstAmount: booking.gstAmount || 0,
                totalAmount: booking.totalAmount,
                notes: booking.notes,
                roomId: booking.roomId,
                payments: finalPayments,
                totalPaid: totalPaid,
                remainingBalance: remainingBalance,
                paymentStatus: newPaymentStatus,
            };

            return { success: true, booking: serializedBooking }
        } else {
            return { error: result.error }
        }
    } catch (error) {
        console.error('Error adding hotel booking payment:', error)
        return { error: 'Failed to add payment' }
    }
}

export async function getAllBookings() {
    try {
        const snapshot = await adminDb.collection('bookings')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get()

        const bookings = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const data = doc.data()

                // Fetch customer data
                const customerDoc = await adminDb.collection('customers').doc(data.customerMobile).get()
                const customerData = customerDoc.exists ? customerDoc.data() : null

                const customer = customerData ? {
                    name: customerData.name || 'Unknown',
                    mobileNumber: customerData.mobileNumber || data.customerMobile,
                } : {
                    name: 'Unknown',
                    mobileNumber: data.customerMobile
                }

                // Convert payment timestamps to ISO strings for serialization
                const paymentsWithDates = data.payments?.map((payment: any) => ({
                    ...payment,
                    date: payment.date ? timestampToDate(payment.date).toISOString() : new Date().toISOString()
                })) || []

                return {
                    id: doc.id,
                    customer,
                    customerMobile: data.customerMobile,
                    type: data.type,
                    payments: paymentsWithDates,
                    totalPaid: data.totalPaid || 0,
                    remainingBalance: data.remainingBalance ?? Math.max((data.totalAmount || 0) - (data.totalPaid || 0), 0),
                    paymentStatus: data.paymentStatus || 'pending',
                    basePrice: data.basePrice || data.totalAmount || 0,
                    discountPercent: data.discountPercent || 0,
                    discountAmount: data.discountAmount || 0,
                    gstEnabled: data.gstEnabled || false,
                    gstPercentage: data.gstPercentage || 0,
                    gstAmount: data.gstAmount || 0,
                    startDate: timestampToDate(data.startDate).toISOString(),
                    endDate: timestampToDate(data.endDate).toISOString(),
                    createdAt: timestampToDate(data.createdAt).toISOString(),
                    updatedAt: data.updatedAt ? timestampToDate(data.updatedAt).toISOString() : null,
                    roomId: data.roomId || null,
                    notes: data.notes || null,
                    totalAmount: data.totalAmount,
                    status: data.status,
                    eventType: data.eventType || null,
                    guestCount: data.guestCount || null,
                    eventTime: data.eventTime || null,
                    advancePayment: data.advancePayment || 0,
                }
            })
        )

        return bookings
    } catch (error) {
        console.error('Error fetching all bookings:', error)
        return []
    }
}
