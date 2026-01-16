"use client";

import { useState } from "react";
import { HotelBooking } from "@/actions/hotel";
;

import { Badge } from "@/components/ui/badge";
import { GlassButton } from "@/components/ui/glass/GlassFormComponents";
import { Calendar, IndianRupee, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Trash2 } from "lucide-react";
import { PasswordDialog } from "@/components/ui/PasswordDialog";

type HotelBookingsSectionProps = {
  bookings: HotelBooking[];
  onCheckIn: (bookingId: string) => void;
  onCheckOut: (bookingId: string) => void;
  onViewDetails: (booking: HotelBooking) => void;
  onDelete: (bookingId: string, password?: string) => void;
  isSuperAdmin: boolean;
};

export default function HotelBookingsSection({
  bookings,
  onCheckIn,
  onCheckOut,
  onViewDetails,
  onDelete,
  isSuperAdmin
}: HotelBookingsSectionProps) {
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "completed">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsPasswordOpen(true);
  };

  const onPasswordConfirm = (password: string) => {
    if (deleteId) {
      onDelete(deleteId, password);
      setIsPasswordOpen(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Confirmed</Badge>;
      case "checked-in":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Checked In</Badge>;
      case "checked-out":
        return <Badge className="bg-white/5 text-white border border-white/10">Checked Out</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</Badge>;
      default:
        return <Badge className="bg-white/5 text-white">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</Badge>;
      case "partial":
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">Partial</Badge>;
      case "pending":
        return <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20">Pending</Badge>;
      default:
        return <Badge className="bg-white/5 text-white">{status}</Badge>;
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
        <h2 className="text-3xl font-bold text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Hotel Bookings
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === "all"
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === "active"
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === "upcoming"
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === "completed"
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
            >
              Completed
            </button>
          </div>
        </h2>
      </div>
      <div className="p-8">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            No bookings found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Guest Details</TableHead>
                  <TableHead className="w-[120px]">Room</TableHead>
                  <TableHead className="w-[180px]">Stay Duration</TableHead>
                  <TableHead className="w-[100px]">Amount</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{booking.guestName}</span>
                        <span className="text-xs text-white/50">{booking.customerMobile}</span>
                        <div className="flex items-center gap-1 text-xs text-white/40 mt-1">
                          <Users className="h-3 w-3" />
                          <span>{(booking.adults ?? 1) + (booking.children ?? 0)} Guests</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-emerald-400">Room {booking.roomNumber}</span>
                        <span className="text-xs text-white/40 capitalize">{booking.type || "Standard"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="text-white/80">{new Date(booking.startDate).toLocaleDateString()}</span>
                        <span className="text-xs text-white/40">to {new Date(booking.endDate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">₹{booking.totalAmount?.toLocaleString()}</span>
                        <div className="flex gap-2 text-xs">
                          <span className="text-emerald-400">Paid: ₹{booking.paidAmount?.toLocaleString() || 0}</span>
                          <span className="text-amber-400">Bal: ₹{((booking.totalAmount || 0) - (booking.paidAmount || 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <GlassButton
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full"
                          title="View Details"
                          onClick={() => onViewDetails(booking)}
                        >
                          <Clock className="h-4 w-4" />
                        </GlassButton>
                        {booking.status === "confirmed" && (
                          <GlassButton
                            size="icon"
                            variant="primary"
                            className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/50"
                            title="Check In"
                            onClick={() => onCheckIn(booking.id!)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </GlassButton>
                        )}
                        {booking.status === "checked-in" && (
                          <GlassButton
                            size="icon"
                            variant="primary"
                            className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/50"
                            title="Check Out"
                            onClick={() => onCheckOut(booking.id!)}
                          >
                            <XCircle className="h-4 w-4" />
                          </GlassButton>
                        )}

                        <GlassButton
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
                          title="Delete Booking"
                          onClick={() => handleDeleteClick(booking.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </GlassButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <PasswordDialog
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        onConfirm={onPasswordConfirm}
        title="Delete Booking"
        description="Are you sure you want to delete this booking? This action cannot be undone."
      />
    </div>
  );
}

