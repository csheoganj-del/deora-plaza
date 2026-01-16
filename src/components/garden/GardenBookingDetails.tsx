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
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RecordPaymentDialog } from "@/components/garden/RecordPaymentDialog"
import { printGardenReceipt } from "@/lib/print-utils"

interface Payment {
  id: string
  amount: number
  date: string
  type: string
  receiptNumber: number
}

interface GardenBookingDetailsProps {
  booking: any
  isOpen: boolean
  onClose: () => void
  onEdit?: (booking: any) => void
  onDelete?: (booking: any) => void
}

export function GardenBookingDetails({
  booking,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: GardenBookingDetailsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "payments">("details")
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false)
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-amber-400" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-400" />
      default: return <AlertCircle className="h-4 w-4 text-zinc-400" />
    }
  }

  const getPaymentStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      case 'partial': return "text-amber-400 border-amber-500/30 bg-amber-500/10"
      case 'pending': return "text-red-400 border-red-500/30 bg-red-500/10"
      default: return "text-zinc-400 border-zinc-700 bg-zinc-800/50"
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/90 border-white/10 text-white backdrop-blur-xl" aria-label="Booking details">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-white">{booking.customerName}</DialogTitle>
                <p className="text-zinc-400 capitalize">{booking.eventType} Event</p>
              </div>
              <Badge variant="outline" className={`flex items-center gap-1 text-base py-1 w-fit bg-white/5 border-white/10 text-white`}>
                {getStatusIcon(booking.status)}
                <span className="sr-only">Status:</span>
                {booking.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap border-b border-white/10 gap-1" role="tablist" aria-label="Booking details sections">
            <Button
              variant={activeTab === "details" ? "default" : "ghost"}
              className={`rounded-none px-3 sm:px-4 py-2 text-sm sm:text-base ${activeTab === "details" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
              onClick={() => setActiveTab("details")}
              role="tab"
              aria-selected={activeTab === "details"}
              aria-controls="details-panel"
            >
              <FileText className="h-4 w-4 mr-2" /> Event Details
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "ghost"}
              className={`rounded-none px-3 sm:px-4 py-2 text-sm sm:text-base ${activeTab === "payments" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
              onClick={() => setActiveTab("payments")}
              role="tab"
              aria-selected={activeTab === "payments"}
              aria-controls="payments-panel"
            >
              <CreditCard className="h-4 w-4 mr-2" /> Payments
              {booking.payments && booking.payments.length > 0 && (
                <Badge className="ml-2 bg-white/10 text-white text-xs hover:bg-white/20">
                  {booking.payments.length}
                </Badge>
              )}
            </Button>
          </div>

          <div id="details-panel" role="tabpanel" aria-labelledby="details-tab" className={activeTab !== "details" ? "hidden" : ""}>
            {activeTab === "details" && (
              <div className="space-y-4 sm:space-y-6 pt-4">
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-zinc-400" />
                      Customer Information
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-zinc-400">Name</p>
                        <p className="font-medium text-white text-lg">{booking.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Mobile</p>
                        <p className="font-medium text-white">{booking.customerMobile}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/5">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-zinc-400" />
                        Event Schedule
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-black/40 rounded-lg gap-3 border border-white/5">
                        <div className="text-center sm:text-left">
                          <p className="text-sm text-zinc-400">Start</p>
                          <p className="font-medium text-white">{format(startDate, "MMM d, yyyy")}</p>
                          <p className="text-sm text-zinc-300">{format(startDate, "h:mm a")}</p>
                        </div>
                        <Clock className="h-5 w-5 text-zinc-500" />
                        <div className="text-center sm:text-right">
                          <p className="text-sm text-zinc-400">End</p>
                          <p className="font-medium text-white">{format(endDate, "MMM d, yyyy")}</p>
                          <p className="text-sm text-zinc-300">{format(endDate, "h:mm a")}</p>
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      <div>
                        <p className="text-sm text-zinc-400 mb-1">Duration</p>
                        <p className="font-medium text-white">
                          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/5">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-zinc-400" />
                        Billing Summary
                      </h2>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Base Price</span>
                        <span className="text-white">₹{booking.basePrice?.toLocaleString()}</span>
                      </div>

                      {booking.discountPercent && booking.discountPercent > 0 && (
                        <div className="flex justify-between text-red-400">
                          <span>Discount ({booking.discountPercent}%)</span>
                          <span>-₹{(booking.basePrice * booking.discountPercent / 100).toLocaleString()}</span>
                        </div>
                      )}

                      {booking.gstEnabled && (
                        <div className="flex justify-between text-zinc-300">
                          <span>GST ({booking.gstPercentage}%)</span>
                          <span>₹{((booking.basePrice - (booking.basePrice * (booking.discountPercent || 0) / 100)) * booking.gstPercentage / 100).toLocaleString()}</span>
                        </div>
                      )}

                      <Separator className="bg-white/10" />

                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-white">Total Amount</span>
                        <span className="text-white">₹{booking.totalAmount?.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Total Paid</span>
                        <span className={booking.totalPaid >= booking.totalAmount ? "text-emerald-400" : "text-amber-400"}>
                          ₹{booking.totalPaid?.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Remaining Balance</span>
                        <span className={booking.remainingBalance > 0 ? "text-red-400" : "text-emerald-400"}>
                          ₹{booking.remainingBalance?.toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-2">
                        <Badge variant="outline" className={getPaymentStatusStyle(booking.paymentStatus)}>
                          <span className="sr-only">Payment Status:</span>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {(booking.guestCount > 0 || booking.notes) && (
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/5">
                      <h2 className="text-xl font-bold text-white">Additional Information</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      {booking.guestCount > 0 && (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Users className="h-5 w-5 text-zinc-500" />
                          <span>
                            <span className="font-medium text-white">{booking.guestCount}</span> guests expected
                          </span>
                        </div>
                      )}

                      {booking.notes && (
                        <div>
                          <p className="text-sm text-zinc-400 mb-1">Special Notes</p>
                          <p className="bg-black/40 p-3 rounded-lg text-zinc-300 border border-white/5 italic">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div id="payments-panel" role="tabpanel" aria-labelledby="payments-tab" className={activeTab !== "payments" ? "hidden" : ""}>
            {activeTab === "payments" && (
              <div className="space-y-4 pt-4">
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white">Payment History</h2>
                  </div>
                  <div className="p-6">
                    {booking.payments && booking.payments.length > 0 ? (
                      <div className="space-y-3">
                        {booking.payments.map((payment: Payment) => (
                          <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-white/5 bg-black/20 rounded-lg gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-lg">₹{payment.amount.toLocaleString()}</span>
                                <Badge variant="outline" className="bg-white/5 text-zinc-300 border-white/10 capitalize">{payment.type}</Badge>
                              </div>
                              <p className="text-sm text-zinc-500 mt-1">
                                {format(new Date(payment.date), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-zinc-500">#{payment.receiptNumber}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 bg-transparent"
                                onClick={async () => {
                                  const freshSettings = await (await import("@/actions/businessSettings")).getBusinessSettings();
                                  printGardenReceipt(
                                    { ...booking, receiptNumber: payment.receiptNumber },
                                    freshSettings || settings
                                  );
                                }}
                              >
                                Print
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-zinc-600 mx-auto mb-3" aria-hidden="true" />
                        <h3 className="text-lg font-medium text-white mb-1">No payments recorded</h3>
                        <p className="text-zinc-500">This booking has no payment history yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsRecordPaymentOpen(true)}
                    aria-label="Record a new payment"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/50 bg-transparent"
                  >
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                  <Button
                    aria-label="Print receipt"
                    className="bg-white/10 text-white hover:bg-white/20 border border-white/5"
                    onClick={async () => {
                      // ... logic remains same
                      if (booking.paymentStatus === "completed") {
                        const freshSettings = await (await import("@/actions/businessSettings")).getBusinessSettings();
                        printGardenReceipt(booking, freshSettings || settings);
                      } else {
                        alert("Final receipt can only be printed when payment is complete.");
                      }
                    }}
                    disabled={booking.paymentStatus !== "completed"}
                  >
                    Print Receipt
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-white/10 mt-4">
            <Button
              variant="ghost"
              onClick={() => onDelete?.(booking)}
              aria-label={`Delete booking for ${booking.customerName}`}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              Delete Booking
            </Button>
            <Button
              variant="ghost"
              onClick={() => onEdit?.(booking)}
              aria-label={`Edit booking for ${booking.customerName}`}
              className="text-white hover:bg-white/10"
            >
              Edit Details
            </Button>
            <Button onClick={onClose} aria-label="Close dialog" className="bg-white text-black hover:bg-zinc-200">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RecordPaymentDialog
        booking={booking}
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={(updatedBooking) => {
          console.log("Payment recorded successfully", updatedBooking)
          if (updatedBooking && updatedBooking.payments && updatedBooking.payments.length > 0) {
            const latestPayment = updatedBooking.payments[updatedBooking.payments.length - 1]
            // Print receipt automatically with fresh settings
            import("@/actions/businessSettings").then(mod => mod.getBusinessSettings()).then(freshSettings => {
              printGardenReceipt(
                { ...updatedBooking, receiptNumber: latestPayment.receiptNumber },
                freshSettings || settings
              )
            })
            // Refresh to show updated data
            window.location.reload()
          }
        }}
      />
    </>
  )
}

