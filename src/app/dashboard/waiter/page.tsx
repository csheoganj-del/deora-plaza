import WaiterBoard from "@/components/waiter/WaiterBoard"
import { UtensilsCrossed } from "lucide-react"

export default function WaiterPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] text-[#111827] p-6">
            <div className="mb-8 flex items-center justify-between border-b border-[#E5E7EB] pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#6D5DFB] to-[#EDEBFF] shadow-lg shadow-[#6D5DFB]/20">
                        <UtensilsCrossed className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#6D5DFB] to-[#EDEBFF] bg-clip-text text-transparent">
                            Waiter Dashboard
                        </h1>
                        <p className="text-[#6B7280] mt-1">Ready orders for delivery • Cafe, Restaurant & Hotel</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl bg-white border border-[#E5E7EB] shadow-sm p-6">
                <WaiterBoard />
            </div>
        </div>
    )
}

