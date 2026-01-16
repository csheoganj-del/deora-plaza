"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import {
  deleteDocument,
  updateDocument,
  createDocument,
  queryDocuments,
} from "@/lib/supabase/database";
import { updateTableStatus } from "./tables";

export async function createOrder(data: {
  tableId?: string;
  tableNumber?: string;
  customerMobile?: string;
  customerName?: string;
  type: string;
  businessUnit: string;
  roomNumber?: string;
  source?: string;
  guestCount?: number;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
    description?: string; // Add description support
    status?: string; // Allow initial status override for items
  }>;
  initialStatus?: string; // Add initialStatus parameter
  discountPercent?: number;
  discountAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
}) {
  try {
    console.log("=== CREATE ORDER ACTION STARTED ===");

    // Get current user for logging
    const { requireAuth } = await import("@/lib/auth-helpers");
    const session = await requireAuth();

    console.log("createOrder: Received data:", JSON.stringify(data, null, 2));


    // Validate required fields
    if (!data.type) {
      console.error("createOrder: Missing required field 'type'");
      return { success: false, error: "Order type is required" };
    }

    if (!data.businessUnit) {
      console.error("createOrder: Missing required field 'businessUnit'");
      return { success: false, error: "Business unit is required" };
    }

    if (!data.items || data.items.length === 0) {
      console.error("createOrder: No items provided");
      return { success: false, error: "At least one item is required" };
    }

    // Generate order number
    const timestamp = Date.now();
    const orderNumber = `ORD-${timestamp}`;
    console.log("createOrder: Generated order number:", orderNumber);

    // Calculate total
    // Calculate total
    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      console.log(
        `Item calculation: ${item.name} - Price: ${item.price}, Quantity: ${item.quantity}, Total: ${itemTotal}`,
      );
      return sum + itemTotal;
    }, 0);

    // Apply GST for Cafe (Food) orders
    // TODO: Centralize rates? For now using fixed 5% as per requirements
    const taxAmount = data.businessUnit === 'cafe' ? Math.round(subtotal * 0.05) : 0;
    const totalAmount = subtotal + taxAmount;

    console.log("createOrder: Calculated subtotal:", subtotal, "Tax:", taxAmount, "Total:", totalAmount);

    // Handle customer creation if customer details are provided
    if (data.customerMobile) {
      console.log(
        "createOrder: Processing customer data for mobile:",
        data.customerMobile,
      );
      try {
        // Import customer functions
        const { getCustomerByMobile, createCustomer } =
          await import("@/actions/customers");

        // Check if customer already exists
        const existingCustomer = await getCustomerByMobile(data.customerMobile);
        console.log(
          "createOrder: Existing customer check result:",
          existingCustomer,
        );

        if (!existingCustomer) {
          // Create new customer
          console.log("createOrder: Creating new customer");
          const customerData = {
            mobileNumber: data.customerMobile,
            name: data.customerName || "Walk-in Customer",
          };

          const customerResult = await createCustomer(customerData);
          console.log("createOrder: Customer creation result:", customerResult);

          if (customerResult.success) {
            console.log("createOrder: New customer created successfully");
          } else {
            console.warn(
              "createOrder: Failed to create customer, but continuing with order:",
              customerResult.error,
            );
            // Don't fail the order creation if customer creation fails
          }
        } else {
          console.log(
            "createOrder: Customer already exists, no need to create",
          );
        }
      } catch (customerError) {
        console.error(
          "createOrder: Error handling customer creation:",
          customerError,
        );
        // Don't fail the order creation if customer handling fails
      }
    }

    const settlementStatus = ["hotel", "bar"].includes(data.businessUnit)
      ? "pending"
      : "not-required";
    console.log("createOrder: Determined settlement status:", settlementStatus);

    const orderData = {
      orderNumber,
      type: data.type,
      businessUnit: data.businessUnit,
      tableId: data.tableId || null,
      tableNumber: data.tableNumber || null,
      roomNumber: data.roomNumber || null,
      source: data.source || "pos",
      customerMobile: data.customerMobile || null,
      discountPercent: data.discountPercent || 0,
      discountAmount: data.discountAmount || 0,
      gstPercent: data.gstPercent || 0,
      gstAmount: data.gstAmount || 0,
      status: data.initialStatus || "pending",
      settlementStatus,
      totalAmount,
      isPaid: false,
      items: data.items.map((item: any) => ({
        ...item,
        status: data.initialStatus || "pending"
      })),
      guestCount: data.guestCount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingAt: new Date().toISOString(),
      preparingAt: null,
      readyAt: null,
      servedAt: null,
      completedAt: null,
      timeline: [
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          actor: "system",
          message: "Order placed",
        },
      ],
    };

    console.log(
      "createOrder: Prepared order data:",
      JSON.stringify(orderData, null, 2),
    );
    console.log("createOrder: About to save order to 'orders' collection");

    const result = await createDocument("orders", orderData);
    console.log(
      "createOrder: Database operation result:",
      JSON.stringify(result, null, 2),
    );

    if (!result.success) {
      console.error(
        "createOrder: Failed to save order to database:",
        result.error,
      );
      return {
        success: false,
        error: result.error || "Failed to save order to database",
      };
    }

    console.log(
      "createOrder: Order saved successfully with ID:",
      result.data?.id,
    );

    // If this is a dine-in order with a table, update the table status
    if (data.tableId && data.type === "dine-in") {
      console.log(
        "createOrder: Updating table status for tableId:",
        data.tableId,
      );
      const tableResult = await updateTableStatus(
        data.tableId,
        "occupied",
        data.guestCount || 0,
        result.data?.id,
      );
      console.log(
        "createOrder: Table status update result:",
        JSON.stringify(tableResult, null, 2),
      );
    }

    // Create notification for kitchen
    try {
      await createKitchenNotification(orderNumber, data);
    } catch (notifError) {
      console.error("createOrder: Error creating kitchen notification:", notifError);
    }

    // Send integrated notification
    try {
      const { getIntegratedNotificationSystem } = await import("@/lib/integrated-notification-system");
      const notificationSystem = getIntegratedNotificationSystem();

      await notificationSystem.handleOrderStatusChange(
        result.data?.id || '',
        orderNumber,
        '',
        'pending',
        data.businessUnit,
        {
          tableNumber: data.tableNumber,
          roomNumber: data.roomNumber,
          customerName: data.customerName,
          itemCount: data.items.length,
          totalAmount,
          isTakeaway: data.type === 'takeaway',
          location: data.type === 'takeaway'
            ? 'takeaway'
            : data.tableNumber
              ? `table number ${data.tableNumber}`
              : data.roomNumber
                ? `room number ${data.roomNumber}`
                : 'counter'
        }
      );
    } catch (notificationError) {
      console.warn("Failed to send integrated notification:", notificationError);
    }

    console.log("=== CREATE ORDER ACTION COMPLETED SUCCESSFULLY ===");

    try {
      revalidatePath('/dashboard/cafe');
      revalidatePath('/dashboard/restaurant');
      revalidatePath('/dashboard/bar');
      revalidatePath('/dashboard/kitchen');
    } catch (e) {
      console.warn("Error revalidating paths:", e);
    }

    return { success: true, orderId: result.data?.id, orderNumber };
  } catch (error) {
    console.error("=== CREATE ORDER ACTION FAILED ===");
    console.error("Error creating order:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function createKitchenNotification(orderNumber: string, data: any) {
  try {
    console.log(
      "createKitchenNotification: Starting notification creation for order:",
      orderNumber,
    );

    const isTakeaway = data.type === 'takeaway' || (!data.tableNumber && !data.roomNumber);
    const locationName =
      data.businessUnit === "hotel"
        ? `Room ${data.roomNumber}`
        : isTakeaway
          ? "Takeaway"
          : `${data.businessUnit} Table ${data.tableNumber || "N/A"}`;

    console.log("createKitchenNotification: Location name:", locationName);
    console.log(
      "createKitchenNotification: Creating notification for order:",
      orderNumber,
    );

    const result = await createDocument("notifications", {
      type: "order_new",
      businessUnit: data.businessUnit,
      message: `New order ${orderNumber} for ${locationName}`,
      title: "New Order Received",
      recipient: "all", // Changed from 'kitchen' to 'all' to ensure Managers also see it in Bell Icon
      priority: "high",
      metadata: {
        orderNumber,
        businessUnit: data.businessUnit,
        tableNumber: data.tableNumber,
        roomNumber: data.roomNumber,
        isTakeaway,
        locationName,
      },
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    console.log(
      "createKitchenNotification: Notification creation result:",
      JSON.stringify(result, null, 2),
    );

    if (!result.success) {
      console.error(
        "createKitchenNotification: Failed to create notification:",
        result.error,
      );
    } else {
      console.log(
        "createKitchenNotification: Notification created successfully with ID:",
        result.data?.id,
      );
    }
  } catch (error) {
    console.error("Error creating kitchen notification:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
  }
}

export async function getOrders(businessUnit?: string, status?: string) {
  try {
    console.log(
      "getOrders: Called with businessUnit:",
      businessUnit,
      "status:",
      status,
    );
    const filters = [];


    if (businessUnit) {
      if (Array.isArray(businessUnit)) {
        if (businessUnit.length > 0) {
          filters.push({
            field: "businessUnit",
            operator: "in",
            value: businessUnit,
          });
        }
      } else {
        filters.push({
          field: "businessUnit",
          operator: "==",
          value: businessUnit,
        });
      }
    }

    if (status) {
      filters.push({ field: "status", operator: "==", value: status });
    }

    console.log("getOrders: Filters:", filters);
    let orders = await queryDocuments("orders", filters, "createdAt", "desc");
    console.log("getOrders: Raw orders from database:", orders);
    console.log("getOrders: Number of raw orders:", orders.length);

    // Fallback: if filtered query returns empty but we expect results,
    // fetch all orders and filter in memory. This helps when database
    // index constraints or data mismatches cause empty results.
    if (orders.length === 0 && (businessUnit || status)) {
      console.warn(
        "getOrders: Filtered query returned 0. Applying fallback to fetch all and filter client-side.",
      );
      const all = await queryDocuments("orders", [], "createdAt", "desc");
      orders = all.filter((o: any) => {
        const unitOk = businessUnit
          ? Array.isArray(businessUnit)
            ? businessUnit.includes(o.businessUnit)
            : o.businessUnit === businessUnit
          : true;
        const statusOk = status ? o.status === status : true;
        return unitOk && statusOk;
      });
      console.log("getOrders: Fallback filtered orders count:", orders.length);
    }

    // DEBUG: Let's also fetch ALL orders to see what's in the database
    const allOrders = await queryDocuments("orders", [], "createdAt", "desc");
    console.log("getOrders: ALL orders in database (no filter):", allOrders);
    console.log("getOrders: Total orders in database:", allOrders.length);
    if (allOrders.length > 0) {
      console.log(
        "getOrders: Sample order businessUnit values:",
        allOrders.map((o: any) => ({ id: o.id, businessUnit: o.businessUnit })),
      );
      // DEBUG: Log the first order's pendingAt field to see its structure
      if (allOrders[0]) {
        console.log(
          "getOrders: First order pendingAt structure:",
          (allOrders[0] as any).pendingAt,
        );
      }
    }

    // Helper function to safely convert any timestamp to ISO string
    const safeTimestampToISO = (ts: any): string | null => {
      if (!ts) return null;
      if (typeof ts === "string") return ts;
      try {
        // Handle Date object
        if (ts instanceof Date) {
          return ts.toISOString();
        }
        // Handle number (milliseconds)
        if (typeof ts === "number") {
          return new Date(ts).toISOString();
        }
        return null;
      } catch (e) {
        console.error("Error converting timestamp:", e, ts);
        return null;
      }
    };

    // Explicitly serialize all known timestamp fields first
    const explicitlySerializedOrders = orders.map((order: any) => ({
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

    // Final sanitization to ensure strictly plain objects (handles any remaining non-plain objects or BigInts)
    const sanitizedOrders = JSON.parse(
      JSON.stringify(explicitlySerializedOrders, (key, value) => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        return value;
      }),
    );

    console.log("getOrders: Serialized orders:", sanitizedOrders);
    return sanitizedOrders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: string, metadata?: any) {
  try {
    const now = new Date().toISOString();
    const updateData: any = {
      status,
      [`${status}At`]: now,
      updatedAt: now,
    };

    // Add timeline entry
    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("status, timeline, orderNumber, businessUnit, tableNumber, roomNumber, type, items")
      .eq("id", orderId)
      .single();

    if (!orderError && orderData) {
      const timeline = orderData.timeline || [];
      timeline.push({
        status,
        timestamp: now,
        actor: metadata?.actor || "system",
        message: metadata?.message || `Order ${status}`,
        metadata: metadata?.additionalData || {}
      });
      updateData.timeline = timeline;
    }

    await updateDocument("orders", orderId, updateData);

    // Handle status-specific logic
    if (status === "bill_requested") {
      try {
        if (orderData) {
          const locationName =
            orderData?.businessUnit === "hotel"
              ? `Room ${orderData?.roomNumber}`
              : `${orderData?.businessUnit} Table ${orderData?.tableNumber || "N/A"}`;

          // Create notification for manager
          await createDocument("notifications", {
            type: "bill_request",
            orderId: orderId,
            businessUnit: orderData?.businessUnit,
            message: `Bill Requested for ${locationName}`,
            title: "Bill Request",
            recipient: "manager",
            priority: "high",
            metadata: {
              orderNumber: orderData?.orderNumber,
              location: locationName,
              businessUnit: orderData?.businessUnit,
              tableNumber: orderData.tableNumber,
            },
            isRead: false,
            createdAt: now,
            expiresAt: new Date(new Date().getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
          });
        }
      } catch (billReqError) {
        console.warn("Failed to create bill request notification:", billReqError);
      }
    }

    if (status === "ready") {
      try {
        if (orderData) {
          const locationName =
            orderData?.businessUnit === "hotel"
              ? `Room ${orderData?.roomNumber}`
              : `${orderData?.businessUnit} Table ${orderData?.tableNumber || "N/A"}`;

          // Create notification for waiters
          await createDocument("notifications", {
            type: "order_ready",
            orderId: orderId,
            businessUnit: orderData?.businessUnit,
            message: `Order ${orderData?.orderNumber} ready for ${locationName}`,
            title: "Order Ready for Delivery",
            recipient: "waiter",
            metadata: {
              orderNumber: orderData?.orderNumber,
              location: locationName,
              businessUnit: orderData?.businessUnit,
            },
            isRead: false,
            createdAt: now,
            expiresAt: new Date(
              new Date().getTime() + 2 * 60 * 60 * 1000,
            ).toISOString(),
          });
        }
      } catch (notificationError) {
        console.warn("Failed to create ready notification:", notificationError);
      }

      // Check for waiterless mode auto-serve
      try {
        const { data: settingsData, error: settingsError } =
          await supabaseServer
            .from("businessSettings")
            .select("*")
            .eq("id", "default")
            .single();

        const settings = !settingsError && settingsData ? settingsData : {};
        const waiterless = !!settings.waiterlessMode;

        if (orderData) {
          const unit = String(orderData.businessUnit || "").toLowerCase();

          // Check unit-specific waiterless mode
          const unitWaiterless = settings[`${unit}WaiterlessMode`] ?? waiterless;

          // Auto-serve only dine-in orders in waiterless mode, not takeaway orders
          if (unitWaiterless && (unit === "cafe" || unit === "restaurant") && orderData.type === "dine-in") {
            // Auto-serve in waiterless mode (dine-in only)
            await updateDocument("orders", orderId, {
              status: "served",
              servedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Add timeline entry for auto-serve
            const updatedTimeline = [...(updateData.timeline || []), {
              status: "served",
              timestamp: new Date().toISOString(),
              actor: "system",
              message: "Auto-served (waiterless mode - dine-in)",
              metadata: { waiterlessMode: true, orderType: orderData.type }
            }];

            await updateDocument("orders", orderId, {
              timeline: updatedTimeline
            });

            // Send integrated notification for auto-serve
            try {
              const { getIntegratedNotificationSystem } = await import("@/lib/integrated-notification-system");
              const notificationSystem = getIntegratedNotificationSystem();

              await notificationSystem.handleOrderStatusChange(
                orderId,
                orderData.orderNumber,
                'ready',
                'served',
                orderData.businessUnit,
                {
                  waiterlessMode: true,
                  tableNumber: orderData.tableNumber,
                  roomNumber: orderData.roomNumber,
                  autoServed: true,
                  orderType: orderData.type
                }
              );
            } catch (integratedNotificationError) {
              console.warn("Failed to send integrated auto-serve notification:", integratedNotificationError);
            }
          }
        }
      } catch (waiterlessError) {
        console.warn("Failed to check waiterless mode:", waiterlessError);
      }
    }

    // Send integrated notification for status change
    try {
      const { getIntegratedNotificationSystem } = await import("@/lib/integrated-notification-system");
      const notificationSystem = getIntegratedNotificationSystem();

      if (orderData) {
        await notificationSystem.handleOrderStatusChange(
          orderId,
          orderData.orderNumber,
          orderData.status,
          status,
          orderData.businessUnit,
          {
            tableNumber: orderData.tableNumber,
            roomNumber: orderData.roomNumber,
            actor: metadata?.actor,
            ...metadata?.additionalData
          }
        );
      }
    } catch (integratedNotificationError) {
      console.warn("Failed to send integrated status notification:", integratedNotificationError);
    }

    // If we have order data, sync item statuses
    if (orderData && Array.isArray(orderData.items)) {
      updateData.items = orderData.items.map((item: any) => ({
        ...item,
        status: ["ready", "served", "completed"].includes(status) ? (status === "ready" ? "prepared" : "served") : (item.status || "pending")
      }));
    }

    // Handle payment status updates
    if (status === "completed" && metadata?.paymentProcessed) {
      await updateDocument("orders", orderId, {
        isPaid: true,
        paidAt: now
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error };
  }
}

export async function updateOrderItemStatus(
  orderId: string,
  menuItemId: string,
  newStatus: string,
  metadata?: any
) {
  try {
    const { data: order, error: fetchError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) return { success: false, error: "Order not found" };

    const items = order.items || [];
    const updatedItems = items.map((item: any) => {
      if (item.menuItemId === menuItemId || item.id === menuItemId) {
        return { ...item, status: newStatus };
      }
      return item;
    });

    const now = new Date().toISOString();
    const updateData: any = {
      items: updatedItems,
      updatedAt: now,
    };

    const allServed = updatedItems.every((i: any) => i.status === "served");
    // Only mark ready if ALL items are either prepared or served
    const allKitchenDone = updatedItems.every((i: any) => i.status === "prepared" || i.status === "served");
    // Work in progress if ANY item is prepared, preparing, or served (but not all done)
    const anyWorkStarted = updatedItems.some((i: any) => ["prepared", "preparing", "served"].includes(i.status));

    if (allServed) {
      updateData.status = "served";
      updateData.servedAt = now;
    } else if (allKitchenDone) {
      updateData.status = "ready";
      updateData.readyAt = now;
    } else if (anyWorkStarted) {
      updateData.status = "preparing";
      updateData.preparingAt = now;
    } else {
      updateData.status = "pending"; // Fallback to pending if all items are reset to pending
    }

    const timeline = order.timeline || [];
    const itemName = items.find((i: any) => i.menuItemId === menuItemId || i.id === menuItemId)?.name || 'Item';
    timeline.push({
      status: `item_${newStatus}`,
      timestamp: now,
      actor: metadata?.actor || "system",
      message: `${itemName} marked as ${newStatus}`,
      metadata: { menuItemId, status: newStatus }
    });
    updateData.timeline = timeline;

    await updateDocument("orders", orderId, updateData);

    if (newStatus === "prepared") {
      try {
        const locationName = order.businessUnit === "hotel" ? `Room ${order.roomNumber}` : `${order.businessUnit} Table ${order.tableNumber || "N/A"}`;
        await createDocument("notifications", {
          type: "item_ready",
          orderId: orderId,
          businessUnit: order.businessUnit,
          message: `${itemName} for ${locationName} is Ready!`,
          title: "Item Prepared",
          recipient: "waiter",
          metadata: { orderNumber: order.orderNumber, itemName, menuItemId, locationName },
          isRead: false,
          createdAt: now
        });
      } catch (e) {
        console.warn("Notification error:", e);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating item status:", error);
    return { success: false, error };
  }
}

export async function updateOrderItems(
  orderId: string,
  items: any[],
  totalAmount: number,
) {
  try {
    const { data: currentOrder, error: fetchError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !currentOrder) {
      return { success: false, error: "Order not found" };
    }

    const currentItems = currentOrder.items || [];

    // For existing items, keep their status. For new items, set to pending.
    const updatedItems = items.map(newItem => {
      const existingItem = currentItems.find((oldItem: any) => oldItem.menuItemId === newItem.menuItemId);
      return {
        ...newItem,
        status: existingItem ? (existingItem.status || "pending") : (newItem.status || "pending")
      };
    });

    const isNewItemAdded = items.length > currentItems.length ||
      items.some(newItem => !currentItems.some((oldItem: any) => oldItem.menuItemId === newItem.menuItemId));

    const updateData: any = {
      items: updatedItems,
      totalAmount,
      updatedAt: new Date().toISOString(),
    };

    // If new items were added, reset status to pending so kitchen sees it
    if (isNewItemAdded && ["served", "ready"].includes(currentOrder.status)) {
      updateData.status = "pending";
      updateData.pendingAt = new Date().toISOString();
      updateData.timeline = [
        ...(currentOrder.timeline || []),
        {
          status: "pending",
          timestamp: new Date().toISOString(),
          actor: "waiter",
          message: "Order items added - re-sent to kitchen",
        },
      ];
    } else {
      updateData.timeline = [
        ...(currentOrder.timeline || []),
        {
          status: currentOrder.status,
          timestamp: new Date().toISOString(),
          actor: "waiter",
          message: "Order updated (quantities/details)",
        },
      ];
    }

    await updateDocument("orders", orderId, updateData);

    // Notify kitchen if new items added
    if (isNewItemAdded) {
      await createKitchenNotification(currentOrder.orderNumber, {
        ...currentOrder,
        items // Pass updated items
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating order items:", error);
    return { success: false, error };
  }
}


export async function getLiveOrders(businessUnit?: string) {
  try {
    console.log("getLiveOrders: Fetching live orders for unit:", businessUnit);
    // Use the existing getOrders but filter for live statuses
    // This runs on the server with admin privileges, bypassing RLS
    const orders = await getOrders(businessUnit);

    // Filter for active statuses
    return orders.filter((o: any) =>
      ["pending", "preparing", "ready", "served", "bill_requested"].includes(o.status)
    );
  } catch (error) {
    console.error("Error in getLiveOrders:", error);
    return [];
  }
}

export async function getOrderById(orderId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      return null;
    }

    // Helper to safely convert timestamps
    const safeTimestampToISO = (ts: any): string | null => {
      if (!ts) return null;
      try {
        if (typeof ts === "string") return ts;
        return null;
      } catch (e) {
        return null;
      }
    };

    return {
      id: data.id,
      ...data,
      createdAt: safeTimestampToISO(data?.createdAt),
      updatedAt: safeTimestampToISO(data?.updatedAt),
      pendingAt: safeTimestampToISO(data?.pendingAt),
      preparingAt: safeTimestampToISO(data?.preparingAt),
      readyAt: safeTimestampToISO(data?.readyAt),
      servedAt: safeTimestampToISO(data?.servedAt),
      completedAt: safeTimestampToISO(data?.completedAt),
      timeline: Array.isArray(data?.timeline)
        ? data.timeline.map((entry: any) => ({
          ...entry,
          timestamp: safeTimestampToISO(entry.timestamp),
        }))
        : data?.timeline,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function getOrderTimeline(orderId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      orderId,
      orderNumber: data?.orderNumber,
      status: data?.status,
      timeline: (data?.timeline || []).map((event: any) => ({
        ...event,
        timestamp: event.timestamp,
      })),
      timings: {
        createdAt: data?.createdAt,
        pendingAt: data?.pendingAt,
        preparingAt: data?.preparingAt,
        readyAt: data?.readyAt,
        servedAt: data?.servedAt,
        completedAt: data?.completedAt,
      },
      isPaid: data?.isPaid || false,
    };
  } catch (error) {
    console.error("Error fetching order timeline:", error);
    return null;
  }
}

export async function syncOrderPaymentStatus(
  orderId: string,
  bookingId: string,
  isPaid: boolean,
) {
  try {
    await updateDocument("orders", orderId, {
      isPaid,
      paymentSyncedAt: new Date().toISOString(),
      bookingId,
      updatedAt: new Date().toISOString(),
    });

    if (isPaid) {
      await createDocument("notifications", {
        type: "payment_received",
        orderId,
        bookingId,
        businessUnit: "hotel",
        message: `Order paid - marked in system`,
        title: "Payment Received",
        recipient: "restaurant_manager",
        isRead: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing order payment status:", error);
    return { success: false, error };
  }
}

// Link a room service order to a hotel booking
export async function linkOrderToBooking(
  orderId: string,
  bookingId: string,
  roomNumber: string,
) {
  try {
    console.log(`[linkOrderToBooking] Starting: orderId=${orderId}, bookingId=${bookingId}`);

    // Get the order
    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      console.error("[linkOrderToBooking] Order not found:", orderError);
      return { success: false, error: "Order not found" };
    }

    console.log("[linkOrderToBooking] Order data:", { orderNumber: orderData.orderNumber, total: orderData.totalAmount });

    const orderTotal = orderData?.totalAmount || 0;

    // Update the order with booking reference
    const orderUpdateResult = await updateDocument("orders", orderId, {
      bookingId,
      roomNumber,
      linkedToBooking: true,
    });
    console.log("[linkOrderToBooking] Order update result:", orderUpdateResult);

    // Get the booking from the bookings collection
    const { data: bookingData, error: bookingError } = await supabaseServer
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      console.error("[linkOrderToBooking] Booking not found:", bookingError);
      return { success: false, error: "Booking not found" };
    }

    console.log("[linkOrderToBooking] Current booking data:", {
      id: bookingData.id,
      roomNumber: bookingData.roomNumber,
      currentRoomServiceCharges: bookingData.roomServiceCharges,
      currentRoomServiceTotal: bookingData.roomServiceTotal
    });

    // Add room service charge to booking
    const roomServiceCharges = bookingData?.roomServiceCharges || [];
    const newCharge = {
      orderId,
      orderNumber: orderData?.orderNumber,
      amount: orderTotal,
      items: orderData?.items || [],
      createdAt: new Date().toISOString(),
    };

    console.log("[linkOrderToBooking] New charge to add:", newCharge);

    const updatedCharges = [...roomServiceCharges, newCharge];
    const roomServiceTotal = updatedCharges.reduce(
      (sum, charge) => sum + charge.amount,
      0,
    );

    console.log("[linkOrderToBooking] Updated charges array:", updatedCharges);
    console.log("[linkOrderToBooking] New room service total:", roomServiceTotal);

    // Update booking total amount to include room service
    const baseAmount = bookingData?.totalAmount || 0;
    const previousRoomServiceTotal = bookingData?.roomServiceTotal || 0;
    const newTotalAmount =
      baseAmount - previousRoomServiceTotal + roomServiceTotal;

    // Recalculate remaining balance
    const totalPaid = bookingData?.totalPaid || 0;
    const newRemainingBalance = newTotalAmount - totalPaid;
    const newPaymentStatus =
      newRemainingBalance <= 0
        ? "completed"
        : totalPaid > 0
          ? "partial"
          : "pending";

    const bookingUpdateData = {
      roomServiceCharges: updatedCharges,
      roomServiceTotal,
      totalAmount: newTotalAmount,
      remainingBalance: newRemainingBalance,
      paymentStatus: newPaymentStatus,
      updatedAt: new Date().toISOString(),
    };

    console.log("[linkOrderToBooking] Booking update data:", bookingUpdateData);

    const bookingUpdateResult = await updateDocument("bookings", bookingId, bookingUpdateData);

    console.log("[linkOrderToBooking] Booking update result:", bookingUpdateResult);

    if (!bookingUpdateResult.success) {
      console.error("[linkOrderToBooking] Failed to update booking:", bookingUpdateResult.error);
      return { success: false, error: bookingUpdateResult.error };
    }

    console.log("[linkOrderToBooking] âœ… Successfully linked order to booking");
    return { success: true };
  } catch (error) {
    console.error("[linkOrderToBooking] Error:", error);
    return { success: false, error };
  }
}

export async function deleteOrder(orderId: string, password?: string) {
  try {
    // Removed password validation - allowing direct deletion
    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      return { success: false, error: "Order not found" };
    }

    const bookingId = orderData?.bookingId;

    await deleteDocument("orders", orderId);

    // Also delete associated bill if exists
    if (orderData.billId) {
      await deleteDocument("bills", orderData.billId);
    }

    // Update booking if this order was linked to one
    if (bookingId) {
      const { data: bookingData, error: bookingError } = await supabaseServer
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (!bookingError && bookingData) {
        // Remove this order from roomServiceCharges array
        const roomServiceCharges = bookingData.roomServiceCharges || [];
        const updatedCharges = roomServiceCharges.filter((charge: any) => charge.orderId !== orderId);

        // Recalculate room service total
        const roomServiceTotal = updatedCharges.reduce(
          (sum: number, charge: any) => sum + (charge.amount || 0),
          0
        );

        // Recalculate total amount
        const baseAmount = bookingData.basePrice || 0;
        const newTotalAmount = baseAmount + roomServiceTotal;

        // Recalculate remaining balance
        const totalPaid = bookingData.totalPaid || 0;
        const newRemainingBalance = newTotalAmount - totalPaid;
        const newPaymentStatus =
          newRemainingBalance <= 0
            ? "completed"
            : totalPaid > 0
              ? "partial"
              : "pending";

        await updateDocument("bookings", bookingId, {
          roomServiceCharges: updatedCharges,
          roomServiceTotal,
          totalAmount: newTotalAmount,
          remainingBalance: newRemainingBalance,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/billing");
    revalidatePath(`/dashboard/bookings/${bookingId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}


export async function getFreshOrders() {
  const { unstable_noStore } = require('next/cache');
  unstable_noStore(); // Opt out of static caching for this request

  try {
    console.log("getFreshOrders: Fetching fresh orders for live view");
    const { data: orders, error } = await supabaseServer
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("getFreshOrders: Error fetching,", error);
      return [];
    }

    return orders || [];
  } catch (error) {
    console.error("getFreshOrders: Exception:", error);
    return [];
  }

}

export async function markOrdersAsCompleted(orderIds: string[]) {
  try {
    if (!orderIds || orderIds.length === 0) return { success: true };

    const { data, error } = await supabaseServer
      .from('orders')
      .update({
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .in('id', orderIds);

    if (error) {
      console.error("Error marking orders as completed:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("markOrdersAsCompleted: Exception:", error);
    return { success: false, error: "Failed to mark orders as completed" };
  }
}

