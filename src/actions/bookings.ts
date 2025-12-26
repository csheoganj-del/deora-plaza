"use server"

import { queryDocuments, createDocument, updateDocument, getDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"

// Get the next sequential receipt number for hotel bookings
export async function getNextHotelReceiptNumber(): Promise<number> {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const counterName = `hotel-receipts-${dateString}`;

    // Try to get existing counter
    const { data: counterData, error: counterError } = await supabaseServer
        .from('counters')
        .select('value')
        .eq('id', counterName)
        .single();

    if (counterError || !counterData) {
        // Counter doesn't exist, create it with value 1
        const { error: insertError } = await supabaseServer
            .from('counters')
            .insert([{ id: counterName, value: 1 }]);

        if (insertError) {
            throw insertError;
        }

        return 1;
    } else {
        // Counter exists, increment it
        const newValue = counterData.value + 1;
        const { error: updateError } = await supabaseServer
            .from('counters')
            .update({ value: newValue })
            .eq('id', counterName);

        if (updateError) {
            throw updateError;
        }

        return newValue;
    }
}

export async function getAvailableRooms(startDate: Date, endDate: Date) {
    try {
        // Get all rooms
        const allRooms = await queryDocuments('rooms', [
            { field: 'status', operator: '==', value: 'available' }
        ])

        // Get bookings that overlap with requested dates
        const { data: bookingsData, error: bookingsError } = await supabaseServer
            .from('bookings')
            .select('*')
            .eq('type', 'hotel')
            .in('status', ['confirmed', 'checked_in'])

        if (bookingsError) {
            throw bookingsError;
        }

        const bookedRoomIds = new Set()
        bookingsData?.forEach(booking => {
            const bookingStart = new Date(booking.startDate)
            const bookingEnd = new Date(booking.endDate)

            // Check if dates overlap
            if (bookingStart <= endDate && bookingEnd >= startDate) {
                if (booking.roomId) {
                    bookedRoomIds.add(booking.roomId)
                }
            }
        })

        // Filter out booked rooms and convert dates to ISO strings
        return allRooms
            .filter((room: any) => !bookedRoomIds.has(room.id))
            .map((room: any) => ({
                ...room,
                createdAt: room.createdAt ? new Date(room.createdAt).toISOString() : null,
                updatedAt: room.updatedAt ? new Date(room.updatedAt).toISOString() : null
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
        const { data: customerData, error: customerError } = await supabaseServer
            .from('customers')
            .select('*')
            .eq('mobileNumber', data.customerMobile)
            .single()

        if (customerError || !customerData) {
            const { error: insertError } = await supabaseServer
                .from('customers')
                .insert([{
                    mobileNumber: data.customerMobile,
                    name: data.customerName || 'Guest',
                    email: null,
                    visitCount: 1,
                    totalSpent: data.totalAmount,
                    discountTier: 0,
                    notes: null,
                    preferredBusiness: data.type,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastVisit: new Date().toISOString()
                }])

            if (insertError) {
                throw insertError;
            }
        } else {
            // Update existing customer stats
            const { error: updateError } = await supabaseServer
                .from('customers')
                .update({
                    name: data.customerName || customerData.name, // Update name if provided
                    visitCount: (customerData.visitCount || 0) + 1,
                    totalSpent: (customerData.totalSpent || 0) + data.totalAmount,
                    lastVisit: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
                .eq('mobileNumber', data.customerMobile)

            if (updateError) {
                console.error('Error updating customer stats:', updateError);
                // Don't throw here, as the booking can still proceed
            }
        }

        // Reset hotel receipt counters if no hotel bookings exist
        if (data.type === 'hotel') {
            const { data: hotelBookingsData, error: hotelBookingsError } = await supabaseServer
                .from('bookings')
                .select('*')
                .eq('type', 'hotel')
                .limit(1);

            if (!hotelBookingsError && (!hotelBookingsData || hotelBookingsData.length === 0)) {
                // Delete all hotel receipt counters
                const { data: countersData, error: countersError } = await supabaseServer
                    .from('counters')
                    .select('id');

                if (!countersError && countersData) {
                    // Delete all counters that start with 'hotel-receipts-'
                    for (const counter of countersData) {
                        if (counter.id.startsWith('hotel-receipts-')) {
                            await supabaseServer
                                .from('counters')
                                .delete()
                                .eq('id', counter.id);
                        }
                    }
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
            id: `payment_${Date.now()}`, // Generate a simple ID
            amount: totalPaid,
            date: new Date().toISOString(),
            type: 'advance',
            receiptNumber: data.type === 'hotel' ? await getNextHotelReceiptNumber() : 0
        }] : []

        const bookingData = {
            customerMobile: data.customerMobile,
            type: data.type,
            startDate: data.startDate.toISOString(),
            endDate: data.endDate.toISOString(),
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        const result = await createDocument('bookings', bookingData)

        // Return only necessary serializable data
        return {
            success: true,
            booking: {
                id: result.data?.id,
                ...bookingData,
                startDate: new Date(bookingData.startDate).toISOString(),
                endDate: new Date(bookingData.endDate).toISOString(),
                createdAt: new Date(bookingData.createdAt).toISOString(),
                updatedAt: new Date(bookingData.updatedAt).toISOString(),
                payments: payments.map(p => ({
                    ...p,
                    date: new Date(p.date).toISOString()
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
            { field: 'type', operator: '==', value: type }
        ], 'startDate', 'asc')

        // Fetch customer data for each booking
        const bookingsWithCustomers = await Promise.all(
            bookings.map(async (booking: any) => {
                const { data: customerData, error: customerError } = await supabaseServer
                    .from('customers')
                    .select('*')
                    .eq('mobileNumber', booking.customerMobile)
                    .single()

                const customer = !customerError && customerData ? {
                    name: customerData.name || 'Unknown',
                    mobileNumber: customerData.mobileNumber || booking.customerMobile,
                    email: customerData.email || null,
                    visitCount: customerData.visitCount || 0,
                    totalSpent: customerData.totalSpent || 0,
                    discountTier: customerData.discountTier || 0,
                    notes: customerData.notes || null,
                    preferredBusiness: customerData.preferredBusiness || null,
                    createdAt: customerData.createdAt ? new Date(customerData.createdAt).toISOString() : null,
                    updatedAt: customerData.updatedAt ? new Date(customerData.updatedAt).toISOString() : null,
                    lastVisit: customerData.lastVisit ? new Date(customerData.lastVisit).toISOString() : null
                } : {
                    name: 'Unknown',
                    mobileNumber: booking.customerMobile
                }

                const paymentsWithDates = booking.payments?.map((payment: any) => ({
                    ...payment,
                    date: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString()
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
                    startDate: new Date(booking.startDate).toISOString(),
                    endDate: new Date(booking.endDate).toISOString(),
                    createdAt: new Date(booking.createdAt).toISOString(),
                    updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : null,
                    roomServiceCharges: booking.roomServiceCharges?.map((charge: any) => ({
                        ...charge,
                        createdAt: charge.createdAt ? new Date(charge.createdAt).toISOString() : null
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
        // Delete the booking
        const { error: deleteError } = await supabaseServer
            .from('bookings')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw deleteError;
        }

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
        const { data: bookingData, error: bookingError } = await supabaseServer
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

        if (bookingError || !bookingData) {
            return { error: "Booking not found" }
        }

        const receiptNumber = await getNextHotelReceiptNumber();

        const currentPayments = bookingData.payments || []
        const newPayment = {
            id: `payment_${Date.now()}`, // Generate a simple ID
            amount: amount,
            date: new Date().toISOString(),
            type: paymentType,
            method: paymentMethod,
            receiptNumber: receiptNumber,
        }

        const updatedPayments = [...currentPayments, newPayment]
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
        const remainingBalance = bookingData.totalAmount - totalPaid
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
            updatedAt: new Date().toISOString(),
        })

        // Sync payment status to all linked room service orders
        if (newPaymentStatus === "completed") {
            const linkedOrders = await queryDocuments('orders', [
                { field: 'bookingId', operator: '==', value: bookingId },
                { field: 'businessUnit', operator: '==', value: 'hotel' }
            ])

            // Update all linked orders
            for (const order of linkedOrders) {
                await updateDocument('orders', order.id, {
                    isPaid: true,
                    paymentSyncedAt: new Date().toISOString(),
                    paymentReceipt: receiptNumber
                })
            }

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
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            })
        }

        if (result.success) {
            const finalPayments = updatedPayments.map((p: any) => ({
                ...p,
                date: p.date ? new Date(p.date).toISOString() : new Date().toISOString()
            }));

            // Fetch customer data
            const { data: customerData, error: customerError } = await supabaseServer
                .from('customers')
                .select('*')
                .eq('mobileNumber', bookingData.customerMobile)
                .single()

            const customer = !customerError && customerData ? {
                name: customerData.name || 'Unknown',
                mobileNumber: customerData.mobileNumber || bookingData.customerMobile,
            } : {
                name: 'Unknown',
                mobileNumber: bookingData.customerMobile
            }

            const serializedBooking = {
                id: bookingId,
                customerMobile: bookingData.customerMobile,
                customer,
                type: bookingData.type,
                startDate: new Date(bookingData.startDate).toISOString(),
                endDate: new Date(bookingData.endDate).toISOString(),
                checkInTime: bookingData.checkInTime || null,
                checkOutTime: bookingData.checkOutTime || null,
                createdAt: new Date(bookingData.createdAt).toISOString(),
                updatedAt: new Date().toISOString(),
                status: newPaymentStatus,
                basePrice: bookingData.basePrice,
                discountPercent: bookingData.discountPercent || 0,
                discountAmount: bookingData.discountAmount || 0,
                gstEnabled: bookingData.gstEnabled,
                gstPercentage: bookingData.gstPercentage,
                gstAmount: bookingData.gstAmount || 0,
                totalAmount: bookingData.totalAmount,
                notes: bookingData.notes,
                roomId: bookingData.roomId,
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
        const { data: bookingsData, error: bookingsError } = await supabaseServer
            .from('bookings')
            .select('*')
            .order('createdAt', { ascending: false })
            .limit(50)

        if (bookingsError) {
            console.error('Database error fetching bookings:', bookingsError)
            console.error('Error details:', {
                message: bookingsError.message,
                code: bookingsError.code,
                hint: bookingsError.hint,
                details: bookingsError.details
            })
            throw bookingsError;
        }

        const bookings = await Promise.all(
            bookingsData?.map(async (booking) => {
                // Fetch customer data
                const { data: customerData, error: customerError } = await supabaseServer
                    .from('customers')
                    .select('*')
                    .eq('mobileNumber', booking.customerMobile)
                    .single()

                const customer = !customerError && customerData ? {
                    name: customerData.name || 'Unknown',
                    mobileNumber: customerData.mobileNumber || booking.customerMobile,
                } : {
                    name: 'Unknown',
                    mobileNumber: booking.customerMobile
                }

                // Convert payment timestamps to ISO strings for serialization
                const paymentsWithDates = booking.payments?.map((payment: any) => ({
                    ...payment,
                    date: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString()
                })) || []

                return {
                    id: booking.id,
                    customer,
                    customerMobile: booking.customerMobile,
                    type: booking.type,
                    payments: paymentsWithDates,
                    totalPaid: booking.totalPaid || 0,
                    remainingBalance: booking.remainingBalance ?? Math.max((booking.totalAmount || 0) - (booking.totalPaid || 0), 0),
                    paymentStatus: booking.paymentStatus || 'pending',
                    basePrice: booking.basePrice || booking.totalAmount || 0,
                    discountPercent: booking.discountPercent || 0,
                    discountAmount: booking.discountAmount || 0,
                    gstEnabled: booking.gstEnabled || false,
                    gstPercentage: booking.gstPercentage || 0,
                    gstAmount: booking.gstAmount || 0,
                    startDate: new Date(booking.startDate).toISOString(),
                    endDate: new Date(booking.endDate).toISOString(),
                    createdAt: new Date(booking.createdAt).toISOString(),
                    updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : null,
                    roomId: booking.roomId || null,
                    notes: booking.notes || null,
                    totalAmount: booking.totalAmount,
                    status: booking.status,
                    eventType: booking.eventType || null,
                    guestCount: booking.guestCount || null,
                    eventTime: booking.eventTime || null,
                    advancePayment: booking.advancePayment || 0,
                }
            }) || []
        )

        return bookings
    } catch (error) {
        console.error('Error fetching all bookings:', error)
        console.error('Error type:', typeof error)
        console.error('Error keys:', Object.keys(error || {}))
        if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
        }
        return []
    }
}

