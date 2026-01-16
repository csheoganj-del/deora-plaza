"use server";

import {
  createDocument,
  queryDocuments,
  updateDocument,
} from "@/lib/supabase/database";
import { supabaseServer } from "@/lib/supabase/server";
import { recordDiscount } from "@/actions/discounts";
import { updateCustomerStats } from "@/actions/customers";
import { calculateBillTotals } from "@/lib/discount-utils";
import {
  requireDeletePermission,
  requireFinancialAccess,
} from "@/lib/auth-helpers";
import {
  validateInput,
  createBillSchema,
  deletePasswordSchema,
} from "@/lib/validation";
import { auditBillOperation, createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// Get the next sequential bill number using atomic operation
async function getNextBillNumber(): Promise<string> {
  console.log("🔢 Starting atomic bill number generation...");

  const today = new Date();
  const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  console.log("📅 Date string for bill:", dateString);

  try {
    // Use atomic function to prevent race conditions
    const { data, error } = await supabaseServer.rpc('get_next_bill_number', {
      date_prefix: dateString
    });

    if (error) {
      console.error("❌ Error getting next bill number:", error);
      // Fallback to timestamp-based number if function fails
      const timestamp = Date.now();
      return `BILL-${dateString}-${timestamp.toString().slice(-6)}`;
    }

    const billNumber = `BILL-${dateString}-${String(data).padStart(3, '0')}`;
    console.log("✅ Generated atomic bill number:", billNumber);
    return billNumber;

  } catch (error) {
    console.error("❌ Critical error in bill number generation:", error);
    // Emergency fallback
    const timestamp = Date.now();
    return `BILL-${dateString}-${timestamp.toString().slice(-6)}`;
  }
}

export async function deleteBill(billId: string, password: string, businessUnit?: string) {
  try {
    console.log(`🗑️ deleteBill called for ${billId} (Unit: ${businessUnit})`);

    // Check generic business settings
    // Check generic business settings
    const { getBusinessSettings } = await import("@/actions/businessSettings");
    const settings = await getBusinessSettings();

    const isPasswordProtectionEnabled = settings?.enablePasswordProtection ?? true;
    console.log(`🔒 deleteBill Protection: ${isPasswordProtectionEnabled}, Password provided length: ${password?.length}`);

    if (isPasswordProtectionEnabled) {
      const { requireDeletePermission } = await import("@/lib/auth-helpers");
      await requireDeletePermission();

      const validatedPassword = validateInput(deletePasswordSchema, password);
      const DELETION_PASSWORD = process.env.ADMIN_DELETION_PASSWORD;

      // Explicitly log failure condition (masked)
      if (!DELETION_PASSWORD) console.error("❌ ADMIN_DELETION_PASSWORD not set in env");
      if (validatedPassword !== DELETION_PASSWORD) console.warn("❌ Password mismatch");

      if (!DELETION_PASSWORD || validatedPassword !== DELETION_PASSWORD) {
        return { success: false, error: "Incorrect password" };
      }
    } else {
      const { requireAuth } = await import("@/lib/auth-helpers");
      await requireAuth();
    }

    // Determine collection: garden and hotel are in 'bookings' table
    const collectionName = (businessUnit === 'hotel' || businessUnit === 'garden') ? "bookings" : "bills";

    // Get the record first for auditing
    const { data: recordData, error: fetchError } = await supabaseServer
      .from(collectionName)
      .select("*")
      .eq("id", billId)
      .single();

    if (fetchError || !recordData) {
      return { success: false, error: "Record not found" };
    }

    // AUDIT
    await auditBillOperation(
      "DELETE_RECORD",
      billId,
      recordData.billNumber || recordData.receiptNumber || 'N/A',
      recordData.grandTotal || recordData.totalAmount || 0
    );

    // Delete the record
    // If it's a booking type, delegate to specific handlers if possible or handle specialized logic
    let specializedDeleteSuccess = false;
    let genericDeleteSuccess = false;
    let deletionError = '';

    if (businessUnit === 'hotel') {
      const { deleteHotelBooking } = await import("@/actions/hotel");
      const hotelResult = await deleteHotelBooking(billId, password);

      if (hotelResult.success) {
        specializedDeleteSuccess = true;
      } else if (hotelResult.error && !hotelResult.error.toLowerCase().includes('not found')) {
        // Real error (like db constraint), not just missing record
        deletionError = hotelResult.error;
      }
    } else if (businessUnit === 'garden') {
      const { deleteGardenBooking } = await import("@/actions/garden");
      const gardenResult = await deleteGardenBooking(billId, password);

      if (!gardenResult.error) {
        specializedDeleteSuccess = true;
      } else if (gardenResult.error && !gardenResult.error.toLowerCase().includes('not found')) {
        // Real error
        deletionError = gardenResult.error;
      }
    }

    // ALWAYS try 'bills' table cleanup for these units (or if it's a generic bill)
    // This handles "zombie" records that linger in the bills table
    if (!deletionError) { // Only proceed if no critical error in specialized delete
      console.log(`🧹 Performing cleanup check on generic bills table for ID: ${billId} (${businessUnit || 'generic'})...`);
      const { data: billData, error: billError } = await supabaseServer
        .from('bills')
        .delete()
        .eq('id', billId)
        .select();

      if (!billError && billData && billData.length > 0) {
        genericDeleteSuccess = true;
        console.log("✅ Deleted ghost/generic record from bills table.");
      } else if (businessUnit !== 'hotel' && businessUnit !== 'garden' && (!billData || billData.length === 0)) {
        // If it was PURELY a generic bill and we found nothing, that's an error
        deletionError = "Record not found in bills database";
      }
    }

    // Determine final result
    // If either deletion succeeded, we consider it a success.
    // If we had a specialized error (e.g. password) we return it.
    if (deletionError) {
      // If we had a specific error that wasn't "Not Found", report it
      return { success: false, error: deletionError };
    }

    if (!specializedDeleteSuccess && !genericDeleteSuccess) {
      // Both returned "Not Found"
      return { success: false, error: "Record not found in any database table" };
    }

    revalidatePath("/dashboard/billing");
    if (businessUnit === 'hotel' || businessUnit === 'garden') revalidatePath("/dashboard/statistics");

    return {
      success: true,
      message: `Successfully deleted ${businessUnit || 'bill'}`,
    };
  } catch (error) {
    console.error("Error deleting bill/booking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function bulkDeleteBills(billIds: string[], password: string) {
  try {
    // Check generic business settings
    const { getBusinessSettings } = await import("@/actions/businessSettings");
    const settings = await getBusinessSettings();
    const isPasswordProtectionEnabled = settings?.enablePasswordProtection ?? true;

    if (isPasswordProtectionEnabled) {
      // SECURITY: Require super_admin role for deletion if protection is enabled
      await requireDeletePermission();

      // SECURITY: Validate password
      const validatedPassword = validateInput(deletePasswordSchema, password);

      // SECURE: Get deletion password from environment variables only
      const DELETION_PASSWORD = process.env.ADMIN_DELETION_PASSWORD;

      if (!DELETION_PASSWORD) {
        return { success: false, error: "Deletion password not configured in environment" };
      }

      if (validatedPassword !== DELETION_PASSWORD) {
        // AUDIT: Log failed deletion attempt
        await createAuditLog(
          "DELETE_BILL",
          { count: billIds.length, reason: "Incorrect password" },
          false,
          "Incorrect password"
        );
        return { success: false, error: "Incorrect password" };
      }
    } else {
      // If protection is disabled, just ensure the user is authenticated
      const { requireAuth } = await import("@/lib/auth-helpers");
      await requireAuth();
    }

    // Perform deletions
    // We'll use a loop here, but ideally this should be a single "hashed" query if Supabase supports "in" for delete
    // Supabase JS .delete().in('id', billIds) is supported!

    // First, fetch the bills to log them (audit)
    const { data: billsToDelete } = await supabaseServer
      .from("bills")
      .select("id, billNumber, grandTotal")
      .in("id", billIds);

    if (billsToDelete && billsToDelete.length > 0) {
      // Log audit for each? Or one bulk audit? Let's do one bulk audit log to save time
      await createAuditLog(
        "DELETE_BILL",
        { count: billsToDelete.length, billNumbers: billsToDelete.map(b => b.billNumber) },
        true,
        `Bulk deleted ${billsToDelete.length} bills`
      );
    }

    const { error: deleteError } = await supabaseServer
      .from("bills")
      .delete()
      .in("id", billIds);

    if (deleteError) {
      throw deleteError;
    }

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/orders");

    return {
      success: true,
      message: `Successfully deleted ${billIds.length} bills`,
    };
  } catch (error) {
    console.error("Error bulk deleting bills:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createBill(data: {
  orderId: string;
  businessUnit: string;
  customerMobile?: string;
  customerName?: string;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod?: string;
  paymentStatus?: string; // 'paid' or 'pending'
  source?: string; // 'dine-in', 'online', 'zomato', 'swiggy'
  address?: string;
  items?: any[]; // Add items array
}) {
  try {
    // SECURITY: Require authentication
    const session = await requireFinancialAccess();

    // SECURITY: Validate input data
    const validatedData = validateInput(createBillSchema, data);

    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 Starting bill creation process...");
    }

    let billNumber;
    try {
      billNumber = await getNextBillNumber();
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ Bill number generated:", billNumber);
      }
    } catch (billNumberError) {
      console.error("❌ Bill number generation failed:", billNumberError);
      return {
        success: false,
        error: `Bill number generation failed: ${billNumberError instanceof Error ? billNumberError.message : String(billNumberError)}`,
      };
    }

    const billData = {
      billNumber,
      orderId: data.orderId,
      businessUnit: data.businessUnit,
      customerMobile: data.customerMobile || null,
      customerName: data.customerName || null,
      subtotal: data.subtotal,
      discountPercent: data.discountPercent || 0,
      discountAmount: data.discountAmount || 0,
      gstPercent: data.gstPercent,
      gstAmount: data.gstAmount,
      grandTotal: data.grandTotal,
      paymentMethod: data.paymentMethod || "cash",
      paymentStatus: data.paymentStatus || "paid",
      source: data.source || "dine-in",
      address: data.address || null,
      items: JSON.stringify(data.items || []), // Save items array as JSON string
      createdAt: new Date().toISOString(),
    };

    let result;
    try {
      result = await createDocument("bills", billData);
      if (!result.success) {
        console.error("❌ Bill document creation failed:", result.error);
        return {
          success: false,
          error: `Database insert failed: ${result.error}`,
        };
      }
      if (process.env.NODE_ENV === 'development') {
        console.log("✅ Bill document created successfully:", result.data?.id);
      }
    } catch (createError) {
      console.error("❌ Bill creation error:", createError);
      return {
        success: false,
        error: `Bill creation failed: ${createError instanceof Error ? createError.message : String(createError)}`,
      };
    }

    // AUDIT: Log bill creation
    await auditBillOperation(
      "CREATE_BILL",
      result.data?.id || "",
      billNumber,
      data.grandTotal,
    );

    // Get order details to check if it has a table
    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();

    if (orderError) {
      console.warn("⚠️ Could not fetch order details:", orderError);
    } else {
      console.log("✅ Order details retrieved:", orderData?.id);
    }

    // Update order status to completed
    console.log("🔄 Updating order status to completed...");
    try {
      // Verify bill exists before updating order (Consistency Check)
      if (result.data?.id) {
        const { data: verifyBill } = await supabaseServer
          .from("bills")
          .select("id")
          .eq("id", result.data.id)
          .single();

        if (!verifyBill) {
          console.error("❌ CRITICAL: Bill created but not found in DB immediately:", result.data.id);
          // Wait a moment and try again (Replication lag handling)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await updateDocument("orders", data.orderId, {
        status: "completed",
        billId: result.data?.id,
        isPaid: true,
        // Removed paymentMethod as it doesn't exist in orders table
      });
      console.log("✅ Order status updated");
    } catch (orderUpdateError) {
      console.warn("⚠️ Order status update failed:", orderUpdateError);
      // Don't fail the bill creation for this, but log it clearly
      // If FK error, it means bill is missing.
    }

    // If order has a table, reset it to available
    if (!orderError && orderData?.tableId) {
      console.log("🪑 Resetting table status for table:", orderData.tableId);
      try {
        await updateDocument("tables", orderData.tableId, {
          status: "available",
          currentOrderId: null,
          // Removed customerCount as it doesn't exist in tables table
        });
        console.log("✅ Table status reset");
      } catch (tableUpdateError) {
        console.warn("⚠️ Table status update failed:", tableUpdateError);
      }
    }

    // Handle customer creation/updating
    console.log("👥 Handling customer data...");
    try {
      if (data.customerMobile && data.customerName) {
        console.log("📱 Processing customer:", data.customerMobile, data.customerName);

        // Check if customer exists
        const { data: existingCustomer, error: fetchError } = await supabaseServer
          .from("customers")
          .select("id, visitCount, totalSpent")
          .eq("mobileNumber", data.customerMobile)
          .single();

        if (fetchError || !existingCustomer) {
          console.log("🆕 Creating new customer...");
          // Create new customer with initial values (only fields that exist in the schema)
          const { error: insertError, data: insertedData } = await supabaseServer
            .from("customers")
            .insert([{
              mobileNumber: data.customerMobile,
              name: data.customerName,
              email: null,
              visitCount: 1,
              totalSpent: data.grandTotal,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }])
            .select();

          if (insertError) {
            console.error("❌ Failed to create customer:", insertError);
            console.error("📋 Customer data that failed:", {
              mobileNumber: data.customerMobile,
              name: data.customerName,
              email: null,
              visitCount: 1,
              totalSpent: data.grandTotal,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            console.log("✅ New customer created successfully", insertedData);
          }
        } else {
          console.log("🔄 Updating existing customer...");
          // Update existing customer with incremented values
          const { error: updateError, data: updatedData } = await supabaseServer
            .from("customers")
            .update({
              name: data.customerName,
              visitCount: (existingCustomer.visitCount || 0) + 1,
              totalSpent: (existingCustomer.totalSpent || 0) + data.grandTotal,
              updatedAt: new Date().toISOString(),
            })
            .eq("mobileNumber", data.customerMobile)
            .select();

          if (updateError) {
            console.error("❌ Failed to update customer:", updateError);
            console.error("📋 Update data that failed:", {
              name: data.customerName,
              visitCount: (existingCustomer.visitCount || 0) + 1,
              totalSpent: (existingCustomer.totalSpent || 0) + data.grandTotal,
              updatedAt: new Date().toISOString(),
            });
          } else {
            console.log("✅ Customer updated successfully", updatedData);
          }
        }
      } else {
        console.log("ℹ️ No customer data provided, skipping customer processing");
      }
    } catch (customerError) {
      console.error("❌ Error in customer handling:", customerError);
    }

    // Process discount recording
    console.log("💳 Processing discount recording...");
    try {
      if (data.discountAmount && data.discountAmount > 0) {
        // First, we need to get the customer ID if customer exists
        let customerId = "";
        let customerName = "Anonymous";

        if (data.customerMobile) {
          const { data: customerData } = await supabaseServer
            .from("customers")
            .select("id, name")
            .eq("mobileNumber", data.customerMobile)
            .single();

          if (customerData) {
            customerId = customerData.id;
            customerName = customerData.name;
          }
        }

        await recordDiscount({
          customerId: customerId,
          customerName: customerName,
          billId: result.data?.id || "",
          businessUnit: data.businessUnit,
          originalAmount: data.subtotal,
          discountPercent: data.discountPercent || 0,
          discountAmount: data.discountAmount,
          finalAmount: data.grandTotal,
        });
        console.log("✅ Discount recorded");
      } else {
        console.log("ℹ️ No discount to record");
      }
    } catch (discountError) {
      console.warn("⚠️ Discount recording failed:", discountError);
    }

    console.log("🎉 Bill creation completed successfully!");
    return { success: true, billId: result.data?.id, billNumber };
  } catch (error) {
    console.error("❌ CRITICAL ERROR in createBill:", error);
    console.error(
      "Error name:",
      error instanceof Error ? error.name : "Unknown",
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error(
      "Error cause:",
      error instanceof Error ? error.cause : undefined,
    );

    return {
      success: false,
      error: `Critical error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getBills(businessUnit?: string) {
  try {
    let allBills: any[] = [];

    // 1. Fetch from 'bills' collection (Cafe/Bar standard bills)
    if (!businessUnit || businessUnit === 'cafe' || businessUnit === 'bar') {
      const filters = businessUnit
        ? [{ field: "businessUnit", operator: "==", value: businessUnit }]
        : [];
      const bills = await queryDocuments("bills", filters, "createdAt", "desc");
      allBills = [...allBills, ...bills];
    }

    // 2. Fetch from 'bookings' collection (Hotel/Garden revenue)
    if (!businessUnit || businessUnit === 'hotel' || businessUnit === 'garden') {
      const filters: any[] = [{ field: "type", operator: "in", value: ['hotel', 'garden'] }];
      if (businessUnit) {
        // If specific unit requested, filter by that type
        filters[0] = { field: "type", operator: "==", value: businessUnit } as any;
      }

      const bookings = await queryDocuments("bookings", filters, "createdAt", "desc");

      // Map bookings to Bill format
      const mappedBookings = bookings.map((b: any) => ({
        id: b.id,
        billNumber: b.receiptNumber || b.payments?.[0]?.receiptNumber || `BK-${b.id.slice(0, 8)}`,
        orderId: b.id,
        businessUnit: b.type, // 'hotel' or 'garden'
        customerName: b.customerName || b.guestName || 'Valued Guest',
        customerMobile: b.customerMobile,
        subtotal: b.basePrice || b.totalAmount || 0,
        discountPercent: b.discountPercent || 0,
        discountAmount: b.discountAmount || 0,
        gstPercent: b.gstPercentage || 0,
        gstAmount: b.gstAmount || 0,
        grandTotal: b.totalAmount || 0,
        paymentMethod: b.payments?.[0]?.type || 'Cash/Online',
        paymentStatus: (b.status === 'completed' || (b.remainingBalance !== undefined && b.remainingBalance <= 0)) ? 'paid' : 'unpaid',
        source: b.type === 'garden' ? (b.eventType || 'Event') : 'Booking',
        address: b.notes || '',
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        items: b.payments || [] // Include payment history as items for reference
      }));

      allBills = [...allBills, ...mappedBookings];
    }

    // Sort by date descending
    return allBills.map((bill: any) => ({
      ...bill,
      createdAt: bill.createdAt ? new Date(bill.createdAt).toISOString() : null,
      updatedAt: bill.updatedAt ? new Date(bill.updatedAt).toISOString() : null,
    })).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return [];
  }
}

export async function getBillById(billId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("bills")
      .select("*")
      .eq("id", billId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      ...data,
      createdAt: data?.createdAt
        ? new Date(data.createdAt).toISOString()
        : null,
    };
  } catch (error) {
    console.error("Error fetching bill:", error);
    return null;
  }
}

export async function generateBill(data: any) {
  console.log(
    "🚀 generateBill called with data:",
    JSON.stringify(data, null, 2),
  );

  try {
    // Use simplified createBill function
    const result = await createBill(data);
    console.log("📊 createBill result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("❌ generateBill error:", error);
    return {
      success: false,
      error: `generateBill failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Add a debug version that bypasses all complex logic
export async function generateBillDebug(data: any) {
  console.log(
    "🐛 DEBUG: generateBillDebug called with:",
    JSON.stringify(data, null, 2),
  );

  try {
    // Ultra-simple bill generation for debugging
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const billNumber = `BILL-${dateString}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;

    const simpleBillData = {
      billNumber: billNumber,
      orderId: data.orderId,
      businessUnit: data.businessUnit || "cafe",
      subtotal: data.subtotal || 0,
      gstPercent: data.gstPercent || 18,
      gstAmount: data.gstAmount || 0,
      grandTotal: data.grandTotal || 0,
      paymentStatus: "paid",
      source: "dine-in",
      items: JSON.stringify(data.items || []),
      createdAt: new Date().toISOString(),
    };

    console.log(
      "🐛 DEBUG: Inserting simple bill data:",
      JSON.stringify(simpleBillData, null, 2),
    );

    const { data: insertedBill, error: insertError } = await supabaseServer
      .from("bills")
      .insert(simpleBillData)
      .select();

    if (insertError) {
      console.error("🐛 DEBUG: Bill insertion failed:", insertError);
      return {
        success: false,
        error: `Debug bill creation failed: ${insertError.message}`,
      };
    }

    return {
      success: true,
      billId: insertedBill[0].id,
      billNumber: insertedBill[0].billNumber,
    };
  } catch (error) {
    console.error("🐛 DEBUG: Critical error:", error);
    return {
      success: false,
      error: `Debug bill generation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function ensureBillForOrder(orderId: string) {
  try {
    // 1. Check if bill already exists
    const { data: existingBill, error: fetchError } = await supabaseServer
      .from("bills")
      .select("*")
      .eq("orderId", orderId)
      .single();

    if (existingBill) {
      return { success: true, bill: existingBill, created: false };
    }

    // 2. Fetch Order Data to create new bill
    const { data: order, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: "Order not found" };
    }

    // 3. Create Bill Data
    // Calculate totals if not present (simple fallback)
    const subtotal = order.totalAmount || 0;
    // Assuming inclusive or default logic if details missing
    const gstPercent = 5; // Default for F&B
    const gstAmount = subtotal * (gstPercent / 100);
    const grandTotal = subtotal + gstAmount;

    // Use generateBillDebug logic but production ready?
    // Actually, better to use createBill if we can map data, but createBill requires detailed breakdown.
    // For now, let's construct a valid payload for createBill

    // Parse items for createBill
    let items = order.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { }
    }

    const billPayload: any = {
      orderId: order.id,
      businessUnit: order.businessUnit || 'cafe',
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      subtotal: subtotal,
      grandTotal: subtotal,
      gstPercent: 0,
      gstAmount: 0,
      paymentStatus: 'pending',
      items: items,
      source: 'takeaway-auto'
    };

    const result = await createBill(billPayload);

    if (result.success && result.billId) {
      const { data: newBill } = await supabaseServer
        .from("bills")
        .select("*")
        .eq("id", result.billId)
        .single();
      return { success: true, bill: newBill, created: true };
    }

    return { success: false, error: result.error };

  } catch (error) {
    console.error("ensureBillForOrder error:", error);
    return { success: false, error: "Failed to ensure bill" };
  }
}

export async function processPayment(
  billId: string,
  paymentMethod: string,
  amountPaid?: number,
  fromDepartment?: string,
  toDepartment?: string,
  staffId?: string,
  notes?: string
) {
  try {
    // Import the internal payment system
    const { processInternalPayment, validateInternalPaymentMethod } = await import("@/lib/payment-gateway");

    // Validate payment method
    if (!(await validateInternalPaymentMethod(paymentMethod))) {
      return {
        success: false,
        error: `Unsupported payment method: ${paymentMethod}`
      };
    }

    // Get bill details for amount validation
    const { data: billData, error: billError } = await supabaseServer
      .from("bills")
      .select("grandTotal, paymentStatus, businessUnit")
      .eq("id", billId)
      .single();

    if (billError || !billData) {
      return { success: false, error: "Bill not found" };
    }

    if (billData.paymentStatus === "paid") {
      return { success: false, error: "Bill is already paid" };
    }

    const amount = amountPaid || billData.grandTotal;

    // Process payment through internal system
    const paymentResult = await processInternalPayment({
      billId,
      amount,
      paymentMethod: paymentMethod as any,
      fromDepartment: fromDepartment || billData.businessUnit,
      toDepartment: toDepartment || 'cash_register',
      staffId,
      notes
    });

    if (paymentResult.success) {
      return {
        success: true,
        transactionId: paymentResult.transactionId,
        message: "Internal payment processed successfully"
      };
    } else {
      // Update bill with failed payment status
      await updateDocument("bills", billId, {
        paymentStatus: "failed",
        paymentMethod,
        failedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        success: false,
        error: paymentResult.error || "Internal payment processing failed"
      };
    }
  } catch (error) {
    console.error("Error processing internal payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal payment processing failed"
    };
  }
}

export async function processOrderCancellation(
  orderId: string,
  billId: string,
  reason: string,
  password: string
) {
  try {
    // Check generic business settings for password protection
    const { getBusinessSettings } = await import("@/actions/businessSettings");
    const settings = await getBusinessSettings();
    const isPasswordProtectionEnabled = settings?.enablePasswordProtection ?? true;

    if (isPasswordProtectionEnabled) {
      // SECURITY: Require super_admin role for cancellations
      await requireDeletePermission();

      // SECURITY: Validate password
      const validatedPassword = validateInput(deletePasswordSchema, password);

      // SECURE: Get deletion password from environment variables only
      const DELETION_PASSWORD = process.env.ADMIN_DELETION_PASSWORD;

      if (!DELETION_PASSWORD) {
        return { success: false, error: "Cancellation password not configured in environment" };
      }

      if (validatedPassword !== DELETION_PASSWORD) {
        // AUDIT: Log failed cancellation attempt
        await createAuditLog(
          "ORDER_CANCELLATION_ATTEMPT",
          { orderId, billId, reason: "Incorrect password" },
          false,
          "Incorrect password for order cancellation"
        );
        return { success: false, error: "Incorrect password" };
      }
    } else {
      // If protection is disabled, just ensure the user is authenticated
      const { requireAuth } = await import("@/lib/auth-helpers");
      const session = await requireAuth();
    }

    // Get order and bill details
    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      return { success: false, error: "Order not found" };
    }

    let billData = null;
    if (billId) {
      const { data: bill, error: billError } = await supabaseServer
        .from("bills")
        .select("*")
        .eq("id", billId)
        .single();

      if (!billError && bill) {
        billData = bill;
      }
    }

    // Process order cancellation through internal system
    const { processOrderCancellation: internalCancellation } = await import("@/lib/payment-gateway");
    const session = await requireFinancialAccess();

    const cancellationResult = await internalCancellation(
      orderId,
      billId,
      reason,
      session.user.id
    );

    if (cancellationResult.success) {
      // AUDIT: Log successful cancellation
      await auditBillOperation(
        "ORDER_CANCELLED",
        billId,
        billData?.billNumber,
        billData?.grandTotal,
      );

      revalidatePath("/dashboard/billing");
      revalidatePath("/dashboard/orders");

      return {
        success: true,
        cancellationId: cancellationResult.transferId,
        message: `Successfully cancelled order and associated bill`,
      };
    } else {
      // AUDIT: Log failed cancellation
      await auditBillOperation(
        "ORDER_CANCELLATION_FAILED",
        billId,
        billData?.billNumber,
        billData?.grandTotal,
      );

      return {
        success: false,
        error: cancellationResult.error || "Order cancellation processing failed",
      };
    }
  } catch (error) {
    console.error("Error processing order cancellation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Order cancellation processing failed",
    };
  }
}

/**
 * Create a bill directly without creating an order (billing-only mode)
 * This function is used when billing-only mode is enabled for a business unit
 */
export async function createDirectBill(data: {
  businessUnit: string;
  tableId?: string;
  tableNumber?: string;
  customerMobile?: string;
  customerName?: string;
  address?: string;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  offlineId?: string; // For offline sync
}) {
  try {
    console.log("=== CREATE DIRECT BILL (BILLING-ONLY MODE) ===");
    console.log("Data:", JSON.stringify(data, null, 2));

    const { requireAuth } = await import("@/lib/auth-helpers");
    const session = await requireAuth();

    // Generate bill number
    const billNumber = await getNextBillNumber();
    console.log("Generated bill number:", billNumber);

    // Handle customer creation if needed
    if (data.customerMobile) {
      try {
        const { getCustomerByMobile, createCustomer } = await import("@/actions/customers");
        const existingCustomer = await getCustomerByMobile(data.customerMobile);

        if (!existingCustomer) {
          await createCustomer({
            mobileNumber: data.customerMobile,
            name: data.customerName || "Walk-in Customer",
          });
        }
      } catch (customerError) {
        console.warn("Error handling customer:", customerError);
      }
    }

    // Create bill directly (no order)
    const billData: any = {
      billNumber,
      orderId: null, // No order in billing-only mode
      businessUnit: data.businessUnit,
      customerMobile: data.customerMobile || null,
      customerName: data.customerName || null,
      address: data.address || null,
      subtotal: data.subtotal,
      discountPercent: data.discountPercent || 0,
      discountAmount: data.discountAmount || 0,
      gstPercent: data.gstPercent,
      gstAmount: data.gstAmount,
      grandTotal: data.grandTotal,
      paymentMethod: data.paymentMethod || null,
      paymentStatus: data.paymentMethod ? "paid" : "unpaid",
      source: "billing-only-mode",
      items: JSON.stringify(data.items), // Store items as JSON string
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add offline ID if provided (for sync tracking)
    if (data.offlineId) {
      billData.offlineId = data.offlineId;
    }

    const result = await createDocument("bills", billData);

    if (!result.success) {
      console.error("Failed to create direct bill:", result.error);
      return {
        success: false,
        error: result.error || "Failed to create bill",
      };
    }

    console.log("Direct bill created successfully:", result.data?.id);

    // Update table status if applicable (mark as occupied with bill)
    if (data.tableId) {
      try {
        const { updateTableStatus } = await import("./tables");
        await updateTableStatus(data.tableId, "occupied", 0, result.data?.id);
      } catch (tableError) {
        console.warn("Failed to update table status:", tableError);
      }
    }

    // Record discount if applicable
    if (data.discountAmount && data.discountAmount > 0) {
      try {
        await recordDiscount({
          billId: result.data?.id || "",
          orderId: null,
          discountType: data.discountPercent ? "percentage" : "fixed",
          discountValue: data.discountPercent || data.discountAmount,
          discountAmount: data.discountAmount,
          reason: "Direct billing discount",
          appliedBy: session.user?.id || "system",
        });
      } catch (discountError) {
        console.warn("Failed to record discount:", discountError);
      }
    }

    // Create audit log
    try {
      await auditBillOperation(
        "create",
        result.data?.id || "",
        session.user?.id || "system",
        "Direct bill created (billing-only mode)",
        { billNumber, businessUnit: data.businessUnit, items: data.items.length }
      );
    } catch (auditError) {
      console.warn("Failed to create audit log:", auditError);
    }

    console.log("=== DIRECT BILL CREATED SUCCESSFULLY ===");

    return {
      success: true,
      billId: result.data?.id,
      billNumber,
    };
  } catch (error) {
    console.error("Error creating direct bill:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getCancellationHistory(orderId?: string) {
  try {
    const filters = orderId
      ? [
        { field: "orderId", operator: "==", value: orderId },
        { field: "type", operator: "==", value: "order_cancellation" }
      ]
      : [{ field: "type", operator: "==", value: "order_cancellation" }];

    const cancellations = await queryDocuments("internal_transactions", filters, "createdAt", "desc");

    return cancellations.map((cancellation: any) => ({
      ...cancellation,
      createdAt: cancellation.createdAt ? new Date(cancellation.createdAt).toISOString() : null,
      updatedAt: cancellation.updatedAt ? new Date(cancellation.updatedAt).toISOString() : null,
    }));
  } catch (error) {
    console.error("Error fetching cancellation history:", error);
    return [];
  }
}

import { getGardenDailyRevenue } from "@/actions/garden";
import { getHotelDailyRevenue } from "@/actions/hotel";

export async function updateBill(
  billId: string,
  data: Partial<{
    customerName: string;
    customerMobile: string;
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    gstPercent: number;
    gstAmount: number;
    grandTotal: number;
    address: string;
    items: any[] | string;
  }>,
  businessUnit?: string
) {
  try {
    const { requireAuth } = await import("@/lib/auth-helpers");
    await requireAuth();

    const collectionName = (businessUnit === 'hotel' || businessUnit === 'garden') ? "bookings" : "bills";
    const payload: any = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (collectionName === "bookings" && data.grandTotal !== undefined) {
      payload.totalAmount = data.grandTotal;
    }

    const result = await updateDocument(collectionName, billId, payload);
    if (!result.success) {
      throw new Error(String(result.error || `Failed to update ${collectionName}`));
    }

    revalidatePath("/dashboard/billing");
    if (collectionName === "bookings") revalidatePath("/dashboard/statistics");

    return { success: true };
  } catch (error) {
    console.error("Error updating record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


export async function getDailyRevenue(businessUnit?: string) {
  try {
    if (businessUnit === "garden") {
      return await getGardenDailyRevenue();
    }
    if (businessUnit === "hotel") {
      return await getHotelDailyRevenue();
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const filters: any[] = [
      { field: "createdAt", operator: ">=", value: startOfDay.toISOString() },
    ];

    if (businessUnit) {
      filters.push({
        field: "businessUnit",
        operator: "==",
        value: businessUnit,
      });
    }

    const bills = await queryDocuments("bills", filters);

    const total = bills.reduce(
      (total: number, bill: any) => total + (bill.grandTotal || 0),
      0,
    );
    return { total, count: bills.length };
  } catch (error) {
    console.error("Error fetching daily revenue:", error);
    return { total: 0, count: 0 };
  }
}

export async function getRevenueStats(businessUnit?: string) {
  try {
    const now = new Date();

    // Limit our query to the last 6 months to avoid quota issues
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    // Daily revenue (today)
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    // Weekly revenue (last 7 days)
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
      0,
      0,
      0,
      0,
    );

    // Monthly revenue (current month)
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    // Last month revenue
    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
      0,
      0,
      0,
      0,
    );

    // End of last month
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0, // Day 0 = last day of previous month
      23,
      59,
      59,
      999,
    );

    // Query paid bills from the last 6 months only to avoid quota issues
    const allPaidBills = await queryDocuments("bills", [
      { field: "paymentStatus", operator: "==", value: "paid" },
      { field: "createdAt", operator: ">=", value: sixMonthsAgo.toISOString() },
    ]);

    // Filter bills by date ranges in memory
    const dailyBills = allPaidBills.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startOfDay;
    });

    const weeklyBills = allPaidBills.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startOfWeek;
    });

    const monthlyBills = allPaidBills.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startOfMonth;
    });

    const lastMonthBills = allPaidBills.filter((bill: any) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startOfLastMonth && billDate <= endOfLastMonth;
    });

    // Filter by businessUnit in memory if needed
    const filterByUnit = (bills: any[]) => {
      if (!businessUnit) return bills;
      return bills.filter((bill) => bill.businessUnit === businessUnit);
    };

    const filteredDailyBills = filterByUnit(dailyBills);
    const filteredWeeklyBills = filterByUnit(weeklyBills);
    const filteredMonthlyBills = filterByUnit(monthlyBills);
    const filteredLastMonthBills = filterByUnit(lastMonthBills);

    const daily = filteredDailyBills.reduce(
      (sum: number, bill: any) => sum + (bill.grandTotal || 0),
      0,
    );
    const weekly = filteredWeeklyBills.reduce(
      (sum: number, bill: any) => sum + (bill.grandTotal || 0),
      0,
    );
    const monthly = filteredMonthlyBills.reduce(
      (sum: number, bill: any) => sum + (bill.grandTotal || 0),
      0,
    );
    const lastMonth = filteredLastMonthBills.reduce(
      (sum: number, bill: any) => sum + (bill.grandTotal || 0),
      0,
    );

    // Calculate growth percentage
    const growth =
      lastMonth > 0 ? ((monthly - lastMonth) / lastMonth) * 100 : 0;

    return { daily, weekly, monthly, lastMonth, growth };
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    return { daily: 0, weekly: 0, monthly: 0, lastMonth: 0, growth: 0 };
  }
}

export async function getUnbilledOrders() {
  try {
    // Get orders that are served/completed but not yet billed
    const orders = await queryDocuments("orders", [
      { field: "status", operator: "in", value: ["served", "completed"] },
    ]);

    // Helper function to safely convert any timestamp to ISO string
    const safeTimestampToISO = (ts: any): string | null => {
      if (!ts) return null;
      if (typeof ts === "string") return ts;
      try {
        if (ts instanceof Date) return ts.toISOString();
        if (typeof ts === "number") return new Date(ts).toISOString();
        return null;
      } catch (e) {
        console.error("Error converting timestamp:", e, ts);
        return null;
      }
    };

    // Filter out orders that already have a billId and serialize timestamps
    return orders
      .filter((order: any) => !order.billId)
      .map((order: any) => ({
        ...order,
        createdAt: safeTimestampToISO(order.createdAt),
        updatedAt: safeTimestampToISO(order.updatedAt),
        pendingAt: safeTimestampToISO(order.pendingAt),
        preparingAt: safeTimestampToISO(order.preparingAt),
        readyAt: safeTimestampToISO(order.readyAt),
        servedAt: safeTimestampToISO(order.servedAt),
        completedAt: safeTimestampToISO(order.completedAt),
        timeline: Array.isArray(order.timeline)
          ? order.timeline.map((entry: any) => ({
            ...entry,
            timestamp: safeTimestampToISO(entry.timestamp),
          }))
          : order.timeline,
      }));
  } catch (error) {
    console.error("Error fetching unbilled orders:", error);
    return [];
  }
}

