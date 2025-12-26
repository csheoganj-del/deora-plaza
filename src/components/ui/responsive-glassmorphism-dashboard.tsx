"use client"

import React, { useState, useEffect } from 'react'
import { 
  Home, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut,
  Hotel,
  Coffee,
  Wine,
  TreePine,
  ChefHat,
  Menu,
  X
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  badge?: number
  href?: string
}

export function ResponsiveGlassmorphismDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const menuItems: MenuItem[] = [
    { icon: <Home size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <ShoppingCart size={20} />, label: "Orders", badge: 5, href: "/dashboard/orders" },
    { icon: <ChefHat size={20} />, label: "Kitchen", href: "/dashboard/kitchen" },
    { icon: <Coffee size={20} />, label: "Cafe", href: "/dashboard/cafe" },
    { icon: <Wine size={20} />, label: "Bar", href: "/dashboard/bar" },
    { icon: <Hotel size={20} />, label: "Hotel", href: "/dashboard/hotel" },
    { icon: <TreePine size={20} />, label: "Garden", href: "/dashboard/garden" },
    { icon: <Users size={20} />, label: "Customers", href: "/dashboard/customers" },
    { icon: <BarChart3 size={20} />, label: "Analytics", href: "/dashboard/analytics" },
    { icon: <Bell size={20} />, label: "Notifications", badge: 3, href: "/dashboard/notifications" },
    { icon: <Settings size={20} />, label: "Settings", href: "/dashboard/settings" },
  ]

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          {(!isCollapsed || mobile) && (
            <h1 className="text-white text-xl font-semibold ml-4">DEORA Plaza</h1>
          )}
        </div>
        {mobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white/80 hover:text-white p-2"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
          DP
        </div>
        {(!isCollapsed || mobile) && (
          <div>
            <p className="text-white font-medium">Manager</p>
            <p className="text-white/60 text-sm">Admin Account</p>
          </div>
        )}
      </div>

      {/* Menu Label */}
      {(!isCollapsed || mobile) && (
        <p className="text-white/60 text-sm font-medium mb-4 uppercase tracking-wider">MENU</p>
      )}

      {/* Navigation Items */}
      <nav className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group relative"
            onClick={() => mobile && setIsMobileMenuOpen(false)}
          >
            <div className="text-white/80 group-hover:text-white transition-colors">
              {item.icon}
            </div>
            {(!isCollapsed || mobile) && (
              <>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <div className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </div>
                )}
              </>
            )}
            {isCollapsed && !mobile && item.badge && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {item.badge}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Separator */}
      <div className="my-6 h-px bg-white/20"></div>

      {/* Logout */}
      <button className="w-full flex items-center gap-3 p-3 rounded-xl text-white/80 hover:text-white hover:bg-red-500/20 transition-all duration-200 group">
        <LogOut size={20} className="text-white/80 group-hover:text-white" />
        {(!isCollapsed || mobile) && <span className="font-medium">Log Out</span>}
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 flex">
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="fixed top-4 left-4 z-50 p-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white shadow-2xl"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Mobile Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-80'} p-6`}>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl h-full">
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <div className={`fixed left-0 top-0 h-full w-80 z-50 p-6 transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl h-full">
              <SidebarContent mobile />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 p-6 ${isMobile ? 'ml-0' : ''}`}>
          <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-8 shadow-2xl min-h-[calc(100vh-3rem)]">
            {/* Header with toggle button */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white text-3xl font-bold">Dashboard</h2>
              {!isMobile && (
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200"
                >
                  {isCollapsed ? 'Expand' : 'Collapse'} Sidebar
                </button>
              )}
            </div>

            {/* Sample Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: "Today's Orders", value: "127", change: "+12%", color: "from-blue-500 to-cyan-500" },
                { title: "Revenue", value: "₹45,230", change: "+8%", color: "from-green-500 to-emerald-500" },
                { title: "Active Tables", value: "18/24", change: "75%", color: "from-purple-500 to-pink-500" },
                { title: "Hotel Bookings", value: "12", change: "+3%", color: "from-orange-500 to-red-500" },
                { title: "Garden Events", value: "3", change: "+1%", color: "from-teal-500 to-green-500" },
                { title: "Bar Revenue", value: "₹8,450", change: "+15%", color: "from-indigo-500 to-purple-500" }
              ].map((card, index) => (
                <div key={index} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white/80 text-sm font-medium">{card.title}</h3>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${card.color}`}></div>
                  </div>
                  <p className="text-white text-2xl font-bold mb-1">{card.value}</p>
                  <p className="text-green-400 text-sm">{card.change} from yesterday</p>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: "New order placed", time: "2 minutes ago", type: "order" },
                  { action: "Table 5 checked out", time: "5 minutes ago", type: "checkout" },
                  { action: "Garden booking confirmed", time: "10 minutes ago", type: "booking" },
                  { action: "Bar inventory updated", time: "15 minutes ago", type: "inventory" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-white/60 text-sm">{activity.time}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'order' ? 'bg-blue-500' :
                      activity.type === 'checkout' ? 'bg-green-500' :
                      activity.type === 'booking' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}