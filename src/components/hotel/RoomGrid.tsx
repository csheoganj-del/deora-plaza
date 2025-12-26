"use client";

import { useState } from "react";
;

import { Badge } from "@/components/ui/badge";
import { Bed, User, Star, CheckCircle2, XCircle, Wrench, Sparkles, MoreVertical, Pencil, Trash2, UtensilsCrossed, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
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
  bookings?: HotelBooking[];
  enablePasswordProtection?: boolean;
};

export default function RoomGrid({
  rooms,
  onSelect,
  onEdit,
  onDelete,
  onRoomService,
  onMarkCleaned,
  bookings = [],
  enablePasswordProtection = true
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
        return "bg-[#F8FAFC]/20 text-[#9CA3AF]"
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rooms.map((room) => {
          // Ensure room.id is defined
          if (!room.id) return null;

          const nightlyRate = typeof room.price === "number" ? room.price : typeof room.pricePerNight === "number" ? room.pricePerNight : 0
          return (
            <div key={room.id} className="relative group">
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedRooms.includes(room.id)}
                  onCheckedChange={() => toggleRoomSelection(room.id!)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button onClick={() => onSelect(room)} className="w-full text-left transition-transform duration-200 hover:-translate-y-1 focus:outline-none" >
                <div className="premium-card">
                  <div className="p-8 border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Room</p>
                        <h2 className="text-3xl font-bold text-[#111827] text-3xl font-bold text-[var(--text-primary)]">{room.number}</h2>
                      </div>
                      <div className={cn(
                        "rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1",
                        getStatusBadgeColor(room.status)
                      )}>
                        {getStatusIcon(room.status)}
                        <span className="capitalize">{room.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="flex items-center gap-2 text-sm bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-2 rounded-lg">
                      <Bed className="h-4 w-4 text-[var(--brand-primary)]" />
                      <span className="font-medium text-[var(--text-secondary)]">{room.type}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Per Night</span>
                        <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">₹{nightlyRate.toLocaleString()}</p>
                      </div>
                      {room.type === "Suite" && (
                        <div className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[var(--brand-primary)] text-[var(--brand-primary)]" /> Premium
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 glass-card frosted-glass-light hover:bg-white shadow-sm rounded-full">
                      <MoreVertical className="h-4 w-4 text-[var(--text-secondary)]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    {room.status === 'occupied' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRoomService(room); }}>
                        <UtensilsCrossed className="mr-2 h-4 w-4" /> Room Service
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAvailabilityRoom(room); setAvailabilityOpen(true); }}>
                      <Calendar className="mr-2 h-4 w-4" /> Availability
                    </DropdownMenuItem>
                    {room.status === 'cleaning' && onMarkCleaned && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkCleaned(room); }}>
                        <Sparkles className="mr-2 h-4 w-4" /> Mark Cleaned
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(room); }}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit Room
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleDelete(room.id!, room.number);
                      }}
                      className="text-[#EF4444] focus:text-[#EF4444]"
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
                  if (selectedBookings.length === 0) return <div className="text-sm text-[#9CA3AF]">No bookings</div>;
                  return selectedBookings.map((b, idx) => (
                    <div key={idx} className="border rounded p-2 text-sm">
                      <div className="font-medium">{b.guestName || 'Guest'}</div>
                      <div className="text-[#6B7280]">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</div>
                      <div className="text-[#6B7280]">Status: {b.status}</div>
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

