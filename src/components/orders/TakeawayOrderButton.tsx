"use client"

import { useState } from "react"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

const TakeawayOrderDialog = dynamic(
    () => import("./TakeawayOrderDialog").then((mod) => mod.TakeawayOrderDialog),
    { ssr: false }
)

interface TakeawayOrderButtonProps {
    businessUnit: string
}

export function TakeawayOrderButton({ businessUnit }: TakeawayOrderButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-[#D3E3FD] hover:bg-[#C2D9FB] text-[#001D35] border-none shadow-none rounded-full h-10 px-6 font-medium gap-2 active:scale-[0.98] transition-all"
            >
                <ShoppingBag className="h-4 w-4" />
                Takeaway Order
            </Button>
            <TakeawayOrderDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                businessUnit={businessUnit}
            />
        </>
    )
}

