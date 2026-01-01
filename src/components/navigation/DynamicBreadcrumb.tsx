"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

// Route name mappings for better UX
const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  inventory: "Inventory",
  automation: "Automation",
  "staff-performance": "Staff Performance",
  "daily-reports": "Daily Reports",
  realtime: "Real-Time",
  "kitchen-display": "Kitchen Display",
  waiter: "Waiter Interface",
  "order-management": "Order Management",
  tables: "Tables",
  bar: "Bar",
  orders: "Orders",
  hotel: "Hotel",
  garden: "Garden",
  kitchen: "Kitchen",
  billing: "Billing",
  statistics: "Statistics",
  locations: "Locations",
  "gst-report": "GST Report",
  settlements: "Settlements",
  customers: "Customers",
  discounts: "Discounts",
  menu: "Menu",
  users: "User Management",
  admin: "Admin"
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // Don't show breadcrumb on home or login pages
  if (pathname === "/" || pathname === "/login") {
    return null
  }

  const pathSegments = pathname.split("/").filter(Boolean)
  
  // Build breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === pathSegments.length - 1
    
    return {
      href,
      name,
      isLast
    }
  })

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {breadcrumbItems.map((item) => (
            <React.Fragment key={item.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage>{item.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default DynamicBreadcrumb