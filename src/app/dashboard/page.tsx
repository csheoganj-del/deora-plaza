"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import HybridOverview from "@/components/dashboard/HybridOverview";
import { useServerAuth } from "@/hooks/useServerAuth";

export default function DashboardPage() {
  const { data: session, status } = useServerAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      if (role === 'cafe_manager' || role === 'waiter') {
        router.push('/dashboard/tables');
      }
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="ga-p-6 space-y-6">
        <div className="ga-skeleton h-12 w-64" />
        <div className="ga-grid ga-grid-4 ga-gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ga-skeleton h-36" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="ga-p-6 space-y-6">
        <div className="ga-skeleton h-12 w-64" />
        <div className="ga-grid ga-grid-4 ga-gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ga-skeleton h-36" />
          ))}
        </div>
      </div>
    }>
      <HybridOverview />
    </Suspense>
  );
}

