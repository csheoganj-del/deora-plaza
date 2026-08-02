"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Global Realtime Provider for Orders
 * Skips Supabase realtime when using placeholder/demo credentials.
 */
export function RealtimeOrdersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isPlaceholder = !url || url.includes("placeholder");
    if (isPlaceholder) {
      return;
    }

    let cancelled = false;
    let ordersChannel: { unsubscribe: () => void } | null = null;
    let tablesChannel: { unsubscribe: () => void } | null = null;

    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        if (cancelled) return;
        const supabase = createClient();

        ordersChannel = supabase
          .channel("realtime-orders")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            () => {
              queryClient.invalidateQueries({ queryKey: ["orders"] });
            }
          )
          .subscribe();

        tablesChannel = supabase
          .channel("realtime-tables")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "tables" },
            () => {
              queryClient.invalidateQueries({ queryKey: ["tables"] });
            }
          )
          .subscribe();
      } catch (e) {
        console.warn("[RealtimeOrdersProvider] disabled:", e);
      }
    })();

    return () => {
      cancelled = true;
      try {
        ordersChannel?.unsubscribe();
        tablesChannel?.unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, [queryClient]);

  return <>{children}</>;
}
