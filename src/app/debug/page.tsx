"use client"

import { useState, useEffect } from "react"
import { getHotelBookings, getRooms } from "@/actions/hotel"
import { getMenuItems } from "@/actions/menu"

export default function DebugPage() {
    const [data, setData] = useState<any>({ rooms: [], bookings: [], menuItems: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                console.log("Fetching rooms...")
                const rooms = await getRooms().catch(e => { console.error("Rooms error:", e); return [] })
                console.log("Rooms fetched:", rooms.length)

                console.log("Fetching bookings...")
                const bookings = await getHotelBookings().catch(e => { console.error("Bookings error:", e); return [] })
                console.log("Bookings fetched:", bookings.length)

                console.log("Fetching menu items...")
                const menuItems = await getMenuItems().catch(e => { console.error("Menu items error:", e); return [] })
                console.log("Menu items fetched:", menuItems.length)

                setData({ rooms, bookings, menuItems })
            } catch (error) {
                console.error("General error:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="p-8">Loading debug data...</div>

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Debug Data</h1>

            <section>
                <h2 className="text-xl font-semibold mb-4">Rooms ({data.rooms.length})</h2>
                <div className="bg-slate-100 p-4 rounded overflow-auto max-h-64">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Number</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.rooms.map((room: any) => (
                                <tr key={room.id} className="border-b">
                                    <td className="font-mono">{room.id}</td>
                                    <td>{room.number}</td>
                                    <td>{room.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Bookings ({data.bookings.length})</h2>
                <div className="bg-slate-100 p-4 rounded overflow-auto max-h-64">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Room ID</th>
                                <th>Status</th>
                                <th>Customer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.bookings.map((booking: any) => (
                                <tr key={booking.id} className="border-b">
                                    <td className="font-mono">{booking.id}</td>
                                    <td className="font-mono">{booking.roomId}</td>
                                    <td>{booking.status}</td>
                                    <td>{booking.customer?.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Menu Items ({data.menuItems.length})</h2>
                <div className="bg-slate-100 p-4 rounded overflow-auto max-h-64">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Business Unit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.menuItems.map((item: any) => (
                                <tr key={item.id} className="border-b">
                                    <td className="font-mono">{item.id}</td>
                                    <td>{item.name}</td>
                                    <td>{item.category}</td>
                                    <td>{item.businessUnit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}
