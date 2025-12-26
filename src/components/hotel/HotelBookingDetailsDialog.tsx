"use client";

import { useState } from "react";
import { HotelBooking } from "@/actions/hotel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndianRupee, Calendar, Users, Phone, Mail, IdCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HotelBookingDetailsDialogProps = {
  booking: HotelBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn?: (bookingId: string) => void;
  onCheckOut?: (bookingId: string) => void;
  onAddPayment?: (bookingId: string) => void;
};

export default function HotelBookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onCheckIn,
  onCheckOut,
  onAddPayment
}: HotelBookingDetailsDialogProps) {
  if (!booking) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-[#EDEBFF]/30 text-[#6D5DFB]">Confirmed</Badge>;
      case "checked-in":
        return <Badge className="bg-[#BBF7D0] text-green-800">Checked In</Badge>;
      case "checked-out":
        return <Badge className="bg-[#F1F5F9] text-[#111827]">Checked Out</Badge>;
      case "cancelled":
        return <Badge className="bg-[#FEE2E2] text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-[#F1F5F9] text-[#111827]">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-[#BBF7D0] text-green-800">Paid</Badge>;
      case "partial":
        return <Badge className="bg-[#F59E0B]/10 text-[#F59E0B]800">Partial</Badge>;
      case "pending":
        return <Badge className="bg-[#FEE2E2] text-red-800">Pending</Badge>;
      default:
        return <Badge className="bg-[#F1F5F9] text-[#111827]">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Booking Details</span>
            <div className="flex gap-2">
              {getStatusBadge(booking.status)}
              {getPaymentStatusBadge(booking.paymentStatus)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Guest Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Name:</span>
                <span>{booking.guestName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{booking.customerMobile}</span>
              </div>
              {booking.guestEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{booking.guestEmail}</span>
                </div>
              )}
              {/* ID proof not available in HotelBooking type */}
            </div>
          </div>

          {/* Booking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Booking Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Room:</span>
                <span>Room {booking.roomNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{booking.adults} Adults, {booking.children} Children</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                <span>Total: ₹{booking.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                <span>Paid: ₹{booking.paidAmount?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                <span>Remaining: ₹{booking.remainingBalance?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment History</h3>
          {booking.payments && booking.payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {booking.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {payment.amount?.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{payment.method || 'N/A'}</TableCell>
                    <TableCell>{payment.receiptNumber || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-[#9CA3AF]">
              No payment records found
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onAddPayment && (
            <Button 
              variant="outline" 
              onClick={() => onAddPayment(booking.id!)}
            >
              Add Payment
            </Button>
          )}
          {booking.status === "confirmed" && onCheckIn && (
            <Button 
              onClick={() => onCheckIn(booking.id!)}
            >
              Check In Guest
            </Button>
          )}
          {booking.status === "checked-in" && onCheckOut && (
            <Button 
              onClick={() => onCheckOut(booking.id!)}
            >
              Check Out Guest
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

