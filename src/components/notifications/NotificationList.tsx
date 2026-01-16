"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, X, AlertCircle, Info, ShoppingCart, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationListProps {
    notifications: any[];
    unreadCount: number;
    onMarkAllAsRead: () => void;
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
    onClose: () => void;
}

export default function NotificationList({
    notifications,
    unreadCount,
    onMarkAllAsRead,
    onMarkAsRead,
    onClearAll,
    onClose
}: NotificationListProps) {
    const getIcon = (type: string, priority: string) => {
        if (priority === 'critical' || priority === 'high') return <AlertCircle className="w-5 h-5 text-rose-400" />;

        switch (type) {
            case 'order_new':
            case 'internal_order_new':
                return <ShoppingCart className="w-5 h-5 text-amber-400" />;
            case 'order_ready':
            case 'internal_order_ready':
                return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-4 w-96 rounded-2xl border border-white/10 bg-[#1a1a1a]/90 backdrop-blur-2xl shadow-2xl overflow-hidden z-50"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                            {unreadCount} NEW
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onMarkAllAsRead}
                        className="p-2 text-white/40 hover:text-white transition-colors"
                        title="Mark all as read"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClearAll}
                        className="p-2 text-white/40 hover:text-rose-400 transition-colors"
                        title="Clear all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/40 hover:text-white transition-colors lg:hidden"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-6 h-6 text-white/20" />
                        </div>
                        <p className="text-white/40 text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {notifications.map((notif, i) => (
                            <div
                                key={notif.id || i}
                                className={cn(
                                    "p-4 flex gap-4 transition-colors group/item relative",
                                    !notif.metadata?.isRead ? "bg-white/5" : "hover:bg-white/5"
                                )}
                            >
                                <div className="mt-1">{getIcon(notif.type, notif.priority)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="text-sm font-medium text-white truncate">{notif.title}</h4>
                                        {!notif.metadata?.isRead && (
                                            <button
                                                onClick={() => onMarkAsRead(notif.id)}
                                                className="opacity-0 group-hover/item:opacity-100 p-1 rounded-md bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
                                                title="Mark as read"
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{notif.message}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] uppercase font-bold text-white/20">
                                            {notif.businessUnit}
                                        </span>
                                        <span className="text-[10px] text-white/20">•</span>
                                        <span className="text-[10px] text-white/40">
                                            {notif.metadata?.createdAt ? formatDistanceToNow(new Date(notif.metadata.createdAt)) + ' ago' : 'Just now'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-white/10 text-center">
                    <button className="text-xs text-[#F2B94B] font-medium hover:underline">
                        View All Activity
                    </button>
                </div>
            )}
        </motion.div>
    );
}
