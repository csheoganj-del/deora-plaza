"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
;

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  IndianRupee,
  Calendar,
  Clock,
  User,
  Building2,
  Trash2,
  Download,
  Upload,
  FileJson,
  RefreshCw,
  ClockIcon,
  CheckCircle
} from "lucide-react";
import { getBills, deleteBill } from "@/actions/billing";
import { getBusinessSettings } from "@/actions/businessSettings";
import { getHotelBookings } from "@/actions/hotel";
import { getGardenBookings } from "@/actions/garden";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { printHotelReceipt, printGardenReceipt } from "@/lib/print-utils";
import { deleteHotelBooking } from "@/actions/hotel";
import { deleteGardenBooking } from "@/actions/garden";
import { format } from "date-fns";
import ReprintBill from "@/components/billing/ReprintBill";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import EditBillDialog from "@/components/billing/EditBillDialog";
import { Pencil } from "lucide-react";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type Bill = {
  id: string;
  billNumber: string;
  orderId: string;
  businessUnit: string;
  customerName?: string;
  customerMobile?: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod?: string;
  paymentStatus: string;
  source?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
};

export default function BillingPage() {
  const { data: session } = useSupabaseSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [gardenBookings, setGardenBookings] = useState<any[]>([]);
  const [view, setView] = useState<'bills' | 'hotel' | 'garden'>('bills');
  const [bookingToDelete, setBookingToDelete] = useState<{ id: string; type: 'hotel' | 'garden'; title: string } | null>(null);
  const [isBookingPasswordOpen, setIsBookingPasswordOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showReprint, setShowReprint] = useState(false);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [importedBills, setImportedBills] = useState<Bill[]>([]); // New state for imported bills
  const [activeTab, setActiveTab] = useState<"billed" | "pending">("billed");
  const [passwordProtection, setPasswordProtection] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const unitParam = searchParams?.get('unit') || undefined;

    // Check if user is super admin or owner - they should see all by default
    const userRole = (session?.user as any)?.role;
    const isSuperUser = ['super_admin', 'owner'].includes(userRole);

    // If no unit is specified in URL, and user is not super user, use their business unit
    // For super users, default to 'all' (undefined) unless specified
    const userBusinessUnit = isSuperUser ? undefined : (session?.user?.businessUnit || undefined);

    const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;

    loadBills(effectiveUnit);

    // If showing all or hotel/garden specifically, load bookings
    if (!effectiveUnit || effectiveUnit === 'hotel' || effectiveUnit === 'garden') {
      loadBookings();
    }

    if ((unitParam || '').toLowerCase() === 'all') {
      setView('bills');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, session, session?.user?.businessUnit, session?.user]);

  const loadBills = async (unit?: string) => {
    setLoading(true);
    try {
      const data = await getBills(unit);
      setBills(data);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const hotel = await getHotelBookings();
      const gardenRes = await getGardenBookings();
      setHotelBookings(hotel || []);
      setGardenBookings(((gardenRes as any)?.bookings ?? []) as any[]);
    } catch (error) {
      console.error('Error loading bookings for combined view:', error);
    }
  };

  const confirmDeleteBooking = async (password?: string) => {
    // If state is not set yet (rare race condition if called directly), we might fail. 
    // But if we use the helper below, we are good.
    if (!bookingToDelete) return;
    try {
      if (bookingToDelete.type === 'hotel') {
        await deleteHotelBooking(bookingToDelete.id, password);
        await loadBookings();
      } else {
        await deleteGardenBooking(bookingToDelete.id, password);
        await loadBookings();
      }
      setIsBookingPasswordOpen(false);
      setBookingToDelete(null);
      // Also refresh bills in case any linked financial entries exist
      const unitParam = searchParams?.get('unit') || undefined;
      const userBusinessUnit = session?.user?.businessUnit || undefined;
      const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
      await loadBills(effectiveUnit);
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  };

  const handleBookingDeleteClick = (booking: { id: string; type: 'hotel' | 'garden'; title: string }) => {
    setBookingToDelete(booking);
    if (passwordProtection) {
      setIsBookingPasswordOpen(true);
    } else {
      // Use a timeout to ensure state 'bookingToDelete' is updated before calling confirm
      // Or better yet, pass the booking object directly to a modified confirmDeleteBooking, 
      // but confirmDeleteBooking logic uses the state. 
      // We will stick to the timeout pattern for minimal refactor, or pass param to confirmDelete.
      // Let's modify confirmDeleteBooking to accept an optional booking object override, 
      // but that requires changing signature. 
      // Timeout is simple and effective for this UI interaction.
      setTimeout(() => {
        // Re-read value in closure? No, confirmDeleteBooking reads from state 'bookingToDelete'.
        // But 'bookingToDelete' is a state variable.
        // A better way is forcing the state update to be processed. 
        // Actually, since we are inside a function, we can just call an internal version 
        // that takes the booking object.

        // Let's create an internal function that takes the booking object
        deleteBookingInternal(booking, "");
      }, 0);
    }
  }

  const deleteBookingInternal = async (booking: { id: string; type: 'hotel' | 'garden'; title: string }, password?: string) => {
    try {
      if (booking.type === 'hotel') {
        await deleteHotelBooking(booking.id, password);
        await loadBookings();
      } else {
        await deleteGardenBooking(booking.id, password);
        await loadBookings();
      }
      setIsBookingPasswordOpen(false);
      setBookingToDelete(null); // Clear state

      const unitParam = searchParams?.get('unit') || undefined;
      const userBusinessUnit = session?.user?.businessUnit || undefined;
      const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
      await loadBills(effectiveUnit);
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  }

  const handleReprint = (bill: Bill) => {
    setSelectedBill(bill);
    setShowReprint(true);
  };

  const handleEdit = (bill: Bill) => {
    setBillToEdit(bill);
    setShowEditDialog(true);
  };

  const handleBillUpdated = () => {
    // Reload bills after update
    const unitParam = searchParams?.get('unit') || undefined;
    const userBusinessUnit = session?.user?.businessUnit || undefined;
    const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
    loadBills(effectiveUnit);
  };

  const handleDelete = (billId: string) => {
    setBillToDelete(billId);
    if (passwordProtection) {
      setIsPasswordDialogOpen(true);
    } else {
      handlePasswordSuccess("");
    }
  };

  const handlePasswordSuccess = async (password: string) => {
    if (billToDelete) {
      const result = await deleteBill(billToDelete, password);
      if (result.success) {
        setBills(bills.filter(bill => bill.id !== billToDelete));
        setImportedBills(importedBills.filter(bill => bill.id !== billToDelete));
        if (selectedBills.includes(billToDelete)) {
          setSelectedBills(selectedBills.filter(id => id !== billToDelete));
        }
      } else {
        alert(`Failed to delete bill: ${result.error}`);
      }
    } else if (selectedBills.length > 0) {
      // Bulk delete using optimized server action
      const { bulkDeleteBills } = await import("@/actions/billing");
      const result = await bulkDeleteBills(selectedBills, password);

      if (result.success) {
        setBills(bills.filter(bill => !selectedBills.includes(bill.id)));
        setImportedBills(importedBills.filter(bill => !selectedBills.includes(bill.id)));
        setSelectedBills([]);
      } else {
        alert(`Failed to delete bills: ${result.error}`);
      }
    }

    setIsPasswordDialogOpen(false);
    setBillToDelete(null);
  };

  const toggleBillSelection = (billId: string) => {
    setSelectedBills(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const toggleSelectAll = () => {
    const allBillIds = [...bills, ...importedBills].map(bill => bill.id);
    if (selectedBills.length === allBillIds.length && allBillIds.length > 0) {
      setSelectedBills([]);
    } else {
      setSelectedBills(allBillIds);
    }
  };

  const exportToJSON = () => {
    // Export both database bills and imported bills
    const allBills = [...bills, ...importedBills];
    const dataStr = JSON.stringify(allBills, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `bills-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        let billsToImport: any[] = [];

        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
          // Direct array of bills
          billsToImport = jsonData;
        } else if (jsonData.bills && Array.isArray(jsonData.bills)) {
          // Object with bills array (e.g., { bills: [...] })
          billsToImport = jsonData.bills;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          // Object with data array (e.g., { data: [...] })
          billsToImport = jsonData.data;
        } else if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
          // Single bill object
          billsToImport = [jsonData];
        } else {
          alert('Invalid JSON format. Expected an array of bills or an object containing bills.');
          return;
        }

        // Special handling for bloom-backup format
        if (jsonData.bills && Array.isArray(jsonData.bills)) {
          // Convert bloom-backup format to our expected format
          billsToImport = jsonData.bills.map((bill: any, index: number) => ({
            id: bill.id || `imported-${Date.now()}-${index}`,
            billNumber: `BILL-${new Date(bill.date).toISOString().split('T')[0].replace(/-/g, '')}-${String(bill.billNumber || index).padStart(3, '0')}`,
            orderId: bill.id || `order-${Date.now()}-${index}`, // Using bill id as order id for now
            businessUnit: "cafe", // Default to cafe for bloom-backup
            customerName: bill.customerName || null,
            customerMobile: bill.customerMobile || null,
            subtotal: bill.subtotal || 0,
            discountPercent: bill.discount ? parseFloat(((bill.discount / (bill.subtotal || 1)) * 100).toFixed(2)) : 0,
            discountAmount: bill.discount || 0,
            gstPercent: bill.gst && bill.subtotal ? parseFloat(((bill.gst / ((bill.subtotal || 0) - (bill.discount || 0))) * 100).toFixed(2)) : 0,
            gstAmount: bill.gst || 0,
            grandTotal: bill.total || bill.rounded || 0,
            paymentMethod: bill.paymentMethod || null,
            paymentStatus: "paid", // Assume paid since it's in bills section
            source: "dine-in", // Default source
            address: jsonData.businessInfo?.address || null,
            createdAt: bill.date || new Date().toISOString(),
            updatedAt: bill.date || new Date().toISOString(),
            items: bill.items || []
          }));
        }

        // Validate that the imported data has the required structure
        const isValid = billsToImport.every((item: any) => {
          // Check if item has basic bill properties
          const hasBasicProperties = item.billNumber && item.businessUnit && (typeof item.grandTotal === 'number' || typeof item.total === 'number');
          // If it has an id, that's good, but it's not required for import
          return hasBasicProperties;
        });

        if (isValid) {
          // Convert to our Bill type
          const convertedBills: Bill[] = billsToImport.map(bill => ({
            id: bill.id,
            billNumber: bill.billNumber,
            orderId: bill.orderId,
            businessUnit: bill.businessUnit,
            customerName: bill.customerName || undefined,
            customerMobile: bill.customerMobile || undefined,
            subtotal: bill.subtotal || 0,
            discountPercent: bill.discountPercent || 0,
            discountAmount: bill.discountAmount || 0,
            gstPercent: bill.gstPercent || 0,
            gstAmount: bill.gstAmount || 0,
            grandTotal: bill.grandTotal || bill.total || 0,
            paymentMethod: bill.paymentMethod || undefined,
            paymentStatus: bill.paymentStatus || "pending",
            source: bill.source || undefined,
            address: bill.address || undefined,
            createdAt: bill.createdAt,
            updatedAt: bill.updatedAt,
            items: bill.items || []
          }));

          setImportedBills(convertedBills);
          alert(`Successfully imported ${convertedBills.length} bill(s) from JSON. They are now displayed in the table.`);
        } else {
          alert('Invalid bill data format. Please ensure the file contains valid bill information with at least billNumber, businessUnit, and grandTotal.');
        }
      } catch (error) {
        console.error('JSON parsing error:', error);
        alert('Error parsing JSON file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getBusinessUnitColor = (unit: string) => {
    switch (unit) {
      case "hotel": return "bg-[#EDEBFF] text-purple-800";
      case "restaurant": return "bg-[#BBF7D0] text-green-800";
      case "cafe": return "bg-[#F59E0B]/10 text-[#F59E0B]800";
      case "bar": return "bg-[#EDEBFF]/30 text-[#6D5DFB]";
      case "garden": return "bg-[#BBF7D0] text-emerald-800";
      default: return "bg-[#F1F5F9] text-[#111827]";
    }
  };

  // Combine database bills and imported bills for display
  const allBills = [...bills, ...importedBills];

  // Filter bills based on active tab
  const filteredBills = activeTab === "billed"
    ? allBills.filter(bill => bill.paymentStatus === "paid")
    : allBills.filter(bill => bill.paymentStatus !== "paid");

  // Calculate counts
  const billedCount = allBills.filter(bill => bill.paymentStatus === "paid").length;
  const pendingCount = allBills.filter(bill => bill.paymentStatus !== "paid").length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Billing</h1>
          <p className="text-[#9CA3AF] text-sm">Manage bills and payments</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D5DFB]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] relative overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 text-[#111827]">
              <IndianRupee className="w-full h-full" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827]">
              Billing & Treasury
            </h2>
          </div>
          <p className="text-[#6B7280] font-medium italic pl-14 opacity-80">
            Manage bills and payments
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">

          {(searchParams?.get('unit') || '').toLowerCase() === 'all' && (
            <div className="mb-4">
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList className="bg-white border">
                  <TabsTrigger value="bills">Bills</TabsTrigger>
                  <TabsTrigger value="hotel">Hotel Bookings</TabsTrigger>
                  <TabsTrigger value="garden">Garden Bookings</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToJSON}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const unitParam = searchParams?.get('unit') || undefined;
                const userBusinessUnit = session?.user?.businessUnit || undefined;
                const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
                loadBills(effectiveUnit);
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={importFromJSON}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("billed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === "billed"
                ? "bg-[#EDEBFF]/30 text-[#6D5DFB] border border-[#EDEBFF]/40"
                : "bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E5E7EB]"
                }`}
            >
              <CheckCircle className="h-4 w-4" />
              Billed ({billedCount})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === "pending"
                ? "bg-[#F59E0B]/10 text-[#F59E0B]800 border border-[#F59E0B]/20/20200"
                : "bg-[#F1F5F9] text-[#6B7280] hover:bg-[#E5E7EB]"
                }`}
            >
              <ClockIcon className="h-4 w-4" />
              Pending ({pendingCount})
            </button>
          </div>

          {/* Bulk Actions Bar */}
          {selectedBills.length > 0 && (
            <div className="flex justify-between items-center mb-4 p-4 bg-[#F8FAFC] rounded-lg">
              <div className="text-sm text-[#111827]">
                {selectedBills.length} bill{selectedBills.length !== 1 ? 's' : ''} selected
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsPasswordDialogOpen(true)}
                className="bg-[#EF4444] hover:bg-[#DC2626]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}

          {view === 'bills' && (
            <div className="premium-card">
              <div className="p-8 border-b border-[#E5E7EB]">
                <h2 className="text-3xl font-bold text-[#111827]">
                  {activeTab === "billed" ? "Billed Orders" : "Pending Orders"}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'})
                  </span>
                </h2>
              </div>
              <div className="p-8">
                {filteredBills.length === 0 ? (
                  <div className="text-center py-12">
                    <IndianRupee className="mx-auto h-12 w-12 text-[#9CA3AF]" />
                    <h3 className="mt-2 text-sm font-medium text-[#111827]">
                      No {activeTab} bills found
                    </h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">
                      {activeTab === "billed"
                        ? "Billed orders will appear here once payments are completed."
                        : "Pending orders will appear here awaiting payment processing."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <input
                              type="checkbox"
                              checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                              onChange={toggleSelectAll}
                              className="h-4 w-4 rounded border-[#9CA3AF] text-[#6D5DFB] focus:ring-[#6D5DFB]"
                            />
                          </TableHead>
                          <TableHead>Bill No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBills.map((bill) => (
                          <TableRow key={bill.id} className="hover:bg-[#F8FAFC]">
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedBills.includes(bill.id)}
                                onChange={() => toggleBillSelection(bill.id)}
                                className="h-4 w-4 rounded border-[#9CA3AF] text-[#6D5DFB] focus:ring-[#6D5DFB]"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{bill.billNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-[#9CA3AF]">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(bill.createdAt), "dd/MM/yyyy")}
                                <Clock className="h-4 w-4 ml-2" />
                                {format(new Date(bill.createdAt), "HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getBusinessUnitColor(bill.businessUnit)}>
                                <Building2 className="h-3 w-3 mr-1" />
                                {bill.businessUnit}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-4 w-4 text-[#9CA3AF]" />
                                {bill.customerName || "Walk-in Customer"}
                                {bill.customerMobile && (
                                  <span className="text-[#9CA3AF] text-xs">
                                    ({bill.customerMobile})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{bill.grandTotal.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={bill.paymentStatus === "paid" ? "default" : "secondary"}
                                className={
                                  bill.paymentStatus === "paid"
                                    ? "bg-[#BBF7D0] text-green-800"
                                    : "bg-[#F59E0B]/10 text-[#F59E0B]800"
                                }
                              >
                                {bill.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(bill)}
                                className="h-8 w-8 p-0 text-[#6D5DFB] hover:text-[#6D5DFB] hover:bg-[#EDEBFF]/20"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReprint(bill)}
                                className="h-8 w-8 p-0 text-[#22C55E] hover:text-green-800 hover:bg-[#DCFCE7] ml-1"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(bill.id)}
                                className="h-8 w-8 p-0 text-[#EF4444] hover:text-red-800 hover:bg-[#FEE2E2] ml-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'hotel' && (
            <div className="premium-card">
              <div className="p-8 border-b border-[#E5E7EB]">
                <h2 className="text-3xl font-bold text-[#111827]">Hotel Bookings</h2>
              </div>
              <div className="p-8">
                {hotelBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <IndianRupee className="mx-auto h-12 w-12 text-[#9CA3AF]" />
                    <h3 className="mt-2 text-sm font-medium text-[#111827]">No hotel bookings found</h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">Bookings will appear here once created.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guest</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hotelBookings.map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell>{b.guestName || 'Guest'}</TableCell>
                            <TableCell>{b.customerMobile || '-'}</TableCell>
                            <TableCell>{b.roomNumber || 'N/A'}</TableCell>
                            <TableCell>{format(new Date(b.startDate), 'PP')} - {format(new Date(b.endDate), 'PP')}</TableCell>
                            <TableCell>₹{(b.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>₹{(b.totalPaid || 0).toLocaleString()}</TableCell>
                            <TableCell><Badge variant="outline">{b.paymentStatus || b.status}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => printHotelReceipt(b, b.paymentStatus === 'completed' ? 'full' : 'advance')}>Print</Button>
                                <Button size="sm" variant="destructive" onClick={() => {
                                  setBookingToDelete({ id: b.id, type: 'hotel', title: `Delete Booking for ${b.guestName || 'Guest'}` });
                                  if (passwordProtection) {
                                    setIsBookingPasswordOpen(true);
                                  } else {
                                    // Hack: We need to call confirmDeleteBooking but we can't easily wait for state update in this inline handler if we were to rely on useEffect, 
                                    // but confirmDeleteBooking uses state 'bookingToDelete'. 
                                    // So we set state, then we need to trigger delete. 
                                    // Actually, setting state is async. 
                                    // Better approach: create a proper handler function rather than inline.
                                    // reusing inline logic but with setTimeout to allow state update or just direct call if we can pass id.
                                    // Let's perform a direct call pattern similar to handleDelete
                                    // But confirmDeleteBooking relies on 'bookingToDelete' state.
                                    // We can't guarantee state update is immediate.
                                    // Let's change confirmDeleteBooking to accept an ID optionally or just use the state.
                                    // A safer way is:
                                    // setBookingToDelete(...)
                                    // setTimeout(() => confirmDeleteBooking(""), 0)
                                    // Or better: define a handleBookingDeleteClick function.
                                    handleBookingDeleteClick({ id: b.id, type: 'hotel', title: `Delete Booking for ${b.guestName || 'Guest'}` });
                                  }
                                }}>Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'garden' && (
            <div className="premium-card">
              <div className="p-8 border-b border-[#E5E7EB]">
                <h2 className="text-3xl font-bold text-[#111827]">Garden Bookings</h2>
              </div>
              <div className="p-8">
                {gardenBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <IndianRupee className="mx-auto h-12 w-12 text-[#9CA3AF]" />
                    <h3 className="mt-2 text-sm font-medium text-[#111827]">No garden bookings found</h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">Bookings will appear here once created.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gardenBookings.map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell>{b.customerName || 'Customer'}</TableCell>
                            <TableCell>{b.customerMobile || '-'}</TableCell>
                            <TableCell>{b.eventType || '-'}</TableCell>
                            <TableCell>{format(new Date(b.startDate), 'PP')} - {format(new Date(b.endDate), 'PP')}</TableCell>
                            <TableCell>₹{(b.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>₹{(b.totalPaid || 0).toLocaleString()}</TableCell>
                            <TableCell><Badge variant="outline">{b.paymentStatus || b.status}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => printGardenReceipt(b, b.paymentStatus === 'completed' ? 'full' : 'advance')}>Print</Button>
                                <Button size="sm" variant="destructive" onClick={() => {
                                  handleBookingDeleteClick({ id: b.id, type: 'garden', title: `Delete Booking for ${b.customerName || 'Customer'}` });
                                }}>Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          <PasswordDialog
            isOpen={isBookingPasswordOpen}
            onClose={() => { setIsBookingPasswordOpen(false); setBookingToDelete(null); }}
            onConfirm={(pwd) => confirmDeleteBooking(pwd)}
            title={bookingToDelete?.title || 'Delete Booking'}
            description={'Enter admin password to confirm deletion'}
          />

          {showReprint && selectedBill && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <ReprintBill
                  bill={selectedBill}
                  onClose={() => {
                    setShowReprint(false);
                    setSelectedBill(null);
                  }}
                />
              </div>
            </div>
          )}

          <PasswordDialog
            isOpen={isPasswordDialogOpen}
            onClose={() => {
              setIsPasswordDialogOpen(false);
              setBillToDelete(null);
            }}
            onConfirm={handlePasswordSuccess}
            title={billToDelete ? "Delete Bill" : "Delete Selected Bills"}
            description={
              billToDelete
                ? "Are you sure you want to delete this bill? This action cannot be undone."
                : `Are you sure you want to delete ${selectedBills.length} bills? This action cannot be undone.`
            }
          />

          {billToEdit && (
            <EditBillDialog
              bill={billToEdit}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              onBillUpdated={handleBillUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
}

