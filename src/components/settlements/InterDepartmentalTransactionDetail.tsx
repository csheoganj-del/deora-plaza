"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TransactionItem {
  id: string
  name: string
  quantity: number
  price: number
  businessUnit: string
}

interface TransactionDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: {
    id: string
    orderNumber: string
    sourceBusinessUnit: string
    targetBusinessUnit: string
    totalAmount: number
    createdAt: string
    items: TransactionItem[]
  } | null
}

export default function InterDepartmentalTransactionDetail({ 
  open, 
  onOpenChange,
  order
}: TransactionDetailProps) {
  const [processing, setProcessing] = useState(false)

  if (!order) return null

  const handleProcessSettlement = async () => {
    if (!confirm(`Process settlement for order ${order.orderNumber}?`)) return
    
    setProcessing(true)
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert(`Settlement processed for order ${order.orderNumber}`)
      onOpenChange(false)
    } catch (error) {
      console.error("Error processing settlement:", error)
      alert("Failed to process settlement")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inter-Departmental Transaction Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Order ID</h3>
            <p className="font-mono text-sm">{order.orderNumber}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
            <p className="text-sm">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">From Department</h3>
            <Badge variant="outline" className="capitalize">
              {order.sourceBusinessUnit}
            </Badge>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">To Department</h3>
            <Badge variant="outline" className="capitalize">
              {order.targetBusinessUnit}
            </Badge>
          </div>
          <div className="col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
            <p className="text-2xl font-bold">₹{order.totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium mb-2">Items</h3>
          <ScrollArea className="h-64 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Department</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{item.price.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {item.businessUnit}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleProcessSettlement} disabled={processing}>
            {processing ? "Processing..." : "Process Settlement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

