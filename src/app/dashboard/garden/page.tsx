"use client"

import { useState, useEffect } from "react"
import { createBooking, getBookings } from "@/actions/bookings"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Loader2,
    Plus,
    Calendar as CalendarIcon,
    Users,
    Clock,
    IndianRupee,
    Bell,
    Printer,
    CheckCircle2,
    XCircle,
    Flower2,
    PartyPopper,
    Briefcase,
    Cake
} from "lucide-react"
import { format, formatDistanceToNow, isBefore, isAfter, addDays } from "date-fns"
import { cn } from "@/lib/utils"

type Booking = {
    id: string
    customerMobile: string
    customer: { name: string; mobileNumber: string }
    startDate: Date
    endDate: Date
    status: string
    totalAmount: number
    advancePayment: number
    notes: string | null
    eventType: string | null
    guestCount: number | null
    eventTime: string | null
    createdAt: Date
}

const eventTypes = [
    { value: "wedding", label: "Wedding", icon: PartyPopper, color: "text-pink-400" },
    { value: "reception", label: "Reception", icon: Flower2, color: "text-purple-400" },
    { value: "birthday", label: "Birthday Party", icon: Cake, color: "text-blue-400" },
    { value: "corporate", label: "Corporate Event", icon: Briefcase, color: "text-green-400" },
    { value: "anniversary", label: "Anniversary", icon: PartyPopper, color: "text-amber-400" },
]

const eventTimes = [
    { value: "morning", label: "Morning (6 AM - 12 PM)", price: 25000 },
    { value: "afternoon", label: "Afternoon (12 PM - 6 PM)", price: 30000 },
    { value: "evening", label: "Evening (6 PM - 12 AM)", price: 40000 },
    { value: "full-day", label: "Full Day (6 AM - 12 AM)", price: 80000 },
]

