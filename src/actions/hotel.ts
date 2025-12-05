"use server"

import {
    createDocument,
    deleteDocument,
    queryDocuments,
    getDocument,
    updateDocument,
    timestampToDate
} from "@/lib/firebase/firestore"
import { revalidatePath } from "next/cache"

const ROOMS_COLLECTION = "rooms"
const BOOKINGS_COLLECTION = "bookings"

export type Room = {
    id?: string
    number: string
    type: string // 'Deluxe', 'Suite', 'Standard'
    price: number
    capacity: number
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
    floor?: number
    amenities?: string[]
    description?: string
    createdAt?: Date
    updatedAt?: Date
}

export type HotelBooking = {
    id?: string
    guestName: string
    guestMobile: string
    guestEmail?: string
    guestIdProof?: string
    roomId: string
    roomNumber: string // Denormalized for easier display
    startDate: Date
    endDate: Date
    checkIn: Date
    checkOut: Date
    status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
    adults: number
    children: number
    totalAmount: number
    paidAmount: number
    remainingBalance: number
    paymentStatus: 'pending' | 'partial' | 'completed'
    payments: Payment[]
    notes?: string
    createdAt: Date
    updatedAt: Date
    gstEnabled?: boolean
    gstPercentage?: number
    discountPercent?: number
    basePrice?: number // Price before tax/discount
    advancePayment?: number
}

export type Payment = {
    id: string
    amount: number
    date?: Date
    createdAt?: Date
    type?: string
    method?: string
    receiptNumber?: string | number
    notes?: string
}

export async function createRoom(data: Omit<Room, "id">) {
    try {
        const roomPayload = {
            number: data.number,
            type: data.type,
            price: Number(data.price),
            capacity: Number(data.capacity),
            status: data.status,
            floor: typeof data.floor === "number" ? data.floor : data.floor ? Number(data.floor) : null,
            amenities: data.amenities || [],
            description: data.description || ""
        }

        const room = await createDocument(ROOMS_COLLECTION, roomPayload)
        revalidatePath("/dashboard/hotel")
        return room
    } catch (error) {
        console.error("Error creating room:", error)
        return { success: false, error }
    }
}

export async function getRooms() {
    try {
        const rooms = await queryDocuments(ROOMS_COLLECTION, [], "number", "asc")
        return rooms.map((room: any) => ({
            ...room,
            createdAt: room.createdAt ? timestampToDate(room.createdAt).toISOString() : null,
            updatedAt: room.updatedAt ? timestampToDate(room.updatedAt).toISOString() : null
        })) as Room[]
    } catch (error) {
        console.error("Error fetching rooms:", error)
        return []
    }
}

export async function updateRoom(id: string, data: Partial<Room>) {
    try {
        await updateDocument(ROOMS_COLLECTION, id, data)
        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error updating room:", error)
        return { success: false, error }
    }
}

export async function deleteRoom(id: string, password?: string) {
    try {
        const DELETION_PASSWORD = 'KappuLokuHimu#1006'
        if (password !== DELETION_PASSWORD) {
            return { success: false, error: 'Invalid password' }
        }

        await deleteDocument(ROOMS_COLLECTION, id)
        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error deleting room:", error)
        return { success: false, error }
    }
}

// --- Booking Actions ---

export async function getHotelBookings() {
    try {
        const bookings = await queryDocuments(BOOKINGS_COLLECTION, [], 'createdAt', 'desc')
        return bookings.map((booking: any) => ({
            ...booking,
            startDate: timestampToDate(booking.startDate).toISOString(),
            endDate: timestampToDate(booking.endDate).toISOString(),
            checkIn: booking.checkIn ? timestampToDate(booking.checkIn).toISOString() : null,
            checkOut: booking.checkOut ? timestampToDate(booking.checkOut).toISOString() : null,
            createdAt: timestampToDate(booking.createdAt).toISOString(),
            updatedAt: timestampToDate(booking.updatedAt).toISOString(),
            payments: booking.payments?.map((p: any) => ({
                ...p,
                date: timestampToDate(p.date).toISOString()
            })) || [],
            roomServiceCharges: booking.roomServiceCharges?.map((charge: any) => ({
                ...charge,
                createdAt: charge.createdAt ? timestampToDate(charge.createdAt).toISOString() : null
            })) || []
        })) as HotelBooking[]
    } catch (error) {
        console.error("Error getting hotel bookings:", error)
        return []
    }
}

export async function createHotelBooking(data: any) {
    try {
        // 1. Create the booking
        const bookingData = {
            ...data,
            status: 'confirmed',
            paymentStatus: data.advancePayment >= data.totalAmount ? 'completed' : (data.advancePayment > 0 ? 'partial' : 'pending'),
            paidAmount: data.advancePayment || 0,
            remainingBalance: data.totalAmount - (data.advancePayment || 0),
            payments: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const booking = await createDocument(BOOKINGS_COLLECTION, bookingData)

        // 2. Record advance payment if any
        if (booking.success && booking.id && data.advancePayment > 0) {
            await addHotelPayment(booking.id, {
                amount: data.advancePayment,
                type: data.advancePaymentMethod || 'cash',
                receiptNumber: `ADV-${Date.now().toString().slice(-6)}`,
                notes: 'Advance Payment',
                date: new Date()
            })
        }

        revalidatePath("/dashboard/hotel")
        return { success: true, id: booking.id }
    } catch (error) {
        console.error("Error creating hotel booking:", error)
        return { success: false, error }
    }
}

export async function updateHotelBooking(id: string, data: Partial<HotelBooking>) {
    try {
        await updateDocument(BOOKINGS_COLLECTION, id, {
            ...data,
            updatedAt: new Date()
        })
        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error updating hotel booking:", error)
        return { success: false, error }
    }
}

export async function addHotelPayment(bookingId: string, payment: Omit<Payment, 'id'>) {
    try {
        const booking = await getDocument(BOOKINGS_COLLECTION, bookingId) as HotelBooking
        if (!booking) throw new Error("Booking not found")

        const newPayment = {
            ...payment,
            id: crypto.randomUUID(),
            date: new Date()
        }

        const updatedPayments = [...(booking.payments || []), newPayment]
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
        const remainingBalance = booking.totalAmount - totalPaid
        const paymentStatus = remainingBalance <= 0 ? 'completed' : (totalPaid > 0 ? 'partial' : 'pending')

        await updateDocument(BOOKINGS_COLLECTION, bookingId, {
            payments: updatedPayments,
            paidAmount: totalPaid,
            remainingBalance,
            paymentStatus,
            updatedAt: new Date()
        })

        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error adding hotel payment:", error)
        return { success: false, error }
    }
}

export async function deleteHotelBooking(id: string) {
    try {
        await deleteDocument(BOOKINGS_COLLECTION, id)
        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error deleting hotel booking:", error)
        return { success: false, error }
    }
}

export async function checkInGuest(bookingId: string, roomId: string) {
    try {
        // Update booking status
        await updateDocument(BOOKINGS_COLLECTION, bookingId, {
            status: 'checked-in',
            checkIn: new Date(), // Update actual check-in time
            updatedAt: new Date()
        })

        // Update room status
        await updateDocument(ROOMS_COLLECTION, roomId, {
            status: 'occupied'
        })

        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error checking in guest:", error)
        return { success: false, error }
    }
}

export async function checkOutGuest(bookingId: string, roomId: string) {
    try {
        // Update booking status
        await updateDocument(BOOKINGS_COLLECTION, bookingId, {
            status: 'checked-out',
            checkOut: new Date(), // Update actual check-out time
            updatedAt: new Date()
        })

        // Update room status
        await updateDocument(ROOMS_COLLECTION, roomId, {
            status: 'cleaning' // Mark as dirty/cleaning after checkout
        })

        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error checking out guest:", error)
        return { success: false, error }
    }
}

export async function getHotelDailyRevenue() {
    try {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        // We need to query bookings that have payments today
        // Since payments are an array inside booking, we can't easily query by payment date in Firestore
        // So we'll fetch active bookings and filter in memory (not ideal for scale but works for now)
        // Or better: fetch bookings updated today

        const bookings = await queryDocuments(BOOKINGS_COLLECTION, [
            { field: 'updatedAt', operator: '>=', value: startOfDay }
        ]) as HotelBooking[]

        let total = 0
        let count = 0

        bookings.forEach(booking => {
            if (booking.payments) {
                booking.payments.forEach(payment => {
                    const paymentDate = timestampToDate(payment.date)
                    if (paymentDate >= startOfDay) {
                        total += payment.amount
                    }
                })
            }
        })

        // Count is number of bookings with activity today
        count = bookings.length

        return { total, count }
    } catch (error) {
        console.error("Error getting hotel daily revenue:", error)
        return { total: 0, count: 0 }
    }
}

// Get active booking for a room (for room service orders)
export async function getActiveBookingForRoom(roomId: string, roomNumber?: string) {
    try {
        // Try finding by roomId first
        let bookings = await queryDocuments(BOOKINGS_COLLECTION, [
            { field: 'roomId', operator: '==', value: roomId },
            { field: 'status', operator: 'in', value: ['confirmed', 'checked-in'] }
        ]) as HotelBooking[]

        // If not found and roomNumber is provided, try finding by roomNumber
        if (bookings.length === 0 && roomNumber) {
            console.log(`No active booking found for roomId ${roomId}, trying roomNumber ${roomNumber}`)
            bookings = await queryDocuments(BOOKINGS_COLLECTION, [
                { field: 'roomNumber', operator: '==', value: roomNumber },
                { field: 'status', operator: 'in', value: ['confirmed', 'checked-in'] }
            ]) as HotelBooking[]
        }

        // Return the most recent active booking
        if (bookings.length > 0) {
            const booking = bookings[0]
            return {
                ...booking,
                startDate: timestampToDate(booking.startDate).toISOString(),
                endDate: timestampToDate(booking.endDate).toISOString(),
                checkIn: booking.checkIn ? timestampToDate(booking.checkIn).toISOString() : null,
                checkOut: booking.checkOut ? timestampToDate(booking.checkOut).toISOString() : null,
                createdAt: timestampToDate(booking.createdAt).toISOString(),
                updatedAt: timestampToDate(booking.updatedAt).toISOString(),
                payments: booking.payments?.map((p: any) => ({
                    ...p,
                    date: timestampToDate(p.date).toISOString()
                })) || [],
                roomServiceCharges: booking.roomServiceCharges?.map((charge: any) => ({
                    ...charge,
                    createdAt: charge.createdAt ? timestampToDate(charge.createdAt).toISOString() : null
                })) || []
            }
        }

        return null
    } catch (error) {
        console.error("Error getting active booking for room:", error)
        return null
    }
}

