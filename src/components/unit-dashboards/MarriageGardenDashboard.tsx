import { useState, useEffect } from "react";
import { getGardenBookings, deleteGardenBooking, cancelGardenBooking } from "@/actions/garden";
import { GardenBookingDialog } from "@/components/garden/GardenBookingDialog";
import { RecordPaymentDialog } from "@/components/garden/RecordPaymentDialog";
import EventCalendar from "@/components/garden/EventCalendar";
import { printGardenReceipt } from "@/lib/print-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  RefreshCw,
  Printer,
  IndianRupee,
  Calendar as CalendarIcon,
  Users,
  MoreVertical,
  Pencil,
  Ban,
  Trash2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getBusinessSettings } from "@/actions/businessSettings";

interface MarriageGardenMetrics {
  dailyRevenue: number;
  activeEvents: number;
  upcomingEvents: number;
  totalBookings: number;
  averageBookingValue: number;
  staffOnDuty: number;
  maintenanceRequests: number;
  bookings: any[];
}

export function MarriageGardenDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  // Edit State
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<any>(null);

  // Payment Dialog State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null);

  const [metrics, setMetrics] = useState<MarriageGardenMetrics>({
    dailyRevenue: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    totalBookings: 0,
    averageBookingValue: 0,
    staffOnDuty: 4, // Placeholder
    maintenanceRequests: 0,
    bookings: []
  });
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const result = await getGardenBookings();
      if ('error' in result) {
        console.error("Failed to load bookings:", result.error);
        return;
      }

      const { bookings } = result;

      const now = new Date();
      const upcoming = bookings?.filter((b: any) => new Date(b.startDate) > now).length || 0;
      const active = bookings?.filter((b: any) => {
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        return now >= start && now <= end;
      }).length || 0;

      // Calculate Revenue (Total Paid across all bookings)
      const totalRevenue = bookings?.reduce((sum: number, b: any) => sum + (b.totalPaid || 0), 0) || 0;

      // Calculate Average Booking Value (based on total Amount)
      const totalBookingValue = bookings?.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0) || 0;
      const avgValue = bookings?.length ? totalBookingValue / bookings.length : 0;

      setMetrics(prev => ({
        ...prev,
        bookings: bookings || [],
        activeEvents: active,
        upcomingEvents: upcoming,
        totalBookings: bookings?.length || 0,
        dailyRevenue: totalRevenue, // Using total collected for now as daily specific action needs param
        averageBookingValue: avgValue
      }));

    } catch (error) {
      console.error("Failed to load garden data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await getBusinessSettings();
      if (settings) {
        setBusinessSettings(settings);
      }
    } catch (error) {
      console.error("Failed to load business settings", error);
    }
  };

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const handleRecordPayment = (booking: any) => {
    setSelectedBookingForPayment(booking);
    setIsPaymentOpen(true);
  };

  const handlePrintReceipt = async (booking: any) => {
    try {
      const settings = await getBusinessSettings();
      printGardenReceipt(booking as any, settings);
    } catch (error) {
      console.error("Failed to fetch settings for print:", error);
      // Fallback to state if fetch fails
      printGardenReceipt(booking as any, businessSettings);
    }
  };

  const handleEditBooking = (booking: any) => {
    setSelectedBookingForEdit(booking);
    setIsNewBookingOpen(true);
  };

  const handleCancelBooking = async (booking: any) => {
    if (!confirm(`Are you sure you want to cancel the booking for ${booking.customerName}?`)) return;

    const result = await cancelGardenBooking(booking.id);
    if (result.success) {
      toast({ title: "Booking Cancelled", description: "Status updated successfully." });
      loadData();
    } else {
      toast({ title: "Error", description: result.error || "Failed to cancel booking", variant: "destructive" });
    }
  };

  const handleDeleteBooking = async (booking: any) => {
    const password = prompt("Enter Admin Password to delete this booking:");
    if (!password) return;

    const result = await deleteGardenBooking(booking.id, password);
    if (result.success) {
      toast({ title: "Booking Deleted", description: "Record removed successfully." });
      loadData();
    } else {
      // If error is generic, specific error alert from prompt might be better, but toast is standard
      toast({ title: "Deletion Failed", description: "Incorrect password or permission denied.", variant: "destructive" });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Marriage Garden</h1>
          <p className="text-white/60">Event Management & Bookings</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={refreshing}
            className="border-white/10 text-white hover:bg-white/5 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedBookingForEdit(null);
              setIsNewBookingOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="premium-glass p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="relative">
            <p className="text-emerald-400/80 font-medium text-sm uppercase tracking-wider mb-1">Total Revenue</p>
            <h3 className="text-3xl font-bold text-white">{formatCurrency(metrics.dailyRevenue)}</h3>
            <div className="mt-4 flex items-center text-xs text-emerald-300/60 bg-emerald-500/10 w-fit px-2 py-1 rounded-full">
              <IndianRupee className="w-3 h-3 mr-1" />
              Calculated from {metrics.totalBookings} bookings
            </div>
          </div>
        </div>

        {/* Active Events */}
        <div className="premium-glass p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="relative">
            <p className="text-blue-400/80 font-medium text-sm uppercase tracking-wider mb-1">Active Events</p>
            <h3 className="text-3xl font-bold text-white">{metrics.activeEvents}</h3>
            <div className="mt-4 flex items-center text-xs text-blue-300/60 bg-blue-500/10 w-fit px-2 py-1 rounded-full">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {metrics.upcomingEvents} Upcoming
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="premium-glass p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="relative">
            <p className="text-purple-400/80 font-medium text-sm uppercase tracking-wider mb-1">Total Bookings</p>
            <h3 className="text-3xl font-bold text-white">{metrics.totalBookings}</h3>
            <div className="mt-4 flex items-center text-xs text-purple-300/60 bg-purple-500/10 w-fit px-2 py-1 rounded-full">
              <Users className="w-3 h-3 mr-1" />
              Avg: {formatCurrency(metrics.averageBookingValue)}
            </div>
          </div>
        </div>

        {/* Staff/Maintenance */}
        <div className="premium-glass p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
          <div className="relative">
            <p className="text-orange-400/80 font-medium text-sm uppercase tracking-wider mb-1">Operations</p>
            <h3 className="text-3xl font-bold text-white">{metrics.staffOnDuty}</h3>
            <p className="text-xs text-orange-300/50 mt-1">Staff On Duty</p>
            <div className="mt-3 flex items-center text-xs text-orange-300/60 bg-orange-500/10 w-fit px-2 py-1 rounded-full">
              Maintenance OK
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Calendar & Recents */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="premium-glass p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-emerald-400" />
              Event Calendar
            </h3>
            <EventCalendar
              bookings={metrics.bookings}
              onSelectDate={(date) => console.log(date)}
            />
          </div>
        </div>

        {/* Recent Bookings List */}
        <div className="premium-glass p-6 rounded-2xl border border-white/10 xl:h-full overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Recent Bookings</h3>
            <Button variant="ghost" size="sm" className="text-xs text-white/50 h-auto p-0 hover:text-white">View All</Button>
          </div>

          <div className="overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-1">
            {metrics.bookings.length === 0 ? (
              <div className="text-center text-white/30 py-10 text-sm">No bookings found</div>
            ) : (
              [...metrics.bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((booking: any) => (
                <div key={booking.id} className="relative bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-emerald-500/30 transition-all duration-300 group shadow-lg shadow-black/40">

                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-bold text-white text-lg tracking-tight truncate">{booking.customerName}</h4>
                        {booking.eventType === 'marriage' && <span className="text-base animate-pulse">💍</span>}
                      </div>
                      <div className="flex items-center text-xs text-zinc-400 gap-2">
                        <div className="bg-white/5 px-2 py-0.5 rounded text-white/80 border border-white/5 capitalize text-[11px] font-medium">
                          {booking.eventType}
                        </div>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-zinc-500" />
                          {format(new Date(booking.startDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <Badge variant="outline" className={`${getStatusColor(booking.status)} uppercase text-[10px] px-2.5 h-6 border tracking-wide font-semibold`}>
                        {booking.status}
                      </Badge>

                      {/* Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-200">
                          <DropdownMenuLabel className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Manage Booking</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem onClick={() => handleEditBooking(booking)} className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2.5">
                            <Pencil className="w-4 h-4 mr-3 text-blue-500" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintReceipt(booking)} className="focus:bg-zinc-900 focus:text-white cursor-pointer py-2.5">
                            <Printer className="w-4 h-4 mr-3 text-emerald-500" />
                            Reprint Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem onClick={() => handleCancelBooking(booking)} className="focus:bg-zinc-900 focus:text-white cursor-pointer text-orange-400 hover:text-orange-400 py-2.5">
                            <Ban className="w-4 h-4 mr-3" />
                            Cancel Booking
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteBooking(booking)} className="focus:bg-zinc-900 focus:text-white cursor-pointer text-red-500 hover:text-red-500 py-2.5">
                            <Trash2 className="w-4 h-4 mr-3" />
                            Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Finance Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/40 rounded-xl p-3 flex flex-col justify-center border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-0.5">Total Bill</span>
                      <span className="text-base font-bold text-white tracking-tight">{formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div className={`rounded-xl p-3 flex flex-col justify-center border ${booking.remainingBalance > 0 ? "bg-red-500/5 border-red-500/10" : "bg-emerald-500/5 border-emerald-500/10"}`}>
                      <span className={`text-[10px] uppercase tracking-wider font-medium mb-0.5 ${booking.remainingBalance > 0 ? "text-red-400/80" : "text-emerald-400/80"}`}>
                        {booking.remainingBalance > 0 ? "Balance Due" : "Payment Status"}
                      </span>
                      <span className={`text-base font-bold tracking-tight ${booking.remainingBalance > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {booking.remainingBalance > 0 ? formatCurrency(booking.remainingBalance) : "PAID"}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <Button
                    size="sm"
                    className={`w-full h-9 text-xs font-semibold tracking-wide border-0 transition-all ${booking.remainingBalance > 0 ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}
                    onClick={() => handleRecordPayment(booking)}
                    disabled={booking.status === 'cancelled'}
                  >
                    {booking.remainingBalance > 0 ? (
                      <>
                        <IndianRupee className="w-3.5 h-3.5 mr-2" />
                        RECORD PAYMENT
                      </>
                    ) : (
                      "VIEW PAYMENT HISTORY"
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <GardenBookingDialog
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setSelectedBookingForEdit(null);
        }}
        onSuccess={loadData}
        booking={selectedBookingForEdit}
      />

      {selectedBookingForPayment && (
        <RecordPaymentDialog
          booking={selectedBookingForPayment}
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedBookingForPayment(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

    </div>
  );
}
