"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Global Realtime Provider for Orders
 * Listens to Supabase Realtime changes and invalidates React Query cache
 */
export function RealtimeOrdersProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const supabase = createClient();

    useEffect(() => {
        console.log("[RealtimeOrdersProvider] Setting up Realtime subscriptions...");

        // Subscribe to orders table changes
        const ordersChannel = supabase
            .channel("realtime-orders")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload) => {
                    console.log("[RealtimeOrdersProvider] Orders change detected:", payload.eventType);

                    // Invalidate all order-related queries
                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                }
            )
            .subscribe((status) => {
                console.log("[RealtimeOrdersProvider] Orders subscription status:", status);
            });

        // Subscribe to order_items changes (if they're in a separate table)
        // This ensures item-level updates also trigger refreshes
        const itemsChannel = supabase
            .channel("realtime-order-items")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "orders" },
                (payload) => {
                    console.log("[RealtimeOrdersProvider] Order items change detected");
                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                }
            )
            .subscribe();

        // Subscribe to tables changes (ADD, UPDATE, DELETE)
        const tablesChannel = supabase
            .channel("realtime-tables")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tables" },
                (payload) => {
                    console.log("[RealtimeOrdersProvider] Tables change detected:", payload.eventType);
                    queryClient.invalidateQueries({ queryKey: ["tables"] });
                }
            )
            .subscribe();

        return () => {
            console.log("[RealtimeOrdersProvider] Cleaning up subscriptions");
            ordersChannel.unsubscribe();
            itemsChannel.unsubscribe();
            tablesChannel.unsubscribe();
        };
    }, [queryClient, supabase]);

    return <>{children}</>;
}
