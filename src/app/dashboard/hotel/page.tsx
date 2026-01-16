"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Room, HotelBooking, getRooms, getHotelBookings, deleteRoom, createRoom, updateRoom, deleteHotelBooking, checkInGuest, checkOutGuest, markRoomCleaned, createHotelBooking, updateHotelBooking } from "@/actions/hotel"; // Added missing imports
import { createClient } from "@/lib/supabase/client";
import { DateRange } from "react-day-picker";
import { getBusinessSettings } from "@/actions/businessSettings";
import {
  Bed,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  Users,
  IndianRupee,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  MoreVertical,
  X,
  Utensils,
  GlassWater
} from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import RoomGrid from "@/components/hotel/RoomGrid";
// import HotelSearchBar from "@/components/hotel/HotelSearchBar"; // Replaced by GlassInput
import { useToast } from "@/hooks/use-toast";
import HotelBookingsSection from "@/components/hotel/HotelBookingsSection";
import { HotelBookingDetails } from "@/components/hotel/HotelBookingDetails";
import HotelBookingForm from "@/components/hotel/HotelBookingForm";
import RoomForm from "@/components/hotel/RoomForm";
import { HotelBookingCard } from "@/components/hotel/HotelBookingCard";
import { LiveRoomServiceOrders } from "@/components/hotel/LiveRoomServiceOrders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PasswordDialog } from "@/components/ui/PasswordDialog";

// NEW LIQUID GLASS IMPORTS
import { PremiumLiquidGlass, PremiumStatsCard, PremiumContainer } from "@/components/ui/glass/premium-liquid-glass";
import { GlassButton, GlassInput } from "@/components/ui/glass/GlassFormComponents";
import { GlassDateRangePicker } from "@/components/ui/glass/GlassDatePicker";
import { motion } from "framer-motion";

export default function HotelPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [passwordProtection, setPasswordProtection] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [editingBooking, setEditingBooking] = useState<HotelBooking | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // Default to list for better data density
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "upcoming" | "completed">("all");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<HotelBooking | null>(null);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);


  // Stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0,
    revenue: 0,
    totalCollected: 0,
    totalDue: 0,
    occupiedRooms: 0
  });

  const { toast } = useToast();
  const supabase = createClient();

  const filteredRooms = rooms.filter(room =>
    room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadData = async () => {
    // console.log("=== LOADING HOTEL DATA ===");
    try {
      setLoading(true);
      const roomsResult = await getRooms();
      const bookingsResult = await getHotelBookings();
      const settings = await getBusinessSettings();
      if (settings) {
        setSettings(settings);
        setPasswordProtection(settings.enablePasswordProtection ?? true);
      }

      setRooms(roomsResult || []);
      setBookings(bookingsResult || []);

      console.log("DEBUG: Raw Bookings Result:", bookingsResult);
      console.log("DEBUG: Rooms Result:", roomsResult);
      console.log("[Hotel] 📊 Data loaded - Rooms:", roomsResult?.length, "Bookings:", bookingsResult?.length);

      // Calculate stats
      if (bookingsResult && Array.isArray(bookingsResult)) {
        const totalBookings = bookingsResult.length;
        const now = new Date();

        const activeBookings = bookingsResult.filter((b: any) =>
          b.status === 'confirmed' || b.status === 'checked-in'
        ).length;

        const upcomingBookings = bookingsResult.filter((b: any) =>
          new Date(b.startDate) > now && b.status === 'confirmed'
        ).length;

        // Calculate Financials
        let totalCollected = 0;
        let totalDue = 0;

        bookingsResult.forEach((b: any) => {
          const paid = Number(b.paidAmount) || Number(b.totalPaid) || Number(b.advancePayment) || 0;
          const total = Number(b.totalAmount) || 0;
          const due = Math.max(0, total - paid);

          totalCollected += paid;
          totalDue += due;
        });

        const occupiedRooms = roomsResult ? roomsResult.filter((r: any) =>
          r.status === 'occupied'
        ).length : 0;

        setStats({
          totalBookings,
          activeBookings,
          upcomingBookings,
          revenue: totalCollected, // Keep revenue as collected for backward compact
          totalCollected,
          totalDue,
          occupiedRooms
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      // console.log("=== LOADING HOTEL DATA END ===");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time subscription for bookings
  useEffect(() => {
    console.log("[Hotel] Setting up real-time subscription for bookings...");
    const channel = supabase
      .channel("hotel-dashboard-bookings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload: any) => {
          console.log("[Hotel] Booking change detected:", payload.eventType, payload.new?.id || payload.old?.id);

          if (payload.eventType === "INSERT") {
            // New booking created - reload to get fresh data
            console.log("[Hotel] New booking created, refreshing...");
            loadData();
            toast({
              title: "New Booking",
              description: `Booking for ${payload.new?.guestName || 'guest'} added`,
            });
          } else if (payload.eventType === "UPDATE") {
            // Booking updated - reload to get fresh data
            console.log("[Hotel] Booking updated, refreshing...");
            loadData();
          } else if (payload.eventType === "DELETE") {
            // Booking deleted - remove from state immediately
            console.log("[Hotel] Booking deleted, removing from list...");
            setBookings(prev => prev.filter(b => b.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Hotel] Real-time subscription status: ${status}`);
      });

    return () => {
      console.log("[Hotel] Cleaning up real-time subscription");
      channel.unsubscribe();
    };
  }, []);

  const handleBookingClick = (booking: HotelBooking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleEditBooking = (booking: HotelBooking) => {
    setEditingBooking(booking);
    setShowAddBooking(true);
  };

  const handleDeleteBooking = async (booking: HotelBooking) => {
    setBookingToDelete(booking);
    if (passwordProtection) {
      setIsPasswordDialogOpen(true);
    } else {
      await executeDeleteBooking(booking.id!);
    }
  };

  const executeDeleteBooking = async (bookingId: string, password = "") => {
    try {
      const result = await deleteHotelBooking(bookingId, password);
      if (result.success) {
        toast({
          title: "Success",
          description: "Booking deleted successfully",
        });
        setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId));
        loadData();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: (result.error as string) || "Failed to delete booking",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive"
      });
    } finally {
      setBookingToDelete(null);
    }
  }

  const handlePasswordSuccess = async (password: string) => {
    if (!bookingToDelete?.id) return;
    await executeDeleteBooking(bookingToDelete.id, password);
    setIsPasswordDialogOpen(false);
  };

  const handleBookingUpdated = async (updatedBooking?: any) => {
    const currentBookingId = selectedBooking?.id;

    if (updatedBooking) {
      if (selectedBooking && selectedBooking.id === updatedBooking.id) {
        setSelectedBooking(updatedBooking);
      }
      setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    }
    await loadData();

    // After loading fresh data, fetch and update selectedBooking if it's still open
    if (currentBookingId) {
      const freshBookings = await getHotelBookings();
      const freshBooking = freshBookings?.find((b: any) => b.id === currentBookingId);
      if (freshBooking) {
        setSelectedBooking(freshBooking);
      }
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const roomId = booking?.roomId;
    if (!booking || !roomId) {
      toast({ title: "Error", description: "Booking or room not found", variant: "destructive" });
      return;
    }
    try {
      const result = await checkInGuest(bookingId, roomId);
      if (result.success) {
        toast({ title: "Guest checked in", description: `Room ${booking.roomNumber}` });
        await loadData();
        router.refresh();
      } else {
        toast({ title: "Check-in failed", description: String(result.error || "Unknown error"), variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Check-in error", description: error.message || "Failed to check in", variant: "destructive" });
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const roomId = booking?.roomId;
    if (!booking || !roomId) {
      toast({ title: "Error", description: "Booking or room not found", variant: "destructive" });
      return;
    }

    // Check for remaining balance and warn user
    const balance = booking.remainingBalance || (booking.totalAmount - (booking.paidAmount || booking.advancePayment || 0));
    if (balance > 0) {
      toast({
        title: "Unpaid Balance",
        description: `Guest has a pending balance of ₹${balance.toLocaleString()}. Room will be marked for cleaning.`,
        variant: "default"
      });
    }

    try {
      const result = await checkOutGuest(bookingId, roomId);
      if (result.success) {
        const statusMsg = balance > 0
          ? `Room ${booking.roomNumber} checked out - marked for cleaning`
          : `Room ${booking.roomNumber} checked out - now available`;
        toast({ title: "Guest checked out", description: statusMsg });
        await loadData();
        router.refresh();
      } else {
        toast({ title: "Check-out failed", description: String(result.error || "Unknown error"), variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Check-out error", description: error.message || "Failed to check out", variant: "destructive" });
    }
  };

  const handleSelectRoom = (room: Room) => {
    console.log("[Hotel] Room clicked:", room.number, "Status:", room.status, "ID:", room.id);

    if (room.status === 'available') {
      setSelectedRoomForBooking(room);
      setShowAddBooking(true);
    } else if (room.status === 'occupied' || room.status === 'cleaning' || room.status === 'maintenance') {
      console.log("[Hotel] Room is occupied/unavailable, searching for booking...");
      console.log("[Hotel] Total bookings:", bookings.length);

      // Find active booking for this room
      const activeBooking = bookings.find(b =>
        (b.status === 'confirmed' || b.status === 'checked-in') &&
        b.roomId === room.id
      );

      console.log("[Hotel] Booking found by roomId:", activeBooking?.id);

      // Note: bookings usually have roomId. 
      // If we can't find by ID, try number (but ID is safer)
      const booking = activeBooking || bookings.find(b =>
        (b.status === 'confirmed' || b.status === 'checked-in') &&
        b.roomNumber === room.number
      );

      console.log("[Hotel] Final booking:", booking?.id, "Guest:", booking?.guestName);

      if (booking) {
        console.log("[Hotel] Opening booking details for:", booking.guestName);
        handleBookingClick(booking);
      } else {
        console.warn("[Hotel] No booking found for occupied room!", room.number);
        toast({
          title: "Room Unavailable",
          description: `Room is currently ${room.status}. Booking details not found.`,
        });
      }
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setShowEditRoom(true);
  };

  const handleDeleteRoom = async (room: Room, password?: string) => {
    try {
      const result = await deleteRoom(room.id!, password || "");
      if (result.success) {
        toast({ title: "Success", description: "Room deleted successfully" });
        loadData();
      } else {
        toast({
          title: "Error",
          description: (result.error as string) || "Failed to delete room",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRoom = async (data: Omit<Room, "id" | "createdAt" | "updatedAt">) => {
    if (!editingRoom?.id) return;
    setCreatingRoom(true);
    try {
      const result = await updateRoom(editingRoom.id, data);
      if (result.success) {
        toast({ title: "Success", description: "Room updated successfully" });
        setShowEditRoom(false);
        setEditingRoom(null);
        loadData();
      } else {
        toast({
          title: "Error",
          description: (result.error as string) || "Failed to update room",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive"
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleCreateRoom = async (data: Omit<Room, "id" | "createdAt" | "updatedAt">) => {
    setCreatingRoom(true);
    try {
      const result = await createRoom(data);
      if (result.success) {
        toast({ title: "Success", description: "Room created successfully" });
        setShowAddRoom(false);
        setIsAddRoomOpen(false); // Close the dialog
        loadData();
      } else {
        toast({
          title: "Error",
          description: (result.error as string) || "Failed to create room",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive"
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleCreateBooking = async (data: any) => {
    setCreatingBooking(true);
    try {
      console.log("[Hotel] Creating booking...", data);
      const result = await createHotelBooking(data);

      if (result.success) {
        console.log("[Hotel] ✅ Booking created successfully:", result.id);
        toast({ title: "Success", description: "Booking created successfully" });
        setShowAddBooking(false);
        setSelectedRoomForBooking(null);

        // AUTO-PRINT ADVANCE RECEIPT
        if (data.advancePayment > 0 && result.data) {
          const { printHotelReceipt } = await import("@/lib/print-utils");
          printHotelReceipt(result.data, settings, 'advance');
        }

        // Force immediate refresh to show new booking
        console.log("[Hotel] 🔄 Force refreshing data...");
        await loadData();

        // Also trigger router refresh
        router.refresh();

        console.log("[Hotel] ✅ Data refreshed");
      } else {
        console.error("[Hotel] ❌ Booking creation failed:", result.error);
        toast({
          title: "Error",
          description: (result.error as string) || "Failed to create booking",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("[Hotel] ❌ Exception during booking creation:", error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleUpdateBooking = async (data: any) => {
    if (!editingBooking?.id) return;
    setCreatingBooking(true);
    try {
      const result = await updateHotelBooking(editingBooking.id, data);
      if (result.success) {
        toast({ title: "Success", description: "Booking updated successfully" });
        setShowAddBooking(false);
        setEditingBooking(null);
        await loadData();
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: (result.error as string) || "Failed to update booking",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleMarkCleaned = async (room: Room) => {
    if (!room.id) return;
    try {
      const result = await markRoomCleaned(room.id);
      if (result.success) {
        toast({ title: "Room ready", description: `Room ${room.number} marked available` });
        await loadData();
        router.refresh();
      } else {
        toast({ title: "Failed", description: String(result.error || "Unable to mark cleaned"), variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update room", variant: "destructive" });
    }
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    // 1. Search Filter (if query exists)
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        (booking.guestName?.toLowerCase().includes(q) || false) ||
        (booking.customerMobile?.includes(q) || false) ||
        (booking.roomNumber?.includes(q) || false);
    }

    // 2. Status Filter
    let matchesFilter = true;
    const now = new Date();
    // Safely parse dates
    const startDate = booking.startDate ? new Date(booking.startDate) : new Date();

    if (filterStatus === 'active') {
      matchesFilter = booking.status === 'confirmed' || booking.status === 'checked-in';
    } else if (filterStatus === 'upcoming') {
      matchesFilter = startDate > now && booking.status === 'confirmed';
    } else if (filterStatus === 'completed') {
      matchesFilter = booking.status === 'checked-out' || booking.status === 'cancelled';
    }

    // 3. Date Range Filter
    let matchesRange = true;
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      // Reset times for date comparison
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      const bStart = new Date(booking.startDate);
      const bEnd = new Date(booking.endDate);

      // Check for overlap or containment depending on requirement. 
      // Usually "show bookings within this range" means if they overlap the range.
      // But simple "start date within range" is often easier.
      // Let's use: start OR end falls within range, OR range falls within booking.
      // Simple Overlap Logic: Start(A) <= End(B) AND End(A) >= Start(B)
      matchesRange = bStart <= to && bEnd >= from;
    }

    const passes = matchesSearch && matchesFilter && matchesRange;

    // Debug logging for first booking
    if (booking.id && bookings.indexOf(booking) === 0) {
      console.log("[Hotel] Filter Debug - First Booking:", {
        id: booking.id,
        guestName: booking.guestName,
        status: booking.status,
        filterStatus: filterStatus,
        matchesSearch,
        matchesFilter,
        matchesRange,
        passes
      });
    }

    return passes;
  });

  console.log(`[Hotel] Total bookings: ${bookings.length}, Filtered: ${filteredBookings.length}, Filter: ${filterStatus}, Search: "${searchQuery}", DateRange: ${dateFrom ? 'YES' : 'NO'}`);

  const handleRoomService = (room: Room) => {
    toast({
      title: "Room Service",
      description: "To add food billing, use the POS system and select this room.",
    });
  };

  const handleDeleteBookingDirect = async (bookingId: string, password?: string) => {
    await executeDeleteBooking(bookingId, password || "");
  };

  const handleResetStatus = async (room: Room) => {
    if (!room.id) return;
    try {
      // Force status to available
      // @ts-ignore - explicitly enabling status override
      const result = await updateRoom(room.id, { status: 'available' });
      if (result.success) {
        toast({ title: "Room Reset", description: `Room ${room.number} forced to available status` });
        await loadData();
        router.refresh();
      } else {
        toast({ title: "Failed", description: String(result.error || "Unable to reset status"), variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update room", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70"
          >
            Hotel Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-white/50 mt-1"
          >
            Guest Management & Operations
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
            >
              Cards
            </button>
          </div>
          <GlassButton
            onClick={() => setIsAddRoomOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Room
          </GlassButton>
        </div>
      </div>

      {/* Liquid Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <PremiumStatsCard title="Total Bookings" value={stats.totalBookings.toString()} icon={Bed} delay={0.1} />
        <PremiumStatsCard title="Active" value={stats.activeBookings.toString()} icon={CheckCircle} delay={0.2} trend="+5%" trendUp={true} />
        <PremiumStatsCard title="Upcoming" value={stats.upcomingBookings.toString()} icon={Calendar} delay={0.3} />
        <PremiumStatsCard delay={0.4} className="min-w-[200px]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner">
              <IndianRupee className="w-6 h-6 text-white/90" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Collected
              </span>
              <span className="text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Due
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-white/50">Rec.</span>
              <span className="text-xl font-bold text-emerald-400">₹{stats.totalCollected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-white/50">Pend.</span>
              <span className="text-xl font-bold text-rose-400">₹{stats.totalDue.toLocaleString()}</span>
            </div>
          </div>
        </PremiumStatsCard>
        <PremiumStatsCard title="Check-ins" value={stats.occupiedRooms.toString()} icon={Users} delay={0.5} />
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <GlassInput
            placeholder="Search guests, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex gap-3">
          {/* Premium Glass Date Range Picker */}
          <GlassDateRangePicker
            date={dateFrom && dateTo ? { from: new Date(dateFrom), to: new Date(dateTo) } : undefined}
            setDate={(range: DateRange | undefined) => {
              if (range?.from) {
                setDateFrom(range.from.toISOString().slice(0, 10));
              } else {
                setDateFrom("");
              }

              if (range?.to) {
                setDateTo(range.to.toISOString().slice(0, 10));
              } else {
                setDateTo("");
              }
            }}
            className="w-[280px]"
          />


        </div>
      </div>

      {/* Content Section - Reverted to ~66/33 split but keeping single column for rooms to fit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Bookings List/Cards - Takes ~66% width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Room Service Orders */}
          <LiveRoomServiceOrders />

          <PremiumLiquidGlass title="Recent Bookings">
            {viewMode === 'list' ? (
              <div className="rounded-xl overflow-hidden border border-white/5">
                <HotelBookingsSection
                  bookings={filteredBookings}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onViewDetails={handleBookingClick}
                  onDelete={handleDeleteBookingDirect}
                  isSuperAdmin={false}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <div className="col-span-2 text-center py-10 text-white/50">Loading bookings...</div>
                ) : filteredBookings.length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-white/50">No bookings found matching filters</div>
                ) : (
                  filteredBookings.map((booking) => (
                    <HotelBookingCard
                      key={booking.id}
                      booking={booking}
                      settings={settings}
                      onViewBill={handleBookingClick}
                      onEdit={handleEditBooking}
                      onDelete={handleDeleteBooking}
                    />
                  ))
                )}
              </div>
            )}
          </PremiumLiquidGlass>
        </div>

        {/* Room Status / Quick Actions - Takes ~33% width */}
        <div className="space-y-6">
          {/* Room Grid Preview */}
          <PremiumLiquidGlass title="Rooms Status" className="min-h-[400px]">
            {loading ? (
              <div className="text-center py-12 text-white/30">Loading rooms...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-4 text-xs text-white/50 mb-4 px-2">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Occupied</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Maintenance</span>
                </div>
                <RoomGrid
                  rooms={rooms}
                  bookings={bookings}
                  onSelect={handleSelectRoom}
                  onEdit={handleEditRoom}
                  onDelete={handleDeleteRoom}
                  onMarkCleaned={handleMarkCleaned}
                  onRoomService={handleRoomService}
                  onResetStatus={handleResetStatus}
                  className="grid-cols-1 xl:grid-cols-1 gap-4"
                />
              </div>
            )}
          </PremiumLiquidGlass>
        </div>

      </div>

      {/* Dialogs - Kept functionality, wrapped or styled where possible. 
            Ideally these dialogs should also be updated to Glass Dialogs eventually. 
        */}
      <Dialog open={showAddBooking} onOpenChange={setShowAddBooking}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10 text-white overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingBooking ? "Edit Booking" : "New Booking"}</DialogTitle>
          </DialogHeader>
          <HotelBookingForm
            rooms={rooms}
            existingBooking={editingBooking || undefined}
            initialRoomId={selectedRoomForBooking?.id}
            onSubmit={editingBooking ? handleUpdateBooking : handleCreateBooking}
            onCancel={() => {
              setShowAddBooking(false);
              setEditingBooking(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <RoomForm
            onSubmit={handleCreateRoom}
            onCancel={() => setIsAddRoomOpen(false)}
            loading={creatingRoom}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditRoom} onOpenChange={setShowEditRoom}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
          </DialogHeader>
          <RoomForm
            initialData={editingRoom || undefined}
            onSubmit={handleUpdateRoom}
            onCancel={() => {
              setShowEditRoom(false);
              setEditingRoom(null);
            }}
            loading={creatingRoom}
          />
        </DialogContent>
      </Dialog>

      <HotelBookingDetails
        booking={selectedBooking}
        isOpen={showBookingDetails}
        onClose={() => setShowBookingDetails(false)}
        onUpdate={handleBookingUpdated}
        onEdit={(booking) => {
          setEditingBooking(booking)
          setShowAddBooking(true)
        }}
        onDelete={(booking) => {
          setBookingToDelete(booking)
          setIsPasswordDialogOpen(true)
        }}
      />

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setBookingToDelete(null);
        }}
        onConfirm={handlePasswordSuccess}
        title="Confirm Deletion"
        description="Please enter admin password to delete this booking."
      />

    </div>
  );
}
