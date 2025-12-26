"use client"

import React, { useState } from 'react'
import { SampleGlassmorphismDashboard } from '@/components/ui/sample-glassmorphism-dashboard'
import { ResponsiveGlassmorphismDashboard } from '@/components/ui/responsive-glassmorphism-dashboard'

export default function DashboardSamplePage() {
  const [showResponsive, setShowResponsive] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (showResponsive) {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowResponsive(false)}
            className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-200"
          >
            Switch to Basic Version
          </button>
        </div>
        <ResponsiveGlassmorphismDashboard />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowResponsive(true)}
          className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-200"
        >
          Switch to Responsive Version
        </button>
      </div>
      <SampleGlassmorphismDashboard 
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
    </div>
  )
}