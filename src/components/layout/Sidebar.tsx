"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const role = session?.user?.role

    const links = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["all"],
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
            name: "Bar",
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
            name: "Customers",
            href: "/dashboard/customers",
            icon: Users,
            roles: ["cafe_manager", "super_admin", "owner"],
        },
        {
            name: "Inventory",
            href: "/dashboard/inventory",
            icon: Settings,
            roles: ["cafe_manager", "super_admin"],
        },
        {
            name: "Reports",
            href: "/dashboard/reports",
            icon: FileText,
            roles: ["super_admin", "owner", "cafe_manager"],
        },
        {
            name: "Owner Dashboard",
            href: "/dashboard/owner",
            icon: LayoutDashboard,
            roles: ["owner", "super_admin"],
        },
        {
            name: "Settlements",
            href: "/dashboard/settlements",
            icon: FileText,
            roles: ["owner", "super_admin"],
        },
        {
            name: "Staff",
            href: "/dashboard/staff",
            icon: Users,
            roles: ["super_admin", "owner", "cafe_manager"],
        },
        {
            name: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
            roles: ["super_admin"],
        },
    ]

    const filteredLinks = links.filter(
        (link) => link.roles.includes("all") || (role && link.roles.includes(role))
    )

    return (
        <div className="flex h-full w-64 flex-col border-r border-white/10 bg-black/95 backdrop-blur-xl text-white shadow-2xl">
            <div className="flex h-16 items-center border-b border-white/10 px-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mr-3 shadow-lg shadow-amber-500/20">
                    <span className="font-bold text-black">D</span>
                </div>
                <span className="text-lg font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">DEORA PLAZA</span>
            </div>
            <ScrollArea className="flex-1 py-4">
                <nav className="grid gap-1 px-3">
                    {filteredLinks.map((link) => {
                        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 group",
                                    isActive
                                        ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                                )}
                            >
                                <link.icon className={cn(
                                    "h-5 w-5 transition-colors duration-300",
                                    isActive ? "text-amber-400" : "text-gray-500 group-hover:text-white"
                                )} />
                                {link.name}
                                {isActive && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>
            <div className="border-t border-white/10 p-4">
                <div className="rounded-xl bg-gradient-to-br from-gray-900 to-black p-4 border border-white/5">
                    <p className="text-xs font-medium text-gray-400">Logged in as</p>
                    <p className="text-sm font-bold text-white truncate">{session?.user?.name || session?.user?.username}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-500">System Online</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
