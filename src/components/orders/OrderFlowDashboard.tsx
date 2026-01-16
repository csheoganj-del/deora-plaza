"use client";

import React, { useState, useEffect } from "react"
import { PremiumLiquidGlass, PremiumStatsCard, PremiumContainer } from "@/components/ui/glass/premium-liquid-glass"
import { ShoppingBag, Loader2, Clock, CheckCircle2, TrendingUp, DollarSign, AlertCircle, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordDialog } from "@/components/ui/PasswordDialog"
import { getKitchenOrders } from "@/actions/kitchen"
import OrderFlowTracker from "./OrderFlowTracker"
import { deleteOrder as deleteOrderAction } from "@/actions/orders"
import { getBusinessSettings } from "@/actions/businessSettings"

type Order = {
  id: string
  orderNumber: string
  tableId?: string | null
  table?: { tableNumber: string } | null
  roomNumber?: string
  businessUnit: string
  status: string
  type?: string
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

  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'single' | 'bulk'>('single')
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [passwordProtection, setPasswordProtection] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(false)
      console.log('[OrderFlow DEBUG] Fetching orders...');
      const data = await getKitchenOrders()
      console.log('[OrderFlow DEBUG] Received orders:', data);
      console.log('[OrderFlow DEBUG] Order count:', data?.length);
      if (data && data.length > 0) {
        console.log('[OrderFlow DEBUG] Sample order:', data[0]);
      }
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

  const handleSingleDelete = (orderId: string) => {
    setOrderToDelete(orderId)
    setPasswordAction('single')
    if (passwordProtection) {
      setIsPasswordDialogOpen(true)
    } else {
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
    const allSelected = deptOrderIds.every(id => selectedOrders.includes(id));

    if (allSelected) {
      setSelectedOrders(prev => prev.filter(id => !deptOrderIds.includes(id)));
    } else {
      const newSelections = deptOrderIds.filter(id => !selectedOrders.includes(id));
      setSelectedOrders(prev => [...prev, ...newSelections]);
    }
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Orders Dashboard
            </h1>
          </div>
          <p className="text-white/50 mt-1 pl-[3.5rem]">Live Orders • Hotel, Cafe & Restaurant</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <PremiumStatsCard
          title="Pending Orders"
          value={stats.pending.toString()}
          icon={AlertCircle}
          trend="Needs Attention"
          trendUp={false}
          className={stats.pending > 0 ? "border-amber-500/30 bg-amber-500/10" : ""}
        />
        <PremiumStatsCard
          title="Preparing"
          value={stats.preparing.toString()}
          icon={Clock}
          trend="In Progress"
          trendUp={true}
          className="border-orange-500/30 bg-orange-500/10"
        />
        <PremiumStatsCard
          title="Ready"
          value={stats.ready.toString()}
          icon={CheckCircle2}
          trend="Completed"
          trendUp={true}
          className="border-emerald-500/30 bg-emerald-500/10"
        />
        <PremiumStatsCard
          title="Avg Prep Time"
          value={`${stats.avgPrepTime}m`}
          icon={TrendingUp}
        />
        <PremiumStatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      <PremiumLiquidGlass title="Active Orders">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 mb-6 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-sm text-white/60 font-medium whitespace-nowrap">
              {selectedOrders.length} selected
            </div>
            {selectedOrders.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSelectAll(activeTab)}
                  className="text-xs h-8 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                >
                  {selectedOrders.length > 0 ? "Deselect All" : "Select All"}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="h-8 text-xs"
                >
                  <Trash2 className="mr-2 h-3 w-3" /> Delete ({selectedOrders.length})
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-black/20 w-full md:w-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">All ({orders.length})</TabsTrigger>
              <TabsTrigger value="hotel" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Room Service ({byDepartment.hotel.length})</TabsTrigger>
              <TabsTrigger value="cafe" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Cafe ({byDepartment.cafe.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-white/20" />
            </div>
          ) : (
            <>
              {(['all', 'hotel', 'cafe'] as const).map(dept => {
                const deptOrders = dept === 'all' ? orders : byDepartment[dept];
                // Filter out served and completed orders for the live feed
                const liveOrders = deptOrders.filter(o => !['served', 'completed', 'cancelled'].includes(o.status));

                return (
                  <div key={dept} className={activeTab === dept ? 'block' : 'hidden'}>
                    {liveOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-white/30">
                        <ShoppingBag className="h-16 w-16 mb-4 opacity-20" />
                        <p>No active orders</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {liveOrders.map(order => (
                          <div key={order.id} className="group relative flex flex-col text-left transition-all duration-300 w-full cursor-pointer">
                            <div
                              className={`relative rounded-xl border p-5 transition-all hover:-translate-y-1 ${order.status === 'pending' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' :
                                order.status === 'preparing' ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' :
                                  order.status === 'ready' ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' :
                                    'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                              onClick={() => setSelectedOrder(order)}
                            >
                              <div className="absolute top-3 right-3 z-10 flex gap-2">
                                <Checkbox
                                  checked={selectedOrders.includes(order.id)}
                                  onCheckedChange={() => toggleOrderSelection(order.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="data-[state=checked]:bg-primary border-white/20"
                                />
                                <button
                                  className="h-7 w-7 flex items-center justify-center rounded-md bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all"
                                  onClick={(e) => { e.stopPropagation(); handleSingleDelete(order.id); }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mb-4">
                                <div className="flex justify-between items-start pr-12">
                                  <h2 className="text-xl font-bold text-white">
                                    {order.businessUnit === 'hotel' && `Room ${order.roomNumber}`}
                                    {(order.businessUnit === 'restaurant' || order.businessUnit === 'cafe') && (
                                      order.type === 'takeaway' ? 'Takeaway' : order.table?.tableNumber ? `Table ${order.table.tableNumber}` : 'Counter'
                                    )}
                                  </h2>
                                </div>
                                <p className="text-xs text-white/40 mt-1">#{order.orderNumber}</p>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-4">
                                <Badge className={
                                  order.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' :
                                    order.status === 'preparing' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                      order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                                        'bg-white/10 text-white/60'
                                }>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>

                                {order.isPaid && (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    ✓ Paid
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-2 text-sm pt-4 border-t border-white/5">
                                <div className="flex justify-between text-white/60">
                                  <span>Items</span>
                                  <span className="font-semibold text-white">{order.items?.length || 0}</span>
                                </div>
                                <div className="flex justify-between text-white/60">
                                  <span>Amount</span>
                                  <span className="font-semibold text-white">₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/40 text-xs pt-1">
                                  <Clock className="h-3 w-3" /> {calculateTimeAgo(order.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </PremiumLiquidGlass>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <PremiumLiquidGlass title={`Order Details: ${selectedOrder.orderNumber}`} className="border-white/20 shadow-2xl">
              <div className="absolute top-4 right-4">
                <button onClick={() => setSelectedOrder(null)} className="text-white/40 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
              <div className="p-4">
                <OrderFlowTracker orderId={selectedOrder.id} orderNumber={selectedOrder.orderNumber} />
              </div>
            </PremiumLiquidGlass>
          </div>
        </div>
      )}

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={handlePasswordSuccess}
        title={passwordAction === 'bulk' ? "Delete Selected Orders" : "Delete Order"}
        description={passwordAction === 'bulk' ? `Are you sure you want to delete ${selectedOrders.length} orders?` : "Are you sure you want to delete this order?"}
      />
    </div>
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
