"use server";

import {
  queryDocuments,
  updateDocument,
  createDocument,
} from "@/lib/supabase/database";
import { supabaseServer } from "@/lib/supabase/server";

export async function getKitchenOrders(businessUnit?: string) {
  try {
    const filters: any[] = [
      {
        field: "status",
        operator: "in",
        value: ["pending", "preparing", "ready"],
      },
    ];

    if (businessUnit) {
      filters.push({
        field: "businessUnit",
        operator: "==",
        value: businessUnit,
      });
    } else {
      filters.push({
        field: "businessUnit",
        operator: "in",
        value: ["cafe", "bar", "restaurant", "hotel"],
      });
    }

    let orders = await queryDocuments("orders", filters, "createdAt", "asc");

    // Fallback: fetch all and filter client-side if filtered query returns empty
    if (orders.length === 0) {
      const all = await queryDocuments("orders", [], "createdAt", "asc");
      orders = all.filter((o: any) => {
        const statusOk = ["pending", "preparing", "ready"].includes(o.status);
        const unitOk = businessUnit
          ? o.businessUnit === businessUnit
          : ["cafe", "bar", "restaurant", "hotel"].includes(o.businessUnit);
        return statusOk && unitOk;
      });
    }

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

        const { data: orderData, error: orderError } = await supabaseServer
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        const unit =
          !orderError && orderData
            ? (orderData.businessUnit || "").toLowerCase()
            : "";
        if (waiterless && (unit === "cafe" || unit === "restaurant")) {
          await updateDocument("orders", orderId, {
            status: "served",
            servedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (_err) {}
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
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

    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { success: false, error: "Failed to delete order" };
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

    const locationName =
      orderData.businessUnit === "hotel"
        ? `Room ${orderData.roomNumber}`
        : `${orderData.businessUnit} Table ${orderData.table?.tableNumber || "N/A"}`;

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

