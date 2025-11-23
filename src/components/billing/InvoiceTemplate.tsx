"use client"

import React from "react"
import { Separator } from "@/components/ui/separator"

type InvoiceProps = {
    bill: any // Type properly in real app
    order: any
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>(({ bill, order }, ref) => {
    return (
        <div ref={ref} className="p-8 bg-white text-black w-[80mm] min-h-[297mm] mx-auto font-mono text-sm">
            <div className="text-center mb-4">
                <h1 className="text-xl font-bold">DEORA PLAZA</h1>
                <p>Cafe & Bar</p>
                <p className="text-xs">123, Main Street, City</p>
                <p className="text-xs">GSTIN: 29ABCDE1234F1Z5</p>
            </div>

            <Separator className="my-2" />

            <div className="mb-4 text-xs">
                <div className="flex justify-between">
                    <span>Bill No:</span>
                    <span>{bill.billNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{new Date(bill.createdAt).toLocaleTimeString()}</span>
                </div>
                {order.table && (
                    <div className="flex justify-between">
                        <span>Table:</span>
                        <span>{order.table.tableNumber}</span>
                    </div>
                )}
            </div>

            <Separator className="my-2" />

            <div className="mb-4">
                <div className="grid grid-cols-12 font-bold mb-1 border-b pb-1">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-4 text-right">Amt</span>
                </div>
                {order.items.map((item: any) => (
                    <div key={item.id} className="grid grid-cols-12 mb-1">
                        <span className="col-span-6 truncate">{item.name}</span>
                        <span className="col-span-2 text-center">{item.quantity}</span>
                        <span className="col-span-4 text-right">{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <Separator className="my-2" />

            <div className="space-y-1 text-right">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>GST (5%):</span>
                    <span>{bill.gstAmount.toFixed(2)}</span>
                </div>
                {bill.manualDiscount > 0 && (
                    <div className="flex justify-between text-xs">
                        <span>Discount:</span>
                        <span>-{bill.manualDiscount.toFixed(2)}</span>
                    </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{bill.grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div className="mt-8 text-center text-xs">
                <p>Thank you for visiting!</p>
                <p>Please visit again.</p>
            </div>
        </div>
    )
})

InvoiceTemplate.displayName = "InvoiceTemplate"
