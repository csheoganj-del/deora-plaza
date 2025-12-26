"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Plus,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  MessageCircle,
  Bell,
  Settings,
  Utensils,
  Coffee,
  Wine,
  Building2,
  Trees,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download
} from 'lucide-react'

// Glassmorphism Card Component
function GlassCard({ 
  children, 
  className = "",
  padding = "p-6",
  ...props 
}: {
  children: React.ReactNode
  className?: string
  padding?: string
  [key: string]: any
}) {
  return (
    <div 
      className={`
        backdrop-blur-xl bg-white/10 
        border border-white/20 
        rounded-3xl 
        shadow-2xl shadow-black/10
        ${padding} ${className}
      `} 
      {...props}
    >
      {children}
    </div>
  )
}

// Stats Card Component
function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = "blue"
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: any
  color?: "blue" | "green" | "purple" | "orange"
}) {
  const colorClasses = {
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    orange: "from-orange-500/20 to-yellow-500/20 border-orange-500/30"
  }

  return (
    <GlassCard className={`bg-gradient-to-br ${colorClasses[color]} hover:scale-105 transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${
          trend === 'up' 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-red-500/20 text-red-300'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-white/70 text-sm">{title}</p>
      </div>
    </GlassCard>
  )
}

export default function GlassmorphismDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">DEORA Plaza Dashboard</h1>
          <p className="text-white/70">Restaurant Management System</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value="₹2,45,680"
            change="+12.5%"
            trend="up"
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Active Orders"
            value="47"
            change="+8.2%"
            trend="up"
            icon={ShoppingBag}
            color="blue"
          />
          <StatsCard
            title="Customers Today"
            value="156"
            change="-2.1%"
            trend="down"
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="Avg Order Time"
            value="18 min"
            change="+5.3%"
            trend="down"
            icon={Clock}
            color="orange"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  View All
                </Button>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((order) => (
                  <div key={order} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Order #{1000 + order}</p>
                        <p className="text-white/60 text-sm">Table {order + 2}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">₹{(order * 450) + 200}</p>
                      <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30">
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Quick Actions */}
          <div>
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-white hover:from-blue-500/30 hover:to-cyan-500/30">
                  <Plus className="w-4 h-4 mr-2" />
                  New Order
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-white hover:from-green-500/30 hover:to-emerald-500/30">
                  <Users className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white hover:from-purple-500/30 hover:to-pink-500/30">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Table
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 text-white hover:from-orange-500/30 hover:to-yellow-500/30">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}