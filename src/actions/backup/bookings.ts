"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getAvailableRooms(startDate: Date, endDate: Date) {
    try {
        // Find rooms that are NOT booked during the requested period
        const bookedRoomIds = await prisma.booking.findMany({
            where: {
                type: "hotel",
                status: { in: ["confirmed", "checked_in"] },
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
            select: { roomId: true },
        })

        const excludedIds = bookedRoomIds.map((b) => b.roomId).filter((id): id is string => id !== null)

        const rooms = await prisma.room.findMany({
            where: {
                id: { notIn: excludedIds },
                status: "available", // Only rooms currently marked as available (not maintenance)
            },
            orderBy: { roomNumber: "asc" },
        })

        return rooms
    } catch (error) {
        console.error("Failed to fetch available rooms:", error)
        return []
    }
}

export async function createBooking(data: {
    customerMobile: string
    type: "hotel" | "garden"
    startDate: Date
    endDate: Date
    roomId?: string
    notes?: string
    totalAmount: number
    // Garden event specific fields
    eventType?: string
    guestCount?: number
    eventTime?: string
    advancePayment?: number
}) {
    try {
        // Ensure customer exists
        let customer = await prisma.customer.findUnique({
            where: { mobileNumber: data.customerMobile },
        })

        if (!customer) {
            // Create a temporary customer record if not found
            // In a real app, we might prompt to create full profile first
            customer = await prisma.customer.create({
                data: {
                    mobileNumber: data.customerMobile,
                    name: "Guest", // Placeholder
                    visitCount: 0,
                },
            })
        }

        const booking = await prisma.booking.create({
            data: {
                customerMobile: data.customerMobile,
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate,
                roomId: data.roomId,
                notes: data.notes,
                totalAmount: data.totalAmount,
                status: "confirmed",
                // Garden event fields
                eventType: data.eventType,
                guestCount: data.guestCount,
                eventTime: data.eventTime,
                advancePayment: data.advancePayment || 0,
            },
        })

        revalidatePath("/dashboard/hotel")
        revalidatePath("/dashboard/garden")
        return { success: true, booking }
    } catch (error) {
        console.error("Failed to create booking:", error)
        return { success: false, error }
    }
}

export async function getBookings(type: "hotel" | "garden") {
    try {
        const bookings = await prisma.booking.findMany({
            where: { type },
            include: {
                customer: true,
                room: true,
            },
            orderBy: { startDate: "asc" },
        })
        return bookings
    } catch (error) {
        console.error("Failed to fetch bookings:", error)
        return []
    }
}

export async function updateBookingStatus(id: string, status: string) {
    try {
        await prisma.booking.update({
            where: { id },
            data: { status },
        })
        revalidatePath("/dashboard/hotel")
        revalidatePath("/dashboard/garden")
        return { success: true }
    } catch (error) {
        console.error("Failed to update booking status:", error)
        return { success: false, error }
    }
}
