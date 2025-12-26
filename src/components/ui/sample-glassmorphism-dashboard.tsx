"use client"

import React from 'react'
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
  ChefHat
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  badge?: number
  href?: string
}

interface SampleGlassmorphismDashboardProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function SampleGlassmorphismDashboard({ 
  isCollapsed = false, 
  onToggle 
}: SampleGlassmorphismDashboardProps) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 flex gap-6">
        {/* Main Sidebar */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-80'}`}>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              {!isCollapsed && (
                <h1 className="text-white text-xl font-semibold ml-4">DEORA Plaza</h1>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                DP
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-white font-medium">Manager</p>
                  <p className="text-white/60 text-sm">Admin Account</p>
                </div>
              )}
            </div>

            {/* Menu Label */}
            {!isCollapsed && (
              <p className="text-white/60 text-sm font-medium mb-4 uppercase tracking-wider">MENU</p>
            )}

            {/* Navigation Items */}
            <nav className="space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group relative"
                >
                  <div className="text-white/80 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <div className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </div>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge && (
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
              {!isCollapsed && <span className="font-medium">Log Out</span>}
            </button>
          </div>
        </div>

        {/* Collapsed Sidebar (when minimized) */}
        {isCollapsed && (
          <div className="w-20">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl">
              {/* Collapsed Header */}
              <div className="flex flex-col items-center gap-2 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h1 className="text-white text-lg font-bold mt-2">D</h1>
              </div>

              {/* Collapsed Menu Items */}
              <nav className="space-y-2">
                {menuItems.slice(0, 8).map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center justify-center p-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group relative"
                    title={item.label}
                  >
                    {item.icon}
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.badge}
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-8 shadow-2xl min-h-[600px]">
            <div className="text-center py-20">
              <h2 className="text-white text-3xl font-bold mb-4">Dashboard Content</h2>
              <p className="text-white/60 text-lg mb-8">
                This is where your main dashboard content will be displayed
              </p>
              
              {/* Sample Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                {[
                  { title: "Today's Orders", value: "127", change: "+12%" },
                  { title: "Revenue", value: "₹45,230", change: "+8%" },
                  { title: "Active Tables", value: "18/24", change: "75%" }
                ].map((card, index) => (
                  <div key={index} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                    <h3 className="text-white/80 text-sm font-medium mb-2">{card.title}</h3>
                    <p className="text-white text-2xl font-bold mb-1">{card.value}</p>
                    <p className="text-green-400 text-sm">{card.change}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={onToggle}
                className="mt-8 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl text-white font-medium transition-all duration-200"
              >
                Toggle Sidebar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}