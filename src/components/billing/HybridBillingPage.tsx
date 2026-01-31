"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  Pencil,
  Filter
} from "lucide-react";
import { getBills, deleteBill } from "@/actions/billing";
import { getHotelBookings } from "@/actions/hotel";
import { getGardenBookings } from "@/actions/garden";
import { getBusinessSettings } from "@/actions/businessSettings";
import { printHotelReceipt, printGardenReceipt } from "@/lib/print-utils";
import { deleteHotelBooking } from "@/actions/hotel";
import { deleteGardenBooking } from "@/actions/garden";
import { format, isToday, isThisWeek, isThisMonth, startOfWeek, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

type TimeFilter = 'today' | 'week' | 'month' | 'all';

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

  // Time Filter State - Default 'today'
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  const searchParams = useSearchParams();
  const unitParam = searchParams?.get('unit') || undefined;
  const userRole = (session?.user as any)?.role;
  const isSuperUser = ['super_admin', 'owner'].includes(userRole);
  const userBusinessUnit = isSuperUser ? undefined : (session?.user?.businessUnit || undefined);
  const effectiveUnit = unitParam === 'all' ? undefined : unitParam || userBusinessUnit;

  const [autoPrintBill, setAutoPrintBill] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const processedRef = useRef(new Set<string>());
  const { toast } = useToast();

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
          if (newOrder.status === 'served') {
            if (processedRef.current.has(newOrder.id)) return;

            try {
              const fullOrder = await getOrderById(newOrder.id);
              if (!fullOrder) return;

              if (fullOrder.type && fullOrder.type.toLowerCase() === 'takeaway') {
                processedRef.current.add(newOrder.id);
                // @ts-ignore
                sonnerToast.loading(`Preparing Takeaway Bill #${fullOrder.orderNumber || '...'}`, { id: 'bill-process' });

                const result = await ensureBillForOrder(fullOrder.id);
                if (result.success && result.bill) {
                  setAutoPrintBill(result.bill);
                  // @ts-ignore
                  sonnerToast.dismiss('bill-process');
                  // @ts-ignore
                  sonnerToast.success(`Bill Ready: ${result.bill.billNumber}`);
                  loadBills(effectiveUnit);
                } else {
                  // @ts-ignore
                  sonnerToast.dismiss('bill-process');
                  // @ts-ignore
                  sonnerToast.error(`Bill Failed: ${result.error}`);
                  processedRef.current.delete(newOrder.id);
                }
              }
            } catch (err) {
              console.error("❌ [Billing] Exception in listener:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
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

    const filterParam = searchParams?.get('filter');
    if (filterParam === 'paid' || filterParam === 'settled') {
      setActiveTab('billed');
    } else if (filterParam === 'pending' || filterParam === 'unpaid') {
      setActiveTab('pending');
    } else if (filterParam === 'live' || filterParam === 'active') {
      setActiveTab('live');
    }

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
      if (settings) {
        setPasswordProtection(settings.enablePasswordProtection ?? true);
        setBusinessSettings(settings);
      }
    });
  }, []);


  const { data: liveOrders } = useRealtimeOrders({
    businessUnit: effectiveUnit,
  });

  const { tables, occupiedTables } = useRealtimeTables(effectiveUnit);
  const [serverLiveOrders, setServerLiveOrders] = useState<any[]>([]);

  const occupiedOrderIds = occupiedTables.map(t => t.currentOrderId).filter(Boolean);

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

  // ... (keeping delete logic) ...
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
    if (bill.businessUnit === 'garden') {
      let booking = gardenBookings.find(b => b.id === bill.orderId || b.id === bill.id);
      if (!booking) {
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
        const { getHotelBookingById } = await import("@/actions/hotel");
        booking = await getHotelBookingById(bill.orderId || bill.id);
      }
      if (booking) {
        printHotelReceipt(booking, businessSettings);
        return;
      }
    }

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



  const handlePasswordSuccess = async (password: string) => {
    // ... (keeping delete logic same) ...
    if (billToDelete) {
      const billObj = bills.find(b => b.id === billToDelete);
      const result = await deleteBill(billToDelete, password, billObj?.businessUnit);
      if (result.success) {
        setBills(bills.filter(bill => bill.id !== billToDelete));
        if (selectedBills.includes(billToDelete)) {
          setSelectedBills(selectedBills.filter(id => id !== billToDelete));
        }
        toast({ title: "Success", description: "Bill deleted successfully" });
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete bill", variant: "destructive" });
      }
    } else if (selectedBills.length > 0) {
      const { bulkDeleteBills } = await import("@/actions/billing");
      const result = await bulkDeleteBills(selectedBills, password);
      if (result.success) {
        setBills(bills.filter(bill => !selectedBills.includes(bill.id)));
        setSelectedBills([]);
        toast({ title: "Success", description: `Deleted ${selectedBills.length} bills successfully` });
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete bills", variant: "destructive" });
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

  // ... (export/import logic usually here) ...
  // Simplified for brevity in replacement, but keeping original structure is key. 
  // I will just link export functions to placeholders if not changing them, 
  // but since I'm replacing the whole file content block, I need to keep them or imports break.
  // I'll keep the export logic as it was in original mostly.

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
      const XLSX = await import('xlsx');
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
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');
      XLSX.writeFile(workbook, `bills-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: "Success", description: `Exported ${bills.length} bills to Excel` });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({ title: "Error", description: "Failed to export to Excel.", variant: "destructive" });
    }
  };

  const triggerFileInput = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const importFromJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... keep existing import logic ...
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        let billsToImport: any[] = Array.isArray(jsonData) ? jsonData : (jsonData.bills || jsonData.data || [jsonData]);
        if (!Array.isArray(billsToImport)) { alert('Invalid JSON'); return; }
        const { createBill } = await import("@/actions/billing");
        let successCount = 0;
        for (const bill of billsToImport) {
          const billData = {
            // ... map fields ...
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
          loadBills(effectiveUnit);
        }
      } catch (e) { alert('Error parsing JSON'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  // --- FILTERING LOGIC ---
  const timeFilteredBills = useMemo(() => {
    if (timeFilter === 'all') return bills;

    const now = new Date();
    return bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      if (timeFilter === 'today') {
        return isToday(billDate);
      } else if (timeFilter === 'week') {
        // Week starts on Monday (weekStartsOn: 1)
        return isThisWeek(billDate, { weekStartsOn: 1 });
      } else if (timeFilter === 'month') {
        return isThisMonth(billDate);
      }
      return true;
    });
  }, [bills, timeFilter]);

  // Use filtered bills for stats and list
  const filteredBills = activeTab === "billed"
    ? timeFilteredBills.filter(bill => bill.paymentStatus === "paid")
    : activeTab === "pending"
      ? timeFilteredBills.filter(bill => bill.paymentStatus !== "paid")
      : [];

  const billedCount = timeFilteredBills.filter(bill => bill.paymentStatus === "paid").length;
  const pendingCount = timeFilteredBills.filter(bill => bill.paymentStatus !== "paid").length;
  const liveCount = activeLiveOrders.length; // Live orders are live, don't filter by time generally, or maybe we should? No, live is live.

  const totalRevenue = timeFilteredBills.filter(bill => bill.paymentStatus === "paid")
    .reduce((sum, bill) => sum + bill.grandTotal, 0);
  const pendingAmount = timeFilteredBills.filter(bill => bill.paymentStatus !== "paid")
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

          {/* Time Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 min-w-[120px]">
                <Filter className="h-4 w-4 mr-2" />
                {timeFilter === 'today' ? "Today" :
                  timeFilter === 'week' ? "This Week" :
                    timeFilter === 'month' ? "This Month" : "All Time"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-200">
              <DropdownMenuItem onClick={() => setTimeFilter('today')} className="focus:bg-zinc-800 cursor-pointer">
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('week')} className="focus:bg-zinc-800 cursor-pointer">
                This Week (Mon-Sun)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('month')} className="focus:bg-zinc-800 cursor-pointer">
                This Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter('all')} className="focus:bg-zinc-800 cursor-pointer">
                All Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={exportToJSON} className="bg-white/5 border-white/10 text-white hover:bg-white/10 hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          {/* Hidden Input for Import */}
          <input type="file" ref={fileInputRef} onChange={importFromJSON} accept=".json" className="hidden" />
          <Button variant="outline" size="sm" onClick={triggerFileInput} className="bg-white/5 border-white/10 text-white hover:bg-white/10 hidden sm:flex">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadBills(effectiveUnit)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <RefreshCw className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>

      {/* Stats - Now using Filtered Data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumStatsCard
          title="Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          icon={<IndianRupee className="h-4 w-4 text-[#22C55E]" />}
          trend={{ value: billedCount, label: "billed orders", positive: true }}
          className={timeFilter === 'today' ? "border-emerald-500/20" : ""}
        />
        <PremiumStatsCard
          title="Pending"
          value={`₹${pendingAmount.toLocaleString()}`}
          icon={<Clock className="h-4 w-4 text-orange-400" />}
          trend={{ value: pendingCount, label: "pending orders", positive: false }}
        />
        <PremiumStatsCard
          title="Total Bills"
          value={timeFilteredBills.length.toString()}
          icon={<FileText className="h-4 w-4 text-blue-400" />}
          trend={{ value: 0, label: timeFilter === 'all' ? "All time" : "Selected period", positive: true }}
        />
        <PremiumStatsCard
          title="Avg Bill Value"
          value={`₹${filteredBills.length > 0 ? Math.round(totalRevenue / (billedCount || 1)).toLocaleString() : 0}`}
          icon={<TrendingUp className="h-4 w-4 text-purple-400" />}
          trend={{ value: 0, label: "Per order", positive: true }}
        />
      </div>

      {/* Bills Management - Unified View */}
      <PremiumLiquidGlass className="flex flex-col" title={`Bills Management${isSuperUser && effectiveUnit === undefined ? ' - All Units' : ''}`}>
        <div className="flex gap-4 mb-6 px-1 flex-wrap">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${activeTab === "live"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              }`}
          >
            <ClockIcon className="h-4 w-4" />
            Live ({liveCount})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${activeTab === "pending"
              ? "bg-orange-500/10 text-orange-400 border-orange-400/20"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              }`}
          >
            <Clock className="h-4 w-4" />
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("billed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${activeTab === "billed"
              ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              }`}
          >
            <CheckCircle className="h-4 w-4" />
            Settled ({billedCount})
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
              <p className="text-xs opacity-50 mt-1">Try changing the time filter</p>
            </div>
          ) : (
            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 p-4 text-xs font-medium text-white/40 border-b border-white/5 uppercase tracking-wider min-w-[1000px]">
                <div className="w-8">
                  <input type="checkbox" checked={selectedBills.length === bills.length && bills.length > 0} onChange={toggleSelectAll} className="rounded border-white/20 bg-white/5" />
                </div>
                <div>Bill No</div>
                <div>Date</div>
                <div>Customer</div>
                <div className="text-right">Amount</div>
                <div className="text-center">Status</div>
                <div className="text-center">Type</div>
                <div className="text-right pr-4">Actions</div>
              </div>

              {/* Table Body */}
              <div className="min-w-[1000px]">
                {filteredBills.map((bill) => (
                  <div key={bill.id} className="grid grid-cols-[auto_1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 p-4 text-sm text-white/80 border-b border-white/5 hover:bg-white/5 transition-colors items-center group">
                    <div className="w-8">
                      <input type="checkbox" checked={selectedBills.includes(bill.id)} onChange={() => toggleBillSelection(bill.id)} className="rounded border-white/20 bg-white/5" />
                    </div>
                    <div className="font-mono font-medium text-indigo-300">{bill.billNumber}</div>
                    <div className="text-xs">
                      <div className="text-white/80">{format(new Date(bill.createdAt), "dd MMM, yyyy")}</div>
                      <div className="text-white/40">{format(new Date(bill.createdAt), "hh:mm a")}</div>
                    </div>
                    <div>
                      <div className="text-white">{bill.customerName || "Walk-in"}</div>
                      <div className="text-xs text-white/40">{bill.customerMobile}</div>
                    </div>
                    <div className="text-right font-mono font-bold">₹{bill.grandTotal.toLocaleString()}</div>
                    <div className="flex justify-center">
                      <Badge variant="outline" className={bill.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}>
                        {bill.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-center">
                      <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-widest ${getBusinessUnitColor(bill.businessUnit)}`}>
                        {bill.businessUnit}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 hover:text-white" onClick={() => handleEdit(bill)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-400" onClick={() => handleReprint(bill)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400" onClick={(e) => handleDelete(bill.id, e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PremiumLiquidGlass>

      {/* Dialogs */}
      <PasswordDialog isOpen={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)} onConfirm={handlePasswordSuccess} title="Confirm Deletion" description="Are you sure you want to delete this bill? This action cannot be undone." />
      {selectedBill && <ReprintBill bill={selectedBill} open={showReprint} onOpenChange={setShowReprint} />}
      {billToEdit && <EditBillDialog bill={billToEdit} open={showEditDialog} onOpenChange={setShowEditDialog} onBillUpdated={handleBillUpdated} />}
      {orderToBill && <BillGenerator order={orderToBill} open={showBillGenerator} onOpenChange={setShowBillGenerator} onBillGenerated={() => loadBills(effectiveUnit)} />}
    </div>
  );
}