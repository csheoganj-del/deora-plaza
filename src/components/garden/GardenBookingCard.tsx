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
            case 'confirmed': return "bg-[#BBF7D0] text-emerald-800 border-emerald-200"
            case 'pending': return "bg-[#F59E0B]/10 text-[#F59E0B]800 border-[#F59E0B]/20/20200"
            case 'completed': return "bg-[#EDEBFF]/30 text-[#6D5DFB] border-[#EDEBFF]/40"
            case 'cancelled': return "bg-[#FEE2E2] text-red-800 border-red-200"
            default: return "bg-[#F1F5F9] text-[#111827] border-[#E5E7EB]"
        }
    }

    const getPaymentStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return "text-[#22C55E] bg-[#DCFCE7] border-[#BBF7D0]"
            case 'partial': return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#FDE68A]"
            case 'pending': return "text-[#EF4444] bg-[#FEE2E2] border-[#FECACA]"
            default: return "text-[#6B7280] bg-[#F8FAFC]"
        }
    }

    const getEventTypeColor = (eventType: string) => {
        switch (eventType.toLowerCase()) {
            case 'marriage': return "bg-[#FBCFE8] text-pink-800"
            case 'reception': return "bg-[#EDEBFF] text-purple-800"
            case 'birthday': return "bg-[#F59E0B]/10 text-[#F59E0B]800"
            case 'engagement': return "bg-[#FEE2E2] text-rose-800"
            case 'corporate': return "bg-[#EDEBFF]/30 text-[#6D5DFB]"
            default: return "bg-[#F1F5F9] text-[#111827]"
        }
    }

    return (
        <div className="premium-card">
            <div className="p-8 border-b border-[#E5E7EB] p-3 sm:p-4 bg-gradient-to-r from-[#DCFCE7] to-teal-50 border-b border-[#F1F5F9] pb-2 sm:pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                            <Badge 
                                variant="outline" 
                                className={`capitalize text-xs sm:text-sm ${getStatusStyle(booking.status)}`}
                                aria-label={`Status: ${booking.status}`}
                            >
                                {booking.status}
                            </Badge>
                            <Badge 
                                className={`text-xs sm:text-sm ${getEventTypeColor(booking.eventType)}`}
                                aria-label={`Event type: ${booking.eventType}`}
                            >
                                {booking.eventType}
                            </Badge>
                        </div>
                        <h3 className="font-bold text-base sm:text-lg text-[#111827] leading-tight truncate" title={booking.customerName}>
                            {booking.customerName}
                        </h3>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-[#9CA3AF] hover:text-[#111827]"
                                aria-label="More options"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(booking)}>
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewBill?.(booking)}>
                                View Bill / Payments
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete?.(booking)}
                                className="text-[#EF4444] focus:text-[#DC2626] focus:bg-[#FEE2E2]"
                            >
                                Delete Booking
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="p-8 p-3 sm:p-4 space-y-2 sm:space-y-3 flex-grow">
                {/* Customer Info */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 sm:h-10 w-8 sm:w-10 text-xs font-bold rounded-full bg-[#EDEBFF] text-[#5B4EE5] flex items-center justify-center shrink-0" aria-hidden="true">
                        {booking.customerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-[#111827] truncate text-sm sm:text-base">{booking.customerName}</p>
                        <div className="flex items-center text-xs sm:text-sm text-[#9CA3AF]">
                            <Phone className="h-3 w-3 mr-1" aria-hidden="true" />
                            <span className="truncate">{booking.customerMobile}</span>
                        </div>
                    </div>
                </div>

                {/* Date/Time */}
                <div className="space-y-1.5 pt-1 sm:pt-2">
                    <div className="flex items-center text-sm text-[#111827]">
                        <Calendar className="h-4 w-4 mr-2 text-[#9CA3AF]" aria-hidden="true" />
                        <span className="font-medium">{format(startDate, "EEE, MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-[#9CA3AF]">
                        <Clock className="h-4 w-4 mr-2 text-[#9CA3AF]" aria-hidden="true" />
                        <span>
                            {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                        </span>
                    </div>
                </div>

                {/* Guest Count */}
                {booking.guestCount > 0 && (
                    <div className="flex items-center text-xs sm:text-sm text-[#6B7280] border-t border-[#F1F5F9] pt-1 sm:pt-2 mt-1 sm:mt-2">
                        <Users className="h-4 w-4 mr-2 text-[#9CA3AF]" aria-hidden="true" />
                        <span className="font-medium">{booking.guestCount} guests</span>
                    </div>
                )}

                {/* Notes */}
                {booking.notes && (
                    <div className="text-xs sm:text-sm text-[#6B7280] border-t border-[#F1F5F9] pt-1 sm:pt-2 mt-1 sm:mt-2">
                        <p className="truncate" title={booking.notes}>{booking.notes}</p>
                    </div>
                )}
            </div>

            <div className="p-8 border-t border-[#E5E7EB] p-3 sm:p-4 pt-0">
                <div className="w-full bg-[#F8FAFC] rounded-lg p-2 sm:p-3 border border-[#F1F5F9]">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[#9CA3AF] font-medium uppercase">Total Amount</span>
                        <span className="font-bold text-[#111827] text-sm sm:text-base">₹{booking.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[#9CA3AF] font-medium uppercase">Payment</span>
                        <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 sm:px-2 py-0 h-4 sm:h-5 ${getPaymentStatusStyle(booking.paymentStatus)}`}
                            aria-label={`Payment status: ${booking.paymentStatus}`}
                        >
                            {booking.paymentStatus}
                        </Badge>
                    </div>
                    {booking.remainingBalance > 0 && (
                        <div className="text-xs text-[#EF4444] text-right mt-1 font-medium">
                            Due: ₹{booking.remainingBalance.toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

