"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  Calendar,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/hybrid/button"
import { Input } from "@/components/ui/hybrid/input"
import { Badge } from "@/components/ui/hybrid/badge"
import { useServerAuth } from "@/hooks/useServerAuth"
import { cn } from "@/lib/utils"

export default function HybridHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { data: session, signOut } = useServerAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  })

  return (
    <header className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)] ga-px-6 ga-py-4">
      <div className="ga-flex ga-items-center ga-justify-between ga-gap-4">
        {/* Left Section - Search */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search orders, customers, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full"
          />
        </div>

        {/* Center Section - Date & Time */}
        <div className="hidden md:flex ga-items-center ga-gap-6 text-center">
          <div className="ga-flex ga-items-center ga-gap-2">
            <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="ga-text-body text-[var(--text-secondary)]">
              {currentDate}
            </span>
          </div>
          <div className="ga-flex ga-items-center ga-gap-2">
            <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="ga-text-body font-medium text-[var(--text-primary)]">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="ga-flex ga-items-center ga-gap-3">
          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 w-5 h-5 p-0 ga-flex ga-items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "ga-flex ga-items-center ga-gap-3 ga-p-2 rounded-lg transition-colors",
                "hover:bg-[var(--bg-secondary)] ga-focus-visible",
                showUserMenu && "bg-[var(--bg-secondary)]"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] ga-flex ga-items-center justify-center">
                <span className="ga-text-small font-medium text-[var(--color-primary)]">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="ga-text-body font-medium text-[var(--text-primary)]">
                  {session?.user?.name || "User"}
                </p>
                <p className="ga-text-small text-[var(--text-secondary)] capitalize">
                  {session?.user?.role?.replace("_", " ") || "Staff"}
                </p>
              </div>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50">
                <div className="ga-p-3 border-b border-[var(--border-primary)]">
                  <p className="ga-text-body font-medium text-[var(--text-primary)]">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="ga-text-small text-[var(--text-secondary)]">
                    {session?.user?.email || "user@example.com"}
                  </p>
                </div>
                
                <div className="ga-p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push("/dashboard/profile")
                    }}
                    className="w-full ga-flex ga-items-center ga-gap-3 ga-px-3 ga-py-2 text-left rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="ga-text-body">Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push("/dashboard/settings")
                    }}
                    className="w-full ga-flex ga-items-center ga-gap-3 ga-px-3 ga-py-2 text-left rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="ga-text-body">Settings</span>
                  </button>
                  
                  <hr className="my-2 border-[var(--border-primary)]" />
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full ga-flex ga-items-center ga-gap-3 ga-px-3 ga-py-2 text-left rounded-md hover:bg-[var(--color-error-light)] text-[var(--color-error)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="ga-text-body">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}