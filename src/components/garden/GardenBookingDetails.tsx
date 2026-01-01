"use client"

import { useState } from "react"
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

  if (!booking) return null

  const startDate = new Date(booking.startDate)
  const endDate = new Date(booking.endDate)

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-[#DCFCE7]0" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-[#FEE2E2]0" />
      default: return <AlertCircle className="h-4 w-4 text-[#9CA3AF]" />
    }
  }

  const getPaymentStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return "text-[#22C55E] bg-[#DCFCE7]"
      case 'partial': return "text-[#F59E0B] bg-[#F59E0B]/10"
      case 'pending': return "text-[#EF4444] bg-[#FEE2E2]"
      default: return "text-[#6B7280] bg-[#F8FAFC]"
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-label="Booking details">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold">{booking.customerName}</DialogTitle>
                <p className="text-[#9CA3AF] capitalize">{booking.eventType} Event</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1 text-base py-1 w-fit">
                {getStatusIcon(booking.status)}
                <span className="sr-only">Status:</span>
                {booking.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap border-b gap-1" role="tablist" aria-label="Booking details sections">
            <Button
              variant={activeTab === "details" ? "default" : "ghost"}
              className="rounded-none px-3 sm:px-4 py-2 text-sm sm:text-base"
              onClick={() => setActiveTab("details")}
              role="tab"
              aria-selected={activeTab === "details"}
              aria-controls="details-panel"
            >
              <FileText className="h-4 w-4 mr-2" /> Event Details
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "ghost"}
              className="rounded-none px-3 sm:px-4 py-2 text-sm sm:text-base"
              onClick={() => setActiveTab("payments")}
              role="tab"
              aria-selected={activeTab === "payments"}
              aria-controls="payments-panel"
            >
              <CreditCard className="h-4 w-4 mr-2" /> Payments
              {booking.payments && booking.payments.length > 0 && (
                <Badge className="ml-2 bg-[#F1F5F9] text-[#111827] text-xs">
                  {booking.payments.length}
                </Badge>
              )}
            </Button>
          </div>

          <div id="details-panel" role="tabpanel" aria-labelledby="details-tab" className={activeTab !== "details" ? "hidden" : ""}>
            {activeTab === "details" && (
              <div className="space-y-4 sm:space-y-6 pt-4">
                <div className="premium-card">
                  <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </h2>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#9CA3AF]">Name</p>
                        <p className="font-medium">{booking.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#9CA3AF]">Mobile</p>
                        <p className="font-medium">{booking.customerMobile}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                      <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Event Schedule
                      </h2>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-[#F8FAFC] rounded-lg gap-3">
                        <div className="text-center sm:text-left">
                          <p className="text-sm text-[#9CA3AF]">Start Date & Time</p>
                          <p className="font-medium">{format(startDate, "EEE, MMM d, yyyy")}</p>
                          <p className="text-sm">{format(startDate, "h:mm a")}</p>
                        </div>
                        <Clock className="h-5 w-5 text-[#9CA3AF]" />
                        <div className="text-center sm:text-right">
                          <p className="text-sm text-[#9CA3AF]">End Date & Time</p>
                          <p className="font-medium">{format(endDate, "EEE, MMM d, yyyy")}</p>
                          <p className="text-sm">{format(endDate, "h:mm a")}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm text-[#9CA3AF] mb-2">Duration</p>
                        <p className="font-medium">
                          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                      <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                        <IndianRupee className="h-5 w-5" />
                        Billing Summary
                      </h2>
                    </div>
                    <div className="p-8 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#9CA3AF]">Base Price</span>
                        <span>₹{booking.basePrice?.toLocaleString()}</span>
                      </div>

                      {booking.discountPercent && booking.discountPercent > 0 && (
                        <div className="flex justify-between text-[#EF4444]">
                          <span>Discount ({booking.discountPercent}%)</span>
                          <span>-₹{(booking.basePrice * booking.discountPercent / 100).toLocaleString()}</span>
                        </div>
                      )}

                      {booking.gstEnabled && (
                        <div className="flex justify-between">
                          <span>GST ({booking.gstPercentage}%)</span>
                          <span>₹{((booking.basePrice - (booking.basePrice * (booking.discountPercent || 0) / 100)) * booking.gstPercentage / 100).toLocaleString()}</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span>₹{booking.totalAmount?.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#9CA3AF]">Total Paid</span>
                        <span className={booking.totalPaid >= booking.totalAmount ? "text-[#22C55E]" : "text-[#F59E0B]"}>
                          ₹{booking.totalPaid?.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#9CA3AF]">Remaining Balance</span>
                        <span className={booking.remainingBalance > 0 ? "text-[#EF4444]" : "text-[#22C55E]"}>
                          ₹{booking.remainingBalance?.toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-2">
                        <Badge className={getPaymentStatusStyle(booking.paymentStatus)}>
                          <span className="sr-only">Payment Status:</span>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {(booking.guestCount > 0 || booking.notes) && (
                  <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                      <h2 className="text-3xl font-bold text-[#111827]">Additional Information</h2>
                    </div>
                    <div className="p-8 space-y-4">
                      {booking.guestCount > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-[#9CA3AF]" />
                          <span>
                            <span className="font-medium">{booking.guestCount}</span> guests expected
                          </span>
                        </div>
                      )}

                      {booking.notes && (
                        <div>
                          <p className="text-sm text-[#9CA3AF] mb-1">Special Notes</p>
                          <p className="bg-[#F8FAFC] p-3 rounded-lg">{booking.notes}</p>
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
                <div className="premium-card">
                  <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827]">Payment History</h2>
                  </div>
                  <div className="p-8">
                    {booking.payments && booking.payments.length > 0 ? (
                      <div className="space-y-3">
                        {booking.payments.map((payment: Payment) => (
                          <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                                <Badge variant="secondary">{payment.type}</Badge>
                              </div>
                              <p className="text-sm text-[#9CA3AF] mt-1">
                                {format(new Date(payment.date), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-[#9CA3AF]">Receipt #{payment.receiptNumber}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printGardenReceipt(
                                  { ...booking, receiptNumber: payment.receiptNumber },
                                  payment.type === "advance" ? "advance" : "full"
                                )}
                              >
                                Print
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-[#9CA3AF] mx-auto mb-3" aria-hidden="true" />
                        <h3 className="text-lg font-medium text-[#111827] mb-1">No payments recorded</h3>
                        <p className="text-[#9CA3AF]">This booking has no payment history yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsRecordPaymentOpen(true)} aria-label="Record a new payment">
                    Record Payment
                  </Button>
                  <Button
                    aria-label="Print receipt"
                    onClick={() => {
                      if (booking.paymentStatus === "completed") {
                        printGardenReceipt(booking, "full");
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

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => onDelete?.(booking)} aria-label={`Delete booking for ${booking.customerName}`}>
              Delete Booking
            </Button>
            <Button variant="outline" onClick={() => onEdit?.(booking)} aria-label={`Edit booking for ${booking.customerName}`}>
              Edit Details
            </Button>
            <Button onClick={onClose} aria-label="Close dialog">Close</Button>
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
            // Print receipt automatically
            printGardenReceipt(
              { ...updatedBooking, receiptNumber: latestPayment.receiptNumber },
              latestPayment.type === "advance" ? "advance" : "full"
            )
            // Refresh to show updated data
            window.location.reload()
          }
        }}
      />
    </>
  )
}

