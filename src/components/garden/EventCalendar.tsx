"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"


import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Clock, IndianRupee, Phone, User } from "lucide-react"

type EventCalendarProps = {
    bookings: any[]
    onSelectDate: (date: Date) => void
}

export default function EventCalendar({ bookings, onSelectDate }: EventCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())

    const handleSelect = (newDate: Date | undefined) => {
        setDate(newDate)
        if (newDate) {
            onSelectDate(newDate)
        }
    }

    // Create a set of dates that have bookings
    const bookedDates = bookings.map(b => new Date(b.startDate).toDateString())

    // Get bookings for selected date
    const selectedDateBookings = bookings.filter(b =>
        new Date(b.startDate).toDateString() === date?.toDateString()
    )

    return (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    className="rounded-md border-white/10 text-white"
                    modifiers={{
                        booked: (date) => bookedDates.includes(date.toDateString())
                    }}
                    modifiersStyles={{
                        booked: {
                            fontWeight: 'bold',
                            textDecoration: 'underline',
                            color: '#10b981', // Emerald-500
                            backgroundColor: 'rgba(16, 185, 129, 0.1)'
                        }
                    }}
                    aria-label="Select a date to view events"
                    classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 text-white",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium text-white",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:bg-white/10 rounded-md",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-white/50 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-white/5 [&:has([aria-selected])]:bg-white/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-white/10 rounded-md",
                        day_selected: "bg-emerald-500 text-white hover:bg-emerald-600 focus:bg-emerald-600",
                        day_today: "bg-white/10 text-white",
                        day_outside: "day-outside text-white/30 opacity-50 aria-selected:bg-white/5 aria-selected:text-white/30 aria-selected:opacity-30",
                        day_disabled: "text-white/10 opacity-50",
                        day_range_middle: "aria-selected:bg-white/5 aria-selected:text-white",
                        day_hidden: "invisible",
                    }}
                />
            </div>

            <div className="flex-1">
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden h-full">
                    <div className="bg-white/5 p-4 border-b border-white/10">
                        <h3 className="text-lg font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
                            <span>Events for {date ? format(date, "EEE, MMM d, yyyy") : ""}</span>
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-full self-start sm:self-auto">
                                {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'Event' : 'Events'}
                            </span>
                        </h3>
                    </div>
                    <div className="p-4">
                        {selectedDateBookings.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDateBookings.map(booking => (
                                    <div
                                        key={booking.id}
                                        className="border border-white/10 bg-white/5 rounded-lg p-3 sm:p-4 hover:bg-white/10 transition-colors"
                                        role="article"
                                        aria-label={`Event for ${booking.customerName}, ${booking.eventType}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-base sm:text-lg text-white">{booking.customerName}</h3>
                                                <div className="flex items-center text-xs sm:text-sm text-white/50 mt-1">
                                                    <User className="h-4 w-4 mr-1" aria-hidden="true" />
                                                    <span className="capitalize">{booking.eventType}</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs border px-2 py-1 rounded uppercase font-medium ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                                    booking.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                                        'bg-white/10 text-white/50 border-white/10'
                                                }`} aria-label={`Status: ${booking.status}`}>{booking.status}</span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="flex items-center text-xs sm:text-sm text-white/70">
                                                <Clock className="h-4 w-4 mr-2 text-white/40" aria-hidden="true" />
                                                <span>
                                                    {format(new Date(booking.startDate), "h:mm a")} - {format(new Date(booking.endDate), "h:mm a")}
                                                </span>
                                            </div>

                                            <div className="flex items-center text-xs sm:text-sm text-white/70">
                                                <Phone className="h-4 w-4 mr-2 text-white/40" aria-hidden="true" />
                                                <span>{booking.customerMobile}</span>
                                            </div>

                                            <div className="flex items-center text-xs sm:text-sm text-white/70">
                                                <IndianRupee className="h-4 w-4 mr-2 text-white/40" aria-hidden="true" />
                                                <span>₹{booking.totalAmount.toLocaleString()}</span>
                                            </div>

                                            {booking.guestCount > 0 && (
                                                <div className="flex items-center text-xs sm:text-sm text-white/70">
                                                    <User className="h-4 w-4 mr-2 text-white/40" aria-hidden="true" />
                                                    <span>{booking.guestCount} guests</span>
                                                </div>
                                            )}
                                        </div>

                                        {booking.notes && (
                                            <div className="mt-2 text-xs sm:text-sm bg-black/20 p-2 rounded border border-white/5">
                                                <p className="text-white/60">{booking.notes}</p>
                                            </div>
                                        )}

                                        <div className="mt-3 flex justify-end">
                                            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white h-7 text-xs">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10" aria-hidden="true">
                                    <Calendar className="h-6 w-6 text-white/20" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-1">No events scheduled</h3>
                                <p className="text-white/40">There are no events for this date.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

