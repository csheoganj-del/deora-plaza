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
                    badge: "bg-green-500/20 text-green-400 border-green-500/30",
                    border: "border-green-500/20 hover:border-green-500/50",
                    glow: "from-green-500/20 to-emerald-500/20",
                    icon: "text-green-400"
                }
            case "occupied":
                return {
                    badge: "bg-red-500/20 text-red-400 border-red-500/30",
                    border: "border-red-500/20 hover:border-red-500/50",
                    glow: "from-red-500/20 to-orange-500/20",
                    icon: "text-red-400"
                }
            case "reserved":
                return {
                    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                    border: "border-amber-500/20 hover:border-amber-500/50",
                    glow: "from-amber-500/20 to-yellow-500/20",
                    icon: "text-amber-400"
                }
            default:
                return {
                    badge: "bg-gray-500/20 text-gray-400",
                    border: "border-white/10",
                    glow: "from-gray-500/20 to-gray-600/20",
                    icon: "text-gray-400"
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
                        className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className={cn(
                            "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl",
                            styles.glow
                        )} />

                        <Card className={cn(
                            "relative w-full overflow-hidden bg-white/5 backdrop-blur-md transition-colors border",
                            styles.border
                        )}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Table</span>
                                        <CardTitle className="text-3xl font-bold text-white">{table.tableNumber}</CardTitle>
                                    </div>
                                    <Badge variant="outline" className={cn("capitalize", styles.badge)}>
                                        {table.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
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
