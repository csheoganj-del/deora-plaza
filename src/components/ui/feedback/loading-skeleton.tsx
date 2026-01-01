import { Skeleton } from "@/components/ui/skeleton"


/**
 * Loading skeleton for dashboard stats cards
 */
export function StatsCardSkeleton() {
  return (
    <div className="premium-card bg-white border-[#E5E7EB]">
      <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="p-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

/**
 * Loading skeleton for table rows
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3 px-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full max-w-[250px]" />
        <Skeleton className="h-3 w-full max-w-[200px]" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

/**
 * Loading skeleton for list items
 */
export function ListItemSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

/**
 * Loading skeleton for quick access cards
 */
export function QuickAccessSkeleton() {
  return (
    <div className="premium-card bg-white border-[#E5E7EB]">
      <div className="p-8 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-5 w-24 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for full dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-64 rounded-full" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Quick Access & Activity Skeleton */}
      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <QuickAccessSkeleton />
            <QuickAccessSkeleton />
            <QuickAccessSkeleton />
            <QuickAccessSkeleton />
          </div>
        </div>
        <div className="md:col-span-3 space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="premium-card bg-white border-[#E5E7EB]">
            <div className="p-8 p-0">
              <div className="divide-y divide-slate-100">
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

