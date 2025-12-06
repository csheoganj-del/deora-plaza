"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBooking, getBookings, deleteBooking, addHotelBookingPayment } from "@/actions/bookings"
import { createRoom, getRooms, updateRoom, deleteRoom, checkOutGuest, type Room } from "@/actions/hotel"
import { getBusinessSettings } from "@/actions/businessSettings"
import RoomGrid from "@/components/hotel/RoomGrid"
import RoomServiceDialog from "@/components/hotel/RoomServiceDialog"
import RoomServiceOrders from "@/components/hotel/RoomServiceOrders"
import HotelStatsCard from "@/components/hotel/HotelStatsCard"
import HotelSearchBar from "@/components/hotel/HotelSearchBar"
import EmptyStateCard from "@/components/hotel/EmptyStateCard"
import FormError from "@/components/hotel/FormError"
import { SkeletonStats, SkeletonGrid } from "@/components/hotel/SkeletonCard"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Calendar as CalendarIcon, Hotel, BedDouble, CalendarDays, Printer, MoreVertical, Trash2, LogOut, UtensilsCrossed } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete"
import { getCustomerDiscountInfo } from "@/actions/customers"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function HotelPage() {
    const router = useRouter()
    const [rooms, setRooms] = useState<any[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isBookOpen, setIsBookOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<any>(null)
    const [businessSettings, setBusinessSettings] = useState<any>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [bookingToDelete, setBookingToDelete] = useState<any>(null)
    const [deletePassword, setDeletePassword] = useState("")
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<any>(null)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi" | "online">("cash")
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
    const [isDeleteRoomDialogOpen, setIsDeleteRoomDialogOpen] = useState(false)
    const [isRoomServiceDialogOpen, setIsRoomServiceDialogOpen] = useState(false)
    const [selectedRoomForService, setSelectedRoomForService] = useState<Room | null>(null)
    const [roomSearchQuery, setRoomSearchQuery] = useState("")
    const [bookingSearchQuery, setBookingSearchQuery] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [roomFormError, setRoomFormError] = useState<string | null>(null)
    const [bookingFormError, setBookingFormError] = useState<string | null>(null)
    const [bookingsPerPage] = useState(9)
    const [currentPage, setCurrentPage] = useState(1)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Simple date handling for now
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]

    const initialBookingData = {
        customerName: "",
        customerMobile: "",
        startDate: today,
        endDate: tomorrow,
        checkInTime: "14:00",
        checkOutTime: "11:00",
        notes: "",
        discountPercent: "0",
        gstEnabled: false,
        gstPercentage: "18",
        advancePayment: "",
        acceptedTerms: false
    }

    const [bookingData, setBookingData] = useState(initialBookingData)

    const createEmptyRoomForm = () => ({
        number: "",
        type: "",
        price: "",
        capacity: "",
        status: "available",
        floor: "",
        description: ""
    })

    const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
    const [roomForm, setRoomForm] = useState(createEmptyRoomForm())
    const roomTypeOptions = ["Single", "Double", "Deluxe", "Suite", "Family", "Dorm"]
    const roomStatusOptions: Room["status"][] = ["available", "occupied", "maintenance", "cleaning"]

    const fetchData = async () => {
        setLoading(true)
        const [allRooms, allBookings] = await Promise.all([
            getRooms(),
            getBookings("hotel")
        ])

        // Map rooms to bookings to ensure we have price details
        const bookingsWithRooms = allBookings.map((booking: any) => ({
            ...booking,
            room: allRooms.find((r: any) => r.id === booking.roomId) || null
        }))

        setRooms(allRooms)
        setBookings(bookingsWithRooms)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        const fetchSettings = async () => {
            const settings = await getBusinessSettings()
            if (settings) {
                setBusinessSettings(settings)
            }
        }
        fetchSettings()
    }, [])

    const handleRoomSelect = (room: any) => {
        if (room.status !== "available") {
            alert("Only available rooms can be booked. Update the room status to available before booking.")
            return
        }

        // Set live check-in time
        const now = new Date()
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

        setBookingData(prev => ({
            ...prev,
            checkInTime: currentTime
        }))

        setSelectedRoom(room)
        setIsBookOpen(true)
    }

    const handleOpenRoomService = (room: Room) => {
        setSelectedRoomForService(room)
        setIsRoomServiceDialogOpen(true)
    }

    const handleCustomerSelect = async (customer: any) => {
        if (customer) {
            setBookingData(prev => ({
                ...prev,
                customerName: customer.name,
                customerMobile: customer.mobileNumber
            }))

            // Auto-suggest discount based on customer tier
            const discountInfo = await getCustomerDiscountInfo(customer.mobileNumber)
            if (discountInfo && discountInfo.suggestedDiscount > 0) {
                setBookingData(prev => ({
                    ...prev,
                    discountPercent: discountInfo.suggestedDiscount.toString()
                }))
            }
        } else {
            setBookingData(prev => ({
                ...prev,
                customerName: "",
                customerMobile: "",
                discountPercent: "0"
            }))
        }
    }

    const nightlyRate = selectedRoom ? (Number(selectedRoom.price) || Number(selectedRoom.pricePerNight) || 0) : 0
    const nights = useMemo(() => {
        const start = new Date(bookingData.startDate)
        const end = new Date(bookingData.endDate)
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        return Math.max(diff, 1)
    }, [bookingData.startDate, bookingData.endDate])

    const baseAmount = nightlyRate * nights
    const discountPercentValue = parseFloat(bookingData.discountPercent) || 0
    const discountAmount = baseAmount * (discountPercentValue / 100)
    const discountedSubtotal = Math.max(baseAmount - discountAmount, 0)
    const gstPercentageValue = bookingData.gstEnabled ? (parseFloat(bookingData.gstPercentage) || 0) : 0
    const gstAmount = bookingData.gstEnabled ? discountedSubtotal * (gstPercentageValue / 100) : 0
    const totalAmount = discountedSubtotal + gstAmount
    const advancePaymentValue = parseFloat(bookingData.advancePayment) || 0
    const remainingBalance = Math.max(totalAmount - advancePaymentValue, 0)

    const handleCreateBooking = async () => {
        setBookingFormError(null)

        if (!selectedRoom) {
            setBookingFormError("Please select a room")
            return
        }
        if (!bookingData.customerMobile || !bookingData.customerName) {
            setBookingFormError("Please select or enter a customer name and phone number")
            return
        }
        if (!bookingData.acceptedTerms) {
            setBookingFormError("Please accept the terms and conditions")
            return
        }

        const start = new Date(bookingData.startDate)
        const end = new Date(bookingData.endDate)

        if (start >= end) {
            setBookingFormError("Check-out date must be after check-in date")
            return
        }

        const result = await createBooking({
            customerMobile: bookingData.customerMobile,
            customerName: bookingData.customerName,
            type: "hotel",
            startDate: start,
            endDate: end,
            roomId: selectedRoom.id,
            notes: bookingData.notes,
            totalAmount,
            basePrice: baseAmount,
            discountPercent: discountPercentValue,
            gstEnabled: bookingData.gstEnabled,
            gstPercentage: gstPercentageValue,
            advancePayment: advancePaymentValue,
            checkInTime: bookingData.checkInTime,
            checkOutTime: bookingData.checkOutTime
        })

        if (result.success) {
            setIsBookOpen(false)
            setSelectedRoom(null)
            setBookingData(initialBookingData)
            setBookingFormError(null)
            fetchData()
        } else {
            setBookingFormError(typeof result?.error === "string" ? result.error : "Failed to create booking")
        }
    }

    const handleSaveRoom = async () => {
        setRoomFormError(null)

        if (!roomForm.number.trim()) {
            setRoomFormError("Room number is required")
            return
        }
        if (!roomForm.type) {
            setRoomFormError("Room type is required")
            return
        }
        if (!roomForm.price || Number(roomForm.price) <= 0) {
            setRoomFormError("Please enter a valid price")
            return
        }
        if (!roomForm.capacity || Number(roomForm.capacity) < 1) {
            setRoomFormError("Please enter valid capacity")
            return
        }

        const roomData = {
            number: roomForm.number.trim(),
            type: roomForm.type,
            price: Number(roomForm.price),
            capacity: Number(roomForm.capacity),
            status: roomForm.status as Room["status"],
            floor: roomForm.floor ? Number(roomForm.floor) : undefined,
            amenities: [],
            description: roomForm.description.trim()
        }

        let result;
        if (editingRoom && editingRoom.id) {
            result = await updateRoom(editingRoom.id, roomData)
        } else {
            result = await createRoom(roomData)
        }

        if (result?.success) {
            setIsRoomDialogOpen(false)
            setRoomForm(createEmptyRoomForm())
            setEditingRoom(null)
            setRoomFormError(null)
            fetchData()
        } else {
            const fallback = editingRoom ? "Failed to update room" : "Failed to create room"
            setRoomFormError(typeof result?.error === "string" ? result.error : fallback)
        }
    }

    const handleEditRoom = (room: Room) => {
        setEditingRoom(room)
        setRoomForm({
            number: room.number,
            type: room.type,
            price: room.price.toString(),
            capacity: room.capacity.toString(),
            status: room.status,
            floor: room.floor?.toString() || "",
            description: room.description || ""
        })
        setIsRoomDialogOpen(true)
    }

    const handleDeleteRoom = async () => {
        if (!roomToDelete || !roomToDelete.id) return

        const result = await deleteRoom(roomToDelete.id, deletePassword)
        if (result.success) {
            setIsDeleteRoomDialogOpen(false)
            setRoomToDelete(null)
            setDeletePassword("")
            fetchData()
        } else {
            alert(result.error || "Failed to delete room")
        }
    }

    const confirmDeleteRoom = (room: Room) => {
        setRoomToDelete(room)
        setDeletePassword("")
        setIsDeleteRoomDialogOpen(true)
    }

    const handleCheckOut = async (booking: any) => {
        if (!confirm("Are you sure you want to check out this guest? This will record the current time as the checkout time.")) return

        const result = await checkOutGuest(booking.id, booking.roomId)
        if (result.success) {
            await fetchData()
            router.refresh()
        } else {
            alert("Failed to check out guest")
        }
    }

    const printBill = (booking: any) => {
        const businessName = businessSettings?.businessName || "DEORA PLAZA"
        const businessAddress = businessSettings?.address || ""
        const businessMobile = businessSettings?.phoneNumber || ""

        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            alert("Please allow popups to print the bill")
            return
        }

        const start = new Date(booking.startDate)
        const end = new Date(booking.endDate)
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const nights = Math.max(diff, 1)

        const basePrice = booking.basePrice || 0
        const discountPercent = booking.discountPercent || 0
        const discountAmount = basePrice * (discountPercent / 100)
        const discountedSubtotal = Math.max(basePrice - discountAmount, 0)
        const gstAmount = booking.totalAmount - discountedSubtotal
        const totalAmount = booking.totalAmount || 0

        const receiptNumbers = booking.payments?.map((p: any) => p.receiptNumber).filter(Boolean).join(', ') || booking.id || 'N/A';
        const isFinal = booking.remainingBalance <= 0;
        const receiptTitle = isFinal ? "Final Invoice" : "Advance Receipt";

        const roomServiceHTML = booking.roomServiceCharges && booking.roomServiceCharges.length > 0 ? `
                                <tr>
                                    <td colspan="2" style="padding-top: 16px; padding-bottom: 8px;">
                                        <div style="font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Room Service Orders</div>
                                    </td>
                                </tr>
                                ${booking.roomServiceCharges.map((charge: any) => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 500; color: #0f172a;">Order #${charge.orderNumber}</div>
                                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                                            ${charge.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')}
                                        </div>
                                    </td>
                                    <td class="amount-col">₹${(charge.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                `).join('')}
                                <tr>
                                    <td style="text-align: right; padding-right: 24px; font-size: 13px; color: #64748b;">
                                        <strong>Room Service Subtotal</strong>
                                    </td>
                                    <td class="amount-col" style="font-weight: 600;">₹${(booking.roomServiceTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ` : '';

        const discountHTML = discountPercent > 0 ? `
                                <tr>
                                    <td>
                                        <div style="font-weight: 500; color: #059669;">Discount Applied</div>
                                        <div style="font-size: 12px; color: #059669; margin-top: 2px;">${discountPercent}% Off</div>
                                    </td>
                                    <td class="amount-col" style="color: #059669;">-₹${(discountAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ` : '';

        const gstHTML = booking.gstEnabled ? `
                                <tr>
                                    <td>
                                        <div style="font-weight: 500; color: #0f172a;">GST</div>
                                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">GST @ ${booking.gstPercentage}%</div>
                                    </td>
                                    <td class="amount-col">₹${(gstAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ` : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Hotel Bill - ${booking.customer?.name || booking.customerMobile}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
                    .bill-container { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
                    .header-section { background: #f8fafc; padding: 32px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
                    .business-info h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: -0.025em; }
                    .business-info p { font-size: 13px; color: #64748b; margin: 2px 0; }
                    .invoice-meta { text-align: right; }
                    .invoice-badge { background: ${isFinal ? '#22c55e' : '#f59e0b'}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; display: inline-block; margin-bottom: 8px; }
                    .meta-row { font-size: 13px; margin: 2px 0; color: #64748b; }
                    .meta-row strong { color: #0f172a; margin-left: 8px; }
                    .content-section { padding: 32px; }
                    .customer-section { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
                    .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.05em; }
                    .customer-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
                    .info-group h3 { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 4px 0; }
                    .info-group p { font-size: 13px; color: #64748b; margin: 0; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                    th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                    td { padding: 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0; }
                    .amount-col { text-align: right; font-variant-numeric: tabular-nums; }
                    .total-row td { border-bottom: none; padding-top: 24px; }
                    .grand-total { font-size: 18px; font-weight: 700; color: #0f172a; }
                    .payment-summary { background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px; }
                    .payment-summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
                    .payment-summary-row:last-child { margin-bottom: 0; }
                    .footer-section { background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; }
                    .terms { font-size: 11px; color: #94a3b8; }
                    .terms ul { margin: 8px 0 0 0; padding-left: 16px; }
                    .terms li { margin-bottom: 2px; }
                    .thank-you { text-align: center; margin-top: 24px; font-size: 13px; font-weight: 500; color: #64748b; }
                    @media print { body { padding: 0; } .bill-container { border: none; } }
                </style>
            </head>
            <body>
                <div class="bill-container">
                    <div class="header-section">
                        <div class="business-info">
                            <h1>${businessName}</h1>
                            ${businessAddress ? `<p>${businessAddress}</p>` : ''}
                            ${businessMobile ? `<p>Tel: ${businessMobile}</p>` : ''}
                        </div>
                        <div class="invoice-meta">
                            <div class="invoice-badge">${receiptTitle}</div>
                            <div class="meta-row">Receipt #(s): <strong>${receiptNumbers}</strong></div>
                            <div class="meta-row">Booking ID: <strong>${booking.id || 'N/A'}</strong></div>
                            <div class="meta-row">Date: <strong>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</strong></div>
                        </div>
                    </div>
                    <div class="content-section">
                        <div class="customer-section">
                            <div class="customer-grid">
                                <div class="info-group">
                                    <div class="section-title">Guest Details</div>
                                    <h3>${booking.customer?.name || booking.customerMobile}</h3>
                                    <p>${booking.customerMobile || 'N/A'}</p>
                                </div>
                                <div class="info-group">
                                    <div class="section-title">Booking Dates</div>
                                    <p><strong>Check-in:</strong> ${new Date(booking.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${booking.checkInTime}</p>
                                    <p><strong>Check-out:</strong> ${new Date(booking.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${booking.checkOut ? new Date(booking.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : booking.checkOutTime}</p>
                                </div>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 60%">Description</th>
                                    <th class="amount-col">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style="font-weight: 500; color: #0f172a;">Room Charges</div>
                                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${nights} Night${nights !== 1 ? 's' : ''} @ ₹${((booking.room?.price || booking.room?.pricePerNight || 0)).toLocaleString()}/night</div>
                                    </td>
                                    <td class="amount-col">₹${(basePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ${roomServiceHTML}
                                ${discountHTML}
                                ${gstHTML}
                                <tr class="total-row">
                                    <td style="text-align: right; padding-right: 24px;">
                                        <span style="font-size: 14px; font-weight: 600; color: #64748b;">Total Amount</span>
                                    </td>
                                    <td class="amount-col">
                                        <div class="grand-total">₹${(totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="payment-summary">
                            <div class="payment-summary-row">
                                <span style="color: #64748b;">Amount Paid</span>
                                <span style="font-weight: 600; color: #059669;">₹${(booking.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div class="payment-summary-row">
                                <span style="color: #64748b;">Balance Due</span>
                                <span style="font-weight: 600; color: #e11d48;">₹${(booking.remainingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        ${booking.notes ? `
                        <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px;">
                            <div style="font-size: 11px; font-weight: 600; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">Notes</div>
                            <div style="font-size: 13px; color: #92400e;">${booking.notes}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="footer-section">
                        <div class="terms">
                            <strong>Terms & Conditions</strong>
                            <ul>
                                <li>Check-in time: 2:00 PM | Check-out time: 11:00 AM</li>
                                <li>Early check-in or late check-out subject to availability and may incur additional charges.</li>
                                <li>Any damage to hotel property will be charged separately.</li>
                                <li>Full payment must be settled before check-out.</li>
                            </ul>
                        </div>
                        <div class="thank-you">
                            Thank you for choosing ${businessName}!
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    const handleDeleteBooking = async () => {
        if (!bookingToDelete) return

        const result = await deleteBooking(bookingToDelete.id, deletePassword)

        if (result.success) {
            setIsDeleteDialogOpen(false)
            setBookingToDelete(null)
            setDeletePassword("")
            await fetchData()
            router.refresh()
        } else {
            alert(result.error || "Failed to delete booking. Please check your password.")
        }
    }

    const confirmDelete = (booking: any) => {
        setBookingToDelete(booking)
        setDeletePassword("")
        setIsDeleteDialogOpen(true)
    }
    const openPaymentDialog = (booking: any) => {
        setSelectedBookingForPayment(booking)
        setPaymentAmount("")
        setIsPaymentDialogOpen(true)
    }

    const handleAddPayment = async () => {
        if (!selectedBookingForPayment) return
        const amount = parseFloat(paymentAmount)
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid payment amount")
            return
        }

        const result = await addHotelBookingPayment(selectedBookingForPayment.id, amount, paymentMethod, "partial")

        if (result.success) {
            setIsPaymentDialogOpen(false)
            setSelectedBookingForPayment(null)
            setPaymentAmount("")
            await fetchData()
            router.refresh()

            // Auto-print if payment completes the booking
            if (result.booking && result.booking.remainingBalance <= 0) {
                // Find the updated booking and print
                const updatedBookings = await getBookings("hotel")
                const completedBooking = updatedBookings.find((b: any) => b.id === selectedBookingForPayment.id)
                if (completedBooking) {
                    printBill(completedBooking)
                }
            }
        } else {
            alert(result.error || "Failed to add payment")
        }
    }

    const totalRevenue = useMemo(() => bookings.reduce((sum, booking) => sum + (Number(booking.totalPaid) || 0), 0), [bookings])
    const pendingPaymentsTotal = useMemo(() => bookings.reduce((sum, booking) => sum + (Number(booking.remainingBalance) || 0), 0), [bookings])
    const upcomingBookings = useMemo(() => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        return bookings.filter((booking) => {
            const start = new Date(booking.startDate)
            start.setHours(0, 0, 0, 0)
            return start >= now
        }).length
    }, [bookings])
    const availableRoomsCount = useMemo(() => rooms.filter((room) => room.status === "available").length, [rooms])

    const filteredRooms = useMemo(() => {
        if (!roomSearchQuery.trim()) return rooms
        const query = roomSearchQuery.toLowerCase()
        return rooms.filter(room =>
            room.number.toLowerCase().includes(query) ||
            room.type.toLowerCase().includes(query) ||
            room.description?.toLowerCase().includes(query)
        )
    }, [rooms, roomSearchQuery])

    const filteredBookings = useMemo(() => {
        if (!bookingSearchQuery.trim()) return bookings
        const query = bookingSearchQuery.toLowerCase()
        return bookings.filter(booking =>
            booking.customer?.name.toLowerCase().includes(query) ||
            booking.customerMobile.includes(query) ||
            booking.room?.number.toLowerCase().includes(query)
        )
    }, [bookings, bookingSearchQuery])

    const paginatedBookings = useMemo(() => {
        const startIndex = (currentPage - 1) * bookingsPerPage
        return filteredBookings.slice(startIndex, startIndex + bookingsPerPage)
    }, [filteredBookings, currentPage, bookingsPerPage])

    const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage)

    useEffect(() => {
        setCurrentPage(1)
    }, [bookingSearchQuery])

    if (loading) {
        return (
            <div className="flex-1 min-h-screen bg-slate-50 text-slate-900 p-8 space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-3" />
                        <div className="h-8 w-96 bg-slate-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-80 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
                <SkeletonStats />
                <SkeletonGrid />
            </div>
        )
    }

    return (
        <div className="flex-1 min-h-screen bg-slate-50 text-slate-900 p-8 space-y-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Hotel Management</p>
                    <h1 className="text-5xl font-bold text-slate-900">Hotel Dashboard</h1>
                    <p className="text-base text-slate-600">Manage rooms, bookings, and guest interactions in one place</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white">
                            <Hotel className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-xs font-medium text-slate-600 block">Available</span>
                            <span className="text-lg font-bold text-slate-900">{availableRoomsCount}/{rooms.length}</span>
                        </div>
                    </div>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={() => {
                            setEditingRoom(null)
                            setRoomForm(createEmptyRoomForm())
                            setIsRoomDialogOpen(true)
                        }}
                    >
                        + Add Room
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <HotelStatsCard
                    label="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    subtext="From completed & partial payments"
                    variant="default"
                />
                <HotelStatsCard
                    label="Total Bookings"
                    value={bookings.length}
                    subtext="All-time records"
                    variant="default"
                />
                <HotelStatsCard
                    label="Upcoming Stays"
                    value={upcomingBookings}
                    subtext="Scheduled from today onward"
                    variant="highlight"
                />
                <HotelStatsCard
                    label="Pending Payments"
                    value={`₹${pendingPaymentsTotal.toLocaleString()}`}
                    subtext="Outstanding guest balances"
                    variant="warning"
                />
            </div>

            <Tabs defaultValue="rooms" className="space-y-6">
                <TabsList className="bg-white border border-slate-200 shadow-sm p-1.5 rounded-lg w-full justify-start">
                    <TabsTrigger value="rooms" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 rounded-md px-4 py-2.5 font-medium transition-all">
                        <BedDouble className="h-4 w-4" /> Available Rooms
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 rounded-md px-4 py-2.5 font-medium transition-all">
                        <CalendarDays className="h-4 w-4" /> Active Bookings
                    </TabsTrigger>
                    <TabsTrigger value="room-service" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 rounded-md px-4 py-2.5 font-medium transition-all">
                        <UtensilsCrossed className="h-4 w-4" /> Room Service
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rooms" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-xs">
                            <HotelSearchBar
                                onSearch={setRoomSearchQuery}
                                placeholder="Search room number, type..."
                            />
                        </div>
                        <span className="text-sm text-slate-500">
                            {filteredRooms.length} of {rooms.length} rooms
                        </span>
                    </div>

                    {filteredRooms.length === 0 ? (
                        <EmptyStateCard
                            icon={Hotel}
                            title="No rooms found"
                            description={roomSearchQuery ? "Try adjusting your search criteria" : "Add rooms to get started managing your hotel"}
                            action={!roomSearchQuery ? { label: "Add Room", onClick: () => setIsRoomDialogOpen(true) } : undefined}
                        />
                    ) : (
                        <RoomGrid
                            rooms={filteredRooms}
                            onSelect={handleRoomSelect}
                            onEdit={handleEditRoom}
                            onDelete={confirmDeleteRoom}
                            onRoomService={handleOpenRoomService}
                        />
                    )}
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-xs">
                            <HotelSearchBar
                                onSearch={setBookingSearchQuery}
                                placeholder="Search guest name, phone, room..."
                            />
                        </div>
                        <span className="text-sm text-slate-500">
                            {filteredBookings.length} of {bookings.length} bookings
                        </span>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <EmptyStateCard
                            icon={CalendarDays}
                            title={bookingSearchQuery ? "No bookings found" : "No bookings yet"}
                            description={bookingSearchQuery ? "Try adjusting your search criteria" : "Bookings will appear here once guests start making reservations"}
                        />
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {paginatedBookings.map((booking) => (
                                    <Card key={booking.id} className="border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-5 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Room</div>
                                                    <div className="text-2xl font-bold text-slate-900">{booking.room?.number || "N/A"}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize bg-slate-50 border-slate-200 text-slate-600">
                                                        {booking.status}
                                                    </Badge>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-white">
                                                            <DropdownMenuItem onClick={() => printBill(booking)}>
                                                                <Printer className="mr-2 h-4 w-4" />
                                                                Print Bill
                                                            </DropdownMenuItem>
                                                            {booking.remainingBalance > 0 && (
                                                                <DropdownMenuItem onClick={() => openPaymentDialog(booking)}>
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    Add Payment
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => {
                                                                const room = rooms.find(r => r.id === booking.roomId)
                                                                if (room) {
                                                                    handleOpenRoomService(room)
                                                                }
                                                            }}>
                                                                <UtensilsCrossed className="mr-2 h-4 w-4" />
                                                                Order Room Service
                                                            </DropdownMenuItem>
                                                            {(booking.status === 'confirmed' || booking.status === 'checked-in') && (
                                                                <DropdownMenuItem onClick={() => handleCheckOut(booking)}>
                                                                    <LogOut className="mr-2 h-4 w-4" />
                                                                    Check Out
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => confirmDelete(booking)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Booking
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-700">
                                                    {booking.customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{booking.customer.name}</div>
                                                    <div className="text-xs text-slate-500">{booking.customerMobile}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                                <span>{new Date(booking.startDate).toLocaleDateString()}</span>
                                                <span className="text-slate-300">→</span>
                                                <span>{new Date(booking.endDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="space-y-1 text-sm text-slate-600">
                                                <div className="flex justify-between">
                                                    <span>Total</span>
                                                    <span className="font-semibold text-slate-900">₹{(booking.totalAmount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Paid</span>
                                                    <span>₹{(booking.totalPaid || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500">
                                                    <span>Balance</span>
                                                    <span>₹{(booking.remainingBalance || 0).toLocaleString()}</span>
                                                </div>
                                                <Badge variant="outline" className="mt-2 border-slate-200 text-xs uppercase tracking-wide bg-slate-50 text-slate-600">
                                                    {booking.paymentStatus || "pending"}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <Button
                                                key={i + 1}
                                                variant={currentPage === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={currentPage === i + 1 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                            >
                                                {i + 1}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="room-service">
                    <RoomServiceOrders key={refreshTrigger} />
                </TabsContent>
            </Tabs>

            <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900">
                            {editingRoom ? "Edit Room" : "Add New Room"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <FormError message={roomFormError ?? undefined} />
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-600">Room Number</Label>
                                <Input
                                    value={roomForm.number}
                                    onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
                                    placeholder="E.g. 101"
                                    className="bg-white border-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Room Type</Label>
                                <select
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                    value={roomForm.type}
                                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                                >
                                    <option value="">Select type</option>
                                    {roomTypeOptions.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-600">Price Per Night</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={roomForm.price}
                                    onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                                    placeholder="₹"
                                    className="bg-white border-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Capacity</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={roomForm.capacity}
                                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                                    placeholder="Guests"
                                    className="bg-white border-slate-300"
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-600">Status</Label>
                                <select
                                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 capitalize"
                                    value={roomForm.status}
                                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                                >
                                    {roomStatusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Floor (optional)</Label>
                                <Input
                                    type="number"
                                    value={roomForm.floor}
                                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                                    placeholder="E.g. 1"
                                    className="bg-white border-slate-300"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600">Description</Label>
                            <textarea
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                rows={3}
                                value={roomForm.description}
                                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                                placeholder="Describe the room, amenities, view, etc."
                            />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveRoom}>
                            {editingRoom ? "Update Room" : "Save Room"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
                <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <BedDouble className="h-6 w-6 text-blue-500" />
                            Book Room {selectedRoom?.roomNumber}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <FormError message={bookingFormError ?? undefined} />
                        <CustomerAutocomplete
                            onCustomerSelect={handleCustomerSelect}
                            initialName={bookingData.customerName}
                            initialMobile={bookingData.customerMobile}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600">Check-in</Label>
                                <Input
                                    type="date"
                                    className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                    value={bookingData.startDate}
                                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Check-out</Label>
                                <Input
                                    type="date"
                                    className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                    value={bookingData.endDate}
                                    onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600">Check-in Time</Label>
                                <Input
                                    type="time"
                                    className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                    value={bookingData.checkInTime}
                                    onChange={(e) => setBookingData({ ...bookingData, checkInTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Check-out Time</Label>
                                <Input
                                    type="time"
                                    className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                    value={bookingData.checkOutTime}
                                    onChange={(e) => setBookingData({ ...bookingData, checkOutTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600">Notes</Label>
                            <Input
                                className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                placeholder="Special requests..."
                                value={bookingData.notes}
                                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-slate-600">Discount %</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                    value={bookingData.discountPercent}
                                    onChange={(e) => setBookingData({ ...bookingData, discountPercent: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">Advance Payment</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                    value={bookingData.advancePayment}
                                    onChange={(e) => setBookingData({ ...bookingData, advancePayment: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-3 rounded-lg border border-slate-200 p-3 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-800 font-medium">Apply GST</p>
                                    <p className="text-xs text-slate-500">Include tax on discounted amount</p>
                                </div>
                                <Switch
                                    checked={bookingData.gstEnabled}
                                    onCheckedChange={(value) => setBookingData({ ...bookingData, gstEnabled: value })}
                                />
                            </div>
                            {bookingData.gstEnabled && (
                                <div className="space-y-2">
                                    <Label className="text-slate-600">GST %</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                                        value={bookingData.gstPercentage}
                                        onChange={(e) => setBookingData({ ...bookingData, gstPercentage: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <div className="space-y-3 mb-4 p-3 bg-blue-50 rounded border border-blue-100 text-sm">
                                <div className="flex justify-between text-blue-700">
                                    <span>Base ({nights} nights)</span>
                                    <span className="font-semibold text-blue-900">₹{baseAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-blue-700">
                                    <span>Discount ({discountPercentValue || 0}%)</span>
                                    <span className="font-semibold text-blue-900">-₹{discountAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-blue-700">
                                    <span>GST {bookingData.gstEnabled ? `(${gstPercentageValue} %)` : '(disabled)'}</span>
                                    <span className="font-semibold text-blue-900">₹{gstAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-blue-900 border-t border-blue-200 pt-2 text-base font-semibold">
                                    <span>Total</span>
                                    <span>₹{totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-blue-700">
                                    <span>Advance</span>
                                    <span className="font-semibold text-blue-900">₹{advancePaymentValue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-blue-700">
                                    <span>Balance</span>
                                    <span className="font-semibold text-blue-900">₹{remainingBalance.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 mb-4">
                                <Checkbox
                                    id="terms"
                                    checked={bookingData.acceptedTerms}
                                    onCheckedChange={(checked) => setBookingData({ ...bookingData, acceptedTerms: checked as boolean })}
                                />
                                <label
                                    htmlFor="terms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                                >
                                    I accept the terms and conditions
                                </label>
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-blue-200"
                                onClick={handleCreateBooking}
                            >
                                Confirm Booking
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[400px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Trash2 className="h-6 w-6 text-red-600" />
                            Delete Booking
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-slate-600">
                            Are you sure you want to delete this booking for <strong>{bookingToDelete?.customer?.name}</strong>?
                        </p>
                        <div className="space-y-2">
                            <Label className="text-slate-600">Enter Password to Confirm</Label>
                            <Input
                                type="password"
                                className="bg-white border-slate-300 text-slate-900"
                                placeholder="Enter deletion password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsDeleteDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDeleteBooking}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[400px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarIcon className="h-6 w-6 text-blue-600" />
                            Add Payment
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <p className="text-sm text-slate-600">
                                Customer: <strong>{selectedBookingForPayment?.customer?.name}</strong>
                            </p>
                            <p className="text-sm text-slate-600">
                                Total Amount: <strong>₹{(selectedBookingForPayment?.totalAmount || 0).toLocaleString()}</strong>
                            </p>
                            <p className="text-sm text-slate-600">
                                Paid: <strong>₹{(selectedBookingForPayment?.totalPaid || 0).toLocaleString()}</strong>
                            </p>
                            <p className="text-sm font-semibold text-blue-600">
                                Remaining: ₹{(selectedBookingForPayment?.remainingBalance || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600">Payment Amount</Label>
                            <Input
                                type="number"
                                min="0"
                                max={selectedBookingForPayment?.remainingBalance || 0}
                                className="bg-white border-slate-300 text-slate-900"
                                placeholder="Enter amount"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600">Payment Method</Label>
                            <select
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                            >
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                                <option value="online">Online</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsPaymentDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleAddPayment}
                            >
                                Add Payment
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteRoomDialogOpen} onOpenChange={setIsDeleteRoomDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">Delete Room</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-slate-600">
                            Are you sure you want to delete Room <strong>{roomToDelete?.number}</strong>? This action cannot be undone.
                        </p>
                        <div className="space-y-2">
                            <Label className="text-slate-600">Enter Password to Confirm</Label>
                            <Input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="bg-white border-slate-300"
                                placeholder="Enter admin password"
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteRoomDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDeleteRoom}
                            >
                                Delete Room
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <RoomServiceDialog
                isOpen={isRoomServiceDialogOpen}
                onClose={() => {
                    setIsRoomServiceDialogOpen(false)
                    fetchData()
                    setRefreshTrigger(prev => prev + 1)
                }}
                room={selectedRoomForService}
            />
        </div >
    )
}
