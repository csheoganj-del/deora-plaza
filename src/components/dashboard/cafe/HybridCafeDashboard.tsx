"use client"

import { useState } from "react"
import { 
  Coffee, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
  Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hybrid/card"
import { Button } from "@/components/ui/hybrid/button"
import { Badge } from "@/components/ui/hybrid/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/hybrid/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/hybrid/table"

// Mock data for cafe operations
const cafeMetrics = [
  {
    title: "Today's Revenue",
    value: "₹12,450",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
    color: "success"
  },
  {
    title: "Active Orders",
    value: "15",
    change: "+3",
    trend: "up",
    icon: ShoppingCart,
    color: "primary"
  },
  {
    title: "Customers Served",
    value: "89",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "success"
  },
  {
    title: "Avg Prep Time",
    value: "8 min",
    change: "-2 min",
    trend: "up",
    icon: Clock,
    color: "success"
  }
]

const activeOrders = [
  {
    id: "CAF-001",
    customer: "Sarah Johnson",
    items: ["Cappuccino", "Croissant"],
    total: "₹320",
    status: "preparing",
    time: "3 min ago",
    type: "takeaway"
  },
  {
    id: "CAF-002",
    customer: "Mike Chen",
    items: ["Latte", "Sandwich", "Cookie"],
    total: "₹480",
    status: "ready",
    time: "1 min ago",
    type: "dine-in"
  },
  {
    id: "CAF-003",
    customer: "Emma Wilson",
    items: ["Espresso", "Muffin"],
    total: "₹250",
    status: "pending",
    time: "5 min ago",
    type: "takeaway"
  }
]

const popularItems = [
  { name: "Cappuccino", orders: 23, revenue: "₹2,300" },
  { name: "Latte", orders: 18, revenue: "₹1,980" },
  { name: "Americano", orders: 15, revenue: "₹1,350" },
  { name: "Croissant", orders: 12, revenue: "₹960" }
]

const inventoryStatus = [
  { item: "Coffee Beans", stock: 85, status: "good" },
  { item: "Milk", stock: 45, status: "medium" },
  { item: "Sugar", stock: 20, status: "low" },
  { item: "Pastries", stock: 8, status: "critical" }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ready":
      return <CheckCircle className="w-4 h-4" />
    case "preparing":
      return <Clock className="w-4 h-4" />
    case "pending":
      return <AlertCircle className="w-4 h-4" />
    default:
      return null
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "ready":
      return "success"
    case "preparing":
      return "default"
    case "pending":
      return "warning"
    default:
      return "secondary"
  }
}

