"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, CreditCard, Users, Utensils, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type LiveOrder = {
    id: string;
    tableNumber?: string;
    roomNumber?: string;
    businessUnit: string;
    status: string;
    customerName?: string;
    customerCount?: number;
    totalAmount: number;
    createdAt: string;
    items: any[];
};

type LiveOrdersTabProps = {
    orders: LiveOrder[];
    onGenerateBill: (order: LiveOrder) => void;
};

export default function LiveOrdersTab({ orders, onGenerateBill }: LiveOrdersTabProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "preparing": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case "ready": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "served": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "bill_requested": return "bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse";
            default: return "bg-white/5 text-white/50 border-white/10";
        }
    };

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-white/20 border border-dashed border-white/10 rounded-2xl mx-1 bg-black/20">
                <Utensils className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No active orders</p>
                <p className="text-xs mt-1 text-white/10">Tables will appear here once occupied</p>
            </div>
        );
    }

    const sortedOrders = [...orders].sort((a, b) => {
        if (a.status === 'bill_requested' && b.status !== 'bill_requested') return -1;
        if (a.status !== 'bill_requested' && b.status === 'bill_requested') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/5 bg-black/20">
            <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-white/60 font-medium border-b border-white/5">
                    <tr>
                        <th className="p-3">Location</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-center">Guests</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Running Total</th>
                        <th className="p-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-3">
                                <div className="flex flex-col">
                                    <span className="font-bold text-white">
                                        {order.businessUnit === 'hotel' ? `Room ${order.roomNumber}` : `Table ${order.tableNumber}`}
                                    </span>
                                    <span className="text-[10px] uppercase text-white/30 tracking-wider">
                                        {order.businessUnit}
                                    </span>
                                </div>
                            </td>
                            <td className="p-3 text-white/70">
                                <div className="flex items-center gap-2">
                                    <span>{order.customerName || "Walk-in"}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-white/30 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>Started {formatDistanceToNow(new Date(order.createdAt))} ago</span>
                                </div>
                            </td>
                            <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-white/50">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{order.customerCount || 1}</span>
                                </div>
                            </td>
                            <td className="p-3">
                                <Badge variant="outline" className={getStatusColor(order.status)}>
                                    {order.status === 'bill_requested' ? 'BILL ASKED' : order.status.toUpperCase()}
                                </Badge>
                            </td>
                            <td className="p-3 text-right font-bold text-[#2fd180]">
                                ₹{(order.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-right">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 bg-[#2fd180]/10 text-[#2fd180] border-[#2fd180]/20 hover:bg-[#2fd180] hover:text-[#0a0a0a] transition-all"
                                    onClick={() => onGenerateBill(order)}
                                >
                                    <CreditCard className="w-3.5 h-3.5 mr-2" />
                                    Generate Bill
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
