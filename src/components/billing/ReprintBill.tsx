"use client"

import { useRef, useEffect, useState } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { InvoiceTemplate } from "./InvoiceTemplate"
import { getBusinessSettings } from "@/actions/businessSettings"
import { getOrderById } from "@/actions/orders"

interface ReprintBillProps {
    bill: any
    onClose?: () => void
}

export default function ReprintBill({ bill, onClose }: ReprintBillProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const [businessSettings, setBusinessSettings] = useState<any>(null)
    const [orderData, setOrderData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const settings = await getBusinessSettings()
            setBusinessSettings(settings)

            // If bill doesn't have items, fetch from order
            if ((!bill.items || bill.items.length === 0) && bill.orderId) {
                const order = await getOrderById(bill.orderId)
                setOrderData(order)
            }

            setLoading(false)
        }
        fetchData()
    }, [bill])

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: onClose
    })

    if (loading) {
        return <div className="flex items-center justify-center p-4"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</div>
    }

    // Use items from bill if available, otherwise from fetched order
    const items = bill.items && bill.items.length > 0 ? bill.items : (orderData?.items || [])

    // Construct order object with items
    const mockOrder = {
        id: bill.orderId,
        items: items,
        table: bill.table || orderData?.table,
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <Button onClick={() => handlePrint()}>
                    <Printer className="mr-2 h-4 w-4" /> Print Invoice
                </Button>
            </div>

            <div className="border rounded-md p-4 bg-gray-50 overflow-auto max-h-[60vh]">
                <div ref={printRef}>
                    <InvoiceTemplate
                        bill={bill}
                        order={mockOrder}
                        businessSettings={businessSettings}
                        businessUnit={bill.businessUnit}
                    />
                </div>
            </div>
        </div>
    )
}
