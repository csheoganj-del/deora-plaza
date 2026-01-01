"use client"
// Force recompile - Waiter Served Button

import React, { useState, useEffect } from "react"


import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Loader2, ChefHat, Utensils, DollarSign, CheckCircle } from "lucide-react"
import { getOrderTimeline } from "@/actions/orders"
import { updateOrderStatus } from "@/actions/kitchen"
import { cn } from "@/lib/utils"
import { useServerAuth } from "@/hooks/useServerAuth"

type OrderTimeline = {
    orderId: string
    orderNumber: string
    status: string
    timeline: Array<{
        status: string
        timestamp: string
        actor: string
        message: string
    }>
    timings: {
        createdAt: string
        pendingAt: string | null
        preparingAt: string | null
        readyAt: string | null
        servedAt: string | null
        completedAt: string | null
    }
    isPaid: boolean
}

interface OrderFlowTrackerProps {
    orderId: string
    orderNumber?: string
    compact?: boolean
}

const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: CheckCircle2 },
    { key: 'served', label: 'Served', icon: Utensils }
]

export default function OrderFlowTracker({ orderId, compact = false }: OrderFlowTrackerProps) {
    const [timeline, setTimeline] = useState<OrderTimeline | null>(null)
    const [loading, setLoading] = useState(true)
    const { data: session } = useServerAuth()
    const role = (session?.user as any)?.role

    useEffect(() => {
        let isFirstLoad = true
        const fetchTimeline = async () => {
            if (isFirstLoad) setLoading(true)
            const data = await getOrderTimeline(orderId)
            setTimeline(data)
            if (isFirstLoad) {
                setLoading(false)
                isFirstLoad = false
            }
        }

        fetchTimeline()
        const interval = setInterval(fetchTimeline, 5000)
        return () => clearInterval(interval)
    }, [orderId])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
            </div>
        )
    }

    if (!timeline) {
        return <div className="text-sm text-[#9CA3AF]">Order not found</div>
    }

    const getStatusIndex = (status: string) => {
        return statusSteps.findIndex(step => step.key === status)
    }

    const currentIndex = getStatusIndex(timeline.status)

    const handleStatusUpdate = async (newStatus: string) => {
        if (!timeline) return
        await updateOrderStatus(timeline.orderId, newStatus)
        // Refresh timeline
        const data = await getOrderTimeline(timeline.orderId)
        setTimeline(data)
    }

    const canMarkServed = ['waiter', 'cafe_manager', 'super_admin', 'owner'].includes(role || '')

    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#9CA3AF]">#{timeline.orderNumber}</span>
                    <Badge variant="outline" className={cn(
                        "text-xs",
                        timeline.status === 'pending' && "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20/20300",
                        timeline.status === 'preparing' && "bg-orange-100 text-orange-700 border-orange-300",
                        timeline.status === 'ready' && "bg-[#BBF7D0] text-[#16A34A] border-green-300",
                        timeline.status === 'served' && "bg-[#EDEBFF]/30 text-[#6D5DFB] border-[#EDEBFF]/40"
                    )}>
                        {timeline.status.charAt(0).toUpperCase() + timeline.status.slice(1)}
                    </Badge>
                </div>
                <div className="flex gap-1">
                    {statusSteps.map((step, idx) => (
                        <div key={step.key} className="flex-1">
                            <div className={cn(
                                "h-1 rounded-full transition-all",
                                idx <= currentIndex ? "bg-[#DCFCE7]0" : "bg-[#E5E7EB]"
                            )} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="premium-card">
            <div className="p-8 border-b border-[#E5E7EB] pb-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold text-[#111827] text-lg">Order #{timeline.orderNumber}</h2>
                    <div className="flex items-center gap-2">
                        {timeline.status === 'pending' && (
                            <button
                                onClick={() => handleStatusUpdate('preparing')}
                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <ChefHat className="h-3.5 w-3.5" />
                                Start Preparing
                            </button>
                        )}
                        {timeline.status === 'preparing' && (
                            <button
                                onClick={() => handleStatusUpdate('ready')}
                                className="px-3 py-1.5 bg-[#DCFCE7]0 hover:bg-[#22C55E] text-white rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark Ready
                            </button>
                        )}
                        {timeline.status === 'ready' && canMarkServed && (
                            <button
                                onClick={() => handleStatusUpdate('served')}
                                className="px-3 py-1.5 bg-[#6D5DFB] hover:bg-[#6D5DFB]/90 text-white rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Mark Served
                            </button>
                        )}
                        <Badge variant={timeline.isPaid ? "default" : "secondary"} className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {timeline.isPaid ? "Paid" : "Pending Payment"}
                        </Badge>
                    </div>
                </div>
            </div>
            <div className="p-8 space-y-6">
                <div>
                    <h4 className="text-sm font-semibold text-[#111827] mb-3">Order Status Flow</h4>
                    <div className="relative">
                        <div className="flex justify-between mb-4">
                            {statusSteps.map((step, idx) => {
                                const StepIcon = step.icon
                                const isCompleted = idx <= currentIndex
                                const isCurrent = idx === currentIndex

                                return (
                                    <div key={step.key} className="flex flex-col items-center flex-1">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                                            isCompleted ? "bg-[#DCFCE7]0 text-white" : "bg-[#E5E7EB] text-[#9CA3AF]",
                                            isCurrent && "ring-2 ring-green-300"
                                        )}>
                                            <StepIcon className="h-5 w-5" />
                                        </div>
                                        <span className="text-xs font-medium text-center text-[#111827]">{step.label}</span>
                                        {timeline.timings[`${step.key}At` as keyof typeof timeline.timings] && (
                                            <span className="text-xs text-[#9CA3AF] mt-1">
                                                {new Date(timeline.timings[`${step.key}At` as keyof typeof timeline.timings]!).toLocaleTimeString()}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex gap-1 mb-4">
                            {statusSteps.map((step, idx) => (
                                <div key={step.key} className={cn(
                                    "h-1 flex-1 rounded-full transition-all",
                                    idx < currentIndex ? "bg-[#DCFCE7]0" : idx === currentIndex ? "bg-orange-500" : "bg-[#E5E7EB]"
                                )} />
                            ))}
                        </div>
                    </div>
                </div>

                {timeline.timeline.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-[#111827] mb-3">Timeline History</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {timeline.timeline.map((event, idx) => (
                                <div key={idx} className="flex gap-3 p-2 bg-[#F8FAFC] rounded-md text-xs">
                                    <div className="flex-shrink-0 w-2 h-2 bg-[#9CA3AF] rounded-full mt-1" />
                                    <div className="flex-1">
                                        <div className="font-medium text-[#111827]">{event.message}</div>
                                        <div className="text-[#9CA3AF]">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

