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
          <Badge className={`px-2 py-1 rounded-xl text-xs ${
            trend === 'up' 
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

// Demo Component showing all variations
export function GlassmorphismSystemDemo() {
  const businessUnits = [
    {
      title: "Restaurant",
      description: "Full-service dining experience",
      icon: Utensils,
      stats: [
        { label: "Active Orders", value: "12" },
        { label: "Today's Revenue", value: "₹25,400" },
        { label: "Tables Occupied", value: "8/15" }
      ],
      backgroundImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop"
    },
    {
      title: "Cafe",
      description: "Quick service & takeaway",
      icon: Coffee,
      stats: [
        { label: "Orders Today", value: "45" },
        { label: "Revenue", value: "₹12,800" },
        { label: "Queue Length", value: "3" }
      ],
      backgroundImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop"
    },
    {
      title: "Bar",
      description: "Premium beverages & cocktails",
      icon: Wine,
      stats: [
        { label: "Active Orders", value: "8" },
        { label: "Revenue", value: "₹18,600" },
        { label: "Popular Item", value: "Mojito" }
      ],
      backgroundImage: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop"
    }
  ]

  const statsData = [
    {
      title: "Total Revenue",
      value: "₹56,800",
      change: "+12.5%",
      icon: DollarSign,
      trend: "up" as const,
      backgroundImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop"
    },
    {
      title: "Active Orders",
      value: "28",
      change: "+8.2%",
      icon: Clock,
      trend: "up" as const,
      backgroundImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"
    },
    {
      title: "Customer Satisfaction",
      value: "4.8",
      change: "+0.3",
      icon: Star,
      trend: "up" as const,
      backgroundImage: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop"
    }
  ]

  const orders = [
    {
      orderId: "ORD001",
      customerName: "Rajesh Kumar",
      items: 3,
      total: "₹1,250",
      status: "preparing" as const,
      timeAgo: "5 min ago",
      backgroundImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"
    },
    {
      orderId: "ORD002",
      customerName: "Priya Sharma",
      items: 2,
      total: "₹850",
      status: "ready" as const,
      timeAgo: "2 min ago",
      backgroundImage: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">DEORA Plaza Glassmorphism UI</h1>
          <p className="text-white/70 text-lg">Modern glass design system for restaurant management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <GlassStatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Business Units */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {businessUnits.map((unit, index) => (
            <GlassBusinessCard key={index} {...unit} />
          ))}
        </div>

        {/* Orders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {orders.map((order, index) => (
            <GlassOrderCard key={index} {...order} />
          ))}
        </div>
      </div>
    </div>
  )
}