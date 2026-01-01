"use server"

import {
    createDocument,
    deleteDocument,
    queryDocuments,
    getDocument,
    updateDocument,
} from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"
import { requireDeletePermission } from "@/lib/auth-helpers"
import { validateInput, deletePasswordSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import { logActivityWithLocation } from "@/actions/location"

const ROOMS_COLLECTION = "rooms"
const BOOKINGS_COLLECTION = "bookings"

export type Room = {
    id?: string
    number: string
    type: string // 'Deluxe', 'Suite', 'Standard'
    price: number
    capacity: number
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
    floor?: number | null
    amenities?: string[]
    description?: string
    createdAt?: Date
    updatedAt?: Date
}

// Add a helper type for database operations (using snake_case)
type RoomDB = {
    id?: string
    number: string
    type: string
    price: number
    capacity: number
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning'
    floor?: number | null
    amenities?: string[]
    description?: string
    createdAt?: string
    updatedAt?: string
}

export type HotelBooking = {
    id?: string
    type?: string
    customerMobile: string
    startDate: string
    endDate: string
    roomId: string | null
    notes: string
    totalAmount: number
    status: string
    eventType: string | null
    guestCount: number
    eventTime: string | null
    advancePayment: number
    payments: Payment[]
    totalPaid: number
    remainingBalance: number
    paymentStatus: string
    basePrice: number
    discountPercent: number
    discountAmount: number
    gstEnabled: boolean
    gstPercentage: number
    gstAmount: number
    createdAt: string
    updatedAt: string
    // Additional fields for hotel-specific functionality
    guestName?: string // Derived from customer data
    guestEmail?: string // Derived from customer data
    roomNumber?: string // Denormalized for easier display
    checkIn?: string | null
    checkOut?: string | null
    adults?: number // Derived from guestCount
    children?: number // Derived from guestCount
    paidAmount?: number // Same as totalPaid
    roomServiceCharges?: any[]
    customerId?: string
    receiptNumber?: string
}

export type Payment = {
    id: string
    amount: number
    date?: string
    createdAt?: string
    type?: string
    method?: string
    receiptNumber?: string | number
    notes?: string
}

export async function createRoom(data: Omit<Room, "id">) {
    try {
        // Check if room number already exists
        const existingRooms = await queryDocuments(ROOMS_COLLECTION, [
            { field: "number", operator: "==", value: data.number }
        ]);

        if (existingRooms.length > 0) {
            return { success: false, error: `Room with number ${data.number} already exists` };
        }

        const now = new Date().toISOString();
        // Convert camelCase to snake_case for database
        const roomPayload: RoomDB = {
            number: data.number,
            type: data.type,
            price: Number(data.price),
            capacity: Number(data.capacity),
            status: data.status,
            floor: typeof data.floor === "number" ? data.floor : data.floor ? Number(data.floor) : undefined,
            amenities: data.amenities || [],
            description: data.description || "",
            createdAt: now,
            updatedAt: now
        }

        console.log("Creating room with payload:", roomPayload);

        const room = await createDocument(ROOMS_COLLECTION, roomPayload)

        console.log("Room creation result:", room);

        revalidatePath("/dashboard/hotel")
        return room
    } catch (error) {
        console.error("Error creating room:", error)
        // Return more detailed error information
        let errorMessage = "Unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === "string") {
            errorMessage = error;
        } else {
            errorMessage = JSON.stringify(error);
        }
        return { success: false, error: errorMessage }
    }
}

// Also need to update getRooms to convert snake_case to camelCase
export async function getRooms() {
    try {
        const rooms = await queryDocuments(ROOMS_COLLECTION, [], "number", "asc")
        return rooms.map((room: any) => ({
            ...room,
            // Handle both camelCase and snake_case for backward compatibility
            createdAt: room.createdAt ? new Date(room.createdAt).toISOString() : (room.created_at ? new Date(room.created_at).toISOString() : null),
            updatedAt: room.updatedAt ? new Date(room.updatedAt).toISOString() : (room.updated_at ? new Date(room.updated_at).toISOString() : null)
        })) as Room[]
    } catch (error) {
        console.error("Error fetching rooms:", error)
        return []
    }
}

export async function updateRoom(id: string, data: Partial<Room>) {
    try {
        // Convert camelCase to snake_case for database
        const dbData: any = {};
        Object.keys(data).forEach(key => {
            if (key === 'createdAt') {
                dbData.createdAt = (data as any)[key];
            } else if (key === 'updatedAt') {
                dbData.updatedAt = (data as any)[key];
            } else {
                // Convert camelCase to snake_case for other fields? 
                // Wait, if the DB uses camelCase for timestamps, does it use snake_case for other fields?
                // The insert used direct mapping for number, type, etc.
                // RoomDB definition has number, type, etc. as camelCase (or standard JS names).
                // Let's check RoomDB again.
                // It has 'status' (lowercase), 'amenities' (lowercase).
                // The ONLY difference might be multi-word fields.
                // Room has no multi-word fields other than timestamps?
                // Room has `createdAt`, `updatedAt`.
                // Room has `number`, `type`, `price`, `capacity`, `status`, `floor`, `amenities`, `description`.
                // None of these are multi-word (camelCase).
                // So the snake_case conversion is effectively a no-op for these, EXCEPT if I added new fields.
                // But generally safe to just pass them as is if DB uses quoted identifiers.
                // But `createRoom` uses `RoomDB` which has `number`, `type`...
                // So I should just pass them as is.

                dbData[key] = (data as any)[key];
            }
        });

        await updateDocument(ROOMS_COLLECTION, id, dbData)
        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error updating room:", error)
        return { success: false, error }
    }
}

