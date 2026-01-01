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
  XCircle,
  Bed
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RecordPaymentDialog } from "@/components/hotel/RecordPaymentDialog"
import { printHotelReceipt } from "@/lib/print-utils"
import RoomServiceDialogFixed from "./RoomServiceDialogFixed"

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
  onUpdate?: () => void
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

  if (!booking) return null

  const startDate = new Date(booking.startDate)
  const endDate = new Date(booking.endDate)
  const createdAt = new Date(booking.createdAt)

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-[#DCFCE7]0" />
      case 'checked-in': return <CheckCircle className="h-4 w-4 text-[#6D5DFB]" />
      case 'checked-out': return <CheckCircle className="h-4 w-4 text-[#EDEBFF]0" />
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

  const calculateNights = () => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-label="Booking details">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold">
                  {booking.guestName || 'Guest'}
                </DialogTitle>
                <p className="text-[#9CA3AF]">Room {booking.roomNumber || 'N/A'}</p>
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
              <FileText className="h-4 w-4 mr-2" /> Booking Details
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
            <Button
              variant={activeTab === "services" ? "default" : "ghost"}
              className="rounded-none px-3 sm:px-4 py-2 text-sm sm:text-base"
              onClick={() => setActiveTab("services")}
              role="tab"
              aria-selected={activeTab === "services"}
              aria-controls="services-panel"
            >
              <Bed className="h-4 w-4 mr-2" /> Room Services
            </Button>
          </div>

          <div id="details-panel" role="tabpanel" aria-labelledby="details-tab" className={activeTab !== "details" ? "hidden" : ""}>
            <div className="space-y-4 sm:space-y-6 pt-4">
              <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                  <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Guest Information
                  </h2>
                </div>
                <div className="p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Name</p>
                      <p className="font-medium">{booking.guestName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Mobile</p>
                      <p className="font-medium">{booking.customerMobile}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                  <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Stay Details
                  </h2>
                </div>
                <div className="p-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Check-in</p>
                      <p className="font-medium">
                        {format(startDate, "PPP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Check-out</p>
                      <p className="font-medium">
                        {format(endDate, "PPP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Nights</p>
                      <p className="font-medium">{calculateNights()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Room</p>
                      <p className="font-medium">{booking.roomNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Guests</p>
                      <p className="font-medium">
                        {booking.adults || 1} {booking.adults === 1 ? 'Adult' : 'Adults'}
                        {booking.children ? `, ${booking.children} ${booking.children === 1 ? 'Child' : 'Children'}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9CA3AF]">Booking Date</p>
                      <p className="font-medium">
                        {format(createdAt, "PPPp")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                  <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    Billing Information
                  </h2>
                </div>
                <div className="p-8 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Room Charges ({calculateNights()} nights)</span>
                      <span>₹{booking.basePrice?.toLocaleString() || '0'}</span>
                    </div>
                    
                    {booking.discountPercent > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#9CA3AF]">
                          Discount ({booking.discountPercent}%)
                        </span>
                        <span className="text-[#22C55E]">
                          -₹{((booking.basePrice * booking.discountPercent) / 100).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {booking.gstEnabled && booking.gstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#9CA3AF]">
                          GST ({booking.gstPercentage}%)
                        </span>
                        <span>+₹{booking.gstAmount?.toLocaleString() || '0'}</span>
                      </div>
                    )}

                    <Separator className="my-2" />

                    <div className="flex justify-between font-semibold">
                      <span>Total Amount</span>
                      <span>₹{booking.totalAmount?.toLocaleString() || '0'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Paid</span>
                      <span>₹{booking.totalPaid?.toLocaleString() || '0'}</span>
                    </div>

                    <div className="flex justify-between font-medium">
                      <span>Remaining Balance</span>
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

              {booking.notes && (
                <div className="premium-card">
                  <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827]">Additional Information</h2>
                  </div>
                  <div className="p-8">
                    <p className="bg-[#F8FAFC] p-3 rounded-lg">{booking.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div id="payments-panel" role="tabpanel" aria-labelledby="payments-tab" className={activeTab !== "payments" ? "hidden" : ""}>
            <div className="space-y-4 pt-4">
              <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                  <h2 className="text-3xl font-bold text-[#111827]">Payment History</h2>
                </div>
                <div className="p-8">
                  {booking.payments && booking.payments.length > 0 ? (
                    <div className="space-y-3">
                      {booking.payments.map((payment: any) => (
                        <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">₹{payment.amount?.toLocaleString()}</span>
                              <Badge variant="secondary">{payment.type}</Badge>
                            </div>
                            <p className="text-sm text-[#9CA3AF] mt-1">
                              {format(new Date(payment.date || payment.createdAt), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.receiptNumber && (
                              <p className="text-sm text-[#9CA3AF]">Receipt #{payment.receiptNumber}</p>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => printHotelReceipt(
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
                <Button 
                  variant="outline" 
                  onClick={() => setIsRecordPaymentOpen(true)}
                  aria-label="Record a new payment"
                >
                  Record Payment
                </Button>
                <Button
                  aria-label="Print receipt"
                  onClick={() => {
                    if (booking.paymentStatus === "completed") {
                      printHotelReceipt(booking, "full");
                    } else {
                      alert("Final receipt can only be printed when payment is complete.");
                    }
                  }}
                  disabled={booking.paymentStatus !== "completed"}
                >
                  Print Final Receipt
                </Button>
              </div>
            </div>
          </div>

          <div id="services-panel" role="tabpanel" aria-labelledby="services-tab" className={activeTab !== "services" ? "hidden" : ""}>
            <div className="space-y-4 pt-4">
              <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                  <h2 className="text-3xl font-bold text-[#111827]">Room Services</h2>
                </div>
                <div className="p-8">
                  {booking.roomServices && booking.roomServices.length > 0 ? (
                    <div className="space-y-3">
                      {booking.roomServices.map((service: any) => (
                        <div key={service.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              <p className="text-sm text-[#9CA3AF]">
                                {format(new Date(service.createdAt), "MMM d, yyyy h:mm a")}
                              </p>
                            </div>
                            <span className="font-medium">₹{service.amount?.toLocaleString()}</span>
                          </div>
                          {service.items && service.items.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <h5 className="text-sm font-medium mb-1">Items:</h5>
                              <ul className="space-y-1">
                                {service.items.map((item: any) => (
                                  <li key={item.id} className="flex justify-between text-sm">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span>₹{item.price.toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bed className="h-12 w-12 text-[#9CA3AF] mx-auto mb-3" aria-hidden="true" />
                      <h3 className="text-lg font-medium text-[#111827] mb-1">No room services</h3>
                      <p className="text-[#9CA3AF]">No room services have been ordered yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setIsRoomServiceOpen(true)}
                  aria-label="Order room service"
                >
                  Order Room Service
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t mt-4">
            <Button 
              variant="outline" 
              onClick={() => onDelete?.(booking)} 
              aria-label={`Delete booking for ${booking.guestName || 'guest'}`}
            >
              Delete Booking
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onEdit?.(booking)} 
              aria-label={`Edit booking for ${booking.guestName || 'guest'}`}
            >
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
            printHotelReceipt(
              { ...updatedBooking, receiptNumber: latestPayment.receiptNumber },
              latestPayment.type === "advance" ? "advance" : "full"
            )
            // Refresh to show updated data
            onUpdate?.()
          }
        }}
      />

      {isRoomServiceOpen && booking.roomNumber && (
        <RoomServiceDialogFixed
          isOpen={isRoomServiceOpen}
          onClose={() => setIsRoomServiceOpen(false)}
          room={{
            id: booking.roomId,
            number: booking.roomNumber
          }}
        />
      )}
    </>
  )
}

