"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bed, User, Star, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Room = {
    id: string
    roomNumber: string
    type: string
    pricePerNight: number
    status: string
}

type RoomGridProps = {
    rooms: Room[]
    onSelect: (room: Room) => void
}

export default function RoomGrid({ rooms, onSelect }: RoomGridProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {rooms.map((room) => (
                <button
                    key={room.id}
                    onClick={() => onSelect(room)}
                    className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1"
                >
                    <div className={cn(
                        "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl",
                        room.status === "available" ? "from-blue-500/20 to-cyan-500/20" : "from-red-500/20 to-orange-500/20"
                    )} />

                    <Card className="relative w-full overflow-hidden border-white/10 bg-white/5 backdrop-blur-md transition-colors group-hover:border-white/20 group-hover:bg-white/10">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Room</span>
                                    <CardTitle className="text-2xl font-bold text-white">{room.roomNumber}</CardTitle>
                                </div>
                                <div className={cn(
                                    "rounded-full p-1.5",
                                    room.status === "available" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                )}>
                                    {room.status === "available" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                                <Bed className="h-4 w-4 text-blue-400" />
                                <span className="font-medium text-gray-300">{room.type}</span>
                            </div>
                            <div className="flex items-end justify-between border-t border-white/10 pt-3">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">Price per night</span>
                                    <div className="font-bold text-white text-lg">
                                        ₹{room.pricePerNight}
                                    </div>
                                </div>
                                {room.type === "Suite" && (
                                    <Star className="h-4 w-4 text-amber-400 fill-amber-400 mb-1" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </button>
            ))}
        </div>
    )
}
