"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Menu,
  X,
  Home,
  ShoppingBag,
  Utensils,
  Users,
  BarChart3,
  Bell,
  Settings,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react'

// Sidebar Content Component (moved outside render)
function SidebarContent({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">D</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">DEORA Plaza</h2>
            <p className="text-white/60 text-xs">Restaurant System</p>
          </div>
        </div>
        {mobile && (
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <X size={18} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {[
          { icon: <Home size={18} />, label: "Dashboard", href: "/dashboard", isActive: true },
          { icon: <ShoppingBag size={18} />, label: "Orders", href: "/dashboard/orders" },
          { icon: <Utensils size={18} />, label: "Menu", href: "/dashboard/menu" },
          { icon: <Users size={18} />, label: "Customers", href: "/dashboard/customers" },
          { icon: <BarChart3 size={18} />, label: "Analytics", href: "/dashboard/analytics" },
          { icon: <Bell size={18} />, label: "Notifications", badge: 3, href: "/dashboard/notifications" },
          { icon: <Settings size={18} />, label: "Settings", href: "/dashboard/settings" },
        ].map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              item.isActive
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">A</span>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Admin User</p>
            <p className="text-white/60 text-xs">admin@deoraplaza.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppleLiquidGlassDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 flex h-screen">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:flex transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-80'
        } flex-col`}>
          <div className="h-full m-4 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
            <SidebarContent />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="h-20 backdrop-blur-2xl bg-white/5 border-b border-white/10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex text-white hover:bg-white/10"
              >
                <Menu size={20} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-white hover:bg-white/10"
              >
                <Menu size={20} />
              </Button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">3</span>
              </Button>
              
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome back, Admin</h1>
                <p className="text-white/70">Here's what's happening at DEORA Plaza today</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="backdrop-blur-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-green-500/20 text-green-300">
                      <TrendingUp className="w-3 h-3" />
                      +12.5%
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">₹2,45,680</h3>
                  <p className="text-white/70 text-sm">Total Revenue</p>
                </div>

                <div className="backdrop-blur-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-green-500/20 text-green-300">
                      <TrendingUp className="w-3 h-3" />
                      +8.2%
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">47</h3>
                  <p className="text-white/70 text-sm">Active Orders</p>
                </div>

                <div className="backdrop-blur-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-red-500/20 text-red-300">
                      <TrendingDown className="w-3 h-3" />
                      -2.1%
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">156</h3>
                  <p className="text-white/70 text-sm">Customers Today</p>
                </div>

                <div className="backdrop-blur-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-red-500/20 text-red-300">
                      <TrendingDown className="w-3 h-3" />
                      +5.3%
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">18 min</h3>
                  <p className="text-white/70 text-sm">Avg Order Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="h-full m-4 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
              <SidebarContent mobile />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}