import OrderFlowDashboard from "@/components/orders/OrderFlowDashboard"
import { ShoppingBag } from "lucide-react"

export default function OrdersPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-900/20">
                        <ShoppingBag className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Live Orders</h2>
                        <p className="text-slate-500">Unified view • Hotel, Cafe & Restaurant</p>
                    </div>
                </div>
            </div>

            <OrderFlowDashboard />
        </div>
    )
}

