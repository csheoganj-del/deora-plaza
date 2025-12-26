"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { getGardenBookings, deleteGardenBooking } from "@/actions/garden";
import { getBusinessSettings } from "@/actions/businessSettings";
import { Button } from "@/components/ui/button";
;
import { LayoutGrid, Calendar as CalendarIcon, Plus, Search, Filter, BarChart3, Users, IndianRupee, Clock } from "lucide-react";
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
    <div
      className="h-screen flex flex-col bg-[#F8FAFC]/50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="main"
      aria-label="Garden Management Dashboard"
    >
      {/* Header Section */}
      <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Garden Management</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">Manage event bookings, schedules, and billing</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <div className="bg-[#F1F5F9] p-1 rounded-lg border border-[#E5E7EB] flex" role="tablist" aria-label="View mode selection">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'shadow-sm' : ''}
              role="tab"
              aria-selected={viewMode === 'cards'}
              aria-controls="garden-view-content"
              id="cards-tab"
            >
              <LayoutGrid className="h-4 w-4 mr-2" /> Cards
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'shadow-sm' : ''}
              role="tab"
              aria-selected={viewMode === 'calendar'}
              aria-controls="garden-view-content"
              id="calendar-tab"
            >
              <CalendarIcon className="h-4 w-4 mr-2" /> Calendar
            </Button>
          </div>
          <Button
            className="bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md shadow-emerald-200"
            onClick={() => setIsNewBookingOpen(true)}
            aria-label="Create new booking"
          >
            <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">New Booking</span>
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-[#E5E7EB]">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="premium-card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-[#BBF7D0] text-[#22C55E]" aria-hidden="true">
                <Users className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF]">Total Events</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]" aria-hidden="true">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF]">Upcoming</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>

          {/* Active Bookings Card */}
          <div className="premium-card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-[#EDEBFF]/30 text-[#6D5DFB]" aria-hidden="true">
                <Clock className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF]">Active Bookings</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.activeEvents}</p>
                <p className="text-xs text-[#6D5DFB] mt-1">Ongoing &amp; Pending</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-[#EDEBFF]/30 text-[#6D5DFB]" aria-hidden="true">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF]">Revenue</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">₹{stats.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-[#EDEBFF] text-[#C084FC]" aria-hidden="true">
                <Users className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF]">Total Guests</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.guests.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" aria-hidden="true" />
          <Input
            placeholder="Search by name or mobile..."
            className="pl-10 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search bookings by customer name or mobile number"
          />
        </div>
        <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full sm:w-auto">
          <TabsList className="bg-white border">
            <TabsTrigger value="all" aria-label="Show all events">All Events</TabsTrigger>
            <TabsTrigger value="upcoming" aria-label="Show upcoming events">Upcoming</TabsTrigger>
            <TabsTrigger value="active" aria-label="Show active bookings with pending payments">Active</TabsTrigger>
            <TabsTrigger value="completed" aria-label="Show past events">Past</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6"
        id="garden-view-content"
        role="tabpanel"
        aria-labelledby={viewMode === 'cards' ? 'cards-tab' : 'calendar-tab'}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]" role="status" aria-label="Loading bookings"></div>
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              filteredBookings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredBookings.map((booking) => (
                    <GardenBookingCard
                      key={booking.id}
                      booking={booking}
                      onDelete={(b) => {
                        setDeleteBookingId(b.id);
                        if (passwordProtection) {
                          setIsDeleteDialogOpen(true);
                        } else {
                          // Bypass dialog
                          // We need to call a function that can handle delete directly.
                          // But handleDelete expects a password string.
                          // We can refactor handleDelete to be flexible or just pass empty string.
                          // But we can't call handleDelete directly with empty string because it uses 'deleteBookingId' state 
                          // which might not be updated yet if we call it immediately here.
                          // However, setDeleteBookingId(b.id) is async.
                          //
                          // Better: Call delete directly here with the ID.
                          // But we need the toast logic etc.
                          // Let's create a helper or just do it.
                          // Since we are in a map, we can't easily use state immediately.

                          // Quick fix: define an inline function or call deleteGardenBooking directly and handle UI.
                          // But to be consistent, we should reuse logical flow.

                          // Use a timeout 0 trick to allow state to settle, then call handleDelete("")
                          setTimeout(() => handleDelete(""), 0);
                        }
                      }}
                      onEdit={(b) => console.log("Edit", b.id)}
                      onViewBill={(b) => handleViewBooking(b)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F1F5F9] mb-4" aria-hidden="true">
                    <CalendarIcon className="h-8 w-8 text-[#9CA3AF]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#111827]">No bookings found</h3>
                  <p className="text-[#9CA3AF] mt-1">Try adjusting your search or create a new booking.</p>
                  <Button
                    className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                    onClick={() => setIsNewBookingOpen(true)}
                    aria-label="Create new booking"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Create Booking
                  </Button>
                </div>
              )
            ) : (
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
                <EventCalendar
                  bookings={filteredBookings}
                  onSelectDate={(date) => console.log("Date selected", date)}
                />
              </div>
            )}
          </>
        )}
      </div>

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

