"use client"



import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Phone, IndianRupee, MoreHorizontal, FileText, User, Users } from "lucide-react"
import { format } from "date-fns"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GardenBookingCardProps {
    booking: any
    onEdit?: (booking: any) => void
    onDelete?: (booking: any) => void
    onViewBill?: (booking: any) => void
}

export function GardenBookingCard({ booking, onEdit, onDelete, onViewBill }: GardenBookingCardProps) {
    const startDate = new Date(booking.startDate)
    const endDate = new Date(booking.endDate)

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed': return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            case 'pending': return "text-amber-400 border-amber-500/30 bg-amber-500/10"
            case 'completed': return "text-indigo-400 border-indigo-500/30 bg-indigo-500/10"
            case 'cancelled': return "text-red-400 border-red-500/30 bg-red-500/10"
            default: return "text-zinc-400 border-zinc-700 bg-zinc-800/50"
        }
    }

    const getPaymentStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return "text-emerald-400 border-emerald-500/30"
            case 'partial': return "text-amber-400 border-amber-500/30"
            case 'pending': return "text-red-400 border-red-500/30"
            default: return "text-zinc-400 border-zinc-700"
        }
    }

    const getEventTypeColor = (eventType: string) => {
        switch (eventType.toLowerCase()) {
            case 'marriage': return "text-pink-300 border-pink-500/30 bg-pink-500/10"
            case 'reception': return "text-purple-300 border-purple-500/30 bg-purple-500/10"
            case 'birthday': return "text-amber-300 border-amber-500/30 bg-amber-500/10"
            case 'engagement': return "text-rose-300 border-rose-500/30 bg-rose-500/10"
            case 'corporate': return "text-blue-300 border-blue-500/30 bg-blue-500/10"
            default: return "text-zinc-300 border-zinc-700 bg-zinc-800/50"
        }
    }

    return (
        <div className="relative bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-300 group shadow-lg shadow-black/40">
            {/* Header Row */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-white text-lg tracking-tight truncate" title={booking.customerName}>
                            {booking.customerName}
                        </h3>
                        {booking.eventType.toLowerCase() === 'marriage' && <span className="text-base animate-pulse">💍</span>}
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                        <Badge
                            variant="outline"
                            className={`capitalize text-[10px] px-2 h-5 border bg-white/5 ${getStatusStyle(booking.status)}`}
                        >
                            {booking.status}
                        </Badge>
                        <div className="bg-white/5 px-2 py-0.5 rounded text-zinc-300 border border-white/5 capitalize text-[11px] font-medium">
                            {booking.eventType}
                        </div>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full"
                            aria-label="More options"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200">
                        <DropdownMenuItem onClick={() => onEdit?.(booking)} className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2.5">
                            Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewBill?.(booking)} className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2.5">
                            View Bill / Payments
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete?.(booking)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10 py-2.5"
                        >
                            Delete Booking
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-3 pt-2">
                {/* Customer Info */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 text-xs font-bold rounded-full bg-white/5 text-emerald-400 border border-white/10 flex items-center justify-center shrink-0">
                        {booking.customerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center text-sm text-zinc-300">
                            <Phone className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                            <span className="truncate">{booking.customerMobile}</span>
                        </div>
                        <div className="flex items-center text-sm text-zinc-300 mt-1">
                            <Calendar className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                            <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
                        </div>
                    </div>
                </div>

                {/* Date/Time Detail & Guest Count */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div className="flex items-center text-xs text-zinc-400">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
                        <span>{format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}</span>
                    </div>
                    {booking.guestCount > 0 && (
                        <div className="flex items-center justify-end text-xs text-zinc-400">
                            <Users className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
                            <span>{booking.guestCount} guests</span>
                        </div>
                    )}
                </div>

                {/* Notes */}
                {booking.notes && (
                    <div className="text-xs text-zinc-500 italic truncate pt-1">
                        "{booking.notes}"
                    </div>
                )}
            </div>

            {/* Finance Footer */}
            <div className="mt-4 pt-3 border-t border-white/5">
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Total Amount</span>
                        <span className="font-bold text-white text-base">₹{booking.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Status</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${getPaymentStatusStyle(booking.paymentStatus)} bg-transparent`}>
                                {booking.paymentStatus}
                            </span>
                        </div>
                        {booking.remainingBalance > 0 && (
                            <div className="text-xs font-medium text-red-400 flex items-center">
                                Due: ₹{booking.remainingBalance.toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

