"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumLiquidGlass, PremiumContainer, PremiumStatsCard } from "@/components/ui/glass/premium-liquid-glass";
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
  RefreshCw,
  CheckCircle,
  Plus,
  FileText,
  ClockIcon,
  X,
  TrendingUp,
  Pencil
} from "lucide-react";
import { getBills, deleteBill } from "@/actions/billing";
import { getHotelBookings } from "@/actions/hotel";
import { getGardenBookings } from "@/actions/garden";
import { getBusinessSettings } from "@/actions/businessSettings";
import { printHotelReceipt, printGardenReceipt } from "@/lib/print-utils";
import { deleteHotelBooking } from "@/actions/hotel";
import { deleteGardenBooking } from "@/actions/garden";
import { format } from "date-fns";
import ReprintBill from "@/components/billing/ReprintBill";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import EditBillDialog from "@/components/billing/EditBillDialog";
import { RecordPaymentDialog } from "@/components/garden/RecordPaymentDialog";
import { useServerAuth } from "@/hooks/useServerAuth";
import { useRealtimeOrders, useRealtimeTables } from "@/hooks/useRealtimeData";
import LiveOrdersTab from "./LiveOrdersTab";
import { BillGenerator } from "./BillGenerator";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { ensureBillForOrder } from "@/actions/billing";
import { getOrderById } from "@/actions/orders";
import { toast as sonnerToast } from "sonner";

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

export default function HybridBillingPage() {
  const { data: session } = useServerAuth();
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
  const [importedBills, setImportedBills] = useState<Bill[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "pending" | "billed">("live");
  const [passwordProtection, setPasswordProtection] = useState(true);
  const [orderToBill, setOrderToBill] = useState<any | null>(null);
  const [showBillGenerator, setShowBillGenerator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const unitParam = searchParams?.get('unit') || undefined;
  const userRole = (session?.user as any)?.role;
  const isSuperUser = ['super_admin', 'owner'].includes(userRole);
  const userBusinessUnit = isSuperUser ? undefined : (session?.user?.businessUnit || undefined);
  const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;

  const [autoPrintBill, setAutoPrintBill] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const processedRef = useRef(new Set<string>());

  // Garden Payment Dialog State
  const [isGardenPaymentOpen, setIsGardenPaymentOpen] = useState(false);
  const [selectedGardenBookingForPayment, setSelectedGardenBookingForPayment] = useState<any>(null);

  // Realtime Subscription for Auto-Print
  useEffect(() => {
    const supabase = createClient();
    const channelName = `billing-auto-print-v${Date.now()}`;
    console.log(`🖨️ Initializing Auto-Print Listener (${channelName}) for Billing Page...`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const newOrder = payload.new as any;
          console.log("🔔 [Billing] Order Update Received:", {
            id: newOrder.id,
            status: newOrder.status,
            type: newOrder.type
          });

          if (newOrder.status === 'served') {
            if (processedRef.current.has(newOrder.id)) {
              console.log("ℹ️ [Billing] Order already processed:", newOrder.id);
              return;
            }

            console.log("🚀 [Billing] Triggering Bill Creation for:", newOrder.id);

            try {
              const fullOrder = await getOrderById(newOrder.id);
              if (!fullOrder) {
                console.error("❌ [Billing] Could not fetch unit order details");
                return;
              }

              console.log("📋 [Billing] Order Type:", fullOrder.type);

              if (fullOrder.type && fullOrder.type.toLowerCase() === 'takeaway') {
                processedRef.current.add(newOrder.id);
                // @ts-ignore - sonner toast types
                sonnerToast.loading(`Preparing Takeaway Bill #${fullOrder.orderNumber || '...'}`, { id: 'bill-process' });

                const result = await ensureBillForOrder(fullOrder.id);
                if (result.success && result.bill) {
                  console.log("✅ [Billing] Bill Created Successfully:", result.bill.billNumber);
                  setAutoPrintBill(result.bill);
                  // @ts-ignore
                  sonnerToast.dismiss('bill-process');
                  // @ts-ignore
                  sonnerToast.success(`Bill Ready: ${result.bill.billNumber}`);
                  // Refresh bills list
                  loadBills(effectiveUnit);
                } else {
                  console.error("❌ [Billing] Bill Creation Failed:", result.error);
                  // @ts-ignore
                  sonnerToast.dismiss('bill-process');
                  // @ts-ignore
                  sonnerToast.error(`Bill Failed: ${result.error}`);
                  processedRef.current.delete(newOrder.id);
                }
              } else {
                console.log("ℹ️ [Billing] Skipping: Not a takeaway order");
              }
            } catch (err) {
              console.error("❌ [Billing] Exception in listener:", err);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 [Billing] Subscription Status: ${status}`);
      });

    return () => {
      console.log(`🔌 [Billing] Cleaning up channel ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [effectiveUnit]);

  useEffect(() => {
    loadBills(effectiveUnit);
    if (!effectiveUnit || effectiveUnit === 'hotel' || effectiveUnit === 'garden') {
      loadBookings();
    }
    if ((unitParam || '').toLowerCase() === 'all') {
      setView('bills');
    }

    // Set active tab based on filter param
    const filterParam = searchParams?.get('filter');
    if (filterParam === 'paid' || filterParam === 'settled') {
      setActiveTab('billed');
    } else if (filterParam === 'pending' || filterParam === 'unpaid') {
      setActiveTab('pending');
    } else if (filterParam === 'live' || filterParam === 'active') {
      setActiveTab('live');
    }

    // Check for orderId in URL to auto-open bill generator
    const orderIdParam = searchParams?.get('orderId');
    if (orderIdParam) {
      handleAutoOpenBillGenerator(orderIdParam);
    }
  }, [searchParams, session, session?.user?.businessUnit, session?.user, effectiveUnit]);

  const handleAutoOpenBillGenerator = async (orderId: string) => {
    try {
      const { getOrderById } = await import("@/actions/orders");
      const order = await getOrderById(orderId);
      if (order) {
        setOrderToBill(order);
        setShowBillGenerator(true);
      }
    } catch (error) {
      console.error("Failed to load order for billing:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    getBusinessSettings().then(settings => {
      console.log("HybridBillingPage: Fetched settings:", settings);
      if (settings) {
        console.log("HybridBillingPage: enablePasswordProtection value:", settings.enablePasswordProtection);
        setPasswordProtection(settings.enablePasswordProtection ?? true);
        setBusinessSettings(settings);
      } else {
        console.log("HybridBillingPage: Settings are null, defaulting to true");
      }
    });
  }, []);


  const { data: liveOrders } = useRealtimeOrders({
    businessUnit: effectiveUnit,
  });

  const { tables, occupiedTables } = useRealtimeTables(effectiveUnit);
  const [serverLiveOrders, setServerLiveOrders] = useState<any[]>([]);

  const occupiedOrderIds = occupiedTables.map(t => t.currentOrderId).filter(Boolean);

  // Merge server orders with realtime orders
  // Realtime orders take precedence if they exist
  const mergedOrdersMap = new Map();
  serverLiveOrders.forEach(o => mergedOrdersMap.set(o.id, o));
  liveOrders.forEach(o => mergedOrdersMap.set(o.id, o));
  const mergedOrders = Array.from(mergedOrdersMap.values());

  const activeLiveOrders = mergedOrders.filter(o =>
    ["pending", "preparing", "ready", "bill_requested"].includes(o.status) ||
    occupiedOrderIds.includes(o.id)
  );

  const loadBills = async (unit?: string) => {
    setLoading(true);
    try {
      const data = await getBills(unit);
      setBills(data);

      // Also load live orders from server to bypass RLS issues
      const { getLiveOrders } = await import("@/actions/orders");
      const liveData = await getLiveOrders(unit);
      setServerLiveOrders(liveData || []);
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

      const unitParam = searchParams?.get('unit') || undefined;
      const userBusinessUnit = session?.user?.businessUnit || undefined;
      const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
      await loadBills(effectiveUnit);
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  };

  const handleBookingDeleteClick = async (booking: { id: string; type: 'hotel' | 'garden'; title: string }) => {
    setBookingToDelete(booking);
    if (!passwordProtection) {
      if (confirm(`Are you sure you want to delete this ${booking.type} booking: ${booking.title}?`)) {
        await confirmDeleteBooking("");
      }
      return;
    }
    setIsBookingPasswordOpen(true);
  }

  const handleReprint = async (bill: Bill) => {
    // Specialized printing for garden and hotel
    if (bill.businessUnit === 'garden') {
      let booking = gardenBookings.find(b => b.id === bill.orderId || b.id === bill.id);

      if (!booking) {
        // Fallback: Fetch directly if not in state
        const { getGardenBookingById } = await import("@/actions/garden");
        const res = await getGardenBookingById(bill.orderId || bill.id);
        booking = (res as any)?.booking;
      }

      if (booking) {
        printGardenReceipt(booking, businessSettings);
        return;
      }
    }

    if (bill.businessUnit === 'hotel') {
      let booking = hotelBookings.find(b => b.id === bill.orderId || b.id === bill.id);

      if (!booking) {
        // Fallback: Fetch directly
        const { getHotelBookingById } = await import("@/actions/hotel");
        booking = await getHotelBookingById(bill.orderId || bill.id);
      }

      if (booking) {
        printHotelReceipt(booking, businessSettings);
        return;
      }
    }

    // Default for Cafe/Bar/etc.
    setSelectedBill(bill);
    setShowReprint(true);
  };

  const handleEdit = (bill: Bill) => {
    setBillToEdit(bill);
    setShowEditDialog(true);
  };

  const handleBillUpdated = () => {
    const unitParam = searchParams?.get('unit') || undefined;
    const userBusinessUnit = session?.user?.businessUnit || undefined;
    const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
    loadBills(effectiveUnit);
  };

  const handleDelete = async (billId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setBillToDelete(billId);
    if (!passwordProtection) {
      if (confirm("Are you sure you want to delete this bill?")) {
        await handlePasswordSuccess("");
      }
      return;
    }
    setIsPasswordDialogOpen(true);
  };

  const { toast } = useToast();
  // ... (keep existing state)

  const handlePasswordSuccess = async (password: string) => {
    if (billToDelete) {
      const billObj = bills.find(b => b.id === billToDelete);
      const result = await deleteBill(billToDelete, password, billObj?.businessUnit);
      if (result.success) {
        setBills(bills.filter(bill => bill.id !== billToDelete));
        if (selectedBills.includes(billToDelete)) {
          setSelectedBills(selectedBills.filter(id => id !== billToDelete));
        }
        toast({
          title: "Success",
          description: "Bill deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete bill",
          variant: "destructive",
        });
      }
    } else if (selectedBills.length > 0) {
      const { bulkDeleteBills } = await import("@/actions/billing");
      const result = await bulkDeleteBills(selectedBills, password);

      if (result.success) {
        setBills(bills.filter(bill => !selectedBills.includes(bill.id)));
        setSelectedBills([]);
        toast({
          title: "Success",
          description: `Deleted ${selectedBills.length} bills successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete bills",
          variant: "destructive",
        });
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
    const allBillIds = bills.map(bill => bill.id);
    if (selectedBills.length === allBillIds.length && allBillIds.length > 0) {
      setSelectedBills([]);
    } else {
      setSelectedBills(allBillIds);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(bills, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `bills-export-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToExcel = async () => {
    try {
      // Dynamically import xlsx to avoid bundling it if not used
      const XLSX = await import('xlsx');

      // Prepare data for Excel
      const excelData = bills.map(bill => ({
        'Bill Number': bill.billNumber,
        'Date': format(new Date(bill.createdAt), 'dd/MM/yyyy'),
        'Time': format(new Date(bill.createdAt), 'HH:mm'),
        'Business Unit': bill.businessUnit,
        'Customer Name': bill.customerName || 'Walk-in',
        'Customer Mobile': bill.customerMobile || '-',
        'Subtotal': bill.subtotal,
        'Discount %': bill.discountPercent,
        'Discount Amount': bill.discountAmount,
        'GST %': bill.gstPercent,
        'GST Amount': bill.gstAmount,
        'Grand Total': bill.grandTotal,
        'Payment Method': bill.paymentMethod || '-',
        'Payment Status': bill.paymentStatus,
        'Source': bill.source || '-',
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Bill Number
        { wch: 12 }, // Date
        { wch: 8 },  // Time
        { wch: 12 }, // Business Unit
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Customer Mobile
        { wch: 12 }, // Subtotal
        { wch: 10 }, // Discount %
        { wch: 15 }, // Discount Amount
        { wch: 8 },  // GST %
        { wch: 12 }, // GST Amount
        { wch: 12 }, // Grand Total
        { wch: 15 }, // Payment Method
        { wch: 15 }, // Payment Status
        { wch: 12 }, // Source
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');

      // Generate filename
      const fileName = `bills-export-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Success",
        description: `Exported ${bills.length} bills to Excel`,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Error",
        description: "Failed to export to Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const importFromJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        let billsToImport: any[] = [];

        if (Array.isArray(jsonData)) {
          billsToImport = jsonData;
        } else if (jsonData.bills && Array.isArray(jsonData.bills)) {
          billsToImport = jsonData.bills;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          billsToImport = jsonData.data;
        } else if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
          billsToImport = [jsonData];
        } else {
          alert('Invalid JSON format.');
          return;
        }

        // Bloom backup format handling omitted for brevity but should be here if crucial. 
        // Assuming standard format for now or basic field check.

        const { createBill } = await import("@/actions/billing");
        let successCount = 0;

        for (const bill of billsToImport) {
          // simplified import logic
          const billData = {
            orderId: bill.orderId || `order-${Date.now()}-${Math.random()}`,
            businessUnit: bill.businessUnit || 'cafe',
            customerMobile: bill.customerMobile,
            customerName: bill.customerName,
            subtotal: bill.subtotal || 0,
            discountPercent: bill.discountPercent || 0,
            discountAmount: bill.discountAmount || 0,
            gstPercent: bill.gstPercent || 0,
            gstAmount: bill.gstAmount || 0,
            grandTotal: bill.grandTotal || bill.total || 0,
            paymentMethod: bill.paymentMethod || 'cash',
            source: bill.source || 'dine-in',
            items: bill.items || []
          };

          const result = await createBill(billData);
          if (result.success) successCount++;
        }

        if (successCount > 0) {
          alert(`Imported ${successCount} bills.`);
          const unitParam = searchParams?.get('unit') || undefined;
          const userBusinessUnit = session?.user?.businessUnit || undefined;
          const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;
          await loadBills(effectiveUnit);
        }
      } catch (error) {
        console.error('JSON parsing error:', error);
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };


  const getBusinessUnitColor = (unit: string) => {
    switch (unit) {
      case "hotel": return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      case "restaurant": return "bg-green-500/10 text-green-300 border-green-500/20";
      case "cafe": return "bg-orange-500/10 text-orange-300 border-orange-500/20";
      case "bar": return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "garden": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      default: return "bg-white/5 text-white/50 border-white/10";
    }
  };

  const filteredBills = activeTab === "billed"
    ? bills.filter(bill => bill.paymentStatus === "paid")
    : activeTab === "pending"
      ? bills.filter(bill => bill.paymentStatus !== "paid")
      : [];

  const billedCount = bills.filter(bill => bill.paymentStatus === "paid").length;
  const pendingCount = bills.filter(bill => bill.paymentStatus !== "paid").length;
  const liveCount = activeLiveOrders.length;

  const totalRevenue = bills.filter(bill => bill.paymentStatus === "paid")
    .reduce((sum, bill) => sum + bill.grandTotal, 0);
  const pendingAmount = bills.filter(bill => bill.paymentStatus !== "paid")
    .reduce((sum, bill) => sum + bill.grandTotal, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Billing & Treasury
            </h1>
          </div>
          <div className="text-white/50 mt-1 pl-[3.5rem] flex items-center gap-2">
            <span>Manage bills, payments, and financial records</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToJSON}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToExcel}
            className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const effectiveUnit = (searchParams?.get('unit') === 'all') ? undefined : (searchParams?.get('unit') || session?.user?.businessUnit || undefined);
              loadBills(effectiveUnit);
            }}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumStatsCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={<IndianRupee className="h-4 w-4 text-[#22C55E]" />}
          trend={{ value: billedCount, label: "billed orders", positive: true }}
        />
        <PremiumStatsCard
          title="Pending Amount"
          value={`₹${pendingAmount.toLocaleString()}`}
          icon={<Clock className="h-4 w-4 text-orange-400" />}
          trend={{ value: pendingCount, label: "pending orders", positive: false }}
        />
        <PremiumStatsCard
          title="Total Bills"
          value={bills.length.toString()}
          icon={<FileText className="h-4 w-4 text-blue-400" />}
          trend={{ value: 0, label: "All time", positive: true }}
        />
        <PremiumStatsCard
          title="Avg Bill Value"
          value={`₹${bills.length > 0 ? Math.round(totalRevenue / billedCount || 0).toLocaleString() : 0}`}
          icon={<TrendingUp className="h-4 w-4 text-purple-400" />}
          trend={{ value: 0, label: "Per order", positive: true }}
        />
      </div>

      {/* Bills Management - Unified View */}
      <PremiumLiquidGlass className="flex flex-col" title={`Bills Management${isSuperUser && effectiveUnit === undefined ? ' - All Units' : ''}`}>
        <div className="flex gap-4 mb-6 px-1">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${activeTab === "live"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              }`}
          >
            <ClockIcon className="h-4 w-4" />
            Live Orders ({liveCount})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${activeTab === "pending"
              ? "bg-orange-500/10 text-orange-400 border-orange-400/20"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              }`}
          >
            <Clock className="h-4 w-4" />
            Wait Payment ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("billed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${activeTab === "billed"
              ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              }`}
          >
            <CheckCircle className="h-4 w-4" />
            Settled Bills ({billedCount})
          </button>
        </div>

        {selectedBills.length > 0 && (
          <div className="flex justify-between items-center mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mx-1">
            <div className="text-sm text-red-200">
              {selectedBills.length} bills selected
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsPasswordDialogOpen(true)}
              className="h-8 bg-red-500 hover:bg-red-600 text-white"
              type="button"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/5 bg-black/20">
          {activeTab === "live" ? (
            <LiveOrdersTab
              orders={activeLiveOrders}
              onGenerateBill={(order) => {
                setOrderToBill(order);
                setShowBillGenerator(true);
              }}
            />
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <IndianRupee className="mx-auto h-12 w-12 opacity-50 mb-3" />
              <p>No {activeTab} bills found</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-white/60 font-medium border-b border-white/5">
                <tr>
                  <th className="p-3 w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedBills.length === filteredBills.length && filteredBills.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-black/20"
                    />
                  </th>
                  <th className="p-3">Bill No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedBills.includes(bill.id)}
                        onChange={() => toggleBillSelection(bill.id)}
                        className="rounded border-white/20 bg-black/20"
                      />
                    </td>
                    <td className="p-3 font-mono text-white/80">{bill.billNumber}</td>
                    <td className="p-3 text-white/50">
                      <div className="flex flex-col text-xs">
                        <span>{format(new Date(bill.createdAt), "PP")}</span>
                        <span>{format(new Date(bill.createdAt), "p")}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={getBusinessUnitColor(bill.businessUnit)}>
                        {bill.businessUnit}
                      </Badge>
                    </td>
                    <td className="p-3 text-white/70">
                      <div>{bill.customerName || "Walk-in"}</div>
                      {bill.customerMobile && <div className="text-xs text-white/30">{bill.customerMobile}</div>}
                    </td>
                    <td className="p-3 text-right font-medium text-white">₹{bill.grandTotal.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className={bill.paymentStatus === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"}>
                        {bill.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10" onClick={() => handleEdit(bill)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10" onClick={() => handleReprint(bill)}>
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-white/10" onClick={(e) => handleDelete(bill.id, e)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PremiumLiquidGlass>



      <PasswordDialog
        isOpen={isBookingPasswordOpen}
        onClose={() => { setIsBookingPasswordOpen(false); setBookingToDelete(null); }}
        onConfirm={(pwd) => confirmDeleteBooking(pwd)}
        title={bookingToDelete?.title || 'Delete Booking'}
        description={'Enter admin password to confirm deletion'}
      />

      {
        showReprint && selectedBill && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e24] border border-white/10 text-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <ReprintBill
                bill={selectedBill}
                onClose={() => {
                  setShowReprint(false);
                  setSelectedBill(null);
                }}
              />
            </div>
          </div>
        )
      }

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setBillToDelete(null);
        }}
        onConfirm={handlePasswordSuccess}
        title={billToDelete ? "Delete Bill" : "Delete Selected Bills"}
        description={
          "Action cannot be undone."
        }
      />

      {
        billToEdit && (
          <EditBillDialog
            bill={billToEdit}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onBillUpdated={handleBillUpdated}
          />
        )
      }

      {
        showBillGenerator && orderToBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="w-full max-w-5xl h-[85vh] overflow-hidden rounded-3xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <BillGenerator
                order={orderToBill}
                onClose={() => {
                  setShowBillGenerator(false);
                  setOrderToBill(null);
                }}
                onBillGenerated={() => {
                  setShowBillGenerator(false);
                  setOrderToBill(null);
                  handleBillUpdated();
                }}
              />
            </div>
          </div>
        )
      }

      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
        onChange={importFromJSON}
      />

      {/* Garden Payment Dialog */}
      {
        selectedGardenBookingForPayment && (
          <RecordPaymentDialog
            booking={selectedGardenBookingForPayment}
            isOpen={isGardenPaymentOpen}
            onClose={() => {
              setIsGardenPaymentOpen(false);
              setSelectedGardenBookingForPayment(null);
            }}
            onSuccess={() => {
              loadBookings();
              setIsGardenPaymentOpen(false);
              setSelectedGardenBookingForPayment(null);
            }}
          />
        )
      }

      {/* Auto-Print Dialog Overlay */}
      {
        autoPrintBill && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-[#1c1c24] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    New Takeaway Served!
                  </h2>
                  <p className="text-sm text-white/50 mt-1">Order #{autoPrintBill.billNumber}</p>
                </div>
                <button
                  onClick={() => setAutoPrintBill(null)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <ReprintBill
                  bill={autoPrintBill}
                  onClose={() => setAutoPrintBill(null)}
                />
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}