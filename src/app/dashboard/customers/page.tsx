"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
;

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, User, Phone, Star, Trash2 } from "lucide-react";
import {
  getCustomers,
  searchCustomers,
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"single" | "bulk">(
    "single",
  );
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
      return "bg-[#E5E7EB] text-[#111827]";
    if (tier === "silver") return "bg-[#9CA3AF] text-[#111827]";
    if (tier === "gold") return "bg-[#F59E0B]/10200 text-[#F59E0B]800";
    if (tier === "platinum") return "bg-[#EDEBFF]/30 text-[#6D5DFB]";
    return "bg-purple-200 text-purple-800";
  };

  const handleSingleDelete = (customerId: string) => {
    setCustomerToDelete(customerId);
    setPasswordAction("single");
    if (passwordProtection) {
      setIsPasswordDialogOpen(true);
    } else {
      setTimeout(() => handlePasswordSuccess("", customerId), 0);
    }
  };

  const handleBulkDelete = () => {
    setPasswordAction("bulk");
    if (passwordProtection) {
      setIsPasswordDialogOpen(true);
    } else {
      handlePasswordSuccess("");
    }
  };

  const handlePasswordSuccess = async (password: string, customerIdOverride?: string) => {
    const targetId = customerIdOverride || customerToDelete;

    if (passwordAction === "single" && targetId) {
      const result = await deleteCustomer(targetId);
      if (result.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== targetId));
        setFilteredCustomers((prev) =>
          prev.filter((c) => c.id !== targetId),
        );
        if (selectedCustomers.includes(targetId)) {
          setSelectedCustomers((prev) =>
            prev.filter((id) => id !== targetId),
          );
        }
        toast({
          title: "Success",
          description: "Customer deleted successfully.",
          variant: "default",
        });
      } else {
        // alert(`Failed to delete customer: ${result.error}`);
        toast({
          title: "Error",
          description: `Failed to delete customer: ${result.error}`,
          variant: "destructive",
        });
      }
    } else if (passwordAction === "bulk") {
      const results = await Promise.all(
        selectedCustomers.map((id) => deleteCustomer(id)),
      );

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        setCustomers((prev) =>
          prev.filter((c) => !selectedCustomers.includes(c.id)),
        );
        setFilteredCustomers((prev) =>
          prev.filter((c) => !selectedCustomers.includes(c.id)),
        );
        setSelectedCustomers([]);
        toast({
          title: "Success",
          description: `Deleted ${successCount} customers successfully.`,
          variant: "default",
        });
      }

      if (results.some((r) => !r.success)) {
        const errors = results
          .filter((r) => !r.success)
          .map((r) => r.error)
          .join(", ");
        // alert(`Some customers failed to delete: ${errors}`);
        toast({
          title: "Partial Failure",
          description: `Some customers failed to delete: ${errors}`,
          variant: "destructive",
        });
      }
    }

    setIsPasswordDialogOpen(false);
    setCustomerToDelete(null);
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      // Deselect all
      setSelectedCustomers([]);
    } else {
      // Select all visible customers
      setSelectedCustomers(filteredCustomers.map((c) => c.id));
    }
  };

  // New function to toggle checkbox visibility
  const toggleShowCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes);
    // If hiding checkboxes, also clear selection
    if (showCheckboxes) {
      setSelectedCustomers([]);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] relative overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 text-[#111827]">
              <User className="w-full h-full" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827]">
              Customers
            </h2>
          </div>
          <p className="text-[#6B7280] font-medium italic pl-14 opacity-80">
            Manage customer information and loyalty programs
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">

          <div className="premium-card">
            <div className="p-8 border-b border-[#E5E7EB]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-3xl font-bold text-[#111827]">Customer Management</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      className="pl-8 w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setIsAddCustomerOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-8">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111827]"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-[#9CA3AF]" />
                  <h3 className="mt-2 text-sm font-medium text-[#111827]">
                    No customers
                  </h3>
                  <p className="mt-1 text-sm text-[#9CA3AF]">
                    {searchQuery
                      ? "No customers match your search."
                      : "Get started by adding a new customer."}
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setIsAddCustomerOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Customer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selection toolbar */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {(showCheckboxes || selectedCustomers.length > 0) && (
                        <>
                          <Checkbox
                            checked={
                              selectedCustomers.length ===
                              filteredCustomers.length &&
                              filteredCustomers.length > 0
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                          <span className="text-sm text-muted-foreground">
                            {selectedCustomers.length > 0
                              ? `${selectedCustomers.length} selected`
                              : `${filteredCustomers.length} customers`}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedCustomers.length > 0 ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Selected ({selectedCustomers.length})
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleShowCheckboxes}
                        >
                          {showCheckboxes ? "Cancel Selection" : "Select Customers"}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="group border rounded-lg p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer relative"
                        onClick={() => {
                          if (!showCheckboxes && selectedCustomers.length === 0) {
                            setSelectedCustomer(customer);
                            setIsDetailDialogOpen(true);
                          }
                        }}
                      >
                        {/* Selection checkbox - only in selection mode */}
                        {(showCheckboxes || selectedCustomers.length > 0) && (
                          <div
                            className="absolute top-2 right-2 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={() =>
                                toggleCustomerSelection(customer.id)
                              }
                            />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {customer.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold truncate">
                                {customer.name}
                              </h3>
                              <Badge
                                className={getTierColor(customer.discountTier)}
                              >
                                {getTierDisplay(customer.discountTier)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-sm text-[#9CA3AF]">
                              <Phone className="h-3 w-3" />
                              <span className="truncate">
                                {customer.mobileNumber}
                              </span>
                            </div>
                            {customer.email && (
                              <div className="text-sm text-[#9CA3AF] truncate">
                                {customer.email}
                              </div>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-[#9CA3AF]">
                              <span>Visits: {customer.visitCount || 0}</span>
                              <span>
                                Total: ₹{(customer.totalSpent || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <PasswordDialog
            isOpen={isPasswordDialogOpen}
            onClose={() => setIsPasswordDialogOpen(false)}
            onConfirm={handlePasswordSuccess}
            title={
              passwordAction === "bulk"
                ? "Delete Selected Customers"
                : "Delete Customer"
            }
            description={
              passwordAction === "bulk"
                ? `Are you sure you want to delete ${selectedCustomers.length} customers? This action cannot be undone.`
                : "Are you sure you want to delete this customer? This action cannot be undone."
            }
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
              // Small delay to allow dialog transition
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
      </div>
    </div>
  );
}

