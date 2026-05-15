
"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Booking {
    id: string;
    type: "hotel" | "garden";
    customer?: {
        name: string;
    };
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
}

interface BookingDetailsDialogProps {
    bookings: Booking[];
    children: React.ReactNode;
}

export function BookingDetailsDialog({ bookings, children }: BookingDetailsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>All Bookings</DialogTitle>
                    <DialogDescription>
                        View details of all Hotel and Garden bookings.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {bookings.length === 0 ? (
                            <p className="text-center text-[#9CA3AF] py-8">No bookings found.</p>
                        ) : (
                            bookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="flex items-start justify-between p-4 rounded-lg border border-[#F1F5F9] bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] transition-colors"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={`capitalize ${booking.type === "garden"
                                                    ? "text-[#16A34A] border-emerald-200 bg-[#DCFCE7]"
                                                    : "text-[#6D5DFB] border-[#EDEBFF]/40 bg-[#EDEBFF]/30"
                                                    }`}
                                            >
                                                {booking.type}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] ${booking.status === 'confirmed' ? 'bg-[#BBF7D0] text-[#16A34A]' :
                                                    booking.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                                                        'bg-[#E5E7EB] text-[#111827]'
                                                    }`}
                                            >
                                                {booking.status}
                                            </Badge>
                                        </div>
                                        <h4 className="font-semibold text-[#111827]">
                                            {booking.customer?.name || "Guest"}
                                        </h4>
                                        <p className="text-sm text-[#9CA3AF]">
                                            {format(new Date(booking.startDate), "PPP")} -{" "}
                                            {format(new Date(booking.endDate), "PPP")}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="font-bold text-[#111827]">
                                            ₹{(booking.totalAmount || 0).toLocaleString("en-IN")}
                                        </span>
                                        <Link
                                            href={booking.type === 'garden' ? "/dashboard/garden" : "/dashboard/hotel"}
                                            className="text-xs flex items-center gap-1 text-[#9CA3AF] hover:text-[#111827] transition-colors"
                                        >
                                            View
                                            <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

