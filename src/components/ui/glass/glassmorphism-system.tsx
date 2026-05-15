"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Utensils,
  Coffee,
  Wine,
  Building,
  Trees,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  Star,
  Bookmark,
  Eye,
  MoreHorizontal
} from 'lucide-react'

// Base Glassmorphism Card Component
export function GlassCard({
  children,
  className = "",
  backgroundImage,
  overlay = "bg-black/40",
  blur = "backdrop-blur-xl",
  background = "bg-white/10",
  border = "border-white/20",
  ...props
}: {
  children: React.ReactNode
  className?: string
  backgroundImage?: string
  overlay?: string
  blur?: string
  background?: string
  border?: string
  [key: string]: any
}) {
  return (
    <div className={`relative rounded-3xl overflow-hidden ${className}`} {...props}>
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className={`absolute inset-0 ${overlay}`} />
        </>
      )}

      {/* Glass Content */}
      <div className={`relative ${blur} ${background} border ${border} shadow-2xl h-full`}>
        {children}
      </div>
    </div>
  )
}

// Dashboard Stats Card
export function GlassStatsCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
  backgroundImage
}: {
  title: string
  value: string
  change: string
  icon: any
  trend?: "up" | "down"
  backgroundImage?: string
}) {
  return (
    <GlassCard
      className="h-32"
      backgroundImage={backgroundImage}
    >
      <div className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <Badge className={`px-2 py-1 rounded-xl text-xs ${trend === 'up'
              ? 'bg-green-500/20 text-green-300 border-green-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
            {change}
          </Badge>
        </div>

        <div>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="text-white/70 text-sm">{title}</div>
        </div>
      </div>
    </GlassCard>
  )
}

// Business Unit Card
export function GlassBusinessCard({
  title,
  description,
  icon: Icon,
  stats,
  backgroundImage,
  onViewDetails
}: {
  title: string
  description: string
  icon: any
  stats: { label: string; value: string }[]
  backgroundImage?: string
  onViewDetails?: () => void
}) {
  return (
    <GlassCard
      className="h-64"
      backgroundImage={backgroundImage}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="h-8 w-8 p-0 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/70 text-sm mb-4">{description}</p>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-white/70 text-sm">{stat.label}</span>
              <span className="text-white font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

// Order Card
export function GlassOrderCard({
  orderId,
  customerName,
  items,
  total,
  status,
  timeAgo,
  backgroundImage,
  onViewOrder
}: {
  orderId: string
  customerName: string
  items: number
  total: string
  status: "pending" | "preparing" | "ready" | "completed"
  timeAgo: string
  backgroundImage?: string
  onViewOrder?: () => void
}) {
  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    preparing: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    ready: "bg-green-500/20 text-green-300 border-green-500/30",
    completed: "bg-gray-500/20 text-gray-300 border-gray-500/30"
  }

  return (
    <GlassCard
      className="h-48"
      backgroundImage={backgroundImage}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm">#{orderId.slice(-2)}</span>
            </div>
            <div>
              <div className="text-white font-medium">{customerName}</div>
              <div className="text-white/70 text-sm">{timeAgo}</div>
            </div>
          </div>

          <Badge className={`px-3 py-1 rounded-xl text-xs ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/70 text-sm">Items</span>
            <span className="text-white font-medium">{items} items</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/70 text-sm">Total</span>
            <span className="text-white font-bold text-lg">{total}</span>
          </div>
        </div>

        {/* Action */}
        <Button
          onClick={onViewOrder}
          className="w-full mt-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-medium transition-all duration-300"
        >
          View Order
        </Button>
      </div>
    </GlassCard>
  )
}