"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Armchair, Utensils, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { TableManager } from "./TableManager"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { DineInOrderDialog } from "@/components/orders/DineInOrderDialog"
import { updateTableStatus } from "@/actions/tables"

type Table = {
    id: string
    tableNumber: string
    capacity: number
    status: string
    customerCount: number
    businessUnit: string
}

export default function TableGrid({ initialTables, businessUnit }: { initialTables: Table[], businessUnit: string }) {
    const router = useRouter()
    const [tables, setTables] = useState<Table[]>(initialTables)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        setTables(initialTables)
    }, [initialTables])

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "available":
                return {
                    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    card: "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-emerald-100",
                    icon: "text-emerald-500",
                    title: "text-slate-900"
                }
            case "occupied":
                return {
                    badge: "bg-rose-50 text-rose-700 border-rose-200",
                    card: "bg-rose-50/30 border-rose-200 hover:border-rose-300",
                    icon: "text-rose-500",
                    title: "text-slate-900"
                }
            case "reserved":
                return {
                    badge: "bg-amber-50 text-amber-700 border-amber-200",
                    card: "bg-amber-50/30 border-amber-200 hover:border-amber-300",
                    icon: "text-amber-500",
                    title: "text-slate-900"
                }
            default:
                return {
                    badge: "bg-slate-100 text-slate-500 border-slate-200",
                    card: "bg-slate-50 border-slate-200",
                    icon: "text-slate-400",
                    title: "text-slate-500"
                }
        }
    }

    const handleTableClick = (table: Table) => {
        setSelectedTable(table)
        setIsDialogOpen(true)
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <TableManager businessUnit={businessUnit} initialTables={initialTables}>
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Tables
                    </Button>
                </TableManager>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tables.map((table) => {
                    const styles = getStatusStyles(table.status)
                    return (
                        <div
                            key={table.id}
                            onClick={() => handleTableClick(table)}
                            className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1 w-full cursor-pointer tilt-3d"
                            onMouseMove={(e) => {
                                const t = e.currentTarget as HTMLElement
                                const r = t.getBoundingClientRect()
                                const x = e.clientX - r.left
                                const y = e.clientY - r.top
                                const cx = r.width / 2
                                const cy = r.height / 2
                                const ry = ((x - cx) / cx) * 5
                                const rx = -((y - cy) / cy) * 5
                                t.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
                            }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "" }}
                        >
                            <Card className={cn(
                                "relative w-full overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border elevation-1",
                                styles.card
                            )}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Table</span>
                                            <CardTitle className={cn("text-3xl font-bold font-serif", styles.title)}>{table.tableNumber}</CardTitle>
                                        </div>
                                        <Badge variant="outline" className={cn("capitalize font-medium", styles.badge)}>
                                            {table.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Users className="h-4 w-4" />
                                            <span>
                                                {table.status === "occupied"
                                                    ? `${table.customerCount} Guests`
                                                    : `Capacity: ${table.capacity}`}
                                            </span>
                                        </div>
                                        {table.status === "occupied" ? (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        if (confirm(`Clear Table ${table.tableNumber}? This will mark it as available.`)) {
                                                            await updateTableStatus(table.id, 'available', 0)
                                                            router.refresh()
                                                        }
                                                    }}
                                                    title="Clear Table"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                                <Utensils className={cn("h-5 w-5", styles.icon)} />
                                            </div>
                                        ) : (
                                            <Armchair className={cn("h-5 w-5", styles.icon)} />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )
                })}
            </div>

            {selectedTable && (
                <DineInOrderDialog
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false)
                        setSelectedTable(null)
                    }}
                    businessUnit={selectedTable.businessUnit || businessUnit}
                    tableId={selectedTable.id}
                    tableNumber={selectedTable.tableNumber}
                />
            )}
        </div>
    )
}
