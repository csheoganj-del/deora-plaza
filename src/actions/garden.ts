"use server"

import { revalidatePath } from "next/cache"
import {
  createDocument,
  queryDocuments,
  updateDocument,
  deleteDocument,
  timestampToDate,
  dateToTimestamp,
} from "@/lib/firebase/firestore"
import { adminDb } from "@/lib/firebase/admin"
import { recordDiscount } from "@/actions/discounts"
import { updateCustomerStats } from "@/actions/customers"

// Basic error handler
const handleError = (error: unknown) => {
  if (error instanceof Error) {
    console.error("Error:", error.message)
    return { error: error.message }
  }
  console.error("An unexpected error occurred")
  return { error: "An unexpected error occurred" }
}

// Revalidate relevant paths
const revalidateGardenPaths = () => {
  revalidatePath("/dashboard/garden")
  revalidatePath("/dashboard/owner")
  revalidatePath("/dashboard")
}

// Get the next sequential receipt number for the day
async function getNextReceiptNumber(): Promise<number> {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const counterName = `garden-receipts-${dateString}`;
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
          const customerSnapshot = await adminDb
            .collection("customers")
            .where("mobileNumber", "==", booking.customerMobile)
            .limit(1)
            .get()
          if (!customerSnapshot.empty) {
            const customerData = customerSnapshot.docs[0].data()
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
          date: payment.date ? timestampToDate(payment.date).toISOString() : new Date().toISOString()
        })) || []

        return {
          id: booking.id,
          customerMobile: booking.customerMobile,
          customerName,
          type: booking.type,
          eventType: booking.eventType,
          startDate: timestampToDate(booking.startDate).toISOString(),
          endDate: timestampToDate(booking.endDate).toISOString(),
          createdAt: timestampToDate(booking.createdAt).toISOString(),
          updatedAt: timestampToDate(booking.updatedAt).toISOString(),
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
    // Before creating a new booking, check if any garden bookings exist.
    // If not, reset the counters to ensure receipts start from 1.
    const allGardenBookings = await adminDb.collection('bookings').where('type', '==', 'garden').limit(1).get();
    if (allGardenBookings.empty) {
      const countersSnapshot = await adminDb.collection('counters').get();
      if (!countersSnapshot.empty) {
        const batch = adminDb.batch();
        countersSnapshot.docs.forEach(doc => {
          if (doc.id.startsWith('garden-receipts-')) {
            batch.delete(doc.ref);
          }
        });
        await batch.commit();
      }
    }

    // Upsert customer
    const customerQuery = await adminDb
      .collection("customers")
      .where("mobileNumber", "==", customerMobile)
      .limit(1)
      .get()

    let customerId: string
    if (customerQuery.empty) {
      const newCustomer = await adminDb.collection("customers").add({
        name: customerName,
        mobileNumber: customerMobile,
        visitCount: 1,
        lastVisit: dateToTimestamp(new Date()),
        preferredBusiness: "garden",
        createdAt: dateToTimestamp(new Date()),
        updatedAt: dateToTimestamp(new Date()),
      })
      customerId = newCustomer.id
    } else {
      const customerDoc = customerQuery.docs[0]
      customerId = customerDoc.id
      await customerDoc.ref.update({
        name: customerName,
        visitCount: (customerDoc.data().visitCount || 0) + 1,
        lastVisit: dateToTimestamp(new Date()),
        updatedAt: dateToTimestamp(new Date()),
      })
    }

    const newBookingData = {
      customerMobile,
      type: "garden",
      startDate: dateToTimestamp(new Date(startDate)),
      endDate: dateToTimestamp(new Date(endDate)),
      status: "confirmed", // Initial status, will be updated by payment logic
      basePrice,
      gstEnabled,
      gstPercentage,
      discountPercent: discountPercent || 0,
      totalAmount,
      // payments: [], // Initialize payments array
      notes: notes || "",
      eventType,
      guestCount: guestCount || null,
      createdAt: dateToTimestamp(new Date()),
      updatedAt: dateToTimestamp(new Date()),
    }

    const result = await createDocument("bookings", newBookingData)

    if (result.success && result.id) {
      let finalBooking: any = {
        id: result.id,
        ...newBookingData,
        startDate: timestampToDate(newBookingData.startDate).toISOString(),
        endDate: timestampToDate(newBookingData.endDate).toISOString(),
        createdAt: timestampToDate(newBookingData.createdAt).toISOString(),
        updatedAt: timestampToDate(newBookingData.updatedAt).toISOString(),
        payments: [],
        totalPaid: 0,
        remainingBalance: newBookingData.totalAmount,
        paymentStatus: 'pending',
        customerName: customerName,
      };

      // If there's an advance payment, record it
      if (advancePayment > 0) {
        const paymentResult = await addGardenBookingPayment(result.id, advancePayment, "advance")
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
    const bookingRef = adminDb.collection("bookings").doc(bookingId)
    const bookingDoc = await bookingRef.get()

    if (!bookingDoc.exists) {
      return { error: "Booking not found" }
    }

    const booking = bookingDoc.data()
    if (!booking) {
      return { error: "Booking data is empty" }
    }

    const receiptNumber = await getNextReceiptNumber();

    const currentPayments = booking.payments || []
    const newPayment = {
      id: adminDb.collection("payments").doc().id, // Generate a unique ID for the payment
      amount: amount,
      date: dateToTimestamp(new Date()),
      type: paymentType,
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
      status: newPaymentStatus,
      updatedAt: dateToTimestamp(new Date()),
    })


    if (result.success) {
      revalidateGardenPaths()

      const finalPayments = updatedPayments.map((p: any) => ({
        ...p,
        date: p.date ? timestampToDate(p.date).toISOString() : new Date().toISOString()
      }));

      // Convert timestamps to ISO strings for serialization
      const serializedBooking = {
        id: bookingId,
        customerMobile: booking.customerMobile,
        type: booking.type,
        eventType: booking.eventType,
        startDate: booking.startDate ? timestampToDate(booking.startDate).toISOString() : null,
        endDate: booking.endDate ? timestampToDate(booking.endDate).toISOString() : null,
        createdAt: booking.createdAt ? timestampToDate(booking.createdAt).toISOString() : null,
        updatedAt: timestampToDate(dateToTimestamp(new Date())).toISOString(),
        status: newPaymentStatus,
        basePrice: booking.basePrice,
        gstEnabled: booking.gstEnabled,
        gstPercentage: booking.gstPercentage,
        totalAmount: booking.totalAmount,
        notes: booking.notes,
        guestCount: booking.guestCount,
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

// Delete a garden booking
export async function deleteGardenBooking(bookingId: string) {
  try {
    const result = await deleteDocument("bookings", bookingId)
    if (result.success) {
      revalidateGardenPaths()
      return { success: true }
    } else {
      return { error: result.error }
    }
  } catch (error) {
    return handleError(error)
  }
}
// Calculate daily revenue for garden
export async function getGardenDailyRevenue() {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startTimestamp = dateToTimestamp(startOfDay)

    // Query bookings updated today (since adding a payment updates the booking)
    // We use 'updatedAt' as a proxy to find bookings that might have new payments
    const bookings = await queryDocuments(
      "bookings",
      [
        { field: "type", operator: "==", value: "garden" },
        { field: "updatedAt", operator: ">=", value: startTimestamp }
      ]
    )

    let dailyTotal = 0
    let paymentCount = 0

    bookings.forEach((booking: any) => {
      if (booking.payments && Array.isArray(booking.payments)) {
        booking.payments.forEach((payment: any) => {
          const paymentDate = timestampToDate(payment.date)
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
