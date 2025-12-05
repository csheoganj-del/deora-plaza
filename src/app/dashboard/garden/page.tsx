"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    getGardenBookings,
    createGardenBooking,
    addGardenBookingPayment,
    deleteGardenBooking,
} from "@/actions/garden"
import { getBusinessSettings } from "@/actions/businessSettings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Calendar as CalendarIcon,
    Flower2,
    Search,
    Trash2,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    CalendarCheck,
    CreditCard,
    Plus,
    History,
    Loader2,
    Printer,
    FileSpreadsheet,
    FileText,
    Download,
} from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import CustomerAutocomplete from "@/components/billing/CustomerAutocomplete"
import { getCustomerDiscountInfo } from "@/actions/customers"

const eventTypes = [
    { id: "wedding", name: "Wedding" },
    { id: "birthday", name: "Birthday Party" },
    { id: "conference", name: "Corporate Conference" },
    { id: "reception", name: "Reception" },
    { id: "other", name: "Other Event" },
]

export default function GardenPage() {
    const [bookings, setBookings] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("upcoming")
    const [searchQuery, setSearchQuery] = useState("")
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [isNewEventOpen, setIsNewEventOpen] = useState(false)
    const [businessSettings, setBusinessSettings] = useState<any>(null)

    // Dialog States
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [eventToDelete, setEventToDelete] = useState<any>(null)
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
    const [selectedEventForPayment, setSelectedEventForPayment] = useState<any>(null)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [deletePassword, setDeletePassword] = useState("")
    const [deleteError, setDeleteError] = useState(false)
    const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false)
    const [selectedEventForHistory, setSelectedEventForHistory] = useState<any>(null)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

    // Report States
    const [reportDateRange, setReportDateRange] = useState({
        start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'), // Start of current month
        end: format(new Date(), 'yyyy-MM-dd') // Today
    })

    const [newEvent, setNewEvent] = useState({
        customer: "",
        phone: "",
        type: "",
        startDate: "",
        endDate: "",
        basePrice: "",
        gstEnabled: false,
        gstPercentage: "",
        discountPercent: "",
        totalAmount: "", // This will be calculated
        advancePayment: "",
        notes: "",
        acceptedTerms: false,
    })

    // Handle customer selection from autocomplete
    const handleCustomerSelect = async (customer: any) => {
        setSelectedCustomer(customer)
        if (customer) {
            setNewEvent(prev => ({
                ...prev,
                customer: customer.name,
                phone: customer.mobileNumber
            }))

            // Auto-suggest discount based on customer tier
            const discountInfo = await getCustomerDiscountInfo(customer.mobileNumber)
            if (discountInfo && discountInfo.suggestedDiscount > 0) {
                setNewEvent(prev => ({
                    ...prev,
                    discountPercent: discountInfo.suggestedDiscount.toString()
                }))
            }
        } else {
            setNewEvent(prev => ({
                ...prev,
                customer: "",
                phone: "",
                discountPercent: ""
            }))
        }
    }

    // Helper to calculate total amount based on newEvent state
    const calculateTotal = () => {
        const base = parseFloat(newEvent.basePrice) || 0
        const discount = parseFloat(newEvent.discountPercent) || 0

        // Apply discount first
        const discountAmount = base * (discount / 100)
        const discountedBase = base - discountAmount

        // Then apply GST on discounted amount
        if (!newEvent.gstEnabled) {
            return discountedBase
        }
        const gst = parseFloat(newEvent.gstPercentage) || 0
        const gstAmount = discountedBase * (gst / 100)
        return discountedBase + gstAmount
    }

    const fetchBookings = async () => {
        setIsLoading(true)
        try {
            const result = await getGardenBookings()
            if ('error' in result && result.error) {
                console.error('Error fetching bookings:', result.error)
                // Still set empty array to clear the list
                setBookings([])
            } else if ('bookings' in result) {
                setBookings(result.bookings || [])
            } else {
                // Fallback: set empty array
                setBookings([])
            }
        } catch (error) {
            console.error('Unexpected error:', error)
            setBookings([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings()
        const fetchSettings = async () => {
            const settings = await getBusinessSettings()
            if (settings) {
                setBusinessSettings(settings)
            }
        }
        fetchSettings()
    }, [])

    const router = useRouter()

    const handleCreateEvent = async () => {
        const basePrice = parseFloat(newEvent.basePrice)
        const gstPercentage = newEvent.gstEnabled ? parseFloat(newEvent.gstPercentage) : 0
        const totalAmount = calculateTotal() // Use the helper to calculate total amount

        if (
            !newEvent.customer ||
            !newEvent.phone ||
            !newEvent.type ||
            !newEvent.startDate ||
            !newEvent.endDate ||
            isNaN(basePrice) ||
            (newEvent.gstEnabled && isNaN(gstPercentage)) ||
            !newEvent.acceptedTerms
        ) {
            alert("Please fill all required fields and accept terms.")
            return
        }

        const result = await createGardenBooking({
            customerName: newEvent.customer,
            customerMobile: newEvent.phone,
            eventType: newEvent.type,
            startDate: new Date(newEvent.startDate),
            endDate: new Date(newEvent.endDate),
            basePrice: basePrice,
            gstEnabled: newEvent.gstEnabled,
            gstPercentage: gstPercentage,
            discountPercent: parseFloat(newEvent.discountPercent) || 0,
            totalAmount: totalAmount,
            advancePayment: parseFloat(newEvent.advancePayment) || 0,
            notes: newEvent.notes,
        })

        if (result.error) {
            alert(`Error creating booking: ${result.error}`)
        } else if (result.booking) {
            printReceipt(result.booking, 'advance')
            // Small delay to ensure database has updated
            await new Promise(resolve => setTimeout(resolve, 1000))
            await fetchBookings() // Re-fetch data to update the UI
            router.refresh() // Force router refresh to clear cache
            setIsNewEventOpen(false)
            setSearchQuery("") // Clear search to ensure new item is visible
            setSelectedCustomer(null) // Clear selected customer
            setNewEvent({
                customer: "",
                phone: "",
                type: "",
                startDate: "",
                endDate: "",
                basePrice: "",
                gstEnabled: false,
                gstPercentage: "",
                discountPercent: "",
                totalAmount: "",
                advancePayment: "",
                notes: "",
                acceptedTerms: false,
            })
        }
    }

    const handleAddPayment = async () => {
        const amount = parseFloat(paymentAmount)
        if (!amount || amount <= 0 || !selectedEventForPayment) return

        const result = await addGardenBookingPayment(selectedEventForPayment.id, amount)

        if (result.error) {
            alert(`Error adding payment: ${result.error}`)
        } else if (result.booking) {
            printReceipt(result.booking, 'partial')
            await fetchBookings()
            router.refresh()
            setIsPaymentDialogOpen(false)
            setPaymentAmount("")
            setSelectedEventForPayment(null)
        }
    }

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return
        const result = await deleteGardenBooking(eventToDelete.id)

        if (result.error) {
            alert(`Error deleting booking: ${result.error}`)
        } else {
            // Small delay to ensure database has updated
            await new Promise(resolve => setTimeout(resolve, 1000))
            await fetchBookings()
            router.refresh()
            setIsDeleteDialogOpen(false)
            setEventToDelete(null)
            setSearchQuery("") // Clear search to ensure remaining items are visible
        }
    }

    const confirmDelete = (event: any) => {
        setEventToDelete(event)
        setDeletePassword("")
        setDeleteError(false)
        setIsDeleteDialogOpen(true)
    }

    const openPaymentDialog = (event: any) => {
        setSelectedEventForPayment(event)
        setPaymentAmount(event.remainingBalance.toString())
        setIsPaymentDialogOpen(true)
    }

    const openPaymentHistory = (event: any) => {
        setSelectedEventForHistory(event)
        setIsPaymentHistoryOpen(true)
    }

    const filteredEvents = bookings.filter(event => {
        const customerName = event.customerName || event.customerMobile || ''
        const eventType = event.eventType || event.type || ''
        return (
            customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eventType.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    // Compare dates only (ignore time) for upcoming/past classification
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcomingEvents = filteredEvents.filter(e => {
        const startDate = new Date(e.startDate)
        startDate.setHours(0, 0, 0, 0)
        return startDate >= today
    })

    const pastEvents = filteredEvents.filter(e => {
        const endDate = new Date(e.endDate)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
    })

    // Analytics
    const totalRevenue = bookings.reduce((sum, e) => sum + e.totalPaid, 0)
    const totalBookings = bookings.length
    const upcomingCount = upcomingEvents.length
    const pendingPayments = bookings.reduce((sum, e) => sum + e.remainingBalance, 0)

    const getEventsForDate = (day: Date) => {
        return bookings.filter(event => {
            const start = new Date(event.startDate)
            const end = new Date(event.endDate)
            const checkDate = new Date(day)
            checkDate.setHours(0, 0, 0, 0)
            start.setHours(0, 0, 0, 0)
            end.setHours(0, 0, 0, 0)

            return checkDate >= start && checkDate <= end
        })
    }

    const selectedDateEvents = date ? getEventsForDate(date) : []

    const printReceipt = (event: any, type: 'advance' | 'partial' | 'final' | 'historyPayment', paymentDetails?: any) => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const isFullBill = type === 'final'
        const paymentToDisplay = paymentDetails || (event.payments && event.payments.length > 0 ? event.payments[event.payments.length - 1] : null)

        // Calculate actual basePrice if gstEnabled is true from totalAmount and gstPercentage
        const actualBasePrice = event.gstEnabled
            ? event.totalAmount / (1 + event.gstPercentage / 100)
            : event.totalAmount
        const gstAmount = event.gstEnabled ? event.totalAmount - actualBasePrice : 0

        const businessName = businessSettings?.name || 'Deora Plaza'
        const businessAddress = businessSettings?.address || ''
        const businessMobile = businessSettings?.mobile || ''

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${isFullBill ? 'Final Bill' : 'Payment Receipt'} - ${event.customerName || event.customerMobile}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body { 
                        font-family: 'Inter', sans-serif;
                        color: #0f172a;
                        line-height: 1.5;
                        margin: 0;
                        padding: 40px;
                        background: #fff;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .bill-container {
                        max-width: 800px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    .header-section {
                        background: #f8fafc;
                        padding: 32px;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }
                    .business-info h1 {
                        font-size: 24px;
                        font-weight: 700;
                        color: #0f172a;
                        margin: 0 0 4px 0;
                        text-transform: uppercase;
                        letter-spacing: -0.025em;
                    }
                    .business-info p {
                        font-size: 13px;
                        color: #64748b;
                        margin: 2px 0;
                    }
                    .invoice-meta {
                        text-align: right;
                    }
                    .invoice-badge {
                        background: ${isFullBill ? '#059669' : '#3b82f6'};
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        display: inline-block;
                        margin-bottom: 8px;
                    }
                    .meta-row {
                        font-size: 13px;
                        margin: 2px 0;
                        color: #64748b;
                    }
                    .meta-row strong {
                        color: #0f172a;
                        margin-left: 8px;
                    }
                    
                    .content-section {
                        padding: 32px;
                    }
                    
                    .customer-section {
                        margin-bottom: 32px;
                        padding-bottom: 24px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .section-title {
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        color: #94a3b8;
                        margin-bottom: 8px;
                        letter-spacing: 0.05em;
                    }
                    .customer-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 24px;
                    }
                    .info-group h3 {
                        font-size: 15px;
                        font-weight: 600;
                        color: #0f172a;
                        margin: 0 0 4px 0;
                    }
                    .info-group p {
                        font-size: 13px;
                        color: #64748b;
                        margin: 0;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 24px;
                    }
                    th {
                        text-align: left;
                        padding: 12px 16px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        color: #64748b;
                        background: #f8fafc;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    td {
                        padding: 16px;
                        font-size: 14px;
                        color: #334155;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .amount-col {
                        text-align: right;
                        font-variant-numeric: tabular-nums;
                    }
                    .total-row td {
                        border-bottom: none;
                        padding-top: 24px;
                    }
                    .grand-total {
                        font-size: 18px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    
                    .payment-history-section {
                        margin-top: 40px;
                    }
                    .payment-history-section h4 {
                        font-size: 14px;
                        font-weight: 600;
                        color: #0f172a;
                        margin: 0 0 16px 0;
                    }
                    
                    .footer-section {
                        background: #f8fafc;
                        padding: 24px 32px;
                        border-top: 1px solid #e2e8f0;
                    }
                    .terms {
                        font-size: 11px;
                        color: #94a3b8;
                    }
                    .terms ul {
                        margin: 8px 0 0 0;
                        padding-left: 16px;
                    }
                    .terms li {
                        margin-bottom: 2px;
                    }
                    .thank-you {
                        text-align: center;
                        margin-top: 24px;
                        font-size: 13px;
                        font-weight: 500;
                        color: #64748b;
                    }
                    
                    @media print {
                        body { padding: 0; }
                        .bill-container { border: none; }
                    }
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
                            <div class="invoice-badge">
                                ${isFullBill ? 'Final Invoice' : 'Payment Receipt'}
                            </div>
                            <div class="meta-row">Receipt #: <strong>${paymentToDisplay?.receiptNumber || 'N/A'}</strong></div>
                            <div class="meta-row">Date: <strong>${format(new Date(), 'PPP')}</strong></div>
                        </div>
                    </div>

                    <div class="content-section">
                        <div class="customer-section">
                            <div class="customer-grid">
                                <div class="info-group">
                                    <div class="section-title">Bill To</div>
                                    <h3>${event.customerName || event.customerMobile}</h3>
                                    <p>${event.customerMobile || 'N/A'}</p>
                                </div>
                                <div class="info-group" style="text-align: right;">
                                    <div class="section-title">Event Details</div>
                                    <h3>${event.eventType}</h3>
                                    <p>${format(new Date(event.startDate), 'PPP')} - ${format(new Date(event.endDate), 'PPP')}</p>
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
                                        <div style="font-weight: 500; color: #0f172a;">Venue Base Price</div>
                                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Garden Booking Charges</div>
                                    </td>
                                    <td class="amount-col">₹${(actualBasePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ${event.gstEnabled ? `
                                <tr>
                                    <td>
                                        <div style="font-weight: 500; color: #0f172a;">GST Output</div>
                                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">GST @ ${event.gstPercentage}%</div>
                                    </td>
                                    <td class="amount-col">₹${(gstAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ` : ''}
                                ${event.discountPercent > 0 ? `
                                <tr>
                                    <td>
                                        <div style="font-weight: 500; color: #059669;">Discount Applied</div>
                                        <div style="font-size: 12px; color: #059669; margin-top: 2px;">${event.discountPercent}% Off</div>
                                    </td>
                                    <td class="amount-col" style="color: #059669;">-₹${((event.basePrice * event.discountPercent / 100) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                ` : ''}
                                <tr class="total-row">
                                    <td style="text-align: right; padding-right: 24px;">
                                        <span style="font-size: 14px; font-weight: 600; color: #64748b;">Total Amount</span>
                                    </td>
                                    <td class="amount-col">
                                        <div class="grand-total">₹${(event.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        ${isFullBill || (event.payments && event.payments.length > 1) ? `
                        <div class="payment-history-section">
                            <h4>Payment History</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Receipt #</th>
                                        <th class="amount-col">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${event.payments.map((payment: any) => `
                                    <tr>
                                        <td>${format(new Date(payment.date), 'PPP')}</td>
                                        <td style="text-transform: capitalize;">${payment.type}</td>
                                        <td>${payment.receiptNumber}</td>
                                        <td class="amount-col">₹${(payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    `).join('')}
                                    <tr style="background: #f8fafc;">
                                        <td colspan="3" style="font-weight: 600; text-align: right;">Total Paid</td>
                                        <td class="amount-col" style="font-weight: 600; color: #059669;">₹${(event.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    ${event.remainingBalance > 0 ? `
                                    <tr>
                                        <td colspan="3" style="font-weight: 600; text-align: right; color: #e11d48;">Balance Due</td>
                                        <td class="amount-col" style="font-weight: 700; color: #e11d48;">₹${(event.remainingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    ` : ''}
                                </tbody>
                            </table>
                        </div>
                        ` : `
                        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: #64748b; font-size: 13px;">Amount Paid (${paymentToDisplay?.type || type})</span>
                                <span style="font-weight: 600; color: #059669;">₹${(paymentToDisplay?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #64748b; font-size: 13px;">Balance Due</span>
                                <span style="font-weight: 600; color: #e11d48;">₹${(event.remainingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        `}

                        ${event.notes ? `
                        <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px;">
                            <div style="font-size: 11px; font-weight: 600; color: #b45309; text-transform: uppercase; margin-bottom: 4px;">Notes</div>
                            <div style="font-size: 13px; color: #92400e;">${event.notes}</div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="footer-section">
                        <div class="terms">
                            <strong>Terms & Conditions</strong>
                            <ul>
                                <li>Full payment must be made before the event date.</li>
                                <li>Cancellation must be done 7 days prior to the event for a partial refund.</li>
                                <li>Any damage to property will be charged separately.</li>
                                <li>Event timing must be strictly followed as per booking.</li>
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

    const getFilteredReportData = () => {
        const start = new Date(reportDateRange.start)
        start.setHours(0, 0, 0, 0)
        const end = new Date(reportDateRange.end)
        end.setHours(23, 59, 59, 999)

        return bookings.filter(event => {
            const eventDate = new Date(event.startDate)
            return eventDate >= start && eventDate <= end
        })
    }

    const handleExportCSV = () => {
        const reportData = getFilteredReportData()

        if (reportData.length === 0) {
            alert("No data found for the selected date range")
            return
        }

        const headers = ["Date", "Customer Name", "Mobile", "Event Type", "Total Amount", "Paid Amount", "Balance", "Status"]
        const csvContent = [
            headers.join(","),
            ...reportData.map(event => [
                format(new Date(event.startDate), 'yyyy-MM-dd'),
                `"${event.customerName || event.customerMobile}"`,
                event.customerMobile,
                event.eventType,
                event.totalAmount,
                event.totalPaid,
                event.remainingBalance,
                event.paymentStatus
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `garden_report_${reportDateRange.start}_to_${reportDateRange.end}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrintReport = () => {
        const reportData = getFilteredReportData()

        if (reportData.length === 0) {
            alert("No data found for the selected date range")
            return
        }

        const totalRevenue = reportData.reduce((sum, e) => sum + e.totalPaid, 0)
        const totalPending = reportData.reduce((sum, e) => sum + e.remainingBalance, 0)
        const totalBookings = reportData.length

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const businessName = businessSettings?.name || 'Deora Plaza'

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Garden Booking Report</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body { font-family: 'Inter', sans-serif; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                    th { background: #f8fafc; font-weight: 600; }
                    .header { margin-bottom: 20px; }
                    .summary { display: flex; gap: 20px; margin-bottom: 20px; }
                    .card { background: #f8fafc; padding: 15px; border-radius: 8px; min-width: 150px; }
                    .card h3 { margin: 0 0 5px 0; font-size: 12px; color: #64748b; }
                    .card p { margin: 0; font-size: 18px; font-weight: 700; }
                    .text-right { text-align: right; }
                    .status-completed { color: #059669; font-weight: 600; }
                    .status-pending { color: #e11d48; font-weight: 600; }
                    .status-partial { color: #d97706; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">${businessName} - Garden Report</h1>
                    <p style="color: #64748b; margin: 5px 0;">Period: ${format(new Date(reportDateRange.start), 'PPP')} to ${format(new Date(reportDateRange.end), 'PPP')}</p>
                </div>

                <div class="summary">
                    <div class="card">
                        <h3>Total Revenue</h3>
                        <p>₹${totalRevenue.toLocaleString()}</p>
                    </div>
                    <div class="card">
                        <h3>Pending Amount</h3>
                        <p style="color: #e11d48;">₹${totalPending.toLocaleString()}</p>
                    </div>
                    <div class="card">
                        <h3>Total Bookings</h3>
                        <p>${totalBookings}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Type</th>
                            <th class="text-right">Total</th>
                            <th class="text-right">Paid</th>
                            <th class="text-right">Balance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(event => `
                        <tr>
                            <td>${format(new Date(event.startDate), 'MMM d, yyyy')}</td>
                            <td>
                                <div style="font-weight: 500;">${event.customerName || event.customerMobile}</div>
                                <div style="font-size: 10px; color: #64748b;">${event.customerMobile}</div>
                            </td>
                            <td>${event.eventType}</td>
                            <td class="text-right">₹${event.totalAmount.toLocaleString()}</td>
                            <td class="text-right" style="color: #059669;">₹${event.totalPaid.toLocaleString()}</td>
                            <td class="text-right ${event.remainingBalance > 0 ? 'status-pending' : ''}">₹${event.remainingBalance.toLocaleString()}</td>
                            <td><span class="status-${event.paymentStatus}">${event.paymentStatus.charAt(0).toUpperCase() + event.paymentStatus.slice(1)}</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-emerald-500">Paid</Badge>
            case 'partial':
                return <Badge className="bg-amber-500">Partial</Badge>
            default:
                return <Badge className="bg-rose-500">Pending</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(totalRevenue || 0).toLocaleString()}</div>
                        <p className="text-xs text-emerald-100 mt-1">Total payments received</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <CalendarCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBookings}</div>
                        <p className="text-xs text-blue-100 mt-1">All time bookings</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingCount}</div>
                        <p className="text-xs text-purple-100 mt-1">Scheduled events</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{(pendingPayments || 0).toLocaleString()}</div>
                        <p className="text-xs text-rose-100 mt-1">Outstanding balance</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-900">Event Bookings</h2>
                <p className="text-slate-500">Manage garden events and bookings</p>
            </div>
            <div className="flex gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-white">
                            <Download className="mr-2 h-4 w-4" /> Reports
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-4">
                        <h3 className="font-semibold mb-3">Export Report</h3>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={reportDateRange.start}
                                        onChange={(e) => setReportDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">End Date</Label>
                                    <Input
                                        type="date"
                                        value={reportDateRange.end}
                                        onChange={(e) => setReportDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={handleExportCSV} variant="outline" size="sm" className="w-full">
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel
                                </Button>
                                <Button onClick={handlePrintReport} variant="outline" size="sm" className="w-full">
                                    <FileText className="mr-2 h-4 w-4 text-blue-600" /> PDF
                                </Button>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Flower2 className="mr-2 h-4 w-4" /> New Booking
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-900">New Event Booking</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Customer Selection with Autocomplete */}
                            <div className="space-y-2">
                                <CustomerAutocomplete
                                    onCustomerSelect={handleCustomerSelect}
                                    initialName={newEvent.customer}
                                    initialMobile={newEvent.phone}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="type">Event Type *</Label>
                                <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select event type" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100]">
                                        {eventTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={newEvent.startDate}
                                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={newEvent.endDate}
                                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4 mt-2">
                                <h3 className="font-semibold text-slate-900 mb-3">Pricing Details</h3>

                                <div className="grid gap-2 mb-3">
                                    <Label htmlFor="basePrice">Base Price (₹) *</Label>
                                    <Input
                                        id="basePrice"
                                        type="number"
                                        value={newEvent.basePrice}
                                        onChange={(e) => setNewEvent({ ...newEvent, basePrice: e.target.value })}
                                        placeholder="Enter base price"
                                    />
                                </div>

                                <div className="space-y-3 mb-3">
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                        <Switch
                                            checked={newEvent.gstEnabled}
                                            onCheckedChange={(checked) => setNewEvent({ ...newEvent, gstEnabled: checked })}
                                        />
                                        <Label className="cursor-pointer">Include GST</Label>
                                    </div>
                                    {newEvent.gstEnabled && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="gstPercentage">GST Rate (%) *</Label>
                                            <Input
                                                id="gstPercentage"
                                                type="number"
                                                value={newEvent.gstPercentage}
                                                onChange={(e) => setNewEvent({ ...newEvent, gstPercentage: e.target.value })}
                                                placeholder="Enter %"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2 mb-3">
                                    <Label htmlFor="discountPercent">Discount (%)</Label>
                                    <Input
                                        id="discountPercent"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={newEvent.discountPercent}
                                        onChange={(e) => setNewEvent({ ...newEvent, discountPercent: e.target.value })}
                                        placeholder="Enter discount %"
                                    />
                                </div>

                                <div className="grid gap-2 mb-3">
                                    <Label htmlFor="advancePayment">Advance Payment (₹)</Label>
                                    <Input
                                        id="advancePayment"
                                        type="number"
                                        value={newEvent.advancePayment}
                                        onChange={(e) => setNewEvent({ ...newEvent, advancePayment: e.target.value })}
                                        placeholder="Enter advance amount (optional)"
                                    />
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Base Price:</span>
                                        <span className="font-medium">₹{parseFloat(newEvent.basePrice || "0").toLocaleString()}</span>
                                    </div>
                                    {newEvent.discountPercent && parseFloat(newEvent.discountPercent) > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount ({newEvent.discountPercent}%):</span>
                                            <span className="font-medium">-₹{((parseFloat(newEvent.basePrice || "0") * parseFloat(newEvent.discountPercent || "0")) / 100).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {newEvent.gstEnabled && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">GST ({newEvent.gstPercentage}%):</span>
                                            <span className="font-medium">₹{((parseFloat(newEvent.basePrice || "0") - ((parseFloat(newEvent.basePrice || "0") * parseFloat(newEvent.discountPercent || "0")) / 100)) * parseFloat(newEvent.gstPercentage || "0") / 100).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-bold text-emerald-700 pt-2 border-t border-emerald-300">
                                        <span>Total Amount:</span>
                                        <span>₹{calculateTotal().toLocaleString()}</span>
                                    </div>
                                    {newEvent.advancePayment && parseFloat(newEvent.advancePayment) > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm text-blue-600">
                                                <span>Advance Paid:</span>
                                                <span className="font-medium">- ₹{parseFloat(newEvent.advancePayment).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-bold text-rose-600 pt-2 border-t border-emerald-300">
                                                <span>Balance Due:</span>
                                                <span>₹{(calculateTotal() - parseFloat(newEvent.advancePayment)).toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={newEvent.notes}
                                    onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                                    placeholder="Any special requirements or notes..."
                                    rows={3}
                                />
                            </div>

                            <div className="border-t border-slate-200 pt-4 mt-2">
                                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-slate-900 text-sm">Terms & Conditions</h4>
                                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                                        <li>Full payment must be made before the event date</li>
                                        <li>Cancellation must be done 7 days prior to the event</li>
                                        <li>50% of the total amount will be charged for cancellations within 7 days</li>
                                        <li>No refund for cancellations within 48 hours of the event</li>
                                        <li>Any damage to property will be charged separately</li>
                                        <li>Outside catering is not allowed without prior permission</li>
                                        <li>Event timing must be strictly followed as per booking</li>
                                    </ul>
                                    <div className="flex items-start gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            checked={newEvent.acceptedTerms}
                                            onChange={(e) => setNewEvent({ ...newEvent, acceptedTerms: e.target.checked })}
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <Label htmlFor="acceptTerms" className="text-xs font-medium cursor-pointer">
                                            I have read and agree to the terms and conditions *
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewEventOpen(false)}>Cancel</Button>
                            <Button
                                className={`${!newEvent.customer || !newEvent.type || !newEvent.startDate || !newEvent.endDate || !newEvent.basePrice || !newEvent.acceptedTerms
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    } `}
                                onClick={handleCreateEvent}
                                disabled={!newEvent.customer || !newEvent.type || !newEvent.startDate || !newEvent.endDate || !newEvent.basePrice || !newEvent.acceptedTerms}
                            >
                                Confirm Booking
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                        name="garden_search_query_v1"
                        autoComplete="new-password"
                        placeholder="Search events by customer or type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white"
                    />
                </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
                {/* Main Content - Event Lists */}
                <div className="space-y-6">
                    <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-white border border-slate-200 p-1 mb-6">
                            <TabsTrigger value="upcoming" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500">Upcoming Events</TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500">History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upcoming" className="space-y-4">
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <Flower2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-slate-900">No upcoming events</h3>
                                    <p className="text-slate-500">Schedule a new event to get started</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {upcomingEvents.map((event) => (
                                        <Card key={event.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{event.eventType || event.type}</Badge>
                                                        {getPaymentStatusBadge(event.paymentStatus)}
                                                    </div>
                                                    <Badge className="bg-emerald-500">{event.status}</Badge>
                                                </div>
                                                <CardTitle className="text-lg font-bold text-slate-900 mt-2">{event.customerName || event.customerMobile}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm text-slate-500 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-4 w-4 text-slate-400" />
                                                        <span>{format(new Date(event.startDate), 'PPP')} - {format(new Date(event.endDate), 'PPP')}</span>
                                                    </div>
                                                </div>

                                                {/* Payment Progress */}
                                                {event.paymentStatus !== 'completed' && (
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                                                            <span>Payment Progress</span>
                                                            <span>{Math.round((event.totalPaid / event.totalAmount) * 100)}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                                            <div
                                                                className="bg-emerald-600 h-2 rounded-full transition-all"
                                                                style={{ width: `${(event.totalPaid / event.totalAmount) * 100}% ` }} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                    <div>
                                                        <div className="font-bold text-slate-900">₹{(event.totalAmount || 0).toLocaleString()}</div>
                                                        <div className="text-xs text-emerald-600">Paid: ₹{(event.totalPaid || 0).toLocaleString()}</div>
                                                        {event.remainingBalance > 0 && (
                                                            <div className="text-xs text-rose-600 font-medium">Due: ₹{(event.remainingBalance || 0).toLocaleString()}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {event.remainingBalance > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                onClick={() => openPaymentDialog(event)}
                                                            >
                                                                <Plus className="h-4 w-4 mr-1" /> Pay
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-slate-500 hover:text-slate-900"
                                                            onClick={() => openPaymentHistory(event)}
                                                        >
                                                            <History className="h-4 w-4 mr-1" /> History
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                            onClick={() => confirmDelete(event)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            <div className="rounded-md border border-slate-200 bg-white">
                                <div className="p-4">
                                    {pastEvents.length === 0 ? (
                                        <p className="text-center text-slate-500 py-8">No past events found</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {pastEvents.map((event) => (
                                                <div key={event.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0">
                                                    <div>
                                                        <h4 className="font-medium text-slate-900">{event.customerName || event.customerMobile}</h4>
                                                        <p className="text-sm text-slate-500">{event.eventType || event.type} • {format(new Date(event.startDate), 'PPP')} - {format(new Date(event.endDate), 'PPP')}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            {getPaymentStatusBadge(event.paymentStatus)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-3">
                                                        <div>
                                                            <p className="font-bold text-slate-900">₹{(event.totalAmount || 0).toLocaleString()}</p>
                                                            <p className="text-xs text-emerald-600">Paid: ₹{(event.totalPaid || 0).toLocaleString()}</p>
                                                            <Badge variant="outline" className="mt-1">Completed</Badge>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                                            onClick={() => printReceipt(event, 'final')}
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                            onClick={() => confirmDelete(event)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar - Calendar */}
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                        <h3 className="font-semibold text-slate-900 mb-4 px-2">Calendar</h3>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border-0 w-full flex justify-center"
                            classNames={{
                                head_cell: "text-slate-500 font-normal text-[0.8rem] w-9",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md",
                                day_selected: "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white",
                                day_today: "bg-slate-100 text-slate-900",
                            }}
                            modifiers={{
                                booked: (date) => getEventsForDate(date).length > 0
                            }}
                            modifiersStyles={{
                                booked: {
                                    fontWeight: 'bold',
                                    color: '#059669',
                                    position: 'relative'
                                }
                            }}
                        />

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h4 className="text-sm font-medium text-slate-900 mb-3">
                                {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                            </h4>

                            {selectedDateEvents.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDateEvents.map((event) => (
                                        <div key={event.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-slate-900 text-sm">{event.customerName || event.customerMobile}</span>
                                                <Badge className="text-[10px] h-5 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">{event.eventType || event.type}</Badge>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 h-7 text-xs bg-white"
                                                    onClick={() => openPaymentHistory(event)}
                                                >
                                                    <History className="h-3 w-3 mr-1" /> History
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                    onClick={() => confirmDelete(event)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                    <p className="text-xs text-slate-500 mb-3">No events scheduled</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs"
                                        onClick={() => {
                                            if (date) {
                                                setNewEvent(prev => ({
                                                    ...prev,
                                                    startDate: format(date, 'yyyy-MM-dd'),
                                                    endDate: format(date, 'yyyy-MM-dd')
                                                }))
                                                setIsNewEventOpen(true)
                                            }
                                        }}
                                    >
                                        Book This Date
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <CreditCard className="h-5 w-5" />
                            Add Payment
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-slate-50 p-4 rounded-lg mb-4">
                            <p className="text-sm text-slate-600">Customer: <span className="font-medium text-slate-900">{selectedEventForPayment?.customer}</span></p>
                            <p className="text-sm text-slate-600 mt-1">Total Amount: <span className="font-medium text-slate-900">₹{(selectedEventForPayment?.totalAmount || 0).toLocaleString()}</span></p>
                            <p className="text-sm text-slate-600 mt-1">Already Paid: <span className="font-medium text-emerald-600">₹{(selectedEventForPayment?.totalPaid || 0).toLocaleString()}</span></p>
                            <p className="text-sm text-slate-600 mt-1">Remaining: <span className="font-medium text-rose-600">₹{(selectedEventForPayment?.remainingBalance || 0).toLocaleString()}</span></p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentAmount">Payment Amount (₹) *</Label>
                            <Input
                                id="paymentAmount"
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Enter payment amount"
                                max={selectedEventForPayment?.remainingBalance}
                            />
                            <p className="text-xs text-slate-500">Maximum: ₹{(selectedEventForPayment?.remainingBalance || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleAddPayment}
                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                        >
                            Add Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment History Dialog */}
            <Dialog open={isPaymentHistoryOpen} onOpenChange={setIsPaymentHistoryOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <History className="h-5 w-5" />
                            Payment History - {selectedEventForHistory?.customerName || selectedEventForHistory?.customerMobile}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-slate-50 p-4 rounded-lg mb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Event Type</p>
                                    <p className="font-medium text-slate-900">{selectedEventForHistory?.eventType || selectedEventForHistory?.type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Event Date</p>
                                    <p className="font-medium text-slate-900">{selectedEventForHistory && format(new Date(selectedEventForHistory.startDate), 'PPP')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Total Amount</p>
                                    <p className="font-medium text-slate-900">₹{(selectedEventForHistory?.totalAmount || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Payment Status</p>
                                    <div className="mt-1">{selectedEventForHistory && getPaymentStatusBadge(selectedEventForHistory.paymentStatus)}</div>
                                </div>
                            </div>
                        </div>

                        {selectedEventForHistory?.payments && selectedEventForHistory.payments.length > 0 ? (
                            <div className="space-y-3">
                                <h4 className="font-medium text-slate-900">Transactions</h4>
                                {selectedEventForHistory.payments.map((payment: any, index: number) => (
                                    <div key={payment.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900">₹{(payment.amount || 0).toLocaleString()}</p>
                                            <p className="text-xs text-slate-500">{format(new Date(payment.date), 'PPP')}</p>
                                            <p className="text-xs text-slate-400">Receipt: {payment.receiptNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="mb-1">
                                                {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => printReceipt(selectedEventForHistory, payment.type, payment)}
                                            >
                                                <Printer className="h-3 w-3 mr-1" /> Print
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <div className="border-t border-slate-200 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-slate-900">Total Paid:</span>
                                        <span className="font-bold text-emerald-600">₹{(selectedEventForHistory.totalPaid || 0).toLocaleString()}</span>
                                    </div>
                                    {selectedEventForHistory.remainingBalance > 0 && (
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="font-medium text-slate-900">Remaining Balance:</span>
                                            <span className="font-bold text-rose-600">₹{(selectedEventForHistory.remainingBalance || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-8">No payments recorded</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentHistoryOpen(false)}>Close</Button>
                        {selectedEventForHistory?.paymentStatus === 'completed' && (
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => printReceipt(selectedEventForHistory, 'final')}
                            >
                                <Printer className="h-4 w-4 mr-2" /> Print Final Bill
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Deletion
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600 mb-4">
                            Are you sure you want to delete the booking for <span className="font-bold">{eventToDelete?.customer}</span>? This action cannot be undone.
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="password">Enter Admin Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter password to confirm"
                                className={deleteError ? "border-rose-500 focus:ring-rose-500" : ""}
                            />
                            {deleteError && <p className="text-xs text-rose-600">Incorrect password</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleDeleteEvent}>
                            Delete Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
