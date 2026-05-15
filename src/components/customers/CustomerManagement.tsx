"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, User, Phone, Trash2, CheckCircle, Users, Wallet, Calendar } from "lucide-react";
import {
    getCustomers,
    deleteCustomer,
} from "@/actions/customers";
import { getBusinessSettings } from "@/actions/businessSettings";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { CustomerDetailDialog } from "@/components/customers/CustomerDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { PremiumLiquidGlass, PremiumContainer, PremiumStatsCard } from "@/components/ui/glass/premium-liquid-glass";

type Customer = {
    id: string;
    name: string;
    mobileNumber: string;
    email?: string;
    discountTier?: string;
    visitCount?: number;
    totalSpent?: number;
    createdAt?: string;
    updatedAt?: string;
    lastVisit?: string;
};

export default function CustomerManagement() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordAction, setPasswordAction] = useState<"single" | "bulk">("single");
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [passwordProtection, setPasswordProtection] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadCustomers();
        getBusinessSettings().then(settings => {
            if (settings) {
                setPasswordProtection(settings.enablePasswordProtection ?? true);
            }
        });
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter(
                (customer) =>
                    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    customer.mobileNumber.includes(searchQuery),
            );
            setFilteredCustomers(filtered);
        }
    }, [searchQuery, customers]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const customerData = await getCustomers();
            setCustomers(customerData);
            setFilteredCustomers(customerData);
        } catch (error) {
            console.error("Error loading customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTierDisplay = (tier: string | undefined) => {
        if (!tier || tier === "none" || tier === "regular") return "Regular";
        return tier.charAt(0).toUpperCase() + tier.slice(1);
    };

    const getTierColor = (tier: string | undefined) => {
        if (!tier || tier === "none" || tier === "regular")
            return "bg-white/10 text-white/60 border-white/10";
        if (tier === "silver") return "bg-gray-400/20 text-gray-300 border-gray-400/30";
        if (tier === "gold") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
        if (tier === "platinum") return "bg-purple-500/20 text-purple-300 border-purple-500/30";
        return "bg-white/5 text-white/50";
    };

    const handleSingleDelete = async (customerId: string) => {
        if (!passwordProtection) {
            if (confirm("Are you sure you want to delete this customer?")) {
                await handlePasswordSuccess("", customerId);
            }
            return;
        }
        setCustomerToDelete(customerId);
        setPasswordAction("single");
        setIsPasswordDialogOpen(true);
    };

    const handleBulkDelete = async () => {
        if (selectedCustomers.length === 0) return;

        if (!passwordProtection) {
            if (confirm(`Are you sure you want to delete ${selectedCustomers.length} customers?`)) {
                await handlePasswordSuccess("");
            }
            return;
        }
        setPasswordAction("bulk");
        setIsPasswordDialogOpen(true);
    };

    const handlePasswordSuccess = async (password: string, customerIdOverride?: string) => {
        const targetId = customerIdOverride || customerToDelete;

        if (passwordAction === "single" && targetId) {
            const result = await deleteCustomer(targetId);
            if (result.success) {
                setCustomers((prev) => prev.filter((c) => c.id !== targetId));
                setFilteredCustomers((prev) => prev.filter((c) => c.id !== targetId));
                if (selectedCustomers.includes(targetId)) {
                    setSelectedCustomers((prev) => prev.filter((id) => id !== targetId));
                }
                toast({ title: "Success", description: "Customer deleted successfully.", variant: "default" });
            } else {
                toast({ title: "Error", description: `Failed to delete: ${result.error}`, variant: "destructive" });
            }
        } else if (passwordAction === "bulk") {
            const results = await Promise.all(selectedCustomers.map((id) => deleteCustomer(id)));
            const successCount = results.filter((r) => r.success).length;
            if (successCount > 0) {
                setCustomers((prev) => prev.filter((c) => !selectedCustomers.includes(c.id)));
                setFilteredCustomers((prev) => prev.filter((c) => !selectedCustomers.includes(c.id)));
                setSelectedCustomers([]);
                toast({ title: "Success", description: `Deleted ${successCount} customers.`, variant: "default" });
            }
            if (results.some((r) => !r.success)) {
                toast({ title: "Partial Failure", description: "Some customers failed to delete.", variant: "destructive" });
            }
        }
        setIsPasswordDialogOpen(false);
        setCustomerToDelete(null);
    };

    const toggleCustomerSelection = (customerId: string) => {
        setSelectedCustomers((prev) =>
            prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(filteredCustomers.map((c) => c.id));
        }
    };

    const toggleShowCheckboxes = () => {
        setShowCheckboxes(!showCheckboxes);
        if (showCheckboxes) setSelectedCustomers([]);
    };

    // Stats
    const totalCustomers = customers.length;
    const newCustomersThisMonth = customers.filter(c => {
        const date = c.createdAt ? new Date(c.createdAt) : new Date();
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const activeCustomers = customers.filter(c => c.visitCount && c.visitCount > 0).length;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
                            Customers
                        </h1>
                    </div>
                    <p className="text-white/50 mt-1 pl-[3.5rem]">Manage customer information and loyalty programs</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsAddCustomerOpen(true)} className="bg-primary text-white hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumStatsCard
                    title="Total Customers"
                    value={totalCustomers.toString()}
                    icon={<Users className="h-4 w-4 text-blue-400" />}
                />
                <PremiumStatsCard
                    title="New This Month"
                    value={newCustomersThisMonth.toString()}
                    icon={<Calendar className="h-4 w-4 text-green-400" />}
                    trend={{ value: newCustomersThisMonth, label: "new signups", positive: true }}
                />
                <PremiumStatsCard
                    title="Active Customers"
                    value={activeCustomers.toString()}
                    icon={<CheckCircle className="h-4 w-4 text-purple-400" />}
                />
            </div>

            <PremiumLiquidGlass title="Customer List" className="flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                            placeholder="Search customers..."
                            className="w-full pl-10 h-10 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedCustomers.length > 0 ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete ({selectedCustomers.length})
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleShowCheckboxes}
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                            >
                                {showCheckboxes ? "Cancel Selection" : "Select Multiple"}
                            </Button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-white/30">
                        <User className="mx-auto h-12 w-12 opacity-50 mb-3" />
                        <p>No customers found</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className="group relative p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                                onClick={() => {
                                    if (!showCheckboxes && selectedCustomers.length === 0) {
                                        setSelectedCustomer(customer);
                                        setIsDetailDialogOpen(true);
                                    }
                                }}
                            >
                                {(showCheckboxes || selectedCustomers.length > 0) && (
                                    <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedCustomers.includes(customer.id)}
                                            onCheckedChange={() => toggleCustomerSelection(customer.id)}
                                            className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarFallback className="bg-white/10 text-white">
                                            {customer.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <h3 className="font-semibold text-white truncate pr-6">{customer.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTierColor(customer.discountTier)}`}>
                                                {getTierDisplay(customer.discountTier)}
                                            </Badge>
                                        </div>

                                        <div className="mt-3 space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-white/50">
                                                <Phone className="h-3 w-3" />
                                                <span>{customer.mobileNumber}</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                                                <div className="text-xs text-white/40">
                                                    <span className="text-white/60 font-medium">{customer.visitCount || 0}</span> visits
                                                </div>
                                                <div className="text-xs text-white/40">
                                                    <span className="text-white/60 font-medium">₹{(customer.totalSpent || 0).toLocaleString()}</span> spent
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumLiquidGlass>

            <PasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordSuccess}
                title={passwordAction === "bulk" ? "Delete Selected Customers" : "Delete Customer"}
                description={"Action cannot be undone."}
            />

            <AddCustomerDialog
                isOpen={isAddCustomerOpen}
                onClose={() => setIsAddCustomerOpen(false)}
                onSuccess={loadCustomers}
            />

            <CustomerDetailDialog
                customer={selectedCustomer}
                isOpen={isDetailDialogOpen}
                onClose={() => {
                    setIsDetailDialogOpen(false);
                    setSelectedCustomer(null);
                }}
                onDelete={(customerId) => {
                    setCustomerToDelete(customerId);
                    setPasswordAction("single");
                    setIsDetailDialogOpen(false);
                    setTimeout(() => {
                        if (passwordProtection) {
                            setIsPasswordDialogOpen(true);
                        } else {
                            handlePasswordSuccess("", customerId);
                        }
                    }, 200);
                }}
            />
        </div>
    );
}
