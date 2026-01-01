import { Suspense } from 'react'
import HybridCafeDashboard from '@/components/dashboard/cafe/HybridCafeDashboard'

export default function CafeManagePage() {
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
      <HybridCafeDashboard />
    </Suspense>
  )
}