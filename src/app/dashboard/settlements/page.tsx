"use client"

import { useState, useEffect } from "react"
import { getAllSettlements, generateMonthlySettlement, markSettlementPaid, getCurrentMonthSummary } from "@/actions/settlements"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Check, TrendingUp, Calendar, DollarSign } from "lucide-react"

export default function SettlementsPage() {
    const [settlements, setSettlements] = useState<any[]>([])
    const [currentMonth, setCurrentMonth] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isGenerateOpen, setIsGenerateOpen] = useState(false)
    const [generateData, setGenerateData] = useState({
        businessUnit: "cafe",
        month: new Date().toISOString().slice(0, 7) // YYYY-MM
    })

    const fetchData = async () => {
        setLoading(true)
        const [allSettlements, monthSummary] = await Promise.all([
            getAllSettlements(),
            getCurrentMonthSummary()
        ])
        setSettlements(allSettlements)
        setCurrentMonth(monthSummary)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleGenerate = async () => {
        const result = await generateMonthlySettlement(generateData.businessUnit, generateData.month)
        if (result.success) {
            setIsGenerateOpen(false)
            fetchData()
        } else {
            alert("Failed to generate settlement")
        }
    }

    const handleMarkPaid = async (settlementId: string) => {
        if (!confirm("Mark this settlement as paid?")) return

        const result = await markSettlementPaid(settlementId)
        if (result.success) {
            fetchData()
        }
    }

    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1)
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Settlement Tracking</h2>
                <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Generate Settlement
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Monthly Settlement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Business Unit</label>
                                <Select
                                    value={generateData.businessUnit}
                                    onValueChange={(val) => setGenerateData({ ...generateData, businessUnit: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cafe">Cafe</SelectItem>
                                        <SelectItem value="bar">Bar</SelectItem>
                                        <SelectItem value="hotel">Hotel</SelectItem>
                                        <SelectItem value="garden">Garden</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Month</label>
                                <input
                                    type="month"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={generateData.month}
                                    onChange={(e) => setGenerateData({ ...generateData, month: e.target.value })}
                                />
                            </div>
                            <Button className="w-full" onClick={handleGenerate}>
                                Generate Settlement
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Current Month Summary */}
            {currentMonth && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue (This Month)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{currentMonth.totalRevenue.toLocaleString('en-IN')}</div>
                            <p className="text-xs text-muted-foreground">{formatMonth(currentMonth.month)}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Owner Share (40%)</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₹{currentMonth.ownerShare.toLocaleString('en-IN')}</div>
                            <p className="text-xs text-muted-foreground">Pending payment</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Manager Share (60%)</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">₹{currentMonth.managerShare.toLocaleString('en-IN')}</div>
                            <p className="text-xs text-muted-foreground">Pending payment</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* All Settlements Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Settlement History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead>Business Unit</TableHead>
                                <TableHead>Total Revenue</TableHead>
                                <TableHead>Owner Share (40%)</TableHead>
                                <TableHead>Manager Share (60%)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {settlements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No settlements generated yet. Click "Generate Settlement" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                settlements.map((settlement) => (
                                    <TableRow key={settlement.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {formatMonth(settlement.month)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{settlement.businessUnit}</TableCell>
                                        <TableCell>₹{settlement.totalRevenue.toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="text-green-600 font-medium">
                                            ₹{settlement.ownerShare.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="text-blue-600 font-medium">
                                            ₹{settlement.managerShare.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell>
                                            {settlement.status === "completed" ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                    <Check className="mr-1 h-3 w-3" /> Paid
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">Pending</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {settlement.status === "pending" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMarkPaid(settlement.id)}
                                                >
                                                    Mark as Paid
                                                </Button>
                                            )}
                                            {settlement.status === "completed" && settlement.settlementDate && (
                                                <span className="text-xs text-muted-foreground">
                                                    Paid on {new Date(settlement.settlementDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
