import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  LogOut,
  User,
  Settings,
  Menu,
  LayoutDashboard,
  UtensilsCrossed,
  Armchair as ArmchairIcon,
  FileText,
  Users as UsersIcon,
  Hotel,
  Flower2,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { BusinessSettingsForm } from "@/components/dashboard/BusinessSettingsForm";
import { useServerAuth } from "@/hooks/useServerAuth";
import { logoutCustomUser } from "@/actions/custom-auth";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useServerAuth();
  const pathname = usePathname();
  const role = session?.user?.role;
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSuperAdmin = role === "super_admin";
  const isLoading = !session;

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "owner"],
    },
    {
      name: "Tables",
      href: "/dashboard/tables",
      icon: Armchair,
      roles: ["cafe_manager", "waiter", "super_admin", "owner"],
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: UtensilsCrossed,
      roles: ["cafe_manager", "waiter", "kitchen", "super_admin", "owner"],
    },
    {
      name: "Hotel",
      href: "/dashboard/hotel",
      icon: Hotel,
      roles: ["hotel_manager", "hotel_reception", "super_admin", "owner"],
    },
    {
      name: "Garden",
      href: "/dashboard/garden",
      icon: Flower2,
      roles: ["garden_manager", "super_admin", "owner"],
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: FileText,
      roles: ["cafe_manager", "bar_manager", "super_admin", "owner"],
    },
    {
      name: "Users",
      href: "/dashboard/users",
      icon: UsersIcon,
      roles: ["super_admin", "owner", "manager"],
    },
  ];

  // Dynamic CTA button based on user role and current page
  const getContextualCTA = (): { text: string; href: string; icon: typeof Plus; show: boolean } | { show: false } => {
    // Hotel-related roles or pages
    if (role === "hotel_manager" || role === "hotel_reception" || pathname.includes("/hotel")) {
      return {
        text: "New Booking",
        href: "/dashboard/hotel",
        icon: Plus,
        show: true
      };
    }

    // Garden-related roles or pages
    if (role === "garden_manager" || pathname.includes("/garden")) {
      return {
        text: "New Event",
        href: "/dashboard/garden",
        icon: Plus,
        show: true
      };
    }

    // Cafe/Restaurant-related roles or pages
    if (role === "cafe_manager" || role === "waiter" || pathname.includes("/tables") || pathname.includes("/orders")) {
      return {
        text: "New Order",
        href: "/dashboard/orders/new",
        icon: Plus,
        show: true
      };
    }

    // Bar-related roles or pages
    if (role === "bar_manager" || role === "bartender" || pathname.includes("/bar")) {
      return {
        text: "New Order",
        href: "/dashboard/bar/tables",
        icon: Plus,
        show: true
      };
    }

    // Admin/Owner - show most relevant action based on current page
    if (role === "super_admin" || role === "owner") {
      if (pathname.includes("/hotel")) {
        return { text: "New Booking", href: "/dashboard/hotel", icon: Plus, show: true };
      }
      if (pathname.includes("/garden")) {
        return { text: "New Event", href: "/dashboard/garden", icon: Plus, show: true };
      }
      if (pathname.includes("/tables") || pathname.includes("/orders")) {
        return { text: "New Order", href: "/dashboard/orders/new", icon: Plus, show: true };
      }
      if (pathname.includes("/users")) {
        return { text: "Add User", href: "/dashboard/users", icon: Plus, show: true };
      }
      // Default for admin - don't show CTA on main dashboard
      return { show: false };
    }

    // Default - no CTA
    return { show: false };
  };

  const contextualCTA = getContextualCTA();

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        <div className="dashboard-header-left">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden dashboard-icon-button"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="dashboard-mobile-menu"
            >
              <div className="dashboard-mobile-header">
                <SheetTitle className="dashboard-mobile-title">
                  <div className="dashboard-logo">
                    <div className="dashboard-logo-icon">
                      <span className="dashboard-logo-text">D</span>
                    </div>
                  </div>
                  <div>
                    <span className="dashboard-brand-name">
                      DEORA Plaza
                    </span>
                    <span className="dashboard-brand-subtitle">
                      Management
                    </span>
                  </div>
                </SheetTitle>
              </div>
              <nav className="dashboard-mobile-nav" aria-label="Mobile navigation">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  if (
                    !isSuperAdmin &&
                    !isLoading &&
                    link.roles &&
                    (!role || !link.roles.includes(role))
                  )
                    return null;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "dashboard-mobile-nav-item",
                        isActive && "dashboard-mobile-nav-item-active"
                      )}
                    >
                      <div className="dashboard-mobile-nav-content">
                        <div className="dashboard-mobile-nav-icon">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span>{link.name}</span>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="dashboard-title-container">
            <h2 className="dashboard-title select-text">
              {session?.user?.businessUnit
                ? `${session.user.businessUnit.charAt(0).toUpperCase() + session.user.businessUnit.slice(1)} Dashboard`
                : "Dashboard"}
            </h2>
          </div>
        </div>

        {/* MD3 Search Bar - Centered Pill */}
        <div className="hidden md:flex flex-1 justify-center max-w-[600px] mx-auto px-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5F6368]" />
            <Input
              placeholder="Search"
              className="w-full bg-white/50 backdrop-blur-md border border-white/30 rounded-full pl-12 h-12 focus-visible:ring-2 focus-visible:ring-[#1A73E8] transition-all text-[16px] hover:bg-white/60"
            />
          </div>
        </div>

        <div className="dashboard-header-right">
          {/* MD3 Primary Extended FAB */}
          {contextualCTA.show && 'text' in contextualCTA && (
            <Button
              className="h-12 px-6 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full shadow-lg hover:shadow-xl transition-all gap-3 flex items-center font-medium"
              asChild
            >
              <Link href={contextualCTA.href}>
                <Plus className="h-5 w-5" />
                <span>{contextualCTA.text}</span>
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full text-[#5F6368] hover:bg-white/40 backdrop-blur-sm active:bg-white/50 transition-all"
          >
            <Bell className="h-6 w-6" />
            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#B3261E] rounded-full border-2 border-white" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="dashboard-avatar-button"
              >
                <Avatar className="dashboard-avatar">
                  <AvatarImage
                    src="/avatars/01.png"
                    alt={session?.user?.username || ""}
                  />
                  <AvatarFallback className="dashboard-avatar-fallback">
                    {session?.user?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="dashboard-dropdown"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="dashboard-dropdown-label">
                <div className="dashboard-user-info">
                  <p className="dashboard-user-name">
                    {session?.user?.username}
                  </p>
                  <p className="dashboard-user-role">
                    {session?.user?.role
                      ? session.user.role.replace("_", " ")
                      : session
                        ? "Role not loaded"
                        : "Loading..."}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="dashboard-dropdown-separator" />
              <DropdownMenuItem
                onSelect={() => setIsSettingsDialogOpen(true)}
                className="dashboard-dropdown-item"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setIsSettingsDialogOpen(true)}
                className="dashboard-dropdown-item"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dashboard-dropdown-separator" />
              <DropdownMenuItem
                className="dashboard-dropdown-item dashboard-logout-item"
                onClick={async () => {
                  await logoutCustomUser();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <BusinessSettingsForm onClose={() => setIsSettingsDialogOpen(false)} />
      </Dialog>
    </header>
  );
}