export default function GardenPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [isBookOpen, setIsBookOpen] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

    const today = new Date().toISOString().split('T')[0]

    const [bookingData, setBookingData] = useState({
        customerMobile: "",
        customerName: "",
        startDate: today,
        eventType: "",
        guestCount: 100,
        eventTime: "",
        totalAmount: 0,
        advancePayment: 0,
        notes: ""
    })

    const fetchData = async () => {
        setLoading(true)
        const allBookings = await getBookings("garden")
        setBookings(allBookings as Booking[])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Calculate total based on event time
    useEffect(() => {
        const selectedTime = eventTimes.find(t => t.value === bookingData.eventTime)
        if (selectedTime) {
            setBookingData(prev => ({ ...prev, totalAmount: selectedTime.price }))
        }
    }, [bookingData.eventTime])

    const handleCreateBooking = async () => {
        const start = new Date(bookingData.startDate)
        const end = new Date(bookingData.startDate) // Garden events are typically single-day

        const result = await createBooking({
            customerMobile: bookingData.customerMobile,
            type: "garden",
            startDate: start,
            endDate: end,
            notes: bookingData.notes,
            totalAmount: bookingData.totalAmount,
            eventType: bookingData.eventType,
            guestCount: bookingData.guestCount,
            eventTime: bookingData.eventTime,
            advancePayment: bookingData.advancePayment
        })

        if (result.success) {
            setIsBookOpen(false)
            setBookingData({
                customerMobile: "",
                customerName: "",
                startDate: today,
                eventType: "",
                guestCount: 100,
                eventTime: "",
                totalAmount: 0,
                advancePayment: 0,
                notes: ""
            })
            fetchData()
        } else {
            alert("Failed to create booking")
        }
    }

    const getUpcomingEvents = () => {
        const now = new Date()
        return bookings.filter(b => {
            const eventDate = new Date(b.startDate)
            return isAfter(eventDate, now) && b.status !== 'cancelled'
        }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    }

    const getPastEvents = () => {
        const now = new Date()
        return bookings.filter(b => {
            const eventDate = new Date(b.startDate)
            return isBefore(eventDate, now) || b.status === 'completed'
        }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    }

    const getEventTypeIcon = (type: string | null) => {
        const eventType = eventTypes.find(t => t.value === type)
        return eventType ? eventType.icon : PartyPopper
    }

    const getEventTypeColor = (type: string | null) => {
        const eventType = eventTypes.find(t => t.value === type)
        return eventType ? eventType.color : "text-gray-400"
    }

    const printBill = (booking: Booking) => {
        const billWindow = window.open('', '_blank')
        if (!billWindow) return

        const billHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Event Booking Bill - ${booking.id.slice(0, 8)}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #059669; margin: 0; }
                    .header p { color: #666; margin: 5px 0; }
                    .bill-details { border: 2px solid #059669; padding: 20px; border-radius: 8px; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #333; }
                    .value { color: #666; }
                    .total { font-size: 1.2em; font-weight: bold; color: #059669; margin-top: 20px; padding-top: 20px; border-top: 2px solid #059669; }
                    .footer { text-align: center; margin-top: 40px; color: #999; font-size: 0.9em; }
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌺 DEORA PLAZA - Marriage Garden 🌺</h1>
                    <p>Event Booking Confirmation</p>
                    <p>Bill No: ${booking.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div class="bill-details">
                    <div class="row">
                        <span class="label">Customer Name:</span>
                        <span class="value">${booking.customer.name}</span>
                    </div>
                    <div class="row">
                        <span class="label">Mobile:</span>
                        <span class="value">${booking.customer.mobileNumber}</span>
                    </div>
                    <div class="row">
                        <span class="label">Event Type:</span>
                        <span class="value">${booking.eventType || 'N/A'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Event Date:</span>
                        <span class="value">${format(new Date(booking.startDate), 'PPP')}</span>
                    </div>
                    <div class="row">
                        <span class="label">Event Time:</span>
                        <span class="value">${booking.eventTime || 'N/A'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Guest Count:</span>
                        <span class="value">${booking.guestCount || 'N/A'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Total Amount:</span>
                        <span class="value">₹${booking.totalAmount.toLocaleString()}</span>
                    </div>
                    <div class="row">
                        <span class="label">Advance Paid:</span>
                        <span class="value">₹${booking.advancePayment.toLocaleString()}</span>
                    </div>
                    <div class="total">
                        <div class="row">
                            <span class="label">Balance Due:</span>
                            <span class="value">₹${(booking.totalAmount - booking.advancePayment).toLocaleString()}</span>
                        </div>
                    </div>
                    ${booking.notes ? `<div class="row"><span class="label">Notes:</span><span class="value">${booking.notes}</span></div>` : ''}
                </div>
                <div class="footer">
                    <p>Thank you for choosing Deora Plaza Marriage Garden!</p>
                    <p>For queries, contact: +91 9001160228</p>
                </div>
                <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Bill</button>
            </body>
            </html>
        `
        billWindow.document.write(billHTML)
        billWindow.document.close()
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-black/95 text-white"><Loader2 className="h-8 w-8 animate-spin text-green-500" /></div>
    }

    const upcomingEvents = getUpcomingEvents()
    const pastEvents = getPastEvents()

    return (
        <div className="flex-1 min-h-screen bg-black/95 text-white p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Flower2 className="h-10 w-10 text-green-400" />
                        Marriage Garden
                    </h2>
                    <p className="text-gray-400 mt-1">Event booking and management</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        <Bell className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-200">{upcomingEvents.length} Upcoming Events</span>
                    </div>
                    <Button
                        onClick={() => setIsBookOpen(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Book Event
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Total Bookings</p>
                                <p className="text-2xl font-bold text-white">{bookings.length}</p>
                            </div>
                            <CalendarIcon className="h-8 w-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Upcoming</p>
                                <p className="text-2xl font-bold text-white">{upcomingEvents.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Total Revenue</p>
                                <p className="text-2xl font-bold text-white">₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}</p>
                            </div>
                            <IndianRupee className="h-8 w-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Completed</p>
                                <p className="text-2xl font-bold text-white">{pastEvents.length}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bookings Tabs */}
            <Tabs defaultValue="upcoming" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="upcoming" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-400">
                        <Clock className="mr-2 h-4 w-4" /> Upcoming Events
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
                        <CalendarIcon className="mr-2 h-4 w-4" /> History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingEvents.map((booking) => {
                            const EventIcon = getEventTypeIcon(booking.eventType)
                            const daysUntil = Math.ceil((new Date(booking.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                            return (
                                <Card key={booking.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-full bg-white/10", getEventTypeColor(booking.eventType))}>
                                                    <EventIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg text-white capitalize">{booking.eventType || 'Event'}</CardTitle>
                                                    <p className="text-xs text-gray-500">{booking.customer.name}</p>
                                                </div>
                                            </div>
                                            {daysUntil <= 7 && (
                                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                                    <Bell className="h-3 w-3 mr-1" />
                                                    {daysUntil}d
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                                            <span>{format(new Date(booking.startDate), 'PPP')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            <span className="capitalize">{booking.eventTime || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Users className="h-4 w-4 text-gray-500" />
                                            <span>{booking.guestCount || 0} Guests</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                            <div>
                                                <p className="text-xs text-gray-500">Total Amount</p>
                                                <p className="text-lg font-bold text-green-400">₹{booking.totalAmount.toLocaleString()}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-white/10 hover:bg-white/10"
                                                onClick={() => printBill(booking)}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {pastEvents.map((booking) => {
                            const EventIcon = getEventTypeIcon(booking.eventType)

                            return (
                                <Card key={booking.id} className="bg-white/5 border-white/10 backdrop-blur-sm opacity-75">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-full bg-white/10", getEventTypeColor(booking.eventType))}>
                                                    <EventIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg text-white capitalize">{booking.eventType || 'Event'}</CardTitle>
                                                    <p className="text-xs text-gray-500">{booking.customer.name}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                                                Completed
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>{format(new Date(booking.startDate), 'PPP')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Users className="h-4 w-4" />
                                            <span>{booking.guestCount || 0} Guests</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                            <div>
                                                <p className="text-xs text-gray-500">Total Amount</p>
                                                <p className="text-lg font-bold text-gray-300">₹{booking.totalAmount.toLocaleString()}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-white/10 hover:bg-white/10"
                                                onClick={() => printBill(booking)}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Booking Dialog */}
            <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
                <DialogContent className="bg-gray-900 border-white/10 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <Flower2 className="h-6 w-6 text-green-500" />
                            Book Marriage Garden Event
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Customer Mobile *</Label>
                                <Input
                                    className="bg-black/40 border-white/10 text-white focus:border-green-500"
                                    placeholder="10-digit mobile number"
                                    value={bookingData.customerMobile}
                                    onChange={(e) => setBookingData({ ...bookingData, customerMobile: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">Event Date *</Label>
                                <Input
                                    type="date"
                                    className="bg-black/40 border-white/10 text-white focus:border-green-500 [color-scheme:dark]"
                                    value={bookingData.startDate}
                                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Event Type *</Label>
                            <Select value={bookingData.eventType} onValueChange={(value) => setBookingData({ ...bookingData, eventType: value })}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white focus:border-green-500">
                                    <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/10">
                                    {eventTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Event Time Slot *</Label>
                            <Select value={bookingData.eventTime} onValueChange={(value) => setBookingData({ ...bookingData, eventTime: value })}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white focus:border-green-500">
                                    <SelectValue placeholder="Select time slot" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-white/10">
                                    {eventTimes.map((time) => (
                                        <SelectItem key={time.value} value={time.value} className="text-white hover:bg-white/10">
                                            {time.label} - ₹{time.price.toLocaleString()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Expected Guest Count</Label>
                            <Input
                                type="number"
                                className="bg-black/40 border-white/10 text-white focus:border-green-500"
                                placeholder="Number of guests"
                                value={bookingData.guestCount}
                                onChange={(e) => setBookingData({ ...bookingData, guestCount: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-400">Total Amount</Label>
                                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded border border-green-500/20">
                                    <IndianRupee className="h-4 w-4 text-green-400" />
                                    <span className="text-lg font-bold text-green-400">₹{bookingData.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-400">Advance Payment</Label>
                                <Input
                                    type="number"
                                    className="bg-black/40 border-white/10 text-white focus:border-green-500"
                                    placeholder="Advance amount"
                                    value={bookingData.advancePayment}
                                    onChange={(e) => setBookingData({ ...bookingData, advancePayment: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-400">Special Requirements / Notes</Label>
                            <Textarea
                                className="bg-black/40 border-white/10 text-white focus:border-green-500 min-h-[80px]"
                                placeholder="Any special requirements, decorations, catering preferences, etc."
                                value={bookingData.notes}
                                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                            />
                        </div>

                        <div className="pt-2">
                            <div className="flex justify-between text-sm mb-4 p-3 bg-amber-500/10 rounded border border-amber-500/20">
                                <span className="text-amber-200">Balance Due</span>
                                <span className="font-bold text-amber-400">
                                    ₹{(bookingData.totalAmount - bookingData.advancePayment).toLocaleString()}
                                </span>
                            </div>
                            <Button
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg shadow-green-900/20"
                                onClick={handleCreateBooking}
                                disabled={!bookingData.customerMobile || !bookingData.eventType || !bookingData.eventTime}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirm Booking
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
