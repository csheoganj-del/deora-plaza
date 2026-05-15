"use client"

import { useState } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/hybrid/card"
import { Button } from "@/components/ui/hybrid/button"
import { Badge } from "@/components/ui/hybrid/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/hybrid/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/hybrid/table"

// Mock data for demonstration
const metrics = [
  {
    title: "Total Revenue",
    value: "₹45,231",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "success"
  },
  {
    title: "Active Orders",
    value: "23",
    change: "+3",
    trend: "up", 
    icon: ShoppingCart,
    color: "primary"
  },
  {
    title: "Customers Today",
    value: "156",
    change: "-2.3%",
    trend: "down",
    icon: Users,
    color: "warning"
  },
  {
    title: "Inventory Items",
    value: "1,234",
    change: "+5.2%",
    trend: "up",
    icon: Package,
    color: "secondary"
  }
]

const recentOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    items: 3,
    total: "₹850",
    status: "completed",
    time: "2 min ago"
  },
  {
    id: "ORD-002", 
    customer: "Jane Smith",
    items: 2,
    total: "₹650",
    status: "preparing",
    time: "5 min ago"
  },
  {
    id: "ORD-003",
    customer: "Mike Johnson",
    items: 4,
    total: "₹1,200",
    status: "pending",
    time: "8 min ago"
  },
  {
    id: "ORD-004",
    customer: "Sarah Wilson",
    items: 1,
    total: "₹300",
    status: "cancelled",
    time: "12 min ago"
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />
    case "preparing":
      return <Clock className="w-4 h-4" />
    case "pending":
      return <AlertCircle className="w-4 h-4" />
    case "cancelled":
      return <XCircle className="w-4 h-4" />
    default:
      return null
  }
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "success"
    case "preparing":
      return "default"
    case "pending":
      return "warning"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

export default function HybridOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState("today")

  return (
    <div className="ga-p-6 space-y-6">
      {/* Page Header */}
      <div className="ga-flex ga-items-center ga-justify-between">
        <div>
          <h1 className="ga-text-display text-[var(--text-primary)]">
            Dashboard Overview
          </h1>
          <p className="ga-text-body-secondary mt-1">
            Welcome back! Here's what's happening at your restaurant today.
          </p>
        </div>
        
        <div className="ga-flex ga-items-center ga-gap-3">
          <Button variant="secondary">
            Export Report
          </Button>
          <Button>
            New Order
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="ga-grid ga-grid-4 ga-gap-6">
        {metrics.map((metric, index) => {
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
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-[var(--color-success)]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[var(--color-error)]" />
                      )}
                      <span className={`ga-text-small font-medium ${
                        isPositive ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
                      }`}>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
          <TabsTrigger value="staff">Staff Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="ga-flex ga-items-center ga-justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <p className="ga-text-body-secondary mt-1">
                    Latest orders from all departments
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  View All Orders
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.items} items</TableCell>
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
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="ga-grid ga-grid-2 ga-gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Analytics</CardTitle>
                <p className="ga-text-body-secondary">Revenue trends over time</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 ga-flex ga-items-center justify-center bg-[var(--bg-secondary)] rounded-lg">
                  <p className="ga-text-body-secondary">Chart placeholder</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Popular Items</CardTitle>
                <p className="ga-text-body-secondary">Most ordered menu items</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Butter Chicken", "Biryani", "Paneer Tikka", "Dal Makhani"].map((item, index) => (
                    <div key={item} className="ga-flex ga-items-center ga-justify-between">
                      <span className="ga-text-body">{item}</span>
                      <Badge variant="secondary">{45 - index * 8} orders</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <p className="ga-text-body-secondary">Current stock levels across all departments</p>
            </CardHeader>
            <CardContent>
              <div className="ga-grid ga-grid-3 ga-gap-4">
                {[
                  { name: "Tomatoes", stock: 85, status: "good" },
                  { name: "Chicken", stock: 23, status: "low" },
                  { name: "Rice", stock: 67, status: "good" },
                  { name: "Onions", stock: 12, status: "critical" },
                  { name: "Paneer", stock: 45, status: "good" },
                  { name: "Oil", stock: 8, status: "critical" }
                ].map((item) => (
                  <div key={item.name} className="ga-p-4 border border-[var(--border-primary)] rounded-lg">
                    <div className="ga-flex ga-items-center ga-justify-between mb-2">
                      <span className="ga-text-body font-medium">{item.name}</span>
                      <Badge 
                        variant={
                          item.status === "good" ? "success" : 
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
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Overview</CardTitle>
              <p className="ga-text-body-secondary">Current staff status and performance</p>
            </CardHeader>
            <CardContent>
              <div className="ga-grid ga-grid-2 ga-gap-6">
                <div>
                  <h4 className="ga-text-h3 mb-4">On Duty</h4>
                  <div className="space-y-3">
                    {[
                      { name: "Raj Kumar", role: "Head Chef", status: "active" },
                      { name: "Priya Sharma", role: "Waiter", status: "active" },
                      { name: "Amit Singh", role: "Bartender", status: "break" }
                    ].map((staff) => (
                      <div key={staff.name} className="ga-flex ga-items-center ga-justify-between ga-p-3 bg-[var(--bg-secondary)] rounded-lg">
                        <div>
                          <p className="ga-text-body font-medium">{staff.name}</p>
                          <p className="ga-text-small text-[var(--text-secondary)]">{staff.role}</p>
                        </div>
                        <Badge variant={staff.status === "active" ? "success" : "warning"}>
                          {staff.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="ga-text-h3 mb-4">Performance Today</h4>
                  <div className="space-y-3">
                    {[
                      { metric: "Orders Served", value: "45", target: "50" },
                      { metric: "Avg Service Time", value: "12 min", target: "15 min" },
                      { metric: "Customer Rating", value: "4.8", target: "4.5" }
                    ].map((perf) => (
                      <div key={perf.metric} className="ga-flex ga-items-center ga-justify-between">
                        <span className="ga-text-body">{perf.metric}</span>
                        <div className="text-right">
                          <span className="ga-text-body font-medium">{perf.value}</span>
                          <span className="ga-text-small text-[var(--text-secondary)] ml-2">/ {perf.target}</span>
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