"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

    return (
        <div className="flex gap-4">
            <Card className="w-fit">
                <CardContent className="p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleSelect}
                        className="rounded-md border"
                        modifiers={{
                            booked: (date) => bookedDates.includes(date.toDateString())
                        }}
                        modifiersStyles={{
                            booked: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                        }}
                    />
                </CardContent>
            </Card>

            <div className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Events for {date?.toDateString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bookings
                            .filter(b => new Date(b.startDate).toDateString() === date?.toDateString())
                            .map(booking => (
                                <div key={booking.id} className="mb-4 border-b pb-4 last:border-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold">{booking.customer.name}</h3>
                                            <p className="text-sm text-muted-foreground">{booking.notes || "No notes"}</p>
                                        </div>
                                        <Badge>{booking.status}</Badge>
                                    </div>
                                    <div className="mt-2 text-sm">
                                        <p>Contact: {booking.customerMobile}</p>
                                        <p>Amount: ₹{booking.totalAmount}</p>
                                    </div>
                                </div>
                            ))
                        }
                        {bookings.filter(b => new Date(b.startDate).toDateString() === date?.toDateString()).length === 0 && (
                            <p className="text-muted-foreground">No events scheduled for this date.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
