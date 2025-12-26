"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const AppleVisionGlassDashboard = dynamic(
  () => import('@/components/ui/apple-vision-glass-dashboard').then(mod => ({ default: mod.AppleVisionGlassDashboard })),
  { ssr: false }
)

export default function VisionDemoPage() {
  return (
    <div className="min-h-screen">
      <AppleVisionGlassDashboard />
    </div>
  )
}