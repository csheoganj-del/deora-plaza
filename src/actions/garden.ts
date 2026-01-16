"use server"

import { revalidatePath } from "next/cache"
import {
  createDocument,
  queryDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"

// Basic error handler
const handleError = (error: unknown) => {
  console.error("=== GARDEN BOOKING ERROR ===");
  console.error("Error type:", typeof error);
  console.error("Error object:", error);
  if (error instanceof Error) {
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return { error: error.message }
  }
  console.error("An unexpected error occurred:", error);
  // Return the actual error object as string to help debug
  return { error: `Unexpected error: ${typeof error === 'object' ? JSON.stringify(error) : String(error)}` }
}

// Revalidate relevant paths
const revalidateGardenPaths = () => {
  revalidatePath("/dashboard/garden")
  revalidatePath("/dashboard/owner")
  revalidatePath("/dashboard")
}

// Get the next sequential receipt number for the month (GR-YYYY-MM-XXXXX)
async function getNextReceiptNumber(): Promise<string> {
  const today = new Date();
  const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const counterName = `garden-receipts-${yearMonth}`;

  // Try to get existing counter
  const { data: counterData, error: counterError } = await supabaseServer
    .from('counters')
    .select('value')
    .eq('id', counterName)
    .single();

  let receiptNumber: number;

  if (counterError || !counterData) {
    // Counter doesn't exist, create it with value 1
    const { error: insertError } = await supabaseServer
      .from('counters')
      .insert([{ id: counterName, value: 1 }]);

    if (insertError) {
      throw insertError;
    }

    receiptNumber = 1;
  } else {
    // Counter exists, increment it
    receiptNumber = counterData.value + 1;
    const { error: updateError } = await supabaseServer
      .from('counters')
      .update({ value: receiptNumber })
      .eq('id', counterName);

    if (updateError) {
      throw updateError;
    }
  }

  // Format: GR-YYYY-MM-XXXXX
  return `GR-${yearMonth}-${String(receiptNumber).padStart(5, '0')}`;
}

// Get all garden bookings
export async function getGardenBookings() {
  try {
    const bookings = await queryDocuments(
      "bookings",
      [{ field: "type", operator: "==", value: "garden" }],
      "startDate",
      "asc"
    )

    const bookingsWithCustomers = await Promise.all(
      bookings.map(async (booking: any) => {
        let customerName = ""
        if (booking.customerMobile) {
          const { data: customerData, error: customerError } = await supabaseServer
            .from("customers")
            .select("name")
            .eq("mobileNumber", booking.customerMobile)
            .limit(1)
            .single()

          if (!customerError && customerData) {
            customerName = customerData.name || booking.customerMobile
          }
        }

        // Calculate derived properties
        const totalPaid = booking.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
        const remainingBalance = booking.totalAmount - totalPaid
        const paymentStatus =
          remainingBalance <= 0
            ? "completed"
            : totalPaid > 0
              ? "partial"
              : "pending"

        // Convert payment timestamps to ISO strings for serialization
        const paymentsWithDates = booking.payments?.map((payment: any) => ({
          ...payment,
          date: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString()
        })) || []

        return {
          id: booking.id,
          customerMobile: booking.customerMobile,
          customerName,
          type: booking.type,
          eventType: booking.eventType,
          startDate: new Date(booking.startDate).toISOString(),
          endDate: new Date(booking.endDate).toISOString(),
          createdAt: new Date(booking.createdAt).toISOString(),
          updatedAt: new Date(booking.updatedAt).toISOString(),
          status: booking.status,
          basePrice: booking.basePrice,
          gstEnabled: booking.gstEnabled,
          gstPercentage: booking.gstPercentage,
          totalAmount: booking.totalAmount,
          notes: booking.notes,
          guestCount: booking.guestCount,
          payments: paymentsWithDates,
          totalPaid,
          remainingBalance,
          paymentStatus,
        }
      })
    )
    return { bookings: bookingsWithCustomers }
  } catch (error) {
    return handleError(error)
  }
}

// Create a new garden booking
export async function createGardenBooking(data: {
  customerName: string
  customerMobile: string
  eventType: string
  startDate: Date
  endDate: Date
  basePrice: number
  gstEnabled: boolean
  gstPercentage: number
  discountPercent?: number
  totalAmount: number
  advancePayment: number
  notes?: string
  guestCount?: number
}) {
  const {
    customerName,
    customerMobile,
    eventType,
    startDate,
    endDate,
    basePrice,
    gstEnabled,
    gstPercentage,
    discountPercent,
    totalAmount,
    advancePayment,
    notes,
    guestCount,
  } = data

  try {
    const { requireAuth } = await import("@/lib/auth-helpers");
    const session = await requireAuth();

    // Before creating a new booking, check if any garden bookings exist.
    // If not, reset the counters to ensure receipts start from 1.
    const { data: gardenBookingsData, error: gardenBookingsError } = await supabaseServer
      .from('bookings')
      .select('*')
      .eq('type', 'garden')
      .limit(1);

    if (!gardenBookingsError && (!gardenBookingsData || gardenBookingsData.length === 0)) {
      // Delete all garden receipt counters
      const { data: countersData, error: countersError } = await supabaseServer
        .from('counters')
        .select('id');

      if (!countersError && countersData) {
        // Delete all counters that start with 'garden-receipts-'
        for (const counter of countersData) {
          if (counter.id.startsWith('garden-receipts-')) {
            await supabaseServer
              .from('counters')
              .delete()
              .eq('id', counter.id);
          }
        }
      }
    }

    // Upsert customer
    const { data: customerData, error: customerError } = await supabaseServer
      .from("customers")
      .select("*")
      .eq("mobileNumber", customerMobile)
      .limit(1)
      .single()

    if (customerError || !customerData) {
      // Create new customer
      const { data: newCustomerData, error: insertError } = await supabaseServer
        .from("customers")
        .insert([{
          name: customerName,
          mobileNumber: customerMobile,
          visitCount: 1,
          lastVisit: new Date().toISOString(),
          preferredBusiness: "garden",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }])
        .select()
        .single()

      if (insertError) {
        throw insertError;
      }
    } else {
      // Update existing customer
      const { error: updateError } = await supabaseServer
        .from("customers")
        .update({
          name: customerName,
          visitCount: (customerData.visitCount || 0) + 1,
          lastVisit: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("mobileNumber", customerMobile)

      if (updateError) {
        throw updateError;
      }
    }

    const newBookingData = {
      customerMobile,
      type: "garden",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "confirmed", // Initial status, will be updated by payment logic
      basePrice,
      gstEnabled,
      gstPercentage,
      discountPercent: discountPercent || 0,
      totalAmount,
      notes: notes || "",
      eventType,
      guestCount: guestCount || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await createDocument("bookings", newBookingData)

    if (result.success && result.data?.id) {
      // Generate receipt number after booking is created (with fallback if counters table doesn't exist)
      let receiptNumber = `GR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${result.data.id.substring(0, 5)}`;
      try {
        receiptNumber = await getNextReceiptNumber();
      } catch (error) {
        console.warn('Failed to generate sequential receipt number, using fallback:', error);
      }

      let finalBooking: any = {
        id: result.data.id,
        ...newBookingData,
        startDate: new Date(newBookingData.startDate).toISOString(),
        endDate: new Date(newBookingData.endDate).toISOString(),
        createdAt: new Date(newBookingData.createdAt).toISOString(),
        updatedAt: new Date(newBookingData.updatedAt).toISOString(),
        payments: [],
        totalPaid: 0,
        remainingBalance: newBookingData.totalAmount,
        paymentStatus: 'pending',
        customerName: customerName,
        receiptNumber: receiptNumber, // Add receipt number to response
      };

      // If there's an advance payment, record it
      if (advancePayment > 0) {
        // We'll implement this function separately
        const paymentResult = await addGardenBookingPayment(result.data.id, advancePayment, "advance")
        if (paymentResult.booking) {
          // Merge the booking data from payment result
          finalBooking = {
            ...finalBooking,
            ...paymentResult.booking,
          };
        }
      }

      revalidateGardenPaths()
      return {
        booking: finalBooking
      }
    } else {
      return { error: result.error || "Failed to create booking" }
    }
  } catch (error) {
    return handleError(error)
  }
}

// Add a payment to a garden booking
export async function addGardenBookingPayment(
  bookingId: string,
  amount: number,
  paymentType: "advance" | "partial" | "final" | "refund" = "partial"
) {
  try {
    const { data: bookingData, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError || !bookingData) {
      return { error: "Booking not found" }
    }

    const receiptNumber = await getNextReceiptNumber();

    const currentPayments = bookingData.payments || []
    const newPayment = {
      id: `payment_${Date.now()}`, // Generate a simple ID
      amount: amount,
      date: new Date().toISOString(),
      type: paymentType,
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
      status: newPaymentStatus,
      updatedAt: new Date().toISOString(),
    })


    if (result.success) {
      revalidateGardenPaths()

      const finalPayments = updatedPayments.map((p: any) => ({
        ...p,
        date: p.date ? new Date(p.date).toISOString() : new Date().toISOString()
      }));

      // Convert timestamps to ISO strings for serialization
      const serializedBooking = {
        id: bookingId,
        customerMobile: bookingData.customerMobile,
        type: bookingData.type,
        eventType: bookingData.eventType,
        startDate: new Date(bookingData.startDate).toISOString(),
        endDate: new Date(bookingData.endDate).toISOString(),
        createdAt: new Date(bookingData.createdAt).toISOString(),
        updatedAt: new Date().toISOString(),
        status: newPaymentStatus,
        basePrice: bookingData.basePrice,
        gstEnabled: bookingData.gstEnabled,
        gstPercentage: bookingData.gstPercentage,
        totalAmount: bookingData.totalAmount,
        notes: bookingData.notes,
        guestCount: bookingData.guestCount,
        payments: finalPayments,
        totalPaid: totalPaid,
        remainingBalance: remainingBalance,
        paymentStatus: newPaymentStatus,
      };

      return { booking: serializedBooking }
    } else {
      return { error: result.error }
    }
  } catch (error) {
    return handleError(error)
  }
}

// Update an existing garden booking
export async function updateGardenBooking(bookingId: string, data: {
  customerName: string
  customerMobile: string
  eventType: string
  startDate: Date
  endDate: Date
  basePrice: number
  gstEnabled: boolean
  gstPercentage: number
  discountPercent?: number
  totalAmount: number
  notes?: string
  guestCount?: number
}) {
  try {
    const { requireAuth } = await import("@/lib/auth-helpers");
    const session = await requireAuth();

    // Get current booking to calculate new balance
    const { data: currentBooking, error: fetchError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !currentBooking) {
      return { error: "Booking not found" };
    }

    // Update customer info if changed
    if (data.customerMobile !== currentBooking.customerMobile) {
      // Logic to update customer association if needed, but for now we basically just update the booking's reference
      // Ideally we might upsert the new customer similar to create
    }

    // Recalculate balance
    const totalPaid = currentBooking.payments?.reduce((sum: any, p: any) => sum + (p.amount || 0), 0) || 0;
    const remainingBalance = data.totalAmount - totalPaid;

    // Determine status
    let status = currentBooking.status;
    if (status !== 'cancelled') {
      if (remainingBalance <= 0) status = 'completed';
      else if (totalPaid > 0) status = 'confirmed'; // ongoing/partial
      else status = 'confirmed'; // default
    }

    const updateData = {
      customerMobile: data.customerMobile,
      // We don't change type
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      basePrice: data.basePrice,
      gstEnabled: data.gstEnabled,
      gstPercentage: data.gstPercentage,
      discountPercent: data.discountPercent || 0,
      totalAmount: data.totalAmount,
      notes: data.notes || "",
      eventType: data.eventType,
      guestCount: data.guestCount || null,
      updatedAt: new Date().toISOString(),
      remainingBalance,
      status, // update status based on new balance
    };

    const result = await updateDocument("bookings", bookingId, updateData);

    if (result.success) {
      revalidateGardenPaths();
      return { success: true, booking: { ...currentBooking, ...updateData } };
    } else {
      return { error: result.error };
    }
  } catch (error) {
    return handleError(error);
  }
}

// Cancel a garden booking
export async function cancelGardenBooking(bookingId: string) {
  try {
    const { requireAuth } = await import("@/lib/auth-helpers");
    await requireAuth();

    const result = await updateDocument("bookings", bookingId, {
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });

    if (result.success) {
      revalidateGardenPaths();
      return { success: true };
    } else {
      return { error: result.error };
    }
  } catch (error) {
    return handleError(error);
  }
}

// Delete a garden booking
export async function deleteGardenBooking(bookingId: string, password?: string) {
  try {
    // Check generic business settings
    const { getBusinessSettings } = await import("@/actions/businessSettings");
    const settings = await getBusinessSettings();
    const isPasswordProtectionEnabled = settings?.enablePasswordProtection ?? true;

    if (isPasswordProtectionEnabled) {
      const { requireDeletePermission } = await import("@/lib/auth-helpers");
      await requireDeletePermission(); // Ensure auth/role

      const DELETION_PASSWORD = process.env.ADMIN_DELETION_PASSWORD;
      if (!DELETION_PASSWORD) {
        return { error: 'Deletion password not configured in environment' }
      }

      const pwd = (password || '').trim();
      const envPwd = (DELETION_PASSWORD || '').trim();

      if (pwd !== envPwd) {
        return { error: 'Incorrect password' }
      }
    }

    // Perform deletion with check
    const { data, error } = await supabaseServer
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .select();

    if (error) {
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      // If no data returned, deletion didn't happen (possibly ID mismatch or already deleted)
      // But acts as success if idempotency is desired.
      // However, user complained about "reappearing", meaning it WAS there.
      // So this implies RLS blocked it IF we weren't using Service Role.
      // But we ARE using Service Role (supabaseServer).
      // So if data is empty, it means ID was wrong?
      return { error: "Record not found or could not be deleted" };
    }

    revalidateGardenPaths()
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// Calculate daily revenue for garden
export async function getGardenDailyRevenue() {
  try {
    // Create start of day in local timezone (IST)
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() // This will be in local timezone
    );

    // Query all garden bookings to check for payments made today
    const bookings = await queryDocuments(
      "bookings",
      [
        { field: "type", operator: "==", value: "garden" }
      ]
    )

    let dailyTotal = 0
    let paymentCount = 0

    bookings.forEach((booking: any) => {
      if (booking.payments && Array.isArray(booking.payments)) {
        booking.payments.forEach((payment: any) => {
          const paymentDate = new Date(payment.date)
          // Check if payment was made today in local timezone
          if (paymentDate >= startOfDay) {
            dailyTotal += payment.amount
            paymentCount++
          }
        })
      }
    })

    return { total: dailyTotal, count: paymentCount }
  } catch (error) {
    console.error("Error calculating garden revenue:", error)
    return { total: 0, count: 0 }
  }
}

// Get a single garden booking by ID
export async function getGardenBookingById(id: string) {
  try {
    const booking = await getDocument("bookings", id)
    if (!booking || booking.type !== 'garden') return { error: "Booking not found" }

    let customerName = ""
    if (booking.customerMobile) {
      const { data: customerData, error: customerError } = await supabaseServer
        .from("customers")
        .select("name")
        .eq("mobileNumber", booking.customerMobile)
        .limit(1)
        .single()

      if (!customerError && customerData) {
        customerName = customerData.name || booking.customerMobile
      }
    }

    // Calculate derived properties
    const totalPaid = booking.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
    const remainingBalance = booking.totalAmount - totalPaid
    const paymentStatus =
      remainingBalance <= 0
        ? "completed"
        : totalPaid > 0
          ? "partial"
          : "pending"

    // Convert payment timestamps to ISO strings
    const paymentsWithDates = booking.payments?.map((payment: any) => ({
      ...payment,
      date: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString()
    })) || []

    return {
      booking: {
        id: booking.id,
        customerMobile: booking.customerMobile,
        customerName,
        // Compatibility aliases for printing
        customer_name: customerName,
        customer_phone: booking.customerMobile,
        total_amount: booking.totalAmount,
        advance_paid: totalPaid,

        type: booking.type,
        eventType: booking.eventType,
        startDate: new Date(booking.startDate).toISOString(),
        endDate: new Date(booking.endDate).toISOString(),
        createdAt: new Date(booking.createdAt).toISOString(),
        updatedAt: new Date(booking.updatedAt).toISOString(),
        status: booking.status,
        basePrice: booking.basePrice,
        gstEnabled: booking.gstEnabled,
        gstPercentage: booking.gstPercentage,
        totalAmount: booking.totalAmount,
        notes: booking.notes,
        guestCount: booking.guestCount,
        payments: paymentsWithDates,
        totalPaid,
        remainingBalance,
        paymentStatus,
      }
    }
  } catch (error) {
    return handleError(error)
  }
}

