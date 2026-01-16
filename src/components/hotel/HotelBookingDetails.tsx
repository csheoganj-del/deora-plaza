"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  Phone,
  IndianRupee,
  User,
  Users,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle,
  Bed,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RecordPaymentDialog } from "@/components/hotel/RecordPaymentDialog"
import { printHotelReceipt } from "@/lib/print-utils"
import RoomServiceDialog from "./RoomServiceDialog"
import { GlassButton } from "@/components/ui/glass/GlassFormComponents"
import { PremiumLiquidGlass } from "@/components/ui/glass/premium-liquid-glass"
import { cn } from "@/lib/utils"

interface Payment {
  id: string
  amount: number
  date: string
  type: string
  receiptNumber: number
}

interface HotelBookingDetailsProps {
  booking: any
  isOpen: boolean
  onClose: () => void
  onEdit?: (booking: any) => void
  onDelete?: (booking: any) => void
  onUpdate?: (updatedBooking?: any) => void
}

export function HotelBookingDetails({
  booking,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdate
}: HotelBookingDetailsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "payments" | "services">("details")
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
  const [isRoomServiceOpen, setIsRoomServiceOpen] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  // Fetch settings on mount
  useEffect(() => {
    if (isOpen) {
      import("@/actions/businessSettings").then(mod => {
        mod.getBusinessSettings().then(data => {
          if (data) setSettings(data)
        })
      })
    }
  }, [isOpen])

  if (!booking) return null

  const startDate = new Date(booking.startDate)
  const endDate = new Date(booking.endDate)
  const createdAt = new Date(booking.createdAt)

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'checked-in': return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'checked-out': return <CheckCircle className="h-4 w-4 text-white/50" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-rose-400" />
      default: return <AlertCircle className="h-4 w-4 text-amber-400" />
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case 'checked-in': return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case 'checked-out': return "bg-white/5 text-white/50 border-white/10"
      case 'cancelled': return "bg-rose-500/10 text-rose-400 border-rose-500/20"
      default: return "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }
  }

  const getPaymentStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      case 'partial': return "text-amber-400 bg-amber-500/10 border-amber-500/20"
      case 'pending': return "text-rose-400 bg-rose-500/10 border-rose-500/20"
      default: return "text-white/50 bg-white/5 border-white/10"
    }
  }

  const calculateNights = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 text-white p-0 gap-0 shadow-2xl" aria-label="Booking details">
          <DialogHeader className="p-6 border-b border-white/10 sticky top-0 bg-[#1a1a1a]/95 backdrop-blur-xl z-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
                  {booking.guestName || 'Guest'}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1 text-sm text-white/50">
                    <Bed className="w-3 h-3" /> Room {booking.roomNumber || 'N/A'}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-sm text-white/50">ID: {booking.id.slice(0, 8)}</span>
                </div>
              </div>
              <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm", getStatusBadgeStyle(booking.status))}>
                {getStatusIcon(booking.status)}
                <span className="text-sm font-medium capitalize">{booking.status}</span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex border-b border-white/10 bg-white/5 px-6">
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "details"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <FileText className="h-4 w-4" /> Booking Details
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "payments"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <CreditCard className="h-4 w-4" /> Payments
              {booking.payments && booking.payments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-white text-[10px]">
                  {booking.payments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "services"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <Bed className="h-4 w-4" /> Room Services
            </button>
          </div>

          <div className="p-6">
            {/* DETAILS PANEL */}
            <div className={activeTab !== "details" ? "hidden" : "space-y-6"}>

              {/* Guest Info & Stay Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PremiumLiquidGlass title="Guest Information" className="h-full">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Name</p>
                        <p className="font-medium text-white">{booking.guestName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Mobile</p>
                        <p className="font-medium text-white">{booking.customerMobile || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Guests</p>
                        <p className="font-medium text-white">
                          {booking.adults || 1} Adult(s) {booking.children ? `, ${booking.children} Child(ren)` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </PremiumLiquidGlass>

                <PremiumLiquidGlass title="Stay Details" className="h-full">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Check-in</p>
                      <p className="font-medium text-white text-sm">{format(startDate, "MMM d, yyyy")}</p>
                      <p className="text-xs text-white/30">{format(startDate, "h:mm a")}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Check-out</p>
                      <p className="font-medium text-white text-sm">{format(endDate, "MMM d, yyyy")}</p>
                      <p className="text-xs text-white/30">{format(endDate, "h:mm a")}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Duration</p>
                      <p className="font-medium text-white">{calculateNights()} Night(s)</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Booked On</p>
                      <p className="font-medium text-white text-sm">{format(createdAt, "MMM d")}</p>
                    </div>
                  </div>
                </PremiumLiquidGlass>
              </div>

              {/* Billing Info */}
              <PremiumLiquidGlass title="Billing Summary">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                    <span className="text-white/60">Room Charges ({calculateNights()} nights)</span>
                    <span className="font-medium text-white">₹{booking.basePrice?.toLocaleString() || '0'}</span>
                  </div>

                  {booking.discountPercent > 0 && (
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                      <span className="text-white/60">Discount ({booking.discountPercent}%)</span>
                      <span className="text-emerald-400">-₹{((booking.basePrice * booking.discountPercent) / 100).toLocaleString()}</span>
                    </div>
                  )}

                  {booking.gstEnabled && booking.gstAmount > 0 && (
                    <div className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                      <span className="text-white/60">GST ({booking.gstPercentage}%)</span>
                      <span className="text-white">+₹{booking.gstAmount?.toLocaleString() || '0'}</span>
                    </div>
                  )}

                  <div className="h-px bg-white/10 my-2" />

                  <div className="flex justify-between items-center p-2">
                    <span className="text-lg font-bold text-white">Total Amount</span>
                    <span className="text-2xl font-bold text-white">₹{booking.totalAmount?.toLocaleString() || '0'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-400/70 uppercase">Paid Amount</p>
                      <p className="text-lg font-bold text-emerald-400">₹{(booking.paidAmount || booking.totalPaid || 0).toLocaleString()}</p>
                    </div>
                    <div className={cn("p-3 rounded-lg border",
                      booking.remainingBalance > 0
                        ? "bg-rose-500/10 border-rose-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20"
                    )}>
                      <p className={cn("text-xs uppercase", booking.remainingBalance > 0 ? "text-rose-400/70" : "text-emerald-400/70")}>
                        {booking.remainingBalance > 0 ? "Balance Due" : "Settled"}
                      </p>
                      <p className={cn("text-lg font-bold", booking.remainingBalance > 0 ? "text-rose-400" : "text-emerald-400")}>
                        ₹{booking.remainingBalance?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </PremiumLiquidGlass>

              {booking.notes && (
                <div className="p-4 rounded-xl border border-dashed border-white/20 bg-white/5">
                  <h4 className="text-xs font-bold text-white/40 uppercase mb-2">Additional Notes</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* PAYMENTS PANEL */}
            <div className={activeTab !== "payments" ? "hidden" : "space-y-6"}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Payment History</h3>
                <div className="flex gap-2">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsRecordPaymentOpen(true)}
                    icon={<CreditCard className="w-4 h-4" />}
                  >
                    Record Payment
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    disabled={!booking.advancePayment && (!booking.payments || !booking.payments.some((p: any) => p.type === 'advance'))}
                    onClick={() => printHotelReceipt(booking, settings, 'advance')}
                    icon={<Printer className="w-4 h-4" />}
                  >
                    Advance Receipt
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    disabled={booking.paymentStatus !== "completed"}
                    onClick={() => printHotelReceipt(booking, settings, "full")}
                    icon={<Printer className="w-4 h-4" />}
                  >
                    Full Receipt
                  </GlassButton>
                </div>
              </div>

              {booking.payments && booking.payments.length > 0 ? (
                <div className="space-y-3">
                  {booking.payments.map((payment: any) => (
                    <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <IndianRupee className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">₹{payment.amount?.toLocaleString()}</span>
                            <Badge variant="secondary" className="bg-white/10 text-white/70 hover:bg-white/20 capitalize">{payment.type}</Badge>
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">
                            {format(new Date(payment.date || payment.createdAt), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 sm:mt-0">
                        {payment.receiptNumber && (
                          <span className="text-xs font-mono text-white/30 bg-black/20 px-2 py-1 rounded">
                            #{payment.receiptNumber}
                          </span>
                        )}
                        <GlassButton
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => printHotelReceipt(
                            { ...booking, receiptNumber: payment.receiptNumber },
                            settings,
                            payment.type === "advance" ? "advance" : "full"
                          )}
                          icon={<Printer className="w-3 h-3" />}
                        >
                          Print
                        </GlassButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                  <CreditCard className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-white mb-1">No payments recorded</h3>
                  <p className="text-white/40 text-sm">Add a payment to see history here.</p>
                </div>
              )}
            </div>

            {/* SERVICES PANEL */}
            <div className={activeTab !== "services" ? "hidden" : "space-y-6"}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Room Services</h3>
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRoomServiceOpen(true)}
                  icon={<Bed className="w-4 h-4" />}
                >
                  Order Service
                </GlassButton>
              </div>

              {booking.roomServiceCharges && booking.roomServiceCharges.length > 0 ? (
                <div className="space-y-3">
                  {booking.roomServiceCharges.map((service: any) => (
                    <div key={service.orderId} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-white">Order #{service.orderNumber}</h4>
                          <p className="text-xs text-white/40">
                            {format(new Date(service.createdAt), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                        <span className="font-bold text-white">₹{service.amount?.toLocaleString()}</span>
                      </div>

                      {service.items && service.items.length > 0 && (
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-white/40 uppercase mb-2">Items Ordered</p>
                          <ul className="space-y-2">
                            {service.items.map((item: any, idx: number) => (
                              <li key={idx} className="flex justify-between text-sm">
                                <span className="text-white/70">{item.quantity}x {item.name}</span>
                                <span className="text-white/50">₹{item.price.toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                  <Bed className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-white mb-1">No services ordered</h3>
                  <p className="text-white/40 text-sm">Order room service to see them here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-white/10 bg-white/5 flex gap-3 justify-end sticky bottom-0 z-10 backdrop-blur-xl">
            <GlassButton variant="ghost" onClick={onClose}>
              Close
            </GlassButton>
            <GlassButton variant="secondary" onClick={() => onEdit?.(booking)}>
              Edit Details
            </GlassButton>
            <GlassButton variant="danger" onClick={() => onDelete?.(booking)}>
              Delete Booking
            </GlassButton>
          </div>

        </DialogContent>
      </Dialog>

      <RecordPaymentDialog
        booking={booking}
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={(updatedBooking) => {
          if (updatedBooking && updatedBooking.payments && updatedBooking.payments.length > 0) {
            const latestPayment = updatedBooking.payments[updatedBooking.payments.length - 1]
            printHotelReceipt(
              { ...updatedBooking, receiptNumber: latestPayment.receiptNumber },
              settings,
              latestPayment.type === "advance" ? "advance" : "full"
            )
            onUpdate?.(updatedBooking)
          }
        }}
      />

      {isRoomServiceOpen && booking.roomNumber && (
        <RoomServiceDialog
          isOpen={isRoomServiceOpen}
          onClose={() => {
            setIsRoomServiceOpen(false);
            onUpdate?.(); // Refresh booking data to show new room service orders
          }}
          room={{
            id: booking.roomId,
            number: booking.roomNumber
          }}
        />
      )}

    </>
  )
}

