"use client";

import { Suspense } from "react";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <UnifiedDashboard />
    </Suspense>
  );
}

