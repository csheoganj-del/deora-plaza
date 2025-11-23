"use client"

import { useState, useEffect } from "react"
import { getAvailableRooms, createBooking, getBookings } from "@/actions/bookings"
import RoomGrid from "@/components/hotel/RoomGrid"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Calendar as CalendarIcon, Hotel, BedDouble, CalendarDays, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HotelPage() {
    const [rooms, setRooms] = useState<any[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isBookOpen, setIsBookOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<any>(null)

    // Simple date handling for now
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]

    const [bookingData, setBookingData] = useState({
        customerMobile: "",
        startDate: today,
        endDate: tomorrow,
        notes: ""
    })

    const fetchData = async () => {
        setLoading(true)
        const [availableRooms, allBookings] = await Promise.all([
            getAvailableRooms(new Date(), new Date(new Date().setDate(new Date().getDate() + 1))),
            getBookings("hotel")
        ])
        setRooms(availableRooms)
        setBookings(allBookings)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleRoomSelect = (room: any) => {
        setSelectedRoom(room)
        setIsBookOpen(true)
    }

    const handleCreateBooking = async () => {
        if (!selectedRoom) return

        const start = new Date(bookingData.startDate)
        const end = new Date(bookingData.endDate)
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const totalAmount = nights * selectedRoom.pricePerNight

        const result = await createBooking({
            customerMobile: bookingData.customerMobile,
            type: "hotel",
            startDate: start,
            endDate: end,
            roomId: selectedRoom.id,
            notes: bookingData.notes,
            totalAmount
        })

        if (result.success) {
            setIsBookOpen(false)
            setSelectedRoom(null)
            setBookingData({ customerMobile: "", startDate: today, endDate: tomorrow, notes: "" })
            fetchData()
        } else {
            alert("Failed to create booking")
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-black/95 text-white"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
    }

    return (
        <div className="flex-1 min-h-screen bg-black/95 text-white p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-600 bg-clip-text text-transparent">
                        Hotel Management
                    </h2>
                    <p className="text-gray-400 mt-1">Manage rooms, bookings, and guests</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Hotel className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-200">{rooms.filter(r => r.status === 'available').length} Rooms Available</span>
                </div>
            </div>

            <Tabs defaultValue="rooms" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">
                        <BedDouble className="mr-2 h-4 w-4" /> Available Rooms
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
                        <CalendarDays className="mr-2 h-4 w-4" /> Active Bookings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rooms" className="space-y-4">
                    <RoomGrid rooms={rooms} onSelect={handleRoomSelect} />
                </TabsContent>

                <TabsContent value="bookings">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((booking) => (
                            <Card key={booking.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Room</div>
                                            <div className="text-2xl font-bold text-white">{booking.room?.roomNumber}</div>
                                        </div>
                                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                            {booking.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <span className="font-bold text-xs">{booking.customer.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{booking.customer.name}</div>
                                                <div className="text-xs text-gray-500">{booking.customerMobile}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-black/20 p-2 rounded border border-white/5">
                                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                                            <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                                            <span className="text-gray-600">→</span>
                                            <span>{new Date(booking.endDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
                <DialogContent className="bg-gray-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <BedDouble className="h-6 w-6 text-blue-500" />
                            Book Room {selectedRoom?.roomNumber}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <Label className="text-gray-400">Customer Mobile</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    className="pl-9 bg-black/40 border-white/10 text-white focus:border-blue-500"
                                    placeholder="Search or enter mobile..."
                                    value={bookingData.customerMobile}
                                    onChange={(e) => setBookingData({ ...bookingData, customerMobile: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Check-in</Label>
                                <Input
                                    type="date"
                                    className="bg-black/40 border-white/10 text-white focus:border-blue-500 [color-scheme:dark]"
                                    value={bookingData.startDate}
                                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">Check-out</Label>
                                <Input
                                    type="date"
                                    className="bg-black/40 border-white/10 text-white focus:border-blue-500 [color-scheme:dark]"
                                    value={bookingData.endDate}
                                    onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400">Notes</Label>
                            <Input
                                className="bg-black/40 border-white/10 text-white focus:border-blue-500"
                                placeholder="Special requests..."
                                value={bookingData.notes}
                                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                            />
                        </div>

                        <div className="pt-2">
                            <div className="flex justify-between text-sm mb-4 p-3 bg-blue-500/10 rounded border border-blue-500/20">
                                <span className="text-blue-200">Total Amount</span>
                                <span className="font-bold text-blue-400">
                                    ₹{selectedRoom ?
                                        (Math.ceil((new Date(bookingData.endDate).getTime() - new Date(bookingData.startDate).getTime()) / (1000 * 60 * 60 * 24)) * selectedRoom.pricePerNight)
                                        : 0}
                                </span>
                            </div>
                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg shadow-blue-900/20"
                                onClick={handleCreateBooking}
                            >
                                Confirm Booking
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