export async function deleteRoom(roomId: string, password: string) {
    try {
        // Check generic business settings
        const { getBusinessSettings } = await import("@/actions/businessSettings");
        const settings = await getBusinessSettings();
        const isPasswordProtectionEnabled = settings?.enablePasswordProtection ?? true;

        if (isPasswordProtectionEnabled) {
            const session = await requireDeletePermission()
            if (session.user.role !== 'super_admin') {
                const validatedPassword = validateInput(deletePasswordSchema, password)
                const DELETION_PASSWORD = process.env.ADMIN_DELETION_PASSWORD;
                if (!DELETION_PASSWORD) {
                    return { success: false, error: 'Deletion password not configured in environment' }
                }
                if ((validatedPassword || '').trim() !== (DELETION_PASSWORD || '').trim()) {
                    return { success: false, error: 'Invalid password' }
                }
            }
        } else {
            console.log(`⚠️ Room deletion performed without password (Protection User-Disabled)`);
        }

        const { error } = await supabaseServer
            .from('rooms')
            .delete()
            .eq('id', roomId)

        if (error) throw error

        revalidatePath('/dashboard/hotel')
        return { success: true }
    } catch (error) {
        console.error('Error deleting room:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

// --- Booking Actions ---

export async function getHotelBookings() {
    console.log("=== GET HOTEL BOOKINGS START ===");
    try {
        console.log("Querying with filter: type == hotel");
        const bookings = await queryDocuments(BOOKINGS_COLLECTION, [
            { field: 'type', operator: '==', value: 'hotel' }
        ], 'createdAt', 'desc')

        console.log("Raw query result:", bookings);
        console.log("Query result type:", typeof bookings);
        console.log("Query result is array:", Array.isArray(bookings));
        console.log("Number of bookings returned:", bookings.length);

        const processedBookings = bookings.map((booking: any) => {
            try {
                // Safely convert dates
                const startDate = booking.startDate ? new Date(booking.startDate) : new Date();
                const endDate = booking.endDate ? new Date(booking.endDate) : new Date();
                const checkIn = booking.checkIn ? new Date(booking.checkIn) : null;
                const checkOut = booking.checkOut ? new Date(booking.checkOut) : null;
                const createdAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
                const updatedAt = booking.updatedAt ? new Date(booking.updatedAt) : new Date();

                // Validate dates
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) ||
                    (checkIn && isNaN(checkIn.getTime())) ||
                    (checkOut && isNaN(checkOut.getTime())) ||
                    isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                    console.warn("Invalid date found in booking, using current date:", booking.id);
                }

                // Derive additional fields for hotel functionality
                const guestCount = booking.guestCount || 1;
                const adults = Math.max(1, guestCount); // Assume at least 1 adult
                const children = Math.max(0, guestCount - adults);

                return {
                    ...booking,
                    startDate: isNaN(startDate.getTime()) ? new Date().toISOString() : startDate.toISOString(),
                    endDate: isNaN(endDate.getTime()) ? new Date().toISOString() : endDate.toISOString(),
                    checkIn: checkIn && !isNaN(checkIn.getTime()) ? checkIn.toISOString() : null,
                    checkOut: checkOut && !isNaN(checkOut.getTime()) ? checkOut.toISOString() : null,
                    createdAt: isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
                    updatedAt: isNaN(updatedAt.getTime()) ? new Date().toISOString() : updatedAt.toISOString(),
                    // Derived fields for hotel functionality
                    guestName: booking.guestName || 'Guest', // Will be populated from customer data
                    guestMobile: booking.customerMobile,
                    guestEmail: booking.guestEmail || null,
                    roomNumber: booking.roomNumber || 'N/A', // Will be populated from room data
                    adults: adults,
                    children: children,
                    paidAmount: booking.totalPaid || 0,
                    payments: booking.payments?.map((p: any) => {
                        try {
                            const paymentDate = p.date ? new Date(p.date) : null;
                            const paymentCreatedAt = p.createdAt ? new Date(p.createdAt) : null;

                            return {
                                ...p,
                                date: paymentDate && !isNaN(paymentDate.getTime()) ? paymentDate.toISOString() : null,
                                createdAt: paymentCreatedAt && !isNaN(paymentCreatedAt.getTime()) ? paymentCreatedAt.toISOString() : null
                            }
                        } catch (paymentDateError) {
                            console.error("Error processing payment date:", paymentDateError, p);
                            return p; // Return payment as-is if date processing fails
                        }
                    }) || [],
                    roomServiceCharges: booking.roomServiceCharges?.map((charge: any) => {
                        try {
                            const chargeCreatedAt = charge.createdAt ? new Date(charge.createdAt) : null;

                            return {
                                ...charge,
                                createdAt: chargeCreatedAt && !isNaN(chargeCreatedAt.getTime()) ? chargeCreatedAt.toISOString() : null
                            }
                        } catch (chargeDateError) {
                            console.error("Error processing charge date:", chargeDateError, charge);
                            return charge; // Return charge as-is if date processing fails
                        }
                    }) || []
                }
            } catch (dateError) {
                console.error("Error processing booking dates:", dateError, booking);
                return booking; // Return booking as-is if date processing fails
            }
        }) as HotelBooking[]

        console.log("Processed bookings:", processedBookings);
        console.log("Number of processed bookings:", processedBookings.length);
        console.log("=== GET HOTEL BOOKINGS END ===");
        return processedBookings;
    } catch (error) {
        console.error("Error getting hotel bookings:", error)
        console.log("=== GET HOTEL BOOKINGS END (ERROR) ===");
        return []
    }
}

export async function createHotelBooking(data: any) {
    console.log("=== CREATE HOTEL BOOKING START ===");

    const { requireAuth } = await import("@/lib/auth-helpers");
    const session = await requireAuth();

    console.log("Input data:", JSON.stringify(data, null, 2));

    try {
        // Handle customer data
        let customerData = null;
        if (data.guestMobile) {
            console.log("Checking customer with mobile:", data.guestMobile);
            // Check if customer exists
            const { data: existingCustomer, error: customerError } = await supabaseServer
                .from('customers')
                .select('*')
                .eq('mobileNumber', data.guestMobile)
                .single();

            console.log("Customer query result:", { existingCustomer, customerError });

            if (!customerError && existingCustomer) {
                customerData = existingCustomer;
                console.log("Found existing customer:", customerData);
                // Update customer visit count and total spent
                const visitCount = (existingCustomer.visitCount || 0) + 1;
                const totalSpent = (existingCustomer.totalSpent || 0) + (data.totalAmount || 0);

                const { error: updateError } = await supabaseServer
                    .from('customers')
                    .update({
                        visitCount,
                        totalSpent,
                        lastVisit: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                    .eq('id', existingCustomer.id);

                if (updateError) {
                    console.error("Error updating customer:", updateError);
                } else {
                    console.log("Customer updated successfully");
                }
            } else {
                console.log("Creating new customer for:", data.guestName);
                // Create new customer
                const { data: newCustomer, error: createError } = await supabaseServer
                    .from('customers')
                    .insert({
                        name: data.guestName,
                        mobileNumber: data.guestMobile,
                        visitCount: 1,
                        totalSpent: data.totalAmount || 0,
                        discountTier: 'regular',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        lastVisit: new Date().toISOString()
                    })
                    .select()
                    .single();

                console.log("New customer creation result:", { newCustomer, createError });

                if (!createError && newCustomer) {
                    customerData = newCustomer;
                    console.log("New customer created:", customerData);
                } else {
                    console.error("Failed to create customer:", createError);
                }
            }
        }

        // Conflict check for overlapping bookings on the same room
        if (data.roomId) {
            const existing = await queryDocuments(BOOKINGS_COLLECTION, [
                { field: 'type', operator: '==', value: 'hotel' },
                { field: 'roomId', operator: '==', value: data.roomId }
            ], 'createdAt', 'desc') as any[]

            const start = new Date(data.startDate)
            const end = new Date(data.endDate)
            const overlaps = existing.some((b: any) => {
                const bStart = new Date(b.startDate)
                const bEnd = new Date(b.endDate)
                const active = (b.status === 'confirmed' || b.status === 'checked-in')
                return active && start < bEnd && end > bStart
            })

            if (overlaps) {
                return { success: false, error: 'Room is already booked for the selected dates' }
            }
        }

        // 1. Create the booking
        console.log("Creating booking with dates:", { startDate: data.startDate, endDate: data.endDate });
        // Safely convert dates to ISO strings
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = data.endDate ? new Date(data.endDate) : new Date();

        console.log("Converted dates:", { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid date format provided");
            throw new Error("Invalid date format provided");
        }

        const bookingData = {
            customerMobile: data.guestMobile,
            type: 'hotel',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            roomId: data.roomId || null,
            notes: data.notes || '',
            totalAmount: data.totalAmount || 0,
            status: 'confirmed',
            eventType: null, // Hotel bookings don't have eventType
            guestCount: data.adults + (data.children || 0), // Combine adults and children
            eventTime: null, // Hotel bookings don't have eventTime
            advancePayment: data.advancePayment || 0,
            payments: [],
            totalPaid: data.advancePayment || 0,
            remainingBalance: (data.totalAmount || 0) - (data.advancePayment || 0),
            paymentStatus: data.advancePayment >= data.totalAmount ? 'completed' : (data.advancePayment > 0 ? 'partial' : 'pending'),
            basePrice: data.basePrice || data.totalAmount || 0,
            discountPercent: data.discountPercent || 0,
            discountAmount: 0, // Calculate if needed
            gstEnabled: data.gstEnabled !== undefined ? data.gstEnabled : true,
            gstPercentage: data.gstPercentage || 18,
            gstAmount: 0, // Calculate if needed
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        console.log("Final booking data to be created:", JSON.stringify(bookingData, null, 2));

        const booking = await createDocument(BOOKINGS_COLLECTION, bookingData)

        console.log("Booking creation result:", booking);

        // 2. Generate receipt number and update booking
        if (booking.success && booking.data?.id) {
            console.log("Generating receipt number for booking:", booking.data.id);
            let receiptNumber = '';
            try {
                // Import the function dynamically to avoid circular dependencies
                const { getNextHotelReceiptNumber } = await import('@/actions/bookings');
                const receiptNum = await getNextHotelReceiptNumber();
                receiptNumber = `HT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(receiptNum).padStart(4, '0')}`;

                console.log("Generated receipt number:", receiptNumber);

                // Update booking with receipt number
                const updateResult = await updateDocument(BOOKINGS_COLLECTION, booking.data.id, {
                    receiptNumber
                });
                console.log("Receipt number update result:", updateResult);
            } catch (error) {
                console.warn('Failed to generate receipt number:', error);
                // Generate fallback receipt number
                receiptNumber = `HT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${booking.data.id.substring(0, 5)}`;
                const updateResult = await updateDocument(BOOKINGS_COLLECTION, booking.data.id, {
                    receiptNumber
                });
                console.log("Fallback receipt number update result:", updateResult);
            }
        } else {
            console.log("Booking creation failed or no ID returned");
        }

        // 3. Record advance payment if any
        if (booking.success && booking.data?.id && data.advancePayment > 0) {
            console.log("Recording advance payment:", data.advancePayment);
            const paymentResult = await addHotelPayment(booking.data.id, {
                amount: data.advancePayment,
                type: data.advancePaymentMethod || 'cash',
                receiptNumber: `ADV-${Date.now().toString().slice(-6)}`,
                notes: 'Advance Payment',
                date: new Date().toISOString()
            });
            console.log("Advance payment result:", paymentResult);
        }

        // Log location if provided
        if (data.location && session.user && booking.data?.id) {
            await logActivityWithLocation(
                session.user.id,
                "create_hotel_booking",
                `Created hotel booking for ${data.guestName}`,
                data.location.lat,
                data.location.lng,
                { bookingId: booking.data.id }
            );
        }

        revalidatePath("/dashboard/hotel");
        console.log("=== CREATE HOTEL BOOKING END ===");
        return { success: true, id: booking.data?.id }
    } catch (error) {
        console.error("=== CREATE HOTEL BOOKING ERROR ===");
        console.error("Error creating hotel booking:", error)
        return { success: false, error }
    }
}

export async function updateHotelBooking(id: string, data: Partial<HotelBooking>) {
    try {
        await updateDocument(BOOKINGS_COLLECTION, id, {
            ...data,
            updatedAt: new Date().toISOString()
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
            id: `payment_${Date.now()}`, // Generate a simple ID
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
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
            updatedAt: new Date().toISOString()
        })

        revalidatePath("/dashboard/hotel")
        return { success: true }
    } catch (error) {
        console.error("Error adding hotel payment:", error)
        return { success: false, error }
    }
}

export async function deleteHotelBooking(id: string, password?: string) {
    try {
        // Check generic business settings
        const { getBusinessSettings } = await import("@/actions/businessSettings");
        const settings = await getBusinessSettings();
        const isPasswordProtectionEnabled = settings?.enablePasswordProtection ?? true;

        if (isPasswordProtectionEnabled) {
            // Only super_admin can delete; if super_admin, allow without password
            const session = await requireDeletePermission()
            if (session.user.role !== 'super_admin') {
                const DELETION_PASSWORD = process.env.ADMIN_DELETION_PASSWORD;
                if (!DELETION_PASSWORD) {
                    return { success: false, error: 'Deletion password not configured in environment' }
                }
                try {
                    const { validateInput, deletePasswordSchema } = await import('@/lib/validation');
                    const validatedPassword = validateInput(deletePasswordSchema, (password || '').trim());
                    if ((validatedPassword || '').trim() !== (DELETION_PASSWORD || '').trim()) {
                        return { success: false, error: 'Invalid password' }
                    }
                } catch (validationError) {
                    return { success: false, error: 'Invalid password format' }
                }
            }
        } else {
            // If protection is disabled, still require authentication
            const { requireAuth } = await import("@/lib/auth-helpers");
            await requireAuth();
        }

        const result = await deleteDocument(BOOKINGS_COLLECTION, id)
        if (result.success) {
            revalidatePath("/dashboard/hotel")
        }
        return result
    } catch (error) {
        console.error("Error deleting hotel booking:", error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

export async function markRoomCleaned(roomId: string) {
    try {
        await updateDocument(ROOMS_COLLECTION, roomId, {
            status: 'available',
            updatedAt: new Date().toISOString()
        })
        revalidatePath('/dashboard/hotel')
        return { success: true }
    } catch (error) {
        console.error('Error marking room cleaned:', error)
        return { success: false, error }
    }
}

export async function checkInGuest(bookingId: string, roomId: string) {
    try {
        // Update booking status
        await updateDocument(BOOKINGS_COLLECTION, bookingId, {
            status: 'checked-in',
            checkIn: new Date().toISOString(), // Update actual check-in time
            updatedAt: new Date().toISOString()
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
            checkOut: new Date().toISOString(), // Update actual check-out time
            updatedAt: new Date().toISOString()
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
        // Since payments are an array inside booking, we can't easily query by payment date in Supabase
        // So we'll fetch active bookings and filter in memory (not ideal for scale but works for now)
        // Or better: fetch bookings updated today

        // FIXED: Filter for hotel bookings only
        const bookings = await queryDocuments(BOOKINGS_COLLECTION, [
            { field: "type", operator: "==", value: "hotel" }
        ]) as HotelBooking[]

        let total = 0
        let count = 0

        bookings.forEach(booking => {
            if (booking.payments) {
                booking.payments.forEach(payment => {
                    // Handle both string and Date formats
                    if (payment.date) {
                        const paymentDate = new Date(payment.date)
                        if (paymentDate >= startOfDay) {
                            total += payment.amount
                        }
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
                startDate: new Date(booking.startDate).toISOString(),
                endDate: new Date(booking.endDate).toISOString(),
                checkIn: booking.checkIn ? new Date(booking.checkIn).toISOString() : null,
                checkOut: booking.checkOut ? new Date(booking.checkOut).toISOString() : null,
                createdAt: new Date(booking.createdAt).toISOString(),
                updatedAt: new Date(booking.updatedAt).toISOString(),
                payments: booking.payments?.map((p: any) => ({
                    ...p,
                    date: p.date ? new Date(p.date).toISOString() : null,
                    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null
                })) || [],
                roomServiceCharges: booking.roomServiceCharges?.map((charge: any) => ({
                    ...charge,
                    createdAt: charge.createdAt ? new Date(charge.createdAt).toISOString() : null
                })) || []
            }
        }

        return null
    } catch (error) {
        console.error("Error getting active booking for room:", error)
        return null
    }
}

