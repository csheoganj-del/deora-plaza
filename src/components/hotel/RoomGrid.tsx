"use client";

import { useState } from "react";
;

import { Badge } from "@/components/ui/badge";
import { Bed, User, Star, CheckCircle2, XCircle, Wrench, Sparkles, MoreVertical, Pencil, Trash2, UtensilsCrossed, Calendar, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumLiquidGlass } from "@/components/ui/glass/premium-liquid-glass";
import { motion } from "framer-motion";
import { Room, HotelBooking } from "@/actions/hotel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordDialog } from "@/components/ui/PasswordDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type RoomGridProps = {
  rooms: (Room & { pricePerNight?: number })[];
  onSelect: (room: Room) => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room, password?: string) => void;
  onRoomService: (room: Room) => void;
  onMarkCleaned?: (room: Room) => void;
  onResetStatus?: (room: Room) => void;
  bookings?: HotelBooking[];
  enablePasswordProtection?: boolean;
  className?: string;
};

export default function RoomGrid({
  rooms,
  onSelect,
  onEdit,
  onDelete,
  onRoomService,
  onMarkCleaned,
  onResetStatus,
  bookings = [],
  enablePasswordProtection = true,
  className
}: RoomGridProps) {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single');
  const [roomToDelete, setRoomToDelete] = useState<{ id: string, number: string } | null>(null);
  const [availabilityRoom, setAvailabilityRoom] = useState<Room | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(undefined);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return "from-[#6D5DFB]/20 to-[#EDEBFF]/20"
      case 'occupied':
        return "from-[#FEE2E2]0/20 to-orange-500/20"
      case 'maintenance':
        return "from-[#F8FAFC]0/20 to-[#F8FAFC]0/20"
      case 'cleaning':
        return "from-[#FEF3C7]0/20 to-[#FEF3C7]0/20"
      default:
        return "from-[#6D5DFB]/20 to-[#EDEBFF]/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-4 w-4" />
      case 'occupied':
        return <XCircle className="h-4 w-4" />
      case 'maintenance':
        return <Wrench className="h-4 w-4" />
      case 'cleaning':
        return <Sparkles className="h-4 w-4" />
      default:
        return <CheckCircle2 className="h-4 w-4" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return "bg-[#DCFCE7]0/20 text-green-400"
      case 'occupied':
        return "bg-[#FEE2E2]0/20 text-red-400"
      case 'maintenance':
        return "bg-[#F8FAFC]/20 text-white/50"
      case 'cleaning':
        return "bg-[#F59E0B]/100/20 text-[#F59E0B]400"
      default:
        return "bg-[#DCFCE7]0/20 text-green-400"
    }
  }

  const handleSingleDelete = (roomId: string, roomNumber: string) => {
    setRoomToDelete({ id: roomId, number: roomNumber });
    if (enablePasswordProtection) {
      setPasswordAction('single');
      setIsPasswordDialogOpen(true);
    } else {
      // Direct delete if protection disabled
      onDelete({ ...rooms.find(r => r.id === roomId)!, id: roomId } as Room, "");
    }
  };

  const handleBulkDelete = () => {
    if (selectedRooms.length === 0) return;
    if (enablePasswordProtection) {
      setPasswordAction('bulk');
      setIsPasswordDialogOpen(true);
    } else {
      // Direct delete
      selectedRooms.forEach(roomId => {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          onDelete(room as Room, "");
        }
      });
      setSelectedRooms([]);
    }
  };

  const handlePasswordSuccess = async (password: string) => {
    if (passwordAction === 'single' && roomToDelete) {
      onDelete({ ...rooms.find(r => r.id === roomToDelete.id)!, id: roomToDelete.id } as Room, password);
    } else if (passwordAction === 'bulk') {
      // Call onDelete for each selected room
      selectedRooms.forEach(roomId => {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          onDelete(room as Room, password);
        }
      });
      setSelectedRooms([]);
    }

    setIsPasswordDialogOpen(false);
    setRoomToDelete(null);
    setPasswordAction('single');
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRooms.length === rooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(rooms.map(room => room.id).filter(id => id !== undefined) as string[]);
    }
  };

  return (
    <div>
      {/* Bulk Actions Bar */}
      {selectedRooms.length > 0 && (
        <div className="flex justify-between items-center mb-4 p-4 glass-card frosted-glass-medium rounded-lg">
          <div className="text-sm text-[var(--text-secondary)]">
            {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="bg-[var(--danger)] hover:bg-[var(--danger)]/90"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
        {rooms.map((room) => {
          // Ensure room.id is defined
          if (!room.id) return null;

          // Calculate effective status based on bookings
          let effectiveStatus = room.status;
          const activeBooking = bookings.find(b =>
            (b.roomId === room.id || b.roomNumber === room.number) &&
            ['confirmed', 'checked-in'].includes(b.status) &&
            new Date(b.endDate) > new Date() // Only if booking is still valid
          );

          if (activeBooking) {
            effectiveStatus = 'occupied';
          }

          const nightlyRate = typeof room.price === "number" ? room.price : typeof room.pricePerNight === "number" ? room.pricePerNight : 0
          return (
            <div key={room.id} className="relative group">
              <div className="absolute top-3 left-3 z-20">
                <Checkbox
                  checked={selectedRooms.includes(room.id)}
                  onCheckedChange={() => toggleRoomSelection(room.id!)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(room)}
                className="w-full text-left focus:outline-none h-full"
              >
                <PremiumLiquidGlass
                  variant="card"
                  className={cn("h-full relative overflow-hidden transition-all duration-300 !p-0",
                    selectedRooms.includes(room.id) ? "ring-2 ring-emerald-500" : ""
                  )}
                >
                  <div className="p-4 pb-3 border-b border-white/5 relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        {/* <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Room</p> */}
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">{room.number}</h2>
                        <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                          <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Bed className="w-3 h-3" /> {room.type}
                          </span>
                        </div>
                      </div>

                      <div className={cn(
                        "rounded-xl px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md border",
                        effectiveStatus === 'available' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                        effectiveStatus === 'occupied' && "bg-rose-500/10 border-rose-500/20 text-rose-400",
                        effectiveStatus === 'maintenance' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                        effectiveStatus === 'cleaning' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                      )}>
                        {getStatusIcon(effectiveStatus)}
                        <span className="capitalize hidden sm:inline">{effectiveStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 relative z-10">
                    <div className="flex flex-col gap-2">
                      {/* Price Section */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl font-bold text-white tracking-tight">₹{nightlyRate.toLocaleString()}</p>
                          <p className="text-[10px] text-white/50 font-medium uppercase tracking-wide">Per Night</p>
                        </div>
                      </div>

                      {room.type === "Suite" && (
                        <div className="self-start mt-2">
                          <div className="rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-400 flex items-center gap-1 shadow-[0_0_10px_rgba(242,185,75,0.15)]">
                            <Star className="h-3 w-3 fill-[#F2B94B]" /> Premium
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Decorative Gradient Background based on status */}
                  <div className={cn("absolute inset-0 opacity-10 blur-xl transition-all duration-500",
                    effectiveStatus === 'available' && "bg-gradient-to-br from-emerald-500/40 via-transparent to-transparent",
                    effectiveStatus === 'occupied' && "bg-gradient-to-br from-rose-500/40 via-transparent to-transparent",
                    effectiveStatus === 'maintenance' && "bg-gradient-to-br from-amber-500/40 via-transparent to-transparent",
                    effectiveStatus === 'cleaning' && "bg-gradient-to-br from-blue-500/40 via-transparent to-transparent",
                  )} />

                </PremiumLiquidGlass>
              </motion.button>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 text-white">
                    {effectiveStatus === 'occupied' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRoomService(room); }} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        <UtensilsCrossed className="mr-2 h-4 w-4" /> Room Service
                      </DropdownMenuItem>
                    )}
                    {/* Add Force Available option for phantom bookings */}
                    {(effectiveStatus === 'occupied' || effectiveStatus === 'maintenance') && onResetStatus && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onResetStatus(room); }} className="focus:bg-white/10 focus:text-white cursor-pointer text-amber-400 focus:text-amber-400">
                        <RotateCcw className="mr-2 h-4 w-4" /> Force Available
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAvailabilityRoom(room); setAvailabilityOpen(true); }} className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" /> Availability
                    </DropdownMenuItem>
                    {effectiveStatus === 'cleaning' && onMarkCleaned && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkCleaned(room); }} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        <Sparkles className="mr-2 h-4 w-4" /> Mark Cleaned
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(room); }} className="focus:bg-white/10 focus:text-white cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" /> Edit Room
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleDelete(room.id!, room.number);
                      }}
                      className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Room
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={handlePasswordSuccess}
        title={passwordAction === 'bulk' ? "Delete Selected Rooms" : "Delete Room"}
        description={passwordAction === 'bulk'
          ? `Are you sure you want to delete ${selectedRooms.length} rooms?`
          : `Are you sure you want to delete room ${roomToDelete?.number}?`}
      />
      <Dialog open={availabilityOpen} onOpenChange={(o) => setAvailabilityOpen(o)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{availabilityRoom ? `Room ${availabilityRoom.number} Availability` : 'Availability'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <CalendarComponent
                mode="single"
                selected={availabilityDate}
                onSelect={setAvailabilityDate}
                modifiers={{
                  booked: (date) => {
                    if (!availabilityRoom) return false;
                    const roomBookings = bookings.filter(b => (b.roomId && availabilityRoom.id && b.roomId === availabilityRoom.id) || (b.roomNumber && b.roomNumber === availabilityRoom.number));
                    return roomBookings.some(b => {
                      const s = new Date(b.startDate);
                      const e = new Date(b.endDate);
                      return s <= date && e > date;
                    });
                  }
                }}
                modifiersStyles={{
                  booked: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Bookings</div>
              <div className="space-y-2">
                {(() => {
                  if (!availabilityRoom) return null;
                  const roomBookings = bookings.filter(b => (b.roomId && availabilityRoom.id && b.roomId === availabilityRoom.id) || (b.roomNumber && b.roomNumber === availabilityRoom.number));
                  const selectedBookings = availabilityDate ? roomBookings.filter(b => {
                    const s = new Date(b.startDate);
                    const e = new Date(b.endDate);
                    return s <= availabilityDate && e > availabilityDate;
                  }) : roomBookings.slice(0, 5);
                  if (selectedBookings.length === 0) return <div className="text-sm text-white/50">No bookings</div>;
                  return selectedBookings.map((b, idx) => (
                    <div key={idx} className="border rounded p-2 text-sm">
                      <div className="font-medium">{b.guestName || 'Guest'}</div>
                      <div className="text-white/60">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</div>
                      <div className="text-white/60">Status: {b.status}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
