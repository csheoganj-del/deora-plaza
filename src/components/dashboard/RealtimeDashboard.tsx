"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Zap, 
  Clock, 
  Users, 
  ShoppingCart, 
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingUp,
  Eye
} from 'lucide-react'
import { useRealtimeOrders, useRealtimeKitchenOrders, useRealtimeInventory, useRealtimeTables } from '@/hooks/useRealtimeData'
import { useRealtimeSync } from '@/components/providers/RealtimeSyncProvider'
import { formatDistanceToNow } from 'date-fns'

/**
 * REAL-TIME DASHBOARD
 * Ultra-fast, live-updating dashboard showcasing real-time capabilities
 */

interface RealtimeDashboardProps {
  businessUnit?: string
}

export default function RealtimeDashboard({ businessUnit }: RealtimeDashboardProps) {
  const { status, isOnline, reconnect, getPerformanceStats } = useRealtimeSync()
  const [performanceStats, setPerformanceStats] = useState<any>(null)

  // Real-time data hooks
  const { 
    data: orders, 
    loading: ordersLoading, 
    lastUpdated: ordersUpdated,
    isRealtime: ordersRealtime 
  } = useRealtimeOrders({ businessUnit })

  const { 
    orders: kitchenOrders, 
    loading: kitchenLoading 
  } = useRealtimeKitchenOrders(businessUnit)

  const { 
    inventory, 
    lowStockItems, 
    loading: inventoryLoading 
  } = useRealtimeInventory(businessUnit)

  const { 
    tables, 
    occupiedTables, 
    availableTables, 
    loading: tablesLoading 
  } = useRealtimeTables(businessUnit)

  // Update performance stats
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceStats(getPerformanceStats())
    }, 2000)

    return () => clearInterval(interval)
  }, [getPerformanceStats])

  // Calculate real-time metrics
  const metrics = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    completedToday: orders.filter(o => {
      const today = new Date().toDateString()
      return new Date(o.createdAt).toDateString() === today && o.status === 'completed'
    }).length,
    activeKitchenOrders: kitchenOrders.length,
    lowStockCount: lowStockItems.length,
    occupiedTablesCount: occupiedTables.length,
    totalTables: tables.length,
    occupancyRate: tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Dashboard</h1>
          <p className="text-muted-foreground">
            Live updates • Ultra-fast sync • Zero latency
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isOnline && status.connected ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Live</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}
          </div>

          {/* Reconnect Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={reconnect}
            disabled={status.connected && isOnline}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      {performanceStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Real-time sync performance and cache efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceStats.cache.stats.hitRate}%
                </div>
                <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(status.subscriptions).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Subscriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {status.queueLength}
                </div>
                <div className="text-sm text-muted-foreground">Queue Length</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceStats.cache.stats.size}
                </div>
                <div className="text-sm text-muted-foreground">Cache Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {ordersRealtime && (
                <Badge variant="secondary" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
              {ordersUpdated && (
                <span>
                  Updated {formatDistanceToNow(new Date(ordersUpdated), { addSuffix: true })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kitchen Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeKitchenOrders}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingOrders} pending • {metrics.completedToday} completed today
            </p>
          </CardContent>
        </Card>

        {/* Table Occupancy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.occupiedTablesCount} of {metrics.totalTables} tables occupied
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Orders
              <Badge variant="secondary">Live</Badge>
            </CardTitle>
            <CardDescription>
              Real-time order updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordersLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Order #{order.billNumber || order.id.slice(-6)}</div>
                      <div className="text-sm text-muted-foreground">
                        Table {order.tableNumber} • ₹{order.totalAmount}
                      </div>
                    </div>
                    <Badge variant={
                      order.status === 'completed' ? 'default' :
                      order.status === 'preparing' ? 'secondary' :
                      'outline'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Kitchen Display
              <Badge variant="secondary">Live</Badge>
            </CardTitle>
            <CardDescription>
              Active kitchen orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kitchenLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : kitchenOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active kitchen orders
                </div>
              ) : (
                kitchenOrders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Order #{order.billNumber || order.id.slice(-6)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <Badge variant={
                      order.status === 'ready' ? 'default' :
                      order.status === 'preparing' ? 'secondary' :
                      'outline'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
              <Badge variant="destructive">{lowStockItems.length}</Badge>
            </CardTitle>
            <CardDescription>
              Items that need immediate restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-red-600">
                    Stock: {item.currentStock} / Min: {item.minStock}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.businessUnit}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}