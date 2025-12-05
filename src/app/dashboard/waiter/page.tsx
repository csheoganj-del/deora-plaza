import WaiterBoard from "@/components/waiter/WaiterBoard"
import { UtensilsCrossed } from "lucide-react"

export default function WaiterPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 p-6">
            <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/20">
                        <UtensilsCrossed className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Waiter Dashboard
                        </h1>
                        <p className="text-slate-600 mt-1">Ready orders for delivery • Cafe, Restaurant & Hotel</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm p-6">
                <WaiterBoard />
            </div>
        </div>
    )
}
