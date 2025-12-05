import KitchenBoard from "@/components/kitchen/KitchenBoard"
import { ChefHat } from "lucide-react"

export default function KitchenPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-black/95 text-white p-6">
            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-900/20">
                        <ChefHat className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                            Kitchen Display System
                        </h1>
                        <p className="text-gray-400 mt-1">Live order feed • Cafe, Restaurant & Hotel</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    {/* Stats or filters could go here */}
                </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
                <KitchenBoard />
            </div>
        </div>
    )
}
