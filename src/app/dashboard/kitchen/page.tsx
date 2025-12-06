"use client"
import KitchenBoard from "@/components/kitchen/KitchenBoard"
import { ChefHat } from "lucide-react"
export const dynamic = "force-dynamic"

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
            <div
                className="flex-1 overflow-hidden rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 elevation-1 tilt-3d"
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
                <KitchenBoard />
            </div>
        </div>
    )
}
