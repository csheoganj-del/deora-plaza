"use client"

import { useState, useEffect } from "react"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getGSTReport, getGSTSummary, exportGSTData } from "@/actions/gst"
import { Download, Printer, FileText, TrendingUp, Receipt, IndianRupee } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function GSTReportPage() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [businessUnit, setBusinessUnit] = useState('all')
    const [bills, setBills] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Set default dates (current month)
    useEffect(() => {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        setStartDate(firstDay.toISOString().split('T')[0])
        setEndDate(lastDay.toISOString().split('T')[0])
    }, [])

    // Fetch data when dates or business unit change
    useEffect(() => {
        if (startDate && endDate) {
            fetchData()
        }
    }, [startDate, endDate, businessUnit])

    const fetchData = async () => {
        setLoading(true)
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        const [billsData, summaryData] = await Promise.all([
            getGSTReport(start, end, businessUnit),
            getGSTSummary(start, end, businessUnit)
        ])

        setBills(billsData)
        setSummary(summaryData)
        setLoading(false)
    }

    const handleExport = async () => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        const data = await exportGSTData(start, end, businessUnit)

        // Create CSV content
        const csvContent = [
            data.headers.join(','),
            ...data.rows.map((row: any) => row.join(','))
        ].join('\n')

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">GST Report</h1>
                    <p className="text-[#9CA3AF]">View and export GST details for tax filing</p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <Button onClick={handleExport} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={handlePrint} variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827]">Filters</h2>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Business Unit</Label>
                            <Select value={businessUnit} onValueChange={setBusinessUnit}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Units</SelectItem>
                                    <SelectItem value="cafe">Cafe</SelectItem>
                                    <SelectItem value="restaurant">Restaurant</SelectItem>
                                    <SelectItem value="hotel">Hotel</SelectItem>
                                    <SelectItem value="garden">Garden</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="premium-card">
                        <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between pb-2">
                            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Total GST Collected</h2>
                            <IndianRupee className="h-4 w-4 text-[#22C55E]" />
                        </div>
                        <div className="p-8">
                            <div className="text-2xl font-bold text-[#22C55E]">₹{summary.totalGST.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="premium-card">
                        <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between pb-2">
                            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Total Sales</h2>
                            <TrendingUp className="h-4 w-4 text-[#6D5DFB]" />
                        </div>
                        <div className="p-8">
                            <div className="text-2xl font-bold">₹{summary.totalSales.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="premium-card">
                        <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between pb-2">
                            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Number of Bills</h2>
                            <Receipt className="h-4 w-4 text-[#C084FC]" />
                        </div>
                        <div className="p-8">
                            <div className="text-2xl font-bold">{summary.billCount}</div>
                        </div>
                    </div>

                    <div className="premium-card">
                        <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between pb-2">
                            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Average GST/Bill</h2>
                            <FileText className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="p-8">
                            <div className="text-2xl font-bold">₹{summary.averageGST.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* GST Rate Breakdown */}
            {summary && Object.keys(summary.byGSTRate).length > 0 && (
                <div className="premium-card">
                    <div className="p-8 border-b border-[#E5E7EB]">
                        <h2 className="text-3xl font-bold text-[#111827]">GST Rate Breakdown</h2>
                    </div>
                    <div className="p-8">
                        <div className="space-y-3">
                            {Object.entries(summary.byGSTRate).map(([rate, data]: [string, any]) => (
                                <div key={rate} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="font-bold text-lg">{rate}</div>
                                        <div className="text-sm text-[#6B7280]">{data.count} bills</div>
                                    </div>
                                    <div className="flex gap-6 text-sm">
                                        <div>
                                            <span className="text-[#6B7280]">Subtotal: </span>
                                            <span className="font-medium">₹{data.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#6B7280]">GST: </span>
                                            <span className="font-bold text-[#22C55E]">₹{data.gst.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#6B7280]">Total: </span>
                                            <span className="font-medium">₹{data.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bills Table */}
            <div className="premium-card">
                <div className="p-8 border-b border-[#E5E7EB]">
                    <h2 className="text-3xl font-bold text-[#111827]">Bill Details ({bills.length} bills)</h2>
                </div>
                <div className="p-8">
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : bills.length === 0 ? (
                        <div className="text-center py-8 text-[#9CA3AF]">No bills found for the selected period</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bill No</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                        <TableHead className="text-center">GST %</TableHead>
                                        <TableHead className="text-right">GST Amt</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead>Source</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bills.map((bill) => (
                                        <TableRow key={bill.id}>
                                            <TableCell className="font-medium">{bill.billNumber}</TableCell>
                                            <TableCell>{new Date(bill.date).toLocaleDateString('en-IN')}</TableCell>
                                            <TableCell className="capitalize">{bill.businessUnit}</TableCell>
                                            <TableCell>{bill.customerName}</TableCell>
                                            <TableCell>{bill.customerMobile}</TableCell>
                                            <TableCell className="text-right">₹{bill.subtotal.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">{bill.gstPercent}%</TableCell>
                                            <TableCell className="text-right font-medium text-[#22C55E]">
                                                ₹{bill.gstAmount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">₹{bill.grandTotal.toFixed(2)}</TableCell>
                                            <TableCell className="capitalize">{bill.source}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

