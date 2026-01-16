import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Armchair,
  FileText,
  Users,
  Hotel,
  Flower2,
  Wine,
  LogOut,
  ChevronRight,
  Handshake,
  FileSpreadsheet,
  BarChart3,
  Tag,
  MapPin,
  Package,
  Monitor,
  Smartphone,
  Edit3,
  Zap,
  Trophy,
  Calendar,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useServerAuth } from "@/hooks/useServerAuth";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { logoutCustomUser } from "@/actions/custom-auth";
import { useState, useMemo } from "react";

// Google Material Design 3 Nav Item
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
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "w-full flex flex-col items-center gap-1 py-3 group relative transition-all",
        isActive ? "text-[#1A73E8]" : "text-[#5F6368] hover:text-[#202124]"
      )}
    >
      {/* MD3 Indicator Pill (Oval background) */}
      <div className="relative h-8 w-14 flex items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-300 backdrop-blur-sm",
            isActive
              ? "bg-blue-400/30 backdrop-blur-md"
              : "bg-transparent group-hover:bg-white/20 backdrop-blur-sm"
          )}
        />
        <Icon className={cn(
          "h-6 w-6 shrink-0 relative z-10 transition-colors",
          isActive ? "text-[#041E49]" : "text-[#5F6368]"
        )} />
      </div>

      {!isCollapsed && (
        <span className={cn(
          "text-[12px] font-medium truncate max-w-full px-1",
          isActive ? "text-[#1A73E8]" : "text-[#5F6368]"
        )}>
          {name}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && isHovered && (
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 backdrop-blur-xl text-white text-[11px] rounded-lg whitespace-nowrap z-50 shadow-lg border border-white/10">
          {name}
        </div>
      )}
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, loading: authLoading } = useServerAuth();
  const { filterNavigationItems, loading: moduleLoading } = useModuleAccess();
  const role = session?.user?.role;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const isSuperAdmin = role === "super_admin" || role === "owner";
  const isLoading = authLoading || moduleLoading;

  // Memoize links array to prevent infinite render loop
  const links = useMemo(() => [
    {
      name: "Tables",
      href: "/dashboard/tables",
      icon: Armchair,
      roles: ["cafe_manager", "waiter", "super_admin", "owner"],
      moduleKey: "enableTablesModule" as const
    },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "owner"],
      moduleKey: "enableAnalyticsModule" as const
    },
    {
      name: "Bar",
      href: "/dashboard/bar",
      icon: Wine,
      roles: ["bar_manager", "super_admin", "owner"],
      moduleKey: "enableBarModule" as const
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: UtensilsCrossed,
      roles: ["cafe_manager", "waiter", "kitchen", "super_admin", "owner"],
      moduleKey: "enableOrderManagementModule" as const
    },
    {
      name: "Hotel",
      href: "/dashboard/hotel",
      icon: Hotel,
      roles: ["hotel_manager", "hotel_reception", "super_admin", "owner"],
      moduleKey: "enableHotelModule" as const
    },
    {
      name: "Garden",
      href: "/dashboard/garden",
      icon: Flower2,
      roles: ["garden_manager", "super_admin", "owner"],
      moduleKey: "enableGardenModule" as const
    },
    {
      name: "Kitchen",
      href: "/dashboard/kitchen",
      icon: UtensilsCrossed,
      roles: ["kitchen", "super_admin"],
      moduleKey: "enableKitchenModule" as const
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: FileText,
      roles: ["cafe_manager", "super_admin", "owner"],
      moduleKey: "enableBillingModule" as const
    },
    {
      name: "Statistics",
      href: "/dashboard/statistics",
      icon: BarChart3,
      roles: ["bar_manager", "hotel_manager", "manager", "super_admin", "owner"],
      moduleKey: "enableStatisticsModule" as const
    },
    {
      name: "GST Report",
      href: "/dashboard/gst-report",
      icon: FileSpreadsheet,
      roles: ["super_admin", "owner"],
      moduleKey: "enableGSTReportModule" as const
    },
    {
      name: "Dept. Settlements",
      href: "/dashboard/settlements",
      icon: Handshake,
      roles: ["super_admin", "owner"],
      moduleKey: "enableSettlementsModule" as const
    },
    {
      name: "Customers",
      href: "/dashboard/customers",
      icon: Users,
      roles: ["super_admin", "owner"],
      moduleKey: "enableCustomerModule" as const
    },
    {
      name: "Discounts",
      href: "/dashboard/discounts",
      icon: Tag,
      roles: ["super_admin", "owner", "manager"],
      moduleKey: "enableDiscountsModule" as const
    },
    {
      name: "Menu",
      href: "/dashboard/menu",
      icon: UtensilsCrossed,
      roles: ["cafe_manager", "bar_manager", "super_admin", "owner"],
      moduleKey: "enableMenuModule" as const
    },
    {
      name: "User Management",
      href: "/dashboard/users",
      icon: Users,
      roles: ["super_admin", "owner", "manager"],
      moduleKey: "enableUserManagementModule" as const
    },
  ], []); // Empty deps - links definition is static

  // Filter navigation items based on module access and permissions
  const visibleLinks = useMemo(() => {
    if (!role || !session?.user) {
      return []; // No links if no role is detected
    }

    if (isSuperAdmin) {
      return links; // Show all links for super admin
    }

    // Filter links based on user role - strict role checking
    const roleFilteredLinks = links.filter(link => {
      // Ensure user role is explicitly included in the link's allowed roles
      return link.roles.includes(role);
    });

    return filterNavigationItems(roleFilteredLinks);
  }, [role, session?.user, isSuperAdmin, links, filterNavigationItems]);

  return (
    <div
      className={cn(
        "h-full bg-white/80 backdrop-blur-xl backdrop-saturate-150 border-r border-white/20 flex flex-col transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className="flex-1 flex flex-col">
        {/* Logo Section */}
        <div className="p-4 border-b border-white/20">
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-[#1a73e8] rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-[14px]">D</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-[16px] font-semibold text-[#202124]">DEORA</h1>
                <p className="text-[12px] text-[#5f6368]">Plaza</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href;

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

        {/* User Section */}
        <div className="p-4 border-t border-white/20">
          {/* User Info */}
          <div className={cn(
            "flex items-center gap-3 mb-3",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
              <span className="text-[12px] font-medium text-[#5f6368]">
                {session?.user?.username?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#202124] truncate">
                  {session?.user?.email || session?.user?.username || "Loading..."}
                </p>
                <p className="text-[10px] text-[#5f6368] truncate">
                  {role?.replace("_", " ") || "User"}
                </p>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => logoutCustomUser()}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[#d93025] hover:bg-[#fce8e6] rounded-lg transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

