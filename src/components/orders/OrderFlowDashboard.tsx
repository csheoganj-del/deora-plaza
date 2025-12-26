"use client";

import React, { useState, useEffect } from "react"


import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, TrendingUp, DollarSign, AlertCircle, Trash2 } from "lucide-react"
import { getKitchenOrders } from "@/actions/kitchen"
import OrderFlowTracker from "./OrderFlowTracker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { deleteOrder as deleteOrderAction } from "@/actions/orders"
import { getBusinessSettings } from "@/actions/businessSettings"

type Order = {
  id: string
  orderNumber: string
  roomNumber?: string
  tableNumber?: string
  businessUnit: string
  status: string
  totalAmount: number
  createdAt: string
  preparingAt?: string | null
  readyAt?: string | null
  isPaid?: boolean
  items: any[]
}

export default function OrderFlowDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(false)
      const data = await getKitchenOrders()
      setOrders(data as Order[])
    }
    fetchOrders()

    // Fetch password protection settings
    getBusinessSettings().then(settings => {
      if (settings) {
        setPasswordProtection(settings.enablePasswordProtection ?? true)
      }
    })

    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    avgPrepTime: calculateAvgPrepTime(orders)
  }

  const byDepartment = {
    hotel: orders.filter(o => o.businessUnit === 'hotel'),
    cafe: orders.filter(o => o.businessUnit === 'cafe' || o.businessUnit === 'restaurant'),
    bar: orders.filter(o => o.businessUnit === 'bar')
  }

  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [passwordProtection, setPasswordProtection] = useState(true)

  const handleSingleDelete = (orderId: string) => {
    setOrderToDelete(orderId)
    setPasswordAction('single')
    if (passwordProtection) {
      setIsPasswordDialogOpen(true)
    } else {
      // Small delay to ensure state update if needed, though here we just want to bypass dialog
      setTimeout(() => handlePasswordSuccess(""), 0)
    }
  }

  const handleBulkDelete = () => {
    setPasswordAction('bulk')
    if (passwordProtection) {
      setIsPasswordDialogOpen(true)
    } else {
      handlePasswordSuccess("")
    }
  }

  const handlePasswordSuccess = async (password: string) => {
    setLoading(true)
    if (passwordAction === 'single' && orderToDelete) {
      await deleteOrderAction(orderToDelete, password)
      setOrders(prev => prev.filter(o => o.id !== orderToDelete))
      if (selectedOrder?.id === orderToDelete) setSelectedOrder(null)
    } else if (passwordAction === 'bulk') {
      await Promise.all(selectedOrders.map(id => deleteOrderAction(id, password)))
      setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)))
      if (selectedOrder && selectedOrders.includes(selectedOrder.id)) setSelectedOrder(null)
      setSelectedOrders([])
    }
    setLoading(false)
    setIsPasswordDialogOpen(false)
    setOrderToDelete(null)
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId])
  }

  const toggleSelectAll = (dept: string) => {
    const deptOrders = dept === 'all' ? orders : byDepartment[dept as 'hotel' | 'cafe' | 'bar'];
    const deptOrderIds = deptOrders.map(order => order.id);

    // Check if all orders in this department are already selected
    const allSelected = deptOrderIds.every(id => selectedOrders.includes(id));

    if (allSelected) {
      // Deselect all
      setSelectedOrders(prev => prev.filter(id => !deptOrderIds.includes(id)));
    } else {
      // Select all (merge with existing selections)
      const newSelections = deptOrderIds.filter(id => !selectedOrders.includes(id));
      setSelectedOrders(prev => [...prev, ...newSelections]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="premium-card">
          <div className="p-8 pt-6">
            <div className="text-center">
              <p className="text-sm text-[#9CA3AF]">Pending Orders</p>
              <p className="text-3xl font-bold text-[#F59E0B]">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 pt-6">
            <div className="text-center">
              <p className="text-sm text-[#9CA3AF]">Preparing</p>
              <p className="text-3xl font-bold text-orange-600">{stats.preparing}</p>
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 pt-6">
            <div className="text-center">
              <p className="text-sm text-[#9CA3AF]">Ready</p>
              <p className="text-3xl font-bold text-[#22C55E]">{stats.ready}</p>
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 pt-6">
            <div className="text-center">
              <p className="text-sm text-[#9CA3AF]">Avg Prep Time</p>
              <p className="text-3xl font-bold text-[#6D5DFB]">{stats.avgPrepTime}m</p>
            </div>
          </div>
        </div>
        <div className="premium-card">
          <div className="p-8 pt-6">
            <div className="text-center">
              <DollarSign className="h-5 w-5 text-[#22C55E] mx-auto mb-1" />
              <p className="text-sm text-[#9CA3AF]">Total</p>
              <p className="text-2xl font-bold text-[#22C55E]">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#F1F5F9] mb-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-[#6B7280] font-medium">
            {selectedOrders.length} selected
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSelectAll(activeTab)}
            className="text-xs h-8 border-[#9CA3AF]"
          >
            {selectedOrders.length > 0 ? "Deselect All" : "Select All"}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="h-8"
            disabled={selectedOrders.length === 0}
          >
            <Trash2 className="mr-2 h-3 w-3" /> Delete ({selectedOrders.length})
          </Button>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="hotel">Room Service ({byDepartment.hotel.length})</TabsTrigger>
          <TabsTrigger value="cafe">Cafe & Restaurant ({byDepartment.cafe.length})</TabsTrigger>
        </TabsList>
        {(['all', 'hotel', 'cafe'] as const).map(dept => (
          <TabsContent key={dept} value={dept}>
            <div className="space-y-4">
              {(dept === 'all' ? orders : byDepartment[dept]).length === 0 ? (
                <div className="premium-card">
                  <div className="p-8 pt-10 text-center text-[#9CA3AF]">
                    No orders in this category
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {(dept === 'all' ? orders : byDepartment[dept]).map(order => (
                    <div key={order.id} className="group relative flex flex-col text-left transition-all duration-300 hover:-translate-y-1 w-full cursor-pointer">
                      <div className="premium-card cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                          <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={() => toggleOrderSelection(order.id)} onClick={(e) => e.stopPropagation()} />
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-[#FEE2E2]0 hover:text-[#DC2626] hover:bg-[#FEE2E2]" onClick={(e) => { e.stopPropagation(); handleSingleDelete(order.id); }} >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-8 border-b border-[#E5E7EB] pb-3">
                          <div className="flex justify-between items-start">
                            <h2 className="text-3xl font-bold text-[#111827] text-base">
                              {order.businessUnit === 'hotel' && `Room ${order.roomNumber}`}
                              {(order.businessUnit === 'restaurant' || order.businessUnit === 'cafe') && `Table ${order.tableNumber}`}
                            </h2>
                            <p className="text-xs text-[#9CA3AF] mt-1">#{order.orderNumber}</p>
                          </div>
                          <Badge className={order.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]800' : order.status === 'preparing' ? 'bg-orange-100 text-orange-800' : order.status === 'ready' ? 'bg-[#BBF7D0] text-green-800' : 'bg-[#EDEBFF]/30 text-[#6D5DFB]'}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="p-8">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#6B7280]">Items</span>
                              <span className="font-semibold">{order.items?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6B7280]">Amount</span>
                              <span className="font-semibold">₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#9CA3AF] text-xs pt-1">
                              <Clock className="h-3 w-3" /> {calculateTimeAgo(order.createdAt)}
                            </div>
                            {order.isPaid && (
                              <Badge variant="outline" className="mt-2 bg-[#DCFCE7] text-[#16A34A] border-green-300">
                                ✓ Paid
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      {selectedOrder && (
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-[#111827]">Order Details & Timeline</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-[#9CA3AF] hover:text-[#111827]" >
                ✕
              </button>
            </div>
          </div>
          <div className="p-8">
            <OrderFlowTracker orderId={selectedOrder.id} orderNumber={selectedOrder.orderNumber} />
          </div>
        </div>
      )}
      <PasswordDialog isOpen={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)} onConfirm={handlePasswordSuccess} title={passwordAction === 'bulk' ? "Delete Selected Orders" : "Delete Order"} description={passwordAction === 'bulk' ? `Are you sure you want to delete ${selectedOrders.length} orders?` : "Are you sure you want to delete this order?"} />
    </div >
  )
}

function calculateAvgPrepTime(orders: Order[]): number {
  const completedOrders = orders.filter(o => o.readyAt && o.createdAt)
  if (completedOrders.length === 0) return 0
  const totalTime = completedOrders.reduce((sum, order) => {
    const created = new Date(order.createdAt).getTime()
    const ready = new Date(order.readyAt!).getTime()
    return sum + (ready - created)
  }, 0)
  return Math.round(totalTime / completedOrders.length / 60000)
}

function calculateTimeAgo(createdAt: string): string {
  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  const diffMs = now - created
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  return `${Math.floor(diffMins / 60)}h ago`
}

