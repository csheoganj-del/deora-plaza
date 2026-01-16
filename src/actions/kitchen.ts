"use server";

import {
  queryDocuments,
  updateDocument,
  createDocument,
} from "@/lib/supabase/database";
import { supabaseServer } from "@/lib/supabase/server";

export async function getKitchenOrders(businessUnit?: string) {
  try {
    // Build the Supabase query
    let query = supabaseServer
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing", "ready", "served"]);

    if (businessUnit) {
      query = query.eq("businessUnit", businessUnit);
    } else {
      query = query.in("businessUnit", ["cafe", "bar", "restaurant", "hotel"]);
    }

    query = query.order("createdAt", { ascending: true });

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching kitchen orders:", error);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Fetch table data for orders that have tableId
    const tableIds = orders
      .filter(o => o.tableId)
      .map(o => o.tableId)
      .filter((id, index, self) => self.indexOf(id) === index); // unique

    let tableMap: Record<string, any> = {};

    if (tableIds.length > 0) {
      const { data: tables } = await supabaseServer
        .from("tables")
        .select("id, tableNumber")
        .in("id", tableIds);

      if (tables) {
        tableMap = tables.reduce((acc, table) => {
          acc[table.id] = table;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Enrich orders with table data
    const enrichedOrders = orders.map(order => ({
      ...order,
      table: order.tableId ? tableMap[order.tableId] : null
    }));

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

    // Explicitly serialize all timestamp fields
    const explicitlySerializedOrders = enrichedOrders.map((order: any) => ({
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

    // Final sanitization
    return JSON.parse(
      JSON.stringify(explicitlySerializedOrders, (key, value) => {
        if (typeof value === "bigint") return Number(value);
        return value;
      }),
    );
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const updateData: any = {
      status,
      [`${status}At`]: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!orderError && orderData && Array.isArray(orderData.items)) {
      updateData.items = orderData.items.map((item: any) => ({
        ...item,
        status: ["ready", "served", "completed"].includes(status) ? (status === "ready" ? "prepared" : "served") : (item.status || "pending")
      }));
    }

    await updateDocument("orders", orderId, updateData);

    if (status === "ready") {
      await createOrderNotification(orderId);
      try {
        const { data: settingsData, error: settingsError } =
          await supabaseServer
            .from("businessSettings")
            .select("*")
            .eq("id", "default")
            .single();

        const settings = !settingsError && settingsData ? settingsData : {};
        const waiterless = !!settings.waiterlessMode;

        const unit = (orderData?.businessUnit || "").toLowerCase();
        // Auto-serve only dine-in orders in waiterless mode, not takeaway orders
        if (waiterless && (unit === "cafe" || unit === "restaurant") && orderData?.type === "dine-in") {
          await updateDocument("orders", orderId, {
            status: "served",
            servedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (_err) { }
    }

    if (status === "served") {
      await createServedNotification(orderId);
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
    // FIX: Only mark ready if ALL items are either prepared or served
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
      updateData.status = "pending";
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
        const isTakeaway = order.type === 'takeaway' || (!order.tableNumber && !order.roomNumber);
        const locationName = order.businessUnit === "hotel" ? `Room ${order.roomNumber}` : isTakeaway ? "Takeaway" : `${order.businessUnit} Table ${order.tableNumber || "N/A"}`;

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

export async function deleteOrder(orderId: string) {
  try {
    const { error } = await supabaseServer
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      console.error("Error deleting order:", error);
      return { success: false, error: error.message };
    }

    // Revalidate paths to update UI
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/orders");

    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

export async function clearKitchenHistory(businessUnit?: string) {
  try {
    console.log("🗑️ [clearKitchenHistory] Starting clear history operation");
    console.log("🗑️ [clearKitchenHistory] Business Unit:", businessUnit);

    // First, let's see what orders we're trying to delete
    let selectQuery = supabaseServer
      .from("orders")
      .select("id, orderNumber, status, businessUnit")
      .in("status", ["served", "completed", "cancelled", "bill_requested"]);

    if (businessUnit) {
      selectQuery = selectQuery.eq("businessUnit", businessUnit);
    } else {
      selectQuery = selectQuery.in("businessUnit", ["cafe", "restaurant", "bar", "hotel"]);
    }

    const { data: ordersToDelete, error: selectError } = await selectQuery;

    if (selectError) {
      console.error("🗑️ [clearKitchenHistory] Error fetching orders to delete:", selectError);
    } else {
      console.log("🗑️ [clearKitchenHistory] Found orders to delete:", ordersToDelete?.length || 0);
      console.log("🗑️ [clearKitchenHistory] Order IDs:", ordersToDelete?.map(o => o.id));
    }

    // Now perform the actual delete
    let query = supabaseServer
      .from("orders")
      .delete()
      .in("status", ["served", "completed", "cancelled", "bill_requested"]);

    if (businessUnit) {
      query = query.eq("businessUnit", businessUnit);
    } else {
      query = query.in("businessUnit", ["cafe", "restaurant", "bar", "hotel"]);
    }

    const { error, count } = await query;

    if (error) {
      console.error("🗑️ [clearKitchenHistory] Error clearing kitchen history:", error);
      console.error("🗑️ [clearKitchenHistory] Error details:", JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    console.log("🗑️ [clearKitchenHistory] Delete operation completed");
    console.log("🗑️ [clearKitchenHistory] Rows affected:", count);

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/dashboard/kitchen");
    revalidatePath("/dashboard/waiter/track");
    revalidatePath("/dashboard/orders");

    console.log("🗑️ [clearKitchenHistory] Paths revalidated successfully");
    return { success: true };
  } catch (error) {
    console.error("🗑️ [clearKitchenHistory] Exception:", error);
    return { success: false, error: "Failed to clear history" };
  }
}

async function createOrderNotification(orderId: string) {
  try {
    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) return;

    const isTakeaway = orderData.type === 'takeaway' || (!orderData.tableNumber && !orderData.roomNumber);

    const locationName =
      orderData.businessUnit === "hotel"
        ? `Room ${orderData.roomNumber}`
        : isTakeaway
          ? "Takeaway"
          : `${orderData.businessUnit} Table ${orderData.tableNumber || "N/A"}`;


    await createDocument("notifications", {
      type: "order_ready",
      orderId: orderId,
      businessUnit: orderData.businessUnit,
      message: `Order ${orderData.orderNumber} ready for ${locationName}`,
      title: "Order Ready for Delivery",
      recipient: "waiter",
      metadata: {
        orderNumber: orderData.orderNumber,
        location: locationName,
        businessUnit: orderData.businessUnit,
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

async function createServedNotification(orderId: string) {
  try {
    const { data: orderData, error: orderError } = await supabaseServer
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) return;

    const isTakeaway = orderData.type === 'takeaway' || (!orderData.tableNumber && !orderData.roomNumber);
    const locationName =
      orderData.businessUnit === "hotel"
        ? `Room ${orderData.roomNumber}`
        : isTakeaway
          ? "Takeaway"
          : `${orderData.businessUnit} Table ${orderData.tableNumber || "N/A"}`;

    await createDocument("notifications", {
      type: "order_served",
      orderId: orderId,
      businessUnit: orderData.businessUnit,
      message: `Order ${orderData.orderNumber} served for ${locationName}`,
      title: "Order Served",
      recipient: "manager",
      metadata: {
        orderNumber: orderData.orderNumber,
        location: locationName,
        isTakeaway,
        businessUnit: orderData.businessUnit,
      },
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating served notification:", error);
  }
}

