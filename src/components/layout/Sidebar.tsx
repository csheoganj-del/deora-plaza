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

// Luxury Dark Gold Nav Item
function NavItem({
  href,
  icon: Icon,
  name,
  isActive,
  isCollapsed,
  isHovered,
  onHover,
  onLeave,
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
        "w-full flex flex-col items-center gap-1 py-3 group relative transition-all duration-300",
        isActive ? "text-[#F2B94B]" : "text-white/60 hover:text-white"
      )}
    >
      {/* Dark Gold Glass Indicator Pill */}
      <div className="relative h-9 w-14 flex items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-xl transition-all duration-300",
            isActive
              ? "bg-gradient-to-r from-[#F2B94B]/25 to-[#D9A441]/15 border border-[#F2B94B]/40 shadow-[0_0_15px_rgba(242,185,75,0.2)] backdrop-blur-md"
              : "bg-transparent group-hover:bg-white/5 backdrop-blur-sm"
          )}
        />
        <Icon
          className={cn(
            "h-5 w-5 shrink-0 relative z-10 transition-transform duration-200 group-hover:scale-110",
            isActive ? "text-[#F2B94B]" : "text-white/60 group-hover:text-white"
          )}
        />
      </div>

      {!isCollapsed && (
        <span
          className={cn(
            "text-[11px] font-medium tracking-wide truncate max-w-full px-1 transition-colors",
            isActive ? "text-[#F2B94B] font-semibold" : "text-white/60 group-hover:text-white"
          )}
        >
          {name}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && isHovered && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0a0806]/90 border border-[#F2B94B]/30 text-[#F5F5F7] text-[12px] font-medium rounded-lg whitespace-nowrap z-50 shadow-2xl backdrop-blur-xl">
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

  const links = useMemo(
    () => [
      {
        name: "Tables",
        href: "/dashboard/tables",
        icon: Armchair,
        roles: ["cafe_manager", "waiter", "super_admin", "owner"],
        moduleKey: "enableTablesModule" as const,
      },
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["super_admin", "owner"],
        moduleKey: "enableAnalyticsModule" as const,
      },
      {
        name: "Orders",
        href: "/dashboard/orders",
        icon: UtensilsCrossed,
        roles: ["cafe_manager", "waiter", "kitchen", "super_admin", "owner"],
        moduleKey: "enableOrderManagementModule" as const,
      },
      {
        name: "Billing",
        href: "/dashboard/billing",
        icon: FileText,
        roles: ["cafe_manager", "super_admin", "owner"],
        moduleKey: "enableBillingModule" as const,
      },
      {
        name: "Statistics",
        href: "/dashboard/statistics",
        icon: BarChart3,
        roles: ["bar_manager", "hotel_manager", "manager", "super_admin", "owner"],
        moduleKey: "enableStatisticsModule" as const,
      },
      {
        name: "GST Report",
        href: "/dashboard/gst-report",
        icon: FileSpreadsheet,
        roles: ["super_admin", "owner"],
        moduleKey: "enableGSTReportModule" as const,
      },
      {
        name: "Settlements",
        href: "/dashboard/settlements",
        icon: Handshake,
        roles: ["super_admin", "owner"],
        moduleKey: "enableSettlementsModule" as const,
      },
      {
        name: "Customers",
        href: "/dashboard/customers",
        icon: Users,
        roles: ["super_admin", "owner"],
        moduleKey: "enableCustomerModule" as const,
      },
      {
        name: "Discounts",
        href: "/dashboard/discounts",
        icon: Tag,
        roles: ["super_admin", "owner", "manager"],
        moduleKey: "enableDiscountsModule" as const,
      },
      {
        name: "Menu",
        href: "/dashboard/menu",
        icon: UtensilsCrossed,
        roles: ["cafe_manager", "bar_manager", "super_admin", "owner"],
        moduleKey: "enableMenuModule" as const,
      },
      {
        name: "Users",
        href: "/dashboard/users",
        icon: Users,
        roles: ["super_admin", "owner", "manager"],
        moduleKey: "enableUserManagementModule" as const,
      },
    ],
    []
  );

  const visibleLinks = useMemo(() => {
    if (!role || !session?.user) {
      return [];
    }

    if (isSuperAdmin) {
      return links;
    }

    const roleFilteredLinks = links.filter((link) => link.roles.includes(role));
    return filterNavigationItems(roleFilteredLinks);
  }, [role, session?.user, isSuperAdmin, links, filterNavigationItems]);

  return (
    <div
      className={cn(
        "h-screen flex-shrink-0 bg-[#0a0806]/85 backdrop-blur-2xl border-r border-[#d9a441]/15 flex flex-col transition-all duration-300 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.5)]",
        isCollapsed ? "w-16" : "w-64"
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-white/5">
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#F2B94B] to-[#D9A441] rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(242,185,75,0.3)]">
              <span className="text-[#0A0806] font-bold text-[15px] tracking-tight">D</span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-[15px] font-bold tracking-wider text-[#F5F5F7] font-serif">
                  DEORA PLAZA
                </h1>
                <p className="text-[11px] text-[#F2B94B] tracking-widest uppercase font-mono">
                  Staff Access
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <nav className="space-y-1">
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

        {/* User Footer */}
        <div className="p-3 border-t border-white/5 bg-black/20">
          <div
            className={cn(
              "flex items-center gap-3 mb-2",
              isCollapsed && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
              <span className="text-[12px] font-semibold text-[#F2B94B]">
                {session?.user?.username?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-white/90 truncate">
                  {session?.user?.username || session?.user?.name || "Staff"}
                </p>
                <p className="text-[10px] text-white/50 capitalize truncate">
                  {role?.replace("_", " ") || "User"}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => logoutCustomUser()}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
