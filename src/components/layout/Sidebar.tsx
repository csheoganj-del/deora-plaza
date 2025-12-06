"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    LayoutDashboard,
    UtensilsCrossed,
    Armchair,
    FileText,
    Users,
    Settings,
    Beer,
    Hotel,
    Flower2,
    LogOut,
    ChevronRight,
    Handshake,
    FileSpreadsheet
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session } = useSession()
    const role = session?.user?.role

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
            name: "Bar & POS",
            href: "/dashboard/bar",
            icon: Beer,
            roles: ["bar_manager", "bartender", "super_admin", "owner"],
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
            name: "Kitchen",
            href: "/dashboard/kitchen",
            icon: UtensilsCrossed,
            roles: ["kitchen", "cafe_manager", "super_admin"],
        },
        {
            name: "Billing",
            href: "/dashboard/billing",
            icon: FileText,
            roles: ["cafe_manager", "super_admin", "owner"],
        },
        {
            name: "GST Report",
            href: "/dashboard/gst-report",
            icon: FileSpreadsheet,
            roles: ["super_admin", "owner"],
        },
        {
            name: "Dept. Settlements",
            href: "/dashboard/department-settlements",
            icon: Handshake,
            roles: ["super_admin", "owner"],
        },
        {
            name: "Customers",
            href: "/dashboard/customers",
            icon: Users,
            roles: ["cafe_manager", "super_admin", "owner"],
        },
        {
            name: "Menu",
            href: "/dashboard/menu",
            icon: UtensilsCrossed,
            roles: ["cafe_manager", "super_admin", "owner"],
        },
        {
            name: "User Management",
            href: "/dashboard/users",
            icon: Users,
            roles: ["super_admin"],
        },
    ]

    return (
        <div className="flex h-full w-64 flex-col glass-3d border-r border-slate-200 text-slate-800 elevation-2">
            <div className="flex flex-col flex-1 p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6 shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20 glow-ring animate-float-3d">
                        <span className="font-bold text-white text-lg font-serif">D</span>
                    </div>
                    <div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight block">Deora Plaza</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Management</span>
                    </div>
                </div>

                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-1 py-4">
                        {links.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href

                            // Filter links based on role - only show links the user has access to
                            // If no role is detected, don't show any links (except for super_admin/owner)
                            if (link.roles && (!role || !link.roles.includes(role))) {
                                return null
                            }

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 interactive-scale-sm",
                                        isActive
                                            ? "bg-amber-500 text-white shadow-md shadow-amber-900/20"
                                            : "hover:bg-white/60 hover:text-slate-900"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                        <span>{link.name}</span>
                                    </div>
                                    {isActive && <ChevronRight className="h-3 w-3 text-white/90" />}
                                </Link>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>

            <div className="mt-auto p-6 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-8 w-8 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center border border-slate-200 glow-ring">
                        <Users className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">{session?.user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{session?.user?.role?.replace('_', ' ') || 'Staff'}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-white/60 interactive-scale-sm"
                    onClick={async () => {
                        try {
                            await signOut({ redirect: false })
                        } finally {
                            window.location.href = window.location.origin + '/login'
                        }
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