export default function HybridCafeDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")

  return (
    <div className="ga-p-6 space-y-6">
      {/* Page Header */}
      <div className="ga-flex ga-items-center ga-justify-between">
        <div>
          <h1 className="ga-text-display text-[var(--text-primary)]">
            Cafe Dashboard
          </h1>
          <p className="ga-text-body-secondary mt-1">
            Quick-service operations and takeaway management
          </p>
        </div>
        
        <div className="ga-flex ga-items-center ga-gap-3">
          <Button variant="secondary">
            <Package className="w-4 h-4" />
            Inventory
          </Button>
          <Button>
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="ga-grid ga-grid-4 ga-gap-6">
        {cafeMetrics.map((metric, index) => {
          const Icon = metric.icon
          const isPositive = metric.trend === "up"
          
          return (
            <Card key={index} interactive>
              <CardContent className="ga-p-6">
                <div className="ga-flex ga-items-center ga-justify-between">
                  <div>
                    <p className="ga-text-caption text-[var(--text-secondary)] mb-1">
                      {metric.title}
                    </p>
                    <p className="ga-text-h1 font-semibold text-[var(--text-primary)]">
                      {metric.value}
                    </p>
                    <div className="ga-flex ga-items-center ga-gap-1 mt-2">
                      <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                      <span className="ga-text-small font-medium text-[var(--color-success)]">
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-light)] ga-flex ga-items-center justify-center">
                    <Icon className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="ga-grid ga-grid-3 ga-gap-6">
        {/* Active Orders */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <div className="ga-flex ga-items-center ga-justify-between">
                <div>
                  <CardTitle className="ga-flex ga-items-center ga-gap-2">
                    <Coffee className="w-5 h-5" />
                    Active Orders
                  </CardTitle>
                  <p className="ga-text-body-secondary mt-1">
                    Current orders in preparation
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="ga-flex ga-items-center ga-justify-between ga-p-4 bg-[var(--bg-secondary)] rounded-lg">
                    <div className="ga-flex ga-items-center ga-gap-4">
                      <div>
                        <p className="ga-text-body font-medium">{order.id}</p>
                        <p className="ga-text-small text-[var(--text-secondary)]">{order.customer}</p>
                      </div>
                      <div>
                        <p className="ga-text-body">{order.items.join(", ")}</p>
                        <p className="ga-text-small text-[var(--text-secondary)]">{order.type} • {order.time}</p>
                      </div>
                    </div>
                    
                    <div className="ga-flex ga-items-center ga-gap-3">
                      <span className="ga-text-body font-medium">{order.total}</span>
                      <Badge 
                        variant={getStatusVariant(order.status) as any}
                        icon={getStatusIcon(order.status)}
                      >
                        {order.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Popular Items */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Items</CardTitle>
              <p className="ga-text-body-secondary">Top selling items today</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div key={item.name} className="ga-flex ga-items-center ga-justify-between">
                    <div>
                      <p className="ga-text-body font-medium">{item.name}</p>
                      <p className="ga-text-small text-[var(--text-secondary)]">{item.orders} orders</p>
                    </div>
                    <span className="ga-text-body font-medium">{item.revenue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Status */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <p className="ga-text-body-secondary">Current stock levels</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryStatus.map((item) => (
                  <div key={item.item} className="space-y-2">
                    <div className="ga-flex ga-items-center ga-justify-between">
                      <span className="ga-text-body">{item.item}</span>
                      <Badge 
                        variant={
                          item.status === "good" ? "success" : 
                          item.status === "medium" ? "default" :
                          item.status === "low" ? "warning" : "destructive"
                        }
                      >
                        {item.stock}%
                      </Badge>
                    </div>
                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.status === "good" ? "bg-[var(--color-success)]" :
                          item.status === "medium" ? "bg-[var(--color-primary)]" :
                          item.status === "low" ? "bg-[var(--color-warning)]" : "bg-[var(--color-error)]"
                        }`}
                        style={{ width: `${item.stock}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="ga-grid ga-grid-2 ga-gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <p className="ga-text-body-secondary">Daily revenue over the past week</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 ga-flex ga-items-center justify-center bg-[var(--bg-secondary)] rounded-lg">
                  <p className="ga-text-body-secondary">Revenue chart placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Order Types</CardTitle>
                <p className="ga-text-body-secondary">Breakdown by service type</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Takeaway", count: 45, percentage: 65 },
                    { type: "Dine-in", count: 24, percentage: 35 }
                  ].map((type) => (
                    <div key={type.type} className="space-y-2">
                      <div className="ga-flex ga-items-center ga-justify-between">
                        <span className="ga-text-body">{type.type}</span>
                        <span className="ga-text-body font-medium">{type.count} orders</span>
                      </div>
                      <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${type.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <p className="ga-text-body-secondary">Complete order history for today</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.items.join(", ")}</TableCell>
                      <TableCell className="capitalize">{order.type}</TableCell>
                      <TableCell className="font-medium">{order.total}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(order.status) as any}
                          icon={getStatusIcon(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[var(--text-secondary)]">
                        {order.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="ga-grid ga-grid-2 ga-gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Flow</CardTitle>
                <p className="ga-text-body-secondary">Peak hours and customer patterns</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 ga-flex ga-items-center justify-center bg-[var(--bg-secondary)] rounded-lg">
                  <p className="ga-text-body-secondary">Customer flow chart placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
                <p className="ga-text-body-secondary">Ratings and feedback</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="ga-text-display font-bold text-[var(--color-success)]">4.8</div>
                    <p className="ga-text-body-secondary">Average Rating</p>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="ga-flex ga-items-center ga-gap-2">
                        <span className="ga-text-small w-4">{stars}★</span>
                        <div className="flex-1 bg-[var(--bg-secondary)] rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-[var(--color-success)]"
                            style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : 5}%` }}
                          />
                        </div>
                        <span className="ga-text-small text-[var(--text-secondary)]">
                          {stars === 5 ? 70 : stars === 4 ? 20 : 5}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
              <p className="ga-text-body-secondary">Today's staff metrics and performance</p>
            </CardHeader>
            <CardContent>
              <div className="ga-grid ga-grid-2 ga-gap-6">
                <div>
                  <h4 className="ga-text-h3 mb-4">On Duty</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Alex Kumar", role: "Barista", orders: 45, rating: 4.9 },
                      { name: "Lisa Chen", role: "Cashier", orders: 38, rating: 4.8 },
                      { name: "Raj Patel", role: "Kitchen", orders: 52, rating: 4.7 }
                    ].map((staff) => (
                      <div key={staff.name} className="ga-flex ga-items-center ga-justify-between ga-p-3 bg-[var(--bg-secondary)] rounded-lg">
                        <div>
                          <p className="ga-text-body font-medium">{staff.name}</p>
                          <p className="ga-text-small text-[var(--text-secondary)]">{staff.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="ga-text-body font-medium">{staff.orders} orders</p>
                          <p className="ga-text-small text-[var(--color-success)]">★ {staff.rating}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="ga-text-h3 mb-4">Performance Metrics</h4>
                  <div className="space-y-4">
                    {[
                      { metric: "Avg Service Time", value: "3.2 min", target: "< 4 min", status: "good" },
                      { metric: "Order Accuracy", value: "98.5%", target: "> 95%", status: "good" },
                      { metric: "Customer Wait Time", value: "2.1 min", target: "< 3 min", status: "good" }
                    ].map((perf) => (
                      <div key={perf.metric} className="ga-flex ga-items-center ga-justify-between">
                        <span className="ga-text-body">{perf.metric}</span>
                        <div className="text-right">
                          <span className="ga-text-body font-medium">{perf.value}</span>
                          <Badge variant="success" className="ml-2">
                            {perf.target}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}