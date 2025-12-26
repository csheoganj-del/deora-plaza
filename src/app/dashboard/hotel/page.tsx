"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Room, HotelBooking, getRooms, getHotelBookings, deleteRoom, createRoom, updateRoom, getHotelDailyRevenue, createHotelBooking, updateHotelBooking, deleteHotelBooking, checkInGuest, checkOutGuest, markRoomCleaned } from "@/actions/hotel";
import { getBusinessSettings } from "@/actions/businessSettings";
import { Button } from "@/components/ui/button";
import {
  Bed,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Users,
  X,
  IndianRupee,
  TrendingUp,
  BarChart3,
  Utensils,
  GlassWater
} from "lucide-react";
;

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import RoomGrid from "@/components/hotel/RoomGrid";
import HotelSearchBar from "@/components/hotel/HotelSearchBar";
import { useToast } from "@/hooks/use-toast";
import HotelStatsCard from "@/components/hotel/HotelStatsCard";
import HotelBookingsSection from "@/components/hotel/HotelBookingsSection";
import { HotelBookingDetails } from "@/components/hotel/HotelBookingDetails";
import HotelBookingForm from "@/components/hotel/HotelBookingForm";
import RoomForm from "@/components/hotel/RoomForm";
import { HotelBookingCard } from "@/components/hotel/HotelBookingCard";
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
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "upcoming" | "completed">("all");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<HotelBooking | null>(null);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);


  // Stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0,
    revenue: 0,
    occupiedRooms: 0
  });

  const { toast } = useToast();

  const filteredRooms = rooms.filter(room =>
    room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadData = async () => {
    console.log("=== LOADING HOTEL DATA ===");
    try {
      setLoading(true);
      console.log("Fetching rooms...");
      const roomsResult = await getRooms();
      console.log("Rooms fetched:", roomsResult?.length || 0);
      console.log("Fetching bookings...");
      const bookingsResult = await getHotelBookings();
      console.log("Bookings fetched:", bookingsResult?.length || 0);

      console.log("Fetching settings...");
      const settings = await getBusinessSettings();
      if (settings) {
        setPasswordProtection(settings.enablePasswordProtection ?? true);
      }

      console.log("Rooms result:", roomsResult);
      console.log("Bookings result:", bookingsResult);
      console.log("Bookings result type:", typeof bookingsResult);
      console.log("Bookings result is array:", Array.isArray(bookingsResult));

      setRooms(roomsResult || []);
      setBookings(bookingsResult || []);

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

        const revenue = bookingsResult.reduce((sum: number, b: any) =>
          sum + (b.totalPaid || 0), 0
        );

        const occupiedRooms = roomsResult ? roomsResult.filter((r: any) =>
          r.status === 'occupied'
        ).length : 0;

        console.log("Calculated stats:", { totalBookings, activeBookings, upcomingBookings, revenue, occupiedRooms });

        setStats({
          totalBookings,
          activeBookings,
          upcomingBookings,
          revenue,
          occupiedRooms
        });
      } else {
        console.log("BookingsResult is not an array or is null");
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
      console.log("=== LOADING HOTEL DATA END ===");
    }
  };

  useEffect(() => {
    loadData();
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
      try {
        const result = await deleteHotelBooking(booking.id!, "");
        if (result.success) {
          toast({
            title: "Success",
            description: "Booking deleted successfully",
          });
          // Update local state
          setBookings(prevBookings => prevBookings.filter(b => b.id !== booking.id));
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
  };

  const handlePasswordSuccess = async (password: string) => {
    if (!bookingToDelete?.id) return;

    try {
      const result = await deleteHotelBooking(bookingToDelete.id, password);
      if (result.success) {
        toast({
          title: "Success",
          description: "Booking deleted successfully",
        });
        console.log("Booking deleted, updating UI...");
        // Manually remove the deleted booking from state to ensure immediate UI update
        setBookings(prevBookings => {
          const filtered = prevBookings.filter(booking => booking.id !== bookingToDelete.id);
          console.log(`Filtered out ${prevBookings.length - filtered.length} bookings, ${filtered.length} remaining`);
          return filtered;
        });
        // Also reload data to ensure consistency
        await loadData();
        console.log("UI updated and data reloaded");
        // Force a router refresh to ensure everything is consistent
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
      setIsPasswordDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const handleBookingUpdated = () => {
    loadData();
    setShowBookingDetails(false);
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
    try {
      const result = await checkOutGuest(bookingId, roomId);
      if (result.success) {
        toast({ title: "Guest checked out", description: `Room ${booking.roomNumber}` });
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
    if (room.status === 'available') {
      setSelectedRoomForBooking(room);
      setShowAddBooking(true);
    } else if (room.status === 'occupied' || room.status === 'cleaning' || room.status === 'maintenance') {
      // Find active booking for this room
      const activeBooking = bookings.find(b =>
        (b.status === 'confirmed' || b.status === 'checked-in') &&
        b.roomId === room.id
      );

      // Note: bookings usually have roomId. 
      // If we can't find by ID, try number (but ID is safer)
      const booking = activeBooking || bookings.find(b =>
        (b.status === 'confirmed' || b.status === 'checked-in') &&
        b.roomNumber === room.number
      );

      if (booking) {
        handleBookingClick(booking);
      } else {
        toast({
          title: "Room Unavailable",
          description: `Room is currently ${room.status}`,
        });
      }
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setShowEditRoom(true);
  };

  const handleDeleteRoom = async (room: Room) => {
    try {
      // Using a placeholder password for now - in a real app this would come from user input
      const result = await deleteRoom(room.id!, "placeholder_password");
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
      const result = await createHotelBooking(data);
      if (result.success) {
        toast({ title: "Success", description: "Booking created successfully" });
        setShowAddBooking(false);
        setSelectedRoomForBooking(null);
        loadData();
      } else {
        toast({
          title: "Error",
          description: (result.error as string) || "Failed to create booking",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleRoomService = (room: Room) => {
    // Placeholder for now
    toast({
      title: "Room Service",
      description: "To add food billing, use the POS system and select this room.",
    });
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
    const matchesSearch =
      (booking.guestName && booking.guestName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (booking.customerMobile && booking.customerMobile.includes(searchQuery)) ||
      (booking.roomNumber && booking.roomNumber.includes(searchQuery));

    let matchesFilter = true;
    const now = new Date();
    const startDate = new Date(booking.startDate);

    if (filterStatus === 'active') {
      matchesFilter = booking.status === 'confirmed' || booking.status === 'checked-in';
    } else if (filterStatus === 'upcoming') {
      matchesFilter = startDate > now && booking.status === 'confirmed';
    } else if (filterStatus === 'completed') {
      matchesFilter = booking.status === 'checked-out' || booking.status === 'cancelled';
    }

    let matchesRange = true;
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const bStart = new Date(booking.startDate);
      const bEnd = new Date(booking.endDate);
      matchesRange = bStart <= to && bEnd >= from;
    }

    return matchesSearch && matchesFilter && matchesRange;
  });

  const rangeFromDate = dateFrom ? new Date(dateFrom) : null;
  const rangeToDate = dateTo ? new Date(dateTo) : null;
  const rangeDays = rangeFromDate && rangeToDate ? Math.max(1, Math.ceil((rangeToDate.getTime() - rangeFromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1;
  const totalRooms = rooms.length || 0;
  let occupiedRoomNights = 0;
  let totalRoomRevenue = 0;
  filteredBookings.forEach((b: any) => {
    const bStart = new Date(b.startDate);
    const bEnd = new Date(b.endDate);
    const ovStart = rangeFromDate ? new Date(Math.max(bStart.getTime(), rangeFromDate.getTime())) : bStart;
    const ovEnd = rangeToDate ? new Date(Math.min(bEnd.getTime(), rangeToDate.getTime())) : bEnd;
    const overlapMs = Math.max(0, ovEnd.getTime() - ovStart.getTime());
    const overlapNights = overlapMs > 0 ? Math.ceil(overlapMs / (1000 * 60 * 60 * 24)) : 0;
    const bookingNights = Math.max(1, Math.ceil((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24)));
    occupiedRoomNights += overlapNights;
    let base = Number(b.basePrice || 0);
    if (!base || base <= 0) {
      const room = rooms.find(r => r.id === b.roomId) || rooms.find(r => r.number === b.roomNumber);
      const nightly = room ? Number((room as any).price || 0) : 0;
      base = nightly * bookingNights;
    }
    const proportion = bookingNights > 0 ? overlapNights / bookingNights : 0;
    totalRoomRevenue += base * proportion;
  });
  const totalAvailableRoomNights = totalRooms * rangeDays;
  const occupancyRate = totalAvailableRoomNights > 0 ? occupiedRoomNights / totalAvailableRoomNights : 0;
  const adr = occupiedRoomNights > 0 ? totalRoomRevenue / occupiedRoomNights : 0;
  const revpar = totalAvailableRoomNights > 0 ? totalRoomRevenue / totalAvailableRoomNights : 0;

  const buildRevenueSeries = () => {
    const series: { day: number; value: number }[] = [];
    if (!rangeFromDate || !rangeToDate) return series;
    for (let i = 0; i < rangeDays; i++) {
      const dayStart = new Date(rangeFromDate.getTime());
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart.getTime());
      dayEnd.setDate(dayEnd.getDate() + 1);
      let dayRevenue = 0;
      filteredBookings.forEach((b: any) => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        const bookingNights = Math.max(1, Math.ceil((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24)));
        let base = Number(b.basePrice || 0);
        if (!base || base <= 0) {
          const room = rooms.find(r => r.id === b.roomId) || rooms.find(r => r.number === b.roomNumber);
          const nightly = room ? Number((room as any).price || 0) : 0;
          base = nightly * bookingNights;
        }
        const overlaps = bStart < dayEnd && bEnd > dayStart;
        if (overlaps) {
          dayRevenue += base / bookingNights;
        }
      });
      series.push({ day: i + 1, value: Math.round(dayRevenue) });
    }
    return series;
  };
  const revenueSeries = buildRevenueSeries();

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 relative z-10 overflow-y-auto">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-[#111827]">
                Hotel Dashboard
              </h2>
            </div>
            <p className="text-[#6B7280] font-medium italic mt-2">
              Guest Management & Bookings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#F1F5F9] p-1 rounded-lg border border-[#E5E7EB] flex">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'shadow-sm' : ''}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'shadow-sm' : ''}
              >
                Card View
              </Button>
            </div>
            <Button
              className="shadow-lg"
              onClick={() => setIsAddRoomOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="premium-card">
            <div className="p-8 p-4 flex items-center">
              <div className="p-2 rounded-xl bg-[#EDEBFF]/20 text-[#6D5DFB] shadow-sm border border-[#EDEBFF]/30">
                <Bed className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF] font-medium">Total Bookings</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="p-8 p-4 flex items-center">
              <div className="p-2 rounded-xl bg-[#BBF7D0]/50 text-[#22C55E] shadow-sm border border-emerald-200">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF] font-medium">Active Bookings</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="p-8 p-4 flex items-center">
              <div className="p-2 rounded-xl bg-[#F59E0B]/10/50 text-[#F59E0B] shadow-sm border border-[#F59E0B]/20/20200">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF] font-medium">Upcoming</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.upcomingBookings}</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="p-8 p-4 flex items-center">
              <div className="p-2 rounded-xl bg-[#FEE2E2]/50 text-[#DC2626] shadow-sm border border-rose-200">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF] font-medium">Revenue</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">₹{stats.revenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="p-8 p-4 flex items-center">
              <div className="p-2 rounded-xl bg-[#FEE2E2]/50 text-[#EF4444] shadow-sm border border-red-200">
                <Clock className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF] font-medium">Occupied</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{stats.occupiedRooms}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="premium-card">
            <div className="p-8 p-4 h-full flex items-center">
              <div className="p-2 rounded-xl bg-fuchsia-100/50 text-fuchsia-600 shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF] font-medium">Occupancy Rate</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">{Math.round(occupancyRate * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <div className="p-8 p-4 h-full">
              <div className="flex items-center">
                <div className="p-2 rounded-xl bg-[#BBF7D0]/50 text-[#22C55E] shadow-sm">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-[#9CA3AF] font-medium">ADR</p>
                  <p className="text-lg sm:text-xl font-bold text-[#111827]">₹{Math.round(adr).toLocaleString()}</p>
                </div>
              </div>
              {revenueSeries.length > 0 && (
                <div className="h-16 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueSeries}>
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="premium-card">
            <div className="p-8 p-4 h-full flex items-center">
              <div className="p-2 rounded-lg bg-[#EDEBFF]/30 text-[#6D5DFB]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-[#9CA3AF]">RevPAR</p>
                <p className="text-lg sm:text-xl font-bold text-[#111827]">₹{Math.round(revpar).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <HotelSearchBar onSearch={setSearchQuery} />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom && dateTo ? `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}` : "Select date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="range"
                selected={dateFrom && dateTo ? { from: new Date(dateFrom), to: new Date(dateTo) } : undefined}
                onSelect={(range: any) => {
                  if (range?.from && range?.to) {
                    setDateFrom(range.from.toISOString().slice(0, 10));
                    setDateTo(range.to.toISOString().slice(0, 10));
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)} className="w-full sm:w-auto">
            <TabsList className="bg-white border">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Bookings Section */}
        {viewMode === 'list' ? (
          <div className="mb-6">
            <HotelBookingsSection
              bookings={filteredBookings}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onViewDetails={handleBookingClick}
            />
          </div>
        ) : (
          <div className="mb-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">Loading...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-[#9CA3AF]">
                No bookings found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map((booking) => (
                  <HotelBookingCard
                    key={booking.id}
                    booking={booking}
                    onViewBill={handleBookingClick}
                    onEdit={handleEditBooking}
                    onDelete={handleDeleteBooking}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rooms Section */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between pb-2 border-b">
            <h2 className="text-3xl font-bold text-[#111827] text-xl font-bold">Rooms & Suites</h2>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#DCFCE7]0" /> <span className="text-xs">Avail</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-[#FEE2E2]0" /> <span className="text-xs">Booked</span>
              </div>
            </div>
          </div>
          <div className="p-8 pt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-[#111827] border-t-transparent rounded-full" />
              </div>
            ) : (
              <RoomGrid
                rooms={filteredRooms}
                onSelect={handleSelectRoom}
                onEdit={handleEditRoom}
                onDelete={handleDeleteRoom}
                onRoomService={handleRoomService}
                onMarkCleaned={handleMarkCleaned as any}
                bookings={bookings as any}
                enablePasswordProtection={passwordProtection}
              />
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <HotelBookingDetails
          booking={selectedBooking}
          isOpen={showBookingDetails}
          onClose={() => setShowBookingDetails(false)}
          onEdit={handleEditBooking}
          onDelete={handleDeleteBooking}
          onUpdate={handleBookingUpdated}
        />
      )}

      {/* Add Booking Dialog */}
      <Dialog open={showAddBooking} onOpenChange={(open) => {
        setShowAddBooking(open);
        if (!open) setSelectedRoomForBooking(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Create New Booking</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddBooking(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <HotelBookingForm
            rooms={rooms}
            onSubmit={handleCreateBooking}
            onCancel={() => setShowAddBooking(false)}
            loading={creatingBooking}
            initialRoomId={selectedRoomForBooking?.id}
          />
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={showAddRoom} onOpenChange={setShowAddRoom}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Add New Room</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddRoom(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <RoomForm
            onSubmit={handleCreateRoom}
            onCancel={() => setShowAddRoom(false)}
            loading={creatingRoom}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={showEditRoom} onOpenChange={(open) => {
        setShowEditRoom(open);
        if (!open) setEditingRoom(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Room</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditRoom(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {editingRoom && (
            <RoomForm
              initialData={editingRoom}
              onSubmit={handleUpdateRoom}
              onCancel={() => setShowEditRoom(false)}
              loading={creatingRoom}
            />
          )}
        </DialogContent>
      </Dialog>

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setBookingToDelete(null);
        }}
        onConfirm={handlePasswordSuccess}
        title="Delete Booking"
        description={`Are you sure you want to delete the booking for ${(bookingToDelete?.guestName as string) || 'guest'}?`}
      />
    </div>
  );
}

