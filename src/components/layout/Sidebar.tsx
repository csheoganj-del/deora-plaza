"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Armchair,
  FileText,
  Users,
  Hotel,
  Flower2,
  LogOut,
  ChevronRight,
  Handshake,
  FileSpreadsheet,
  BarChart3,
  Tag,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { logoutCustomUser } from "@/actions/custom-auth";
import { useState } from "react";

// Simple nav item component - NO animations, NO complex CSS
function NavItem({ 
  href, 
  icon: Icon, 
  name, 
  isActive, 
  isCollapsed,
  isHovered,
  onHover,
  onLeave
}: {
  href: string;
  icon: React.ElementType;
  name: string;
  isActive: boolean;
  isCollapsed: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <Link 
      href={href}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        // Base styles - FIXED dimensions
        "relative flex items-center h-11 px-3 rounded-xl",
        "border-l-2 box-border",
        // Background and border
        "bg-white/8 border border-white/15",
        "backdrop-blur-xl",
        // Hover - only color changes, NO dimension changes
        "hover:bg-white/12",
        // Active state
        isActive 
          ? "border-l-[#6D5DFB] bg-[#6D5DFB]/15" 
          : "border-l-transparent hover:border-l-[#6D5DFB]/50",
        // Alignment
        isCollapsed ? "justify-center" : "justify-start"
      )}
      style={{
        // Lock dimensions to prevent any layout shift
        minHeight: '44px',
        maxHeight: '44px',
      }}
    >
      <Icon className={cn(
        "h-4 w-4 flex-shrink-0",
        isActive ? "text-[#6D5DFB]" : "text-white/80"
      )} />

      {!isCollapsed && (
        <span className={cn(
          "text-sm font-medium whitespace-nowrap ml-3",
          isActive ? "text-white font-semibold" : "text-white/90"
        )}>
          {name}
        </span>
      )}

      {isActive && !isCollapsed && (
        <ChevronRight className="h-3 w-3 text-[#6D5DFB] ml-auto" />
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && isHovered && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md whitespace-nowrap z-50 pointer-events-none">
          {name}
        </div>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSupabaseSession();
  const role = session?.user?.role;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const isSuperAdmin = role === "super_admin";
  const isLoading = status === "loading";

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "owner"] },
    { name: "Tables", href: "/dashboard/tables", icon: Armchair, roles: ["cafe_manager", "waiter", "super_admin", "owner"] },
    { name: "Orders", href: "/dashboard/orders", icon: UtensilsCrossed, roles: ["cafe_manager", "waiter", "kitchen", "super_admin", "owner"] },
    { name: "Hotel", href: "/dashboard/hotel", icon: Hotel, roles: ["hotel_manager", "hotel_reception", "super_admin", "owner"] },
    { name: "Garden", href: "/dashboard/garden", icon: Flower2, roles: ["garden_manager", "super_admin", "owner"] },
    { name: "Kitchen", href: "/dashboard/kitchen", icon: UtensilsCrossed, roles: ["kitchen", "cafe_manager", "super_admin"] },
    { name: "Billing", href: "/dashboard/billing", icon: FileText, roles: ["cafe_manager", "super_admin", "owner"] },
    { name: "Statistics", href: "/dashboard/statistics", icon: BarChart3, roles: ["cafe_manager", "bar_manager", "hotel_manager", "manager", "super_admin", "owner"] },
    { name: "Locations", href: "/dashboard/admin/locations", icon: MapPin, roles: ["super_admin", "owner"] },
    { name: "GST Report", href: "/dashboard/gst-report", icon: FileSpreadsheet, roles: ["super_admin", "owner"] },
    { name: "Dept. Settlements", href: "/dashboard/settlements", icon: Handshake, roles: ["super_admin", "owner"] },
    { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ["cafe_manager", "super_admin", "owner"] },
    { name: "Discounts", href: "/dashboard/discounts", icon: Tag, roles: ["super_admin", "owner", "manager"] },
    { name: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed, roles: ["cafe_manager", "bar_manager", "super_admin", "owner"] },
    { name: "User Management", href: "/dashboard/users", icon: Users, roles: ["super_admin", "owner", "manager"] },
  ];

  return (
    <div
      className="hidden md:flex h-full flex-col bg-black/40 backdrop-blur-xl border-r border-white/20 overflow-hidden z-50"
      style={{ width: isCollapsed ? 64 : 224 }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className="flex h-full flex-col min-h-0">
        {/* Logo Section */}
        <div className="flex-shrink-0 px-2 py-4">
          <div className={cn(
            "flex items-center h-14 px-3 rounded-xl",
            "bg-white/8 border border-white/15 backdrop-blur-xl",
            isCollapsed ? "justify-center" : "justify-start"
          )}>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#6D5DFB] to-[#C084FC] flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="font-bold text-white text-sm">D</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-sm font-bold text-white">DEORA</h1>
                <p className="text-xs text-white/80">Plaza</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-y-auto px-2 py-4">
            <nav className="space-y-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const hasAccess = isSuperAdmin || isLoading || link.roles.includes(role || "");
                if (!hasAccess) return null;

                return (
                  <NavItem
                    key={link.href}
                    href={link.href}
                    icon={link.icon}
                    name={link.name}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    isHovered={hoveredLink === link.href}
                    onHover={() => setHoveredLink(link.href)}
                    onLeave={() => setHoveredLink(null)}
                  />
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Section */}
        <div className="flex-shrink-0 px-2 py-4 space-y-2">
          {/* User Info */}
          <div className={cn(
            "flex items-center h-14 px-3 rounded-xl",
            "bg-white/8 border border-white/15 backdrop-blur-xl",
            isCollapsed ? "justify-center" : "justify-start"
          )}>
            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#6D5DFB] to-[#C084FC] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-white">
                {session?.user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.email || "Loading..."}
                </p>
                <p className="text-xs text-white/80 capitalize">
                  {role?.replace("_", " ") || "User"}
                </p>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => logoutCustomUser()}
            className={cn(
              "w-full flex items-center h-12 px-3 rounded-xl",
              "bg-white/8 border border-white/15 backdrop-blur-xl",
              "text-red-300 hover:text-red-200 hover:bg-white/12",
              isCollapsed ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium ml-3">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

