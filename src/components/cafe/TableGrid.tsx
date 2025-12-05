"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Armchair, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Table = {
    id: string
    tableNumber: string
    capacity: number
    status: string
    customerCount: number
}

export default function TableGrid({ initialTables }: { initialTables: Table[] }) {
    const router = useRouter()
    const [tables, setTables] = useState<Table[]>(initialTables)

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
        router.push(`/dashboard/orders/new?tableId=${table.id}&tableNumber=${table.tableNumber}`)
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => {
                const styles = getStatusStyles(table.status)
                return (
                    <button
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1 w-full"
                    >
                        <Card className={cn(
                            "relative w-full overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md border",
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
                                        <Utensils className={cn("h-5 w-5", styles.icon)} />
                                    ) : (
                                        <Armchair className={cn("h-5 w-5", styles.icon)} />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </button>
                )
            })}
        </div>
    )
}
