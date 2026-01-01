"use client"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { 
  getInterDepartmentalOrders, 
  createInterDepartmentalSettlement 
} from "@/actions/settlements"
import InterDepartmentalTransactionDetail from "./InterDepartmentalTransactionDetail"

interface InterDepartmentalOrder {
  id: string
  orderNumber: string
  sourceBusinessUnit: string
  targetBusinessUnit: string
  totalAmount: number
  createdAt: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    businessUnit: string
  }>
  isSettled: boolean
}

export default function InterDepartmentalSettlement() {
  const [orders, setOrders] = useState<InterDepartmentalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<InterDepartmentalOrder | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getInterDepartmentalOrders()
      setOrders(data)
    } catch (error) {
      console.error("Error fetching inter-departmental orders:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSettleAll = async () => {
    if (!confirm("Are you sure you want to settle all pending inter-departmental orders?")) return
    
    setProcessing(true)
    try {
      const result = await createInterDepartmentalSettlement(orders.map(order => order.id))
      if (result.success) {
        alert("All inter-departmental settlements processed successfully!")
        fetchData()
      } else {
        alert("Failed to process settlements: " + result.error)
      }
    } catch (error) {
      console.error("Error settling orders:", error)
      alert("An error occurred while processing settlements")
    } finally {
      setProcessing(false)
    }
  }

  const handleViewDetails = (order: InterDepartmentalOrder) => {
    setSelectedOrder(order)
    setShowDetail(true)
  }

  const getTotalPendingAmount = () => {
    return orders
      .filter(order => !order.isSettled)
      .reduce((sum, order) => sum + order.totalAmount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
          <h2 className="text-3xl font-bold text-[#111827]">Inter-Departmental Settlements</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span>Total Pending:</span>
              <span className="font-bold text-primary mx-2">
                ₹{getTotalPendingAmount().toLocaleString('en-IN')}
              </span>
            </div>
            <Button 
              onClick={handleSettleAll} 
              disabled={processing || getTotalPendingAmount() === 0}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Settle All Pending
            </Button>
          </div>
        </div>
        <div className="p-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No inter-departmental orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.sourceBusinessUnit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.targetBusinessUnit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      {order.isSettled ? (
                        <Badge variant="secondary">Settled</Badge>
                      ) : (
                        <Badge variant="default">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <InterDepartmentalTransactionDetail
        open={showDetail}
        onOpenChange={setShowDetail}
        order={selectedOrder}
      />
    </>
  )
}

