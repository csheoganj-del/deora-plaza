"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface EnhancedSkeletonProps {
  className?: string
  variant?: "default" | "card" | "text" | "avatar" | "button" | "table"
  lines?: number
  animate?: boolean
}

export function EnhancedSkeleton({ 
  className, 
  variant = "default", 
  lines = 1,
  animate = true,
  ...props 
}: EnhancedSkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 rounded-md"
  
  const variants = {
    default: "h-4 w-full",
    card: "h-32 w-full rounded-lg",
    text: "h-4 w-3/4",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-md",
    table: "h-8 w-full"
  }

  const shimmerAnimation = {
    initial: { backgroundPosition: "-200% 0" },
    animate: { 
      backgroundPosition: "200% 0",
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0, 0, 1, 1] as any // Linear easing as array
      }
    }
  }

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              baseClasses,
              variants.text,
              i === lines - 1 && "w-1/2", // Last line shorter
              className
            )}
            style={{
              backgroundSize: animate ? "400% 100%" : "100% 100%"
            }}
            {...(animate ? shimmerAnimation : {})}
            {...props}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={cn(baseClasses, variants[variant], className)}
      style={{
        backgroundSize: animate ? "400% 100%" : "100% 100%"
      }}
      {...(animate ? shimmerAnimation : {})}
      {...props}
    />
  )
}

// Specialized skeleton components
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-6 space-y-4", className)}>
      <EnhancedSkeleton variant="text" className="h-6 w-1/3" />
      <EnhancedSkeleton variant="text" lines={3} />
      <div className="flex space-x-2">
        <EnhancedSkeleton variant="button" />
        <EnhancedSkeleton variant="button" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="border-b p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <EnhancedSkeleton key={i} variant="text" className="h-5 w-20" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <EnhancedSkeleton key={colIndex} variant="table" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <EnhancedSkeleton className="h-8 w-48" />
        <EnhancedSkeleton variant="button" className="w-32" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <EnhancedSkeleton className="h-4 w-20" />
            <EnhancedSkeleton className="h-8 w-16" />
            <EnhancedSkeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="premium-card h-96" />
        </div>
        <div className="space-y-6">
          <div className="premium-card h-48" />
          <div className="premium-card h-48" />
        </div>
      </div>
    </div>
  )
}

