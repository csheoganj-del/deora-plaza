"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import LiquidOverview from "@/components/dashboard/LiquidOverview";
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

  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-white/10 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[400px] bg-white/5 rounded-2xl border border-white/5" />
        <div className="h-[400px] bg-white/5 rounded-2xl border border-white/5" />
      </div>
    </div>
  );

  if (status === "loading" || (status === "authenticated" && (session?.user?.role === 'cafe_manager' || session?.user?.role === 'waiter'))) {
    return <LoadingSkeleton />;
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LiquidOverview />
    </Suspense>
  );
}

