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
      icon: ArmchairIcon,
      roles: ["cafe_manager", "waiter", "super_admin", "owner"],
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: UtensilsCrossed,
      roles: ["cafe_manager", "waiter", "kitchen", "super_admin", "owner"],
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

  const getContextualCTA = ():
    | { text: string; href: string; icon: typeof Plus; show: boolean }
    | { show: false } => {
    if (
      role === "hotel_manager" ||
      role === "hotel_reception" ||
      pathname.includes("/hotel")
    ) {
      return { text: "New Booking", href: "/dashboard/hotel", icon: Plus, show: true };
    }

    if (role === "garden_manager" || pathname.includes("/garden")) {
      return { text: "New Event", href: "/dashboard/garden", icon: Plus, show: true };
    }

    if (
      role === "cafe_manager" ||
      role === "waiter" ||
      pathname.includes("/tables") ||
      pathname.includes("/orders")
    ) {
      return { text: "New Order", href: "/dashboard/orders/new", icon: Plus, show: true };
    }

    if (
      role === "bar_manager" ||
      role === "bartender" ||
      pathname.includes("/bar")
    ) {
      return { text: "New Order", href: "/dashboard/bar/tables", icon: Plus, show: true };
    }

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
      return { show: false };
    }

    return { show: false };
  };

  const contextualCTA = getContextualCTA();

  return (
    <header className="w-full bg-[#0a0806]/80 backdrop-blur-2xl border-b border-[#d9a441]/15 px-4 md:px-6 py-3 sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-[#0a0806] border-r border-[#d9a441]/20 text-white p-6"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <SheetTitle className="text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#F2B94B] to-[#D9A441] rounded-lg flex items-center justify-center font-bold text-[#0A0806]">
                      D
                    </div>
                    <div>
                      <span className="font-serif font-bold text-white tracking-wide text-base block">
                        DEORA PLAZA
                      </span>
                      <span className="text-[11px] text-[#F2B94B] font-mono tracking-widest uppercase block">
                        Staff Portal
                      </span>
                    </div>
                  </div>
                </SheetTitle>
              </div>
              <nav className="space-y-2">
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
                        "flex items-center justify-between p-3 rounded-xl transition-all text-sm font-medium",
                        isActive
                          ? "bg-[#F2B94B]/20 text-[#F2B94B] border border-[#F2B94B]/40"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{link.name}</span>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold font-serif text-[#F5F5F7] tracking-wide truncate">
              {session?.user?.businessUnit
                ? `${session.user.businessUnit.charAt(0).toUpperCase() + session.user.businessUnit.slice(1)} Dashboard`
                : "DEORA PLAZA Dashboard"}
            </h2>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search tables, orders, bills..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 h-10 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-[#F2B94B]/60 focus-visible:border-[#F2B94B]/60 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions & User Avatar */}
        <div className="flex items-center gap-3 shrink-0">
          {contextualCTA.show && "text" in contextualCTA && (
            <Button
              className="h-10 px-4 bg-gradient-to-r from-[#F2B94B] to-[#D9A441] text-[#0A0806] font-semibold rounded-xl shadow-lg shadow-[#D9A441]/15 hover:brightness-110 transition-all gap-2 flex items-center text-sm"
              asChild
            >
              <Link href={contextualCTA.href}>
                <Plus className="h-4 w-4" />
                <span>{contextualCTA.text}</span>
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 border border-white/10 relative transition-all"
          >
            <Bell className="h-4 w-4" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#F2B94B] rounded-full shadow-[0_0_8px_#F2B94B]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 p-0 rounded-xl border border-[#D9A441]/30 hover:border-[#D9A441]/60 transition-all overflow-hidden"
              >
                <Avatar className="h-full w-full rounded-xl">
                  <AvatarImage
                    src="/avatars/01.png"
                    alt={session?.user?.username || ""}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#F2B94B] to-[#D9A441] text-[#0A0806] font-bold text-sm rounded-xl">
                    {session?.user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-[#0a0806]/95 border border-[#d9a441]/25 text-white backdrop-blur-2xl w-56 rounded-xl shadow-2xl p-1"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="p-3 border-b border-white/10">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm text-[#F5F5F7]">
                    {session?.user?.username || "Staff Member"}
                  </p>
                  <p className="text-[11px] text-[#F2B94B] font-mono capitalize">
                    {session?.user?.role?.replace("_", " ") || "User"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onSelect={() => setIsSettingsDialogOpen(true)}
                className="p-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 cursor-pointer flex items-center gap-2"
              >
                <User className="h-4 w-4 text-[#F2B94B]" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setIsSettingsDialogOpen(true)}
                className="p-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 cursor-pointer flex items-center gap-2"
              >
                <Settings className="h-4 w-4 text-[#F2B94B]" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="p-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer flex items-center gap-2"
                onClick={async () => {
                  await logoutCustomUser();
                }}
              >
                <LogOut className="h-4 w-4" />
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
