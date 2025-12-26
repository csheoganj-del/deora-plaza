"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  Armchair,
  FileText,
  Users as UsersIcon,
  Hotel,
  Flower2,
  ChevronRight,
  Moon,
  Sun,
  Plus,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { BusinessSettingsForm } from "@/components/dashboard/BusinessSettingsForm";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { logoutCustomUser } from "@/actions/custom-auth";
import { cn } from "@/lib/utils";
import { PremiumLiquidGlass } from "@/components/ui/premium-liquid-glass";
import { SyncStatusIndicator } from "@/components/ui/sync-status-indicator";

export function Header() {
  const { data: session } = useSupabaseSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

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

  return (
    <motion.header 
      className="sticky top-0 z-30 liquid-glass-effect header-glass backdrop-blur-xl border-b border-white/20 shadow-lg"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between px-4 py-3.5 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden premium-glass-button"
                >
                  <Menu className="h-5 w-5 adaptive-text-primary" />
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 p-0 liquid-glass-effect border-r border-white/20"
            >
              <div className="p-6 border-b border-white/20">
                <SheetTitle className="flex items-center gap-3">
                  <PremiumLiquidGlass variant="card" className="p-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#6D5DFB] to-[#C084FC] flex items-center justify-center shadow-lg">
                      <span className="font-bold text-white text-lg">D</span>
                    </div>
                  </PremiumLiquidGlass>
                  <div>
                    <span className="text-lg font-bold adaptive-text-primary ios-text-depth">
                      DEORA Plaza
                    </span>
                    <span className="text-xs adaptive-text-secondary block uppercase tracking-wide">
                      Management
                    </span>
                  </div>
                </SheetTitle>
              </div>
              <nav className="flex flex-col px-3 pb-6 space-y-1 mt-4 overflow-y-auto scroll-smooth" aria-label="Mobile navigation">
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
                    >
                      <PremiumLiquidGlass
                        variant="card"
                        className={cn(
                          "flex items-center justify-between px-3 py-3 text-sm font-medium transition-all active:scale-95",
                          isActive && "border-l-4 border-[#6D5DFB]"
                        )}
                        animated={false}
                      >
                        <div className="flex items-center gap-3">
                          <div className="premium-icon-container p-1 rounded-lg">
                            <Icon
                              className={cn(
                                "h-5 w-5",
                                isActive ? "text-[#6D5DFB]" : "adaptive-text-secondary",
                              )}
                            />
                          </div>
                          <span className={isActive ? "adaptive-text-primary font-semibold" : "adaptive-text-secondary"}>
                            {link.name}
                          </span>
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4 text-[#6D5DFB]" />}
                      </PremiumLiquidGlass>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <PremiumLiquidGlass variant="card" className="px-4 py-2">
            <h2 className="text-base md:text-lg font-semibold adaptive-text-primary tracking-tight ios-text-depth">
              {session?.user?.businessUnit
                ? `${session.user.businessUnit.charAt(0).toUpperCase() + session.user.businessUnit.slice(1)} Dashboard`
                : "Dashboard"}
            </h2>
          </PremiumLiquidGlass>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Primary CTA Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="premium-glass-button hidden md:flex items-center gap-2 px-4 py-2 font-semibold"
              asChild
            >
              <Link href="/dashboard/hotel">
                <Plus className="h-4 w-4" />
                <span>New Booking</span>
              </Link>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="premium-glass-button"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 adaptive-text-primary" />
              ) : (
                <Moon className="h-5 w-5 adaptive-text-primary" />
              )}
            </Button>
          </motion.div>

          {/* Sync Status Indicator */}
          <SyncStatusIndicator variant="icon" size="md" />

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              className="premium-glass-button relative"
            >
              <Bell className="h-5 w-5 adaptive-text-primary" />
              <motion.div
                className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full premium-glass-button p-0"
                >
                  <Avatar className="h-9 w-9 border border-white/50 shadow-sm">
                    <AvatarImage
                      src="/avatars/01.png"
                      alt={session?.user?.name || ""}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#6D5DFB] to-[#C084FC] text-white font-bold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 liquid-glass-effect border border-white/20 shadow-xl"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none adaptive-text-primary ios-text-depth">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs leading-none adaptive-text-secondary">
                    {session?.user?.role
                      ? session.user.role.replace("_", " ")
                      : session
                        ? "Role not loaded"
                        : "Loading..."}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem
                onSelect={() => setIsSettingsDialogOpen(true)}
                className="premium-glass-button m-1 cursor-pointer adaptive-text-secondary hover:adaptive-text-primary"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setIsSettingsDialogOpen(true)}
                className="premium-glass-button m-1 cursor-pointer adaptive-text-secondary hover:adaptive-text-primary"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem
                className="premium-glass-button m-1 text-red-400 hover:text-red-300 cursor-pointer"
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
    </motion.header>
  );
}

