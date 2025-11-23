import { getTables } from "@/actions/tables"
import TableGrid from "@/components/cafe/TableGrid"
import { Armchair } from "lucide-react"

export default async function TablesPage() {
    const tables = await getTables("cafe")
    const availableCount = tables.filter(t => t.status === 'available').length

    return (
        <div className="flex-1 min-h-screen bg-black/95 text-white p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-600 bg-clip-text text-transparent">
                        Cafe Tables
                    </h1>
                    <p className="text-gray-400 mt-1">Manage seating and orders</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <Armchair className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-200">{availableCount} Tables Available</span>
                </div>
            </div>
            <TableGrid initialTables={tables} />
        </div>
    )
}
