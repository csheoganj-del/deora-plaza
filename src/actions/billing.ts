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

// Get the next sequential bill number (reuses deleted numbers to fill gaps)
async function getNextBillNumber(): Promise<string> {
  console.log("🔢 Starting bill number generation...");

  const today = new Date();
  const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  console.log("📅 Date string for bill:", dateString);

  try {
    // Get all bills to find existing numbers
    console.log("📊 Querying existing bills for number generation...");
    const { data: billsData, error: billsError } = await supabaseServer
      .from("bills")
      .select("billNumber");

    if (billsError) {
      console.error("❌ Error querying bills for numbers:", billsError);
      throw new Error(`Bill number query failed: ${billsError.message}`);
    }

    if (!billsData || billsData.length === 0) {
      console.log("📋 No existing bills found, starting from 001");
      return `BILL-${dateString}-001`;
    }

    console.log(`📊 Found ${billsData.length} existing bills`);

    // Extract all existing bill numbers
    const existingNumbers: number[] = [];
    billsData.forEach((bill, index) => {
      const billNumber = bill.billNumber;
      if (billNumber && typeof billNumber === "string") {
        // Extract the number part from "BILL-20251205-003"
        const parts = billNumber.split("-");
        if (parts.length === 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) {
            existingNumbers.push(num);
          } else {
            console.warn(
              `⚠️ Invalid bill number format at index ${index}: ${billNumber}`,
            );
          }
        } else {
          console.warn(
            `⚠️ Unexpected bill number format at index ${index}: ${billNumber}`,
          );
        }
      } else {
        console.warn(
          `⚠️ Invalid bill number type at index ${index}:`,
          typeof billNumber,
          billNumber,
        );
      }
    });

    console.log("🔍 Valid existing numbers:", existingNumbers);

    // Sort the numbers
    existingNumbers.sort((a, b) => a - b);

    // Find the first missing number in the sequence
    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else if (num > nextNumber) {
        // Found a gap, use this number
        break;
      }
    }

    const finalBillNumber = `BILL-${dateString}-${String(nextNumber).padStart(3, "0")}`;
    console.log("✅ Generated bill number:", finalBillNumber);
    return finalBillNumber;
  } catch (error) {
    console.error("❌ Critical error in bill number generation:", error);
    throw error; // Re-throw to be caught by the calling function
  }
}

export async function deleteBill(billId: string, password: string) {
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
          { billId, reason: "Incorrect password" },
          false,
          "Incorrect password"
        );
        return { success: false, error: "Incorrect password" };
      }
    } else {
      // If protection is disabled, just ensure the user is authenticated
      const { requireAuth } = await import("@/lib/auth-helpers");
      await requireAuth();

      // Still log the deletion for audit purposes
      console.log(`⚠️ Bill deletion performed without password (Protection User-Disabled)`);
    }

    // Get the bill to find the orderId
    const { data: billData, error: billError } = await supabaseServer
      .from("bills")
      .select("*")
      .eq("id", billId)
      .single();

    if (billError || !billData) {
      return { success: false, error: "Bill not found" };
    }

    // AUDIT: Log bill deletion
    await auditBillOperation(
      "DELETE_BILL",
      billId,
      billData?.billNumber,
      billData?.grandTotal,
    );

    // Delete the bill
    const { error: deleteError } = await supabaseServer
      .from("bills")
      .delete()
      .eq("id", billId);

    if (deleteError) {
      throw deleteError;
    }

    revalidatePath("/dashboard/billing");
    revalidatePath("/dashboard/orders");

    return {
      success: true,
      message: `Successfully deleted bill ${billData?.billNumber}`,
    };
  } catch (error) {
    console.error("Error deleting bill:", error);
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
      paymentStatus: "paid",
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
      await updateDocument("orders", data.orderId, {
        status: "completed",
        billId: result.data?.id,
        isPaid: true,
        // Removed paymentMethod as it doesn't exist in orders table
      });
      console.log("✅ Order status updated");
    } catch (orderUpdateError) {
      console.warn("⚠️ Order status update failed:", orderUpdateError);
      // Don't fail the bill creation for this
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
    const filters = businessUnit
      ? [{ field: "businessUnit", operator: "==", value: businessUnit }]
      : [];

    const bills = await queryDocuments("bills", filters, "createdAt", "desc");

    return bills.map((bill: any) => ({
      ...bill,
      createdAt: bill.createdAt ? new Date(bill.createdAt).toISOString() : null,
      updatedAt: bill.updatedAt ? new Date(bill.updatedAt).toISOString() : null,
    }));
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

export async function processPayment(
  billId: string,
  paymentMethod: string,
  amountPaid?: number,
) {
  try {
    await updateDocument("bills", billId, {
      paymentStatus: "paid",
      paymentMethod,
      amountPaid: amountPaid || 0,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error processing payment:", error);
    return { success: false, error };
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
) {
  try {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const result = await updateDocument("bills", billId, payload);
    if (!result.success) {
      throw new Error(String(result.error || "Failed to update bill"));
    }

    await auditBillOperation(
      "UPDATE_BILL",
      billId,
      undefined,
      typeof data?.grandTotal === "number" ? data.grandTotal : undefined,
    );

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    console.error("Error updating bill:", error);
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

