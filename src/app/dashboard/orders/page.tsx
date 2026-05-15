import OrderFlowDashboard from "@/components/orders/OrderFlowDashboard"
import { ShoppingBag } from "lucide-react"


export const dynamic = "force-dynamic"

export default function OrdersPage() {
    return (
        <div className="pb-20">
            <OrderFlowDashboard />
        </div>
    )
}

