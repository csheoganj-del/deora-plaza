"use client"

import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { generateBill, processPayment } from "@/actions/billing"
import { InvoiceTemplate } from "./InvoiceTemplate"
import { Printer, CreditCard, Banknote } from "lucide-react"

type BillGeneratorProps = {
    order: any
    onClose: () => void
}

export default function BillGenerator({ order, onClose }: BillGeneratorProps) {
    const [discount, setDiscount] = useState(0)
    const [amountPaid, setAmountPaid] = useState(0)
    const [bill, setBill] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
    })

    const handleGenerateBill = async () => {
        setLoading(true)
        const subtotal = order.totalAmount
        const gst = subtotal * 0.05
        const total = subtotal + gst - discount

        const result = await generateBill({
            orderId: order.id,
            businessUnit: order.businessUnit,
            subtotal,
            gstPercent: 5,
            gstAmount: gst,
            grandTotal: total
        })
        if (result.success) {
            setBill({
                id: result.billId,
                billNumber: result.billNumber,
                orderId: order.id,
                businessUnit: order.businessUnit,
                subtotal,
                gstPercent: 5,
                gstAmount: gst,
                grandTotal: total,
                paymentStatus: 'paid',
                createdAt: new Date()
            })
        } else {
            alert("Failed to generate bill")
        }
        setLoading(false)
    }

    const handlePayment = async (method: string) => {
        if (!bill) return
        setLoading(true)
        const result = await processPayment(bill.id, method, amountPaid || bill.grandTotal)
        if (result.success) {
            alert("Payment successful!")
            onClose()
        } else {
            alert("Payment failed")
        }
        setLoading(false)
    }

    if (bill) {
        return (
            <div className="flex gap-4">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle>Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Due:</span>
                            <span>₹{bill.grandTotal.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount Paid</Label>
                            <Input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(parseFloat(e.target.value))}
                                placeholder={bill.grandTotal.toString()}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => handlePayment("cash")} disabled={loading}>
                                <Banknote className="mr-2 h-4 w-4" /> Cash
                            </Button>
                            <Button onClick={() => handlePayment("upi")} variant="outline" disabled={loading}>
                                <CreditCard className="mr-2 h-4 w-4" /> UPI
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="secondary" className="w-full" onClick={() => handlePrint()}>
                            <Printer className="mr-2 h-4 w-4" /> Print Invoice
                        </Button>
                    </CardFooter>
                </Card>

                <div className="hidden">
                    <InvoiceTemplate ref={printRef} bill={bill} order={order} />
                </div>
            </div>
        )
    }

    const subtotal = order.totalAmount
    const gst = subtotal * 0.05
    const total = subtotal + gst - discount

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Generate Bill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <Separator />
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>GST (5%)</span>
                        <span>₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <Label>Discount</Label>
                        <Input
                            type="number"
                            className="w-24 h-8 text-right"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleGenerateBill} disabled={loading}>
                    Generate Bill
                </Button>
            </CardFooter>
        </Card>
    )
}
