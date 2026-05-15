"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    User,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    ShoppingBag,
    Trash2,
    Receipt,
    Hotel,
    Loader2,
} from "lucide-react";
import { getCustomerTransactions } from "@/actions/customers";
import { format } from "date-fns";

type Customer = {
    id: string;
    name: string;
    mobileNumber: string;
    email?: string;
    discountTier?: string;
    visitCount?: number;
    totalSpent?: number;
    createdAt?: string;
    lastVisit?: string;
};

type CustomerDetailDialogProps = {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (customerId: string) => void;
};

export function CustomerDetailDialog({
    customer,
    isOpen,
    onClose,
    onDelete,
}: CustomerDetailDialogProps) {
    const [transactions, setTransactions] = useState<{
        bills: any[];
        bookings: any[];
    }>({ bills: [], bookings: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer && isOpen) {
            loadTransactions();
        }
    }, [customer, isOpen]);

    const loadTransactions = async () => {
        if (!customer) return;
        setLoading(true);
        try {
            const data = await getCustomerTransactions(customer.mobileNumber);
            setTransactions(data);
        } catch (error) {
            console.error("Error loading transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!customer) return null;

    const getTierDisplay = (tier: string | undefined) => {
        if (!tier || tier === "none" || tier === "regular") return "Regular";
        return tier.charAt(0).toUpperCase() + tier.slice(1);
    };

    const getTierColor = (tier: string | undefined) => {
        if (!tier || tier === "none" || tier === "regular")
            return "bg-[#E5E7EB] text-[#111827]";
        if (tier === "silver") return "bg-[#9CA3AF] text-[#111827]";
        if (tier === "gold") return "bg-[#F59E0B]/10200 text-[#F59E0B]800";
        if (tier === "platinum") return "bg-[#EDEBFF]/30 text-[#6D5DFB]";
        return "bg-purple-200 text-purple-800";
    };

    const allTransactions = [
        ...transactions.bills.map((b) => ({ ...b, transactionType: "bill" })),
        ...transactions.bookings.map((b) => ({ ...b, transactionType: "booking" })),
    ].sort(
        (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {customer.name}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        Customer details, transaction history, and loyalty information
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-350px)]">
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{customer.mobileNumber}</span>
                                </div>
                                {customer.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{customer.email}</span>
                                    </div>
                                )}
                                {customer.createdAt && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            Member since{" "}
                                            {format(new Date(customer.createdAt), "MMM dd, yyyy")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Tier:</span>
                                    <Badge className={getTierColor(customer.discountTier)}>
                                        {getTierDisplay(customer.discountTier)}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        <strong>{customer.visitCount || 0}</strong> visits
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        Total spent: <strong>₹{(customer.totalSpent || 0).toFixed(2)}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Transaction History */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Transaction History ({allTransactions.length})
                            </h3>

                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : allTransactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No transactions yet
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {allTransactions.map((transaction, index) => (
                                        <div
                                            key={`${transaction.transactionType}-${transaction.id}-${index}`}
                                            className="border rounded-lg p-3 hover:bg-[#F8FAFC] transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    {transaction.transactionType === "bill" ? (
                                                        <Receipt className="h-5 w-5 text-[#6D5DFB] mt-0.5" />
                                                    ) : (
                                                        <Hotel className="h-5 w-5 text-[#EDEBFF]0 mt-0.5" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">
                                                            {transaction.transactionType === "bill"
                                                                ? `Bill #${transaction.billNumber || transaction.id.slice(0, 8)}`
                                                                : `${transaction.type === "hotel" ? "Hotel" : "Garden"} Booking`}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {format(
                                                                new Date(transaction.createdAt),
                                                                "MMM dd, yyyy 'at' hh:mm a"
                                                            )}
                                                        </div>
                                                        {transaction.transactionType === "bill" && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {transaction.businessUnit} • {transaction.source || "dine-in"}
                                                            </div>
                                                        )}
                                                        {transaction.transactionType === "booking" && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {format(new Date(transaction.startDate), "MMM dd")} -{" "}
                                                                {format(new Date(transaction.endDate), "MMM dd, yyyy")}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold">
                                                        ₹
                                                        {(
                                                            transaction.grandTotal || transaction.totalAmount || 0
                                                        ).toFixed(2)}
                                                    </div>
                                                    {transaction.transactionType === "booking" && (
                                                        <Badge
                                                            variant="outline"
                                                            className="mt-1 text-xs"
                                                        >
                                                            {transaction.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4 border-t pt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button 
                        variant="destructive" 
                        className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
                        onClick={() => onDelete(customer.id)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

