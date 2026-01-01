import OrderFlowDashboard from "@/components/orders/OrderFlowDashboard"
import { ShoppingBag } from "lucide-react"


export const dynamic = "force-dynamic"

export default function OrdersPage() {
    return (
        <div className="flex h-screen bg-[#F8FAFC] relative overflow-hidden">
            {/* Background Patterns */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="w-8 h-8 text-primary" />
                            <h2 className="text-3xl font-bold tracking-tight">Orders Dashboard</h2>
                        </div>
                        <p className="text-[#6B7280] font-medium italic pl-11">
                            Live Orders • Hotel, Cafe & Restaurant
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden backdrop-blur-sm">
                    <OrderFlowDashboard />
                </div>
            </div>
        </div>
    )
}

