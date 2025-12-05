"use client"

import { useState } from "react"
import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TakeawayOrderDialog } from "./TakeawayOrderDialog"

interface TakeawayOrderButtonProps {
    businessUnit: string
}

export function TakeawayOrderButton({ businessUnit }: TakeawayOrderButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="bg-orange-600 hover:bg-orange-700"
            >
                <ShoppingBag className="mr-2 h-4 w-4" />
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
