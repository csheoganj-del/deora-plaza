"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  Coffee,
  Hotel,
  Utensils,
  Wine,
  Trees,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useServerAuth } from "@/hooks/useServerAuth"

const navigationItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "owner", "manager", "admin"]
  },
  {
    title: "Restaurant",
    href: "/dashboard/restaurant",
    icon: Utensils,
    roles: ["super_admin", "owner", "manager", "admin", "waiter", "kitchen"]
  },
  {
    title: "Cafe",
    href: "/dashboard/cafe",
    icon: Coffee,
    roles: ["super_admin", "owner", "manager", "admin", "barista"]
  },
  {
    title: "Bar",
    href: "/dashboard/bar",
    icon: Wine,
    roles: ["super_admin", "owner", "manager", "admin", "bartender"]
  },
  {
    title: "Hotel",
    href: "/dashboard/hotel",
    icon: Hotel,
    roles: ["super_admin", "owner", "manager", "admin", "reception", "hotel_reception"]
  },
  {
    title: "Garden",
    href: "/dashboard/garden",
    icon: Trees,
    roles: ["super_admin", "owner", "manager", "admin"]
  },
  {
    title: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    roles: ["super_admin", "owner", "manager", "admin", "waiter", "kitchen"]
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    roles: ["super_admin", "owner", "manager", "admin", "reception"]
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["super_admin", "owner", "manager", "admin"]
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: FileText,
    roles: ["super_admin", "owner", "manager", "admin"]
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["super_admin", "owner", "manager", "admin"]
  }
]

export default function HybridSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useServerAuth()

  const userRole = session?.user?.role
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole || "")
  )

  return (
    <aside 
      className={cn(
        "bg-[var(--bg-primary)] border-r border-[var(--border-primary)] transition-all duration-200 ease-out flex flex-col",
        collapsed ? "w-16" : "w-[280px]"
      )}
    >
      {/* Header */}
      <div className="ga-flex ga-items-center ga-justify-between ga-p-6 border-b border-[var(--border-primary)]">
        {!collapsed && (
          <div>
            <h1 className="ga-text-h2 font-semibold text-[var(--color-primary)]">
              DEORA Plaza
            </h1>
            <p className="ga-text-small text-[var(--text-secondary)] mt-1">
              Restaurant Management
            </p>
          </div>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ga-button ga-button-ghost ga-button-icon-sm ga-focus-visible"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 ga-p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "ga-nav-item",
                isActive && "ga-nav-item-active",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="truncate">{item.title}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      {!collapsed && session?.user && (
        <div className="ga-p-4 border-t border-[var(--border-primary)]">
          <div className="ga-flex ga-items-center ga-gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] ga-flex ga-items-center justify-center">
              <span className="ga-text-small font-medium text-[var(--color-primary)]">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="ga-text-body font-medium text-[var(--text-primary)] truncate">
                {session.user.name || "User"}
              </p>
              <p className="ga-text-small text-[var(--text-secondary)] truncate capitalize">
                {session.user.role?.replace("_", " ") || "Staff"}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}