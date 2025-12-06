import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bed, User, Star, CheckCircle2, XCircle, Wrench, Sparkles, MoreVertical, Pencil, Trash2, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { Room } from "@/actions/hotel"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

type RoomGridProps = {
    rooms: (Room & { pricePerNight?: number })[]
    onSelect: (room: Room) => void
    onEdit: (room: Room) => void
    onDelete: (room: Room) => void
    onRoomService: (room: Room) => void
}

export default function RoomGrid({ rooms, onSelect, onEdit, onDelete, onRoomService }: RoomGridProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return "from-blue-500/20 to-cyan-500/20"
            case 'occupied': return "from-red-500/20 to-orange-500/20"
            case 'maintenance': return "from-gray-500/20 to-slate-500/20"
            case 'cleaning': return "from-yellow-500/20 to-amber-500/20"
            default: return "from-blue-500/20 to-cyan-500/20"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'available': return <CheckCircle2 className="h-4 w-4" />
            case 'occupied': return <XCircle className="h-4 w-4" />
            case 'maintenance': return <Wrench className="h-4 w-4" />
            case 'cleaning': return <Sparkles className="h-4 w-4" />
            default: return <CheckCircle2 className="h-4 w-4" />
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'available': return "bg-green-500/20 text-green-400"
            case 'occupied': return "bg-red-500/20 text-red-400"
            case 'maintenance': return "bg-gray-500/20 text-gray-400"
            case 'cleaning': return "bg-yellow-500/20 text-yellow-400"
            default: return "bg-green-500/20 text-green-400"
        }
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => {
                const nightlyRate = typeof room.price === "number"
                    ? room.price
                    : typeof room.pricePerNight === "number"
                        ? room.pricePerNight
                        : 0

                return (
                    <div
                        key={room.id}
                        className="relative group tilt-3d"
                        onMouseMove={(e) => {
                            const t = e.currentTarget as HTMLElement
                            const r = t.getBoundingClientRect()
                            const x = e.clientX - r.left
                            const y = e.clientY - r.top
                            const cx = r.width / 2
                            const cy = r.height / 2
                            const ry = ((x - cx) / cx) * 5
                            const rx = -((y - cy) / cy) * 5
                            t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                        }}
                        onMouseLeave={(e) => {
                            const t = e.currentTarget as HTMLElement
                            t.style.transform = ""
                        }}
                    >
                        <button
                            onClick={() => onSelect(room)}
                            className="w-full text-left transition-transform duration-200 hover:-translate-y-1 focus:outline-none"
                        >
                            <Card className="h-full border border-slate-100 shadow-sm hover:shadow-md bg-white elevation-1">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Room</p>
                                            <CardTitle className="text-3xl font-bold text-slate-900">{room.number}</CardTitle>
                                        </div>
                                        <div className={cn(
                                            "rounded-full px-2 py-1 text-xs font-semibold flex items-center gap-1",
                                            getStatusBadgeColor(room.status)
                                        )}>
                                            {getStatusIcon(room.status)}
                                            <span className="capitalize">{room.status}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                        <Bed className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium">{room.type}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                        <div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Per Night</span>
                                            <p className="text-2xl font-bold text-slate-900 mt-1">₹{nightlyRate.toLocaleString()}</p>
                                        </div>
                                        {room.type === "Suite" && (
                                            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600 flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                                Premium
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </button>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm rounded-full">
                                        <MoreVertical className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white">
                                    {room.status === 'occupied' && (
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRoomService(room); }}>
                                            <UtensilsCrossed className="mr-2 h-4 w-4" /> Room Service
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(room); }}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit Room
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(room); }} className="text-red-600 focus:text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Room
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
