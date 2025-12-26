"use client";

import { useState } from "react";
import { HotelBooking } from "@/actions/hotel";
;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, IndianRupee, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HotelBookingsSectionProps = {
  bookings: HotelBooking[];
  onCheckIn: (bookingId: string) => void;
  onCheckOut: (bookingId: string) => void;
  onViewDetails: (booking: HotelBooking) => void;
};

export default function HotelBookingsSection({
  bookings,
  onCheckIn,
  onCheckOut,
  onViewDetails
}: HotelBookingsSectionProps) {
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "completed">("all");

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

  const filteredBookings = bookings.filter(booking => {
    if (filter === "active") {
      return booking.status === "confirmed" || booking.status === "checked-in";
    }
    if (filter === "upcoming") {
      return booking.status === "confirmed" && new Date(booking.startDate) > new Date();
    }
    if (filter === "completed") {
      return booking.status === "checked-out";
    }
    return true;
  });

  return (
    <div className="premium-card">
      <div className="p-8 border-b border-[#E5E7EB]">
        <h2 className="text-3xl font-bold text-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Hotel Bookings
          </div>
          <div className="flex gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button 
              variant={filter === "active" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button 
              variant={filter === "upcoming" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </Button>
            <Button 
              variant={filter === "completed" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("completed")}
            >
              Completed
            </Button>
          </div>
        </h2>
      </div>
      <div className="p-8">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-[#9CA3AF]">
            No bookings found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.guestName}</div>
                      <div className="text-sm text-[#9CA3AF]">{booking.customerMobile}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">Room {booking.roomNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                      <div className="text-[#9CA3AF]">to {new Date(booking.endDate).toLocaleDateString()}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {(booking.adults ?? 0) + (booking.children ?? 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {booking.totalAmount?.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">
                      Paid: ₹{booking.paidAmount?.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(booking.status)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(booking.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewDetails(booking)}
                      >
                        View
                      </Button>
                      {booking.status === "confirmed" && (
                        <Button 
                          size="sm" 
                          onClick={() => onCheckIn(booking.id!)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                      )}
                      {booking.status === "checked-in" && (
                        <Button 
                          size="sm" 
                          onClick={() => onCheckOut(booking.id!)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Check Out
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

