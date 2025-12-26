"use client"

import { useState, useEffect } from "react"
import { getPendingDepartmentSettlements, settleDepartmentOrders } from "@/actions/departmentSettlements"


import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export default function DepartmentSettlementList() {
    const [settlements, setSettlements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<string[]>([])
    const [isSettling, setIsSettling] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        const pendingSettlements = await getPendingDepartmentSettlements()
        setSettlements(pendingSettlements)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSelect = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        if (selected.length === settlements.length) {
            setSelected([])
        } else {
            setSelected(settlements.map(s => s.id))
        }
    }

    const handleSettle = async () => {
        if (selected.length === 0) return
        if (!confirm(`Are you sure you want to settle ${selected.length} selected orders?`)) return

        setIsSettling(true)
        const result = await settleDepartmentOrders(selected)
        if (result.success) {
            setSelected([])
            fetchData() // Refresh the list
        } else {
            alert("Failed to settle orders.")
        }
        setIsSettling(false)
    }

    const totalSelectedAmount = settlements
        .filter(s => selected.includes(s.id))
        .reduce((sum, s) => sum + s.totalAmount, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="premium-card">
            <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
                <h2 className="text-3xl font-bold text-[#111827]">Pending Settlements</h2>
                <div className="flex items-center gap-4">
                    {selected.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            <span>{selected.length} selected</span>
                            <span className="font-bold text-primary mx-2">
                                (₹{totalSelectedAmount.toLocaleString()})
                            </span>
                        </div>
                    )}
                    <Button onClick={handleSettle} disabled={selected.length === 0 || isSettling}>
                        {isSettling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Settle Selected ({selected.length})
                    </Button>
                </div>
            </div>
            <div className="p-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selected.length === settlements.length && settlements.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settlements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No pending settlements.
                                </TableCell>
                            </TableRow>
                        ) : (
                            settlements.map((settlement) => (
                                <TableRow
                                    key={settlement.id}
                                    data-state={selected.includes(settlement.id) && "selected"}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selected.includes(settlement.id)}
                                            onCheckedChange={() => handleSelect(settlement.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{settlement.orderNumber}</TableCell>
                                    <TableCell>
                                        {new Date(settlement.createdAt).toLocaleString('en-IN', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {settlement.businessUnit === 'hotel' ? `Room ${settlement.roomNumber}` : settlement.businessUnit}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ₹{settlement.totalAmount.toLocaleString('en-IN')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

