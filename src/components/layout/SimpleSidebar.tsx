"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Wine,
  Building2,
  Flower2,
  Users,
  FileText,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Restaurant", href: "/dashboard/tables", icon: UtensilsCrossed },
  { name: "Bar", href: "/dashboard/bar", icon: Wine },
  { name: "Hotel", href: "/dashboard/hotel", icon: Building2 },
  { name: "Garden", href: "/dashboard/garden", icon: Flower2 },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
];

export default function SimpleSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full backdrop-blur-xl bg-white/8 border-r border-white/15">
      {/* Logo */}
      <div className="p-6 border-b border-white/15">
        <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
          DEORA Plaza
        </h1>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-4 left-4 right-4">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 w-full">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}