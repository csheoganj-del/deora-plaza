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
            <div className="premium-card">
                <div className="p-8 p-2">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleSelect}
                        className="rounded-md border"
                        modifiers={{
                            booked: (date) => bookedDates.includes(date.toDateString())
                        }}
                        modifiersStyles={{
                            booked: { 
                                fontWeight: 'bold', 
                                textDecoration: 'underline', 
                                color: 'var(--primary)',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)'
                            }
                        }}
                        aria-label="Select a date to view events"
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                        }}
                    />
                </div>
            </div>

            <div className="flex-1">
                <div className="premium-card">
                    <div className="bg-[#F8FAFC] p-6">
                        <h3 className="text-lg font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span>Events for {date ? format(date, "EEE, MMM d, yyyy") : ""}</span>
                            <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded self-start sm:self-auto">
                                {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'Event' : 'Events'}
                            </span>
                        </h3>
                    </div>
                    <div className="p-6">
                        {selectedDateBookings.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDateBookings.map(booking => (
                                    <div 
                                        key={booking.id} 
                                        className="border rounded-lg p-3 sm:p-4 hover:bg-[#F8FAFC] transition-colors"
                                        role="article"
                                        aria-label={`Event for ${booking.customerName}, ${booking.eventType}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-base sm:text-lg">{booking.customerName}</h3>
                                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground mt-1">
                                                    <User className="h-4 w-4 mr-1" aria-hidden="true" />
                                                    <span className="capitalize">{booking.eventType}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs border px-2 py-1 rounded" aria-label={`Status: ${booking.status}`}>{booking.status}</span>
                                        </div>
                                        
                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="flex items-center text-xs sm:text-sm">
                                                <Clock className="h-4 w-4 mr-2 text-[#9CA3AF]" aria-hidden="true" />
                                                <span>
                                                    {format(new Date(booking.startDate), "h:mm a")} - {format(new Date(booking.endDate), "h:mm a")}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center text-xs sm:text-sm">
                                                <Phone className="h-4 w-4 mr-2 text-[#9CA3AF]" aria-hidden="true" />
                                                <span>{booking.customerMobile}</span>
                                            </div>
                                            
                                            <div className="flex items-center text-xs sm:text-sm">
                                                <IndianRupee className="h-4 w-4 mr-2 text-[#9CA3AF]" aria-hidden="true" />
                                                <span>₹{booking.totalAmount.toLocaleString()}</span>
                                            </div>
                                            
                                            {booking.guestCount > 0 && (
                                                <div className="flex items-center text-xs sm:text-sm">
                                                    <User className="h-4 w-4 mr-2 text-[#9CA3AF]" aria-hidden="true" />
                                                    <span>{booking.guestCount} guests</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {booking.notes && (
                                            <div className="mt-2 text-xs sm:text-sm bg-[#F8FAFC] p-2 rounded">
                                                <p className="text-[#6B7280]">{booking.notes}</p>
                                            </div>
                                        )}
                                        
                                        <div className="mt-3 flex justify-end">
                                            <Button variant="outline" size="sm" aria-label={`View details for ${booking.customerName}`}>
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="mx-auto h-12 w-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3" aria-hidden="true">
                                    <Calendar className="h-6 w-6 text-[#9CA3AF]" />
                                </div>
                                <h3 className="text-lg font-medium text-[#111827] mb-1">No events scheduled</h3>
                                <p className="text-[#9CA3AF]">There are no events for this date.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

