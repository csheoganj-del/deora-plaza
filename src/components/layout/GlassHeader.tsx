"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Calendar, Clock, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useServerAuth } from "@/hooks/useServerAuth";
import { useNotificationSystem } from "@/hooks/useNotificationSystem";
import NotificationList from "@/components/notifications/NotificationList";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { BusinessSettingsForm } from "@/components/dashboard/BusinessSettingsForm";
import { useRouter } from "next/navigation";

import MobileSidebar from "./MobileSidebar";

export default function GlassHeader() {
    const { data: session } = useServerAuth();
    const { notifications, unreadCount, markAllAsRead, clearAll, markAsRead } = useNotificationSystem();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setShowNotifications(!showNotifications);
        if (!showNotifications && unreadCount > 0) {
            // Optional: mark as read when opened
            // markAllAsRead();
        }
    };

    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });

    return (
        <header className="sticky top-0 right-0 z-40 p-4 pb-0">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/40 backdrop-blur-xl shadow-lg p-3 flex items-center justify-between gap-4">

                {/* Left: Mobile Sidebar Toggle & Welcome */}
                <div className="flex-1 flex items-center gap-4">
                    <MobileSidebar />
                    <div className="flex flex-col">
                        <span className="text-white font-semibold flex items-center gap-2">
                            Welcome back, {session?.user?.username || 'User'}
                        </span>
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                            {session?.user?.role?.replace('_', ' ') || 'Guest'} Platform
                        </span>
                    </div>
                </div>

                {/* Center: Global Status/Time */}
                <div className="hidden lg:flex items-center gap-6 px-6 py-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-white/60">
                        <Calendar className="w-4 h-4 text-[#F2B94B]" />
                        <span className="text-xs font-medium">{currentDate}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div className="flex items-center gap-2 text-white/60">
                        <Clock className="w-4 h-4 text-[#F2B94B]" />
                        <span className="text-xs font-medium">{currentTime}</span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">

                    <div className="relative" ref={notificationRef}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleBellClick}
                            className={cn(
                                "relative p-2.5 rounded-xl border transition-all",
                                showNotifications
                                    ? "bg-white/20 border-white/20 text-white"
                                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Bell className="w-5 h-5" />
                            <AnimatePresence>
                                {unreadCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(244,63,94,0.5)] border border-white/20"
                                    >
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        <AnimatePresence>
                            {showNotifications && (
                                <NotificationList
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    onMarkAllAsRead={() => {
                                        markAllAsRead();
                                        // setShowNotifications(false);
                                    }}
                                    onMarkAsRead={markAsRead}
                                    onClearAll={() => {
                                        clearAll();
                                        setShowNotifications(false);
                                    }}
                                    onClose={() => setShowNotifications(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Menu */}
                    <div className="relative" ref={profileRef}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                                showProfileMenu
                                    ? "bg-white/20 border-white/20 text-white"
                                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-white font-bold text-sm border border-white/20">
                                {session?.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <ChevronDown className={cn(
                                "w-4 h-4 transition-transform",
                                showProfileMenu && "rotate-180"
                            )} />
                        </motion.button>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#1a1a1a]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
                                >
                                    {/* User Info Section */}
                                    <div className="p-4 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 shadow-lg">
                                                {session?.user?.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white truncate">
                                                    {session?.user?.username || 'User'}
                                                </h3>
                                                <p className="text-xs text-white/40 uppercase tracking-wider font-bold truncate">
                                                    {session?.user?.role?.replace('_', ' ') || 'Guest'}
                                                </p>
                                                {session?.user?.email && (
                                                    <p className="text-xs text-white/30 truncate mt-0.5">
                                                        {session.user.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-2">
                                        {/* Settings - Admin only */}
                                        {(
                                            session?.user?.role === 'super_admin' ||
                                            session?.user?.role === 'owner' ||
                                            session?.user?.role === 'garden_manager' ||
                                            session?.user?.role === 'hotel_manager' ||
                                            session?.user?.role === 'cafe_manager' ||
                                            session?.user?.role === 'manager' ||
                                            session?.user?.email?.includes('admin')
                                        ) && (
                                                <button
                                                    onClick={() => {
                                                        setShowProfileMenu(false);
                                                        setShowSettingsDialog(true);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all group"
                                                >
                                                    <Settings className="w-4 h-4 text-white/60 group-hover:text-primary transition-colors" />
                                                    <span className="text-sm font-medium">Settings</span>
                                                </button>
                                            )}

                                        {/* Logout */}
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                router.push('/login');
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-red-500/10 hover:text-red-400 transition-all group"
                                        >
                                            <LogOut className="w-4 h-4 text-white/60 group-hover:text-red-400 transition-colors" />
                                            <span className="text-sm font-medium">Logout</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <BusinessSettingsForm
                    onClose={() => setShowSettingsDialog(false)}
                    onSaveSuccess={() => {
                        setShowSettingsDialog(false);
                    }}
                />
            </Dialog>
        </header>
    );
}
