"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getGardenBookings, deleteGardenBooking } from "@/actions/garden";
import { getBusinessSettings } from "@/actions/businessSettings";
import { LayoutGrid, Calendar as CalendarIcon, Plus, Search, Filter, BarChart3, Users, IndianRupee, Clock } from "lucide-react";
import { PremiumLiquidGlass, PremiumStatsCard } from "@/components/ui/glass/premium-liquid-glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCalendar from "@/components/garden/EventCalendar";
import { GardenBookingDialog } from "@/components/garden/GardenBookingDialog";
import { GardenBookingCard } from "@/components/garden/GardenBookingCard";
import { GardenBookingDetails } from "@/components/garden/GardenBookingDetails";
import { useToast } from "@/hooks/use-toast";
import { PasswordDialog } from "@/components/ui/PasswordDialog";


export default function GardenPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, upcoming, completed
  const [passwordProtection, setPasswordProtection] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    activeEvents: 0, // Add this new property
    revenue: 0,
    guests: 0
  });

  // Delete Logic
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
    getBusinessSettings().then(settings => {
      if (settings) {
        setPasswordProtection(settings.enablePasswordProtection ?? true);
      }
    });
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getGardenBookings();
      if ('bookings' in result && result.bookings) {
        setBookings(result.bookings);

        // Calculate stats
        const totalEvents = result.bookings.length;
        const now = new Date();
        const upcomingEvents = result.bookings.filter((b: any) => new Date(b.startDate) >= now).length;
        // Add active events (bookings with partial payments)
        const activeEvents = result.bookings.filter((b: any) => b.paymentStatus === 'partial').length;
        const revenue = result.bookings.reduce((sum: number, b: any) => sum + (b.totalPaid || 0), 0);
        const guests = result.bookings.reduce((sum: number, b: any) => sum + (b.guestCount || 0), 0);

        setStats({
          totalEvents,
          upcomingEvents,
          activeEvents, // Add this new stat
          revenue,
          guests
        });
      }
    } catch (error) {
      console.error("Failed to load garden bookings", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (password: string) => {
    if (!deleteBookingId) return;

    const result = await deleteGardenBooking(deleteBookingId, password);
    if (result.success) {
      toast({ title: "Success", description: "Booking deleted successfully" });
      loadData();
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete", variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
    setDeleteBookingId(null);
  }

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerMobile.includes(searchQuery);

    let matchesFilter = true;
    const now = new Date();
    const startDate = new Date(booking.startDate);

    if (filterStatus === 'upcoming') {
      matchesFilter = startDate >= now;
    } else if (filterStatus === 'completed') {
      matchesFilter = startDate < now; // simplistic past check
    } else if (filterStatus === 'active') {
      // Show bookings with partial payments (advance paid but not finalized)
      matchesFilter = booking.paymentStatus === 'partial';
    }

    return matchesSearch && matchesFilter;
  });

  // Keyboard navigation handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Close all dialogs when Escape is pressed
      setIsNewBookingOpen(false);
      setIsDetailsOpen(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-8 pb-32" onKeyDown={handleKeyDown} tabIndex={-1}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
            Garden Management
          </h1>
          <p className="text-white/50 mt-1">Manage event bookings, schedules, and billing</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>

          <Button
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-lg shadow-[#22C55E]/20 border-0"
            onClick={() => setIsNewBookingOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> New Booking
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <PremiumStatsCard
          title="Total Events"
          value={stats.totalEvents.toString()}
          icon={Users}
          delay={0.1}
        />
        <PremiumStatsCard
          title="Upcoming"
          value={stats.upcomingEvents.toString()}
          icon={CalendarIcon}
          trend="Upcoming"
          trendUp={true}
          delay={0.2}
        />
        <PremiumStatsCard
          title="Active"
          value={stats.activeEvents.toString()}
          icon={Clock}
          trend="Ongoing"
          trendUp={true}
          delay={0.3}
        />
        <PremiumStatsCard
          title="Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={IndianRupee}
          trend="+12%"
          trendUp={true}
          delay={0.4}
        />
        <PremiumStatsCard
          title="Guests"
          value={stats.guests.toLocaleString()}
          icon={Users}
          delay={0.5}
        />
      </div>

      <PremiumLiquidGlass title={viewMode === 'cards' ? "Bookings Overview" : "Calendar View"}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              placeholder="Search bookings..."
              className="w-full pl-10 h-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 flex-wrap">
            {['all', 'upcoming', 'active', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === status ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/20' : 'text-white/50 hover:text-white'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBookings.map((booking) => (
                    <GardenBookingCard
                      key={booking.id}
                      booking={booking}
                      onDelete={(b) => {
                        setDeleteBookingId(b.id);
                        if (passwordProtection) {
                          setIsDeleteDialogOpen(true);
                        } else {
                          setTimeout(() => handleDelete(""), 0);
                        }
                      }}
                      onEdit={(b) => console.log("Edit", b.id)}
                      onViewBill={(b) => handleViewBooking(b)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-white/40">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No bookings found</p>
                </div>
              )
            ) : (
              <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                <EventCalendar
                  bookings={filteredBookings}
                  onSelectDate={(date) => console.log("Date selected", date)}
                />
              </div>
            )}
          </>
        )}
      </PremiumLiquidGlass>

      <GardenBookingDialog
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        onSuccess={loadData}
      />

      <GardenBookingDetails
        booking={selectedBooking}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(b) => {
          console.log("Edit", b.id);
          setIsDetailsOpen(false);
        }}
        onDelete={(b) => {
          setDeleteBookingId(b.id);
          if (passwordProtection) {
            setIsDeleteDialogOpen(true);
          } else {
            setTimeout(() => handleDelete(""), 0);
          }
          setIsDetailsOpen(false);
        }}
      />

      <PasswordDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Booking"
        description="Are you sure you want to delete this booking? This action cannot be undone."
      />
    </div>
  );
}

