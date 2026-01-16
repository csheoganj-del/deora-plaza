"use client"

import React from "react"
import { Separator } from "@/components/ui/separator"

type InvoiceProps = {
    bill: any // Type properly in real app
    order: any
    businessSettings: { // Add businessSettings to props
        name: string;
        address: string;
        mobile: string;
        gstPercentage?: number; // Changed from gstNumber to gstPercentage
        // Add other fields as needed, e.g., gstin: string;
    } | null;
    businessUnit?: string; // Add businessUnit prop
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceProps>(({ bill, order, businessSettings, businessUnit }, ref) => {
    return (
        <div ref={ref} className="p-8 glass-card text-black w-[80mm] min-h-[297mm] mx-auto font-mono text-sm">
            <div className="text-center mb-4 leading-tight">
                <h1 className="text-xl font-bold uppercase">{businessSettings?.name || "Your Business Name"}</h1>
                <p className="text-xs">{businessSettings?.address || "Your Business Address"}</p>
                <p className="text-xs">Mobile: {businessSettings?.mobile || "N/A"}</p>
                {(businessSettings?.gstPercentage ?? 0) > 0 && (
                    <p className="text-xs">GST Rate: {businessSettings?.gstPercentage}%</p>
                )}
            </div>

            <div className="my-2 border-t border-dashed border-[#9CA3AF]"></div>

            <div className="mb-4 text-xs">                <div className="flex justify-between">
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
                <div className="flex justify-between">
                    <span>Source:</span>
                    <span className="capitalize">{bill.source || 'Dine-in'}</span>
                </div>
                {order.table && (
                    <div className="flex justify-between">
                        <span>Table:</span>
                        <span>{order.table.tableNumber}</span>
                    </div>
                )}
                {bill.customerName && (
                    <>
                        <div className="flex justify-between">
                            <span>Customer:</span>
                            <span>{bill.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Mobile:</span>
                            <span>{bill.customerMobile}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="my-2 border-t border-dashed border-[#9CA3AF]"></div>

            <div className="mb-4">
                <div className="grid grid-cols-12 font-bold mb-1 border-b pb-1">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-4 text-right">Amt</span>
                </div>
                {(() => {
                    // Parse items if they're stored as JSON strings
                    let itemsArray = [];
                    try {
                        if (bill.items) {
                            itemsArray = Array.isArray(bill.items) ? bill.items : JSON.parse(bill.items);
                        } else if (order.items) {
                            itemsArray = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
                        }
                    } catch (e) {
                        // If parsing fails, fall back to empty array
                        console.warn('Failed to parse items:', e);
                        itemsArray = [];
                    }

                    return itemsArray.map((item: any, index: number) => (
                        <div key={item.id || item.menuItemId || index} className="grid grid-cols-12 mb-1">
                            <span className="col-span-6 break-words">{item.name}</span>
                            <span className="col-span-2 text-center">{item.quantity}</span>
                            <span className="col-span-4 text-right">{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ));
                })()}
            </div>

            <div className="my-2 border-t border-dashed border-[#9CA3AF]"></div>

            <div className="space-y-1 text-right">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{Math.round(bill.subtotal)}</span>
                </div>
                {(bill.discountPercent > 0 || bill.discountAmount > 0) && (
                    <div className="flex justify-between text-xs text-[#22C55E]">
                        <span>Discount ({bill.discountPercent > 0 ? `${bill.discountPercent}%` : '₹'}):</span>
                        <span>-{Math.round(bill.discountAmount)}</span>
                    </div>
                )}
                {bill.gstPercent > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>GST ({bill.gstPercent}%):</span>
                        <span>{Math.round(bill.gstAmount)}</span>
                    </div>
                )}
                <div className="my-1 border-t border-dashed border-[#9CA3AF]"></div>
                <div className="flex justify-between font-bold text-lg">                    <span>Total:</span>
                    <span>{Math.round(bill.grandTotal)}</span>
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

