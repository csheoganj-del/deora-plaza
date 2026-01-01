"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/base/card'
import { Button } from '@/components/ui/base/button'
import { Badge } from '@/components/ui/base/badge'
import { Separator } from '@/components/ui/base/separator'
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Settings
} from 'lucide-react'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeCustomers: number
  averageOrderValue: number
  revenueChange: number
  ordersChange: number
  customersChange: number
}

interface RecentOrder {
  id: string
  customer: string
  amount: number
  status: 'completed' | 'pending' | 'cancelled'
  time: string
  businessUnit: string
}

interface AppleGradeDashboardProps {
  stats?: DashboardStats
  recentOrders?: RecentOrder[]
  businessUnit?: string
}

const AppleGradeDashboard: React.FC<AppleGradeDashboardProps> = ({
  stats = {
    totalRevenue: 45280,
    totalOrders: 1247,
    activeCustomers: 892,
    averageOrderValue: 36.32,
    revenueChange: 12.5,
    ordersChange: 8.2,
    customersChange: -2.1
  },
  recentOrders = [
    { id: '1', customer: 'John Doe', amount: 45.50, status: 'completed', time: '2 min ago', businessUnit: 'Restaurant' },
    { id: '2', customer: 'Jane Smith', amount: 28.75, status: 'pending', time: '5 min ago', businessUnit: 'Cafe' },
    { id: '3', customer: 'Mike Johnson', amount: 67.20, status: 'completed', time: '8 min ago', businessUnit: 'Bar' },
    { id: '4', customer: 'Sarah Wilson', amount: 34.90, status: 'cancelled', time: '12 min ago', businessUnit: 'Hotel' },
  ],
  businessUnit = 'All Units'
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatChange = (change: number) => {
    const isPositive = change > 0
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
      }`}>
        <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />
        {Math.abs(change)}%
      </span>
    )
  }

  const getStatusBadge = (status: RecentOrder['status']) => {
    const variants = {
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Completed' },
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle, text: 'Cancelled' }
    }
    
    const config = variants[status]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="inline-flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 apple-page-enter">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="apple-text-display apple-text-gradient mb-2">
              DEORA Plaza Dashboard
            </h1>
            <p className="apple-text-subheading">
              {businessUnit} • {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="default" leftIcon={<Calendar className="w-4 h-4" />}>
              Today
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <Card variant="elevated" animation="enter" className="apple-card-enter-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="apple-text-body text-[var(--text-secondary)]">
                  Total Revenue
                </CardTitle>
                <div className="p-2 rounded-[var(--border-radius-md)] bg-[var(--warm-amber-500)]/10">
                  <DollarSign className="w-4 h-4 text-[var(--warm-amber-600)]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="apple-text-heading font-semibold">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <div className="flex items-center justify-between">
                  {formatChange(stats.revenueChange)}
                  <span className="apple-text-caption">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card variant="elevated" animation="enter" className="apple-card-enter-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="apple-text-body text-[var(--text-secondary)]">
                  Total Orders
                </CardTitle>
                <div className="p-2 rounded-[var(--border-radius-md)] bg-blue-500/10">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="apple-text-heading font-semibold">
                  {stats.totalOrders.toLocaleString()}
                </p>
                <div className="flex items-center justify-between">
                  {formatChange(stats.ordersChange)}
                  <span className="apple-text-caption">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customers Card */}
          <Card variant="elevated" animation="enter" className="apple-card-enter-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="apple-text-body text-[var(--text-secondary)]">
                  Active Customers
                </CardTitle>
                <div className="p-2 rounded-[var(--border-radius-md)] bg-green-500/10">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="apple-text-heading font-semibold">
                  {stats.activeCustomers.toLocaleString()}
                </p>
                <div className="flex items-center justify-between">
                  {formatChange(stats.customersChange)}
                  <span className="apple-text-caption">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AOV Card */}
          <Card variant="elevated" animation="enter" className="apple-card-enter-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="apple-text-body text-[var(--text-secondary)]">
                  Avg Order Value
                </CardTitle>
                <div className="p-2 rounded-[var(--border-radius-md)] bg-purple-500/10">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="apple-text-heading font-semibold">
                  {formatCurrency(stats.averageOrderValue)}
                </p>
                <div className="flex items-center justify-between">
                  {formatChange(5.8)}
                  <span className="apple-text-caption">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card variant="default" size="lg" className="lg:col-span-2 apple-card-enter-5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="apple-text-heading">Recent Orders</CardTitle>
                  <CardDescription className="apple-text-caption mt-1">
                    Latest transactions across all business units
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div key={order.id} className="apple-interactive">
                    <div className="flex items-center justify-between p-4 rounded-[var(--border-radius-lg)] bg-white/4 hover:bg-white/8 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--warm-amber-500)] to-[var(--warm-amber-600)] flex items-center justify-center text-white font-semibold text-sm">
                          {order.customer.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="apple-text-body font-medium">{order.customer}</p>
                          <p className="apple-text-caption text-[var(--text-muted)]">
                            {order.businessUnit} • {order.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="apple-text-body font-semibold">
                            {formatCurrency(order.amount)}
                          </p>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                    {index < recentOrders.length - 1 && (
                      <Separator className="my-4 bg-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="default" size="lg" className="apple-card-enter-6">
            <CardHeader>
              <CardTitle className="apple-text-heading">Quick Actions</CardTitle>
              <CardDescription className="apple-text-caption">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="default" 
                  size="default" 
                  className="w-full justify-start"
                  leftIcon={<ShoppingCart className="w-4 h-4" />}
                >
                  New Order
                </Button>
                <Button 
                  variant="secondary" 
                  size="default" 
                  className="w-full justify-start"
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  Add Customer
                </Button>
                <Button 
                  variant="secondary" 
                  size="default" 
                  className="w-full justify-start"
                  leftIcon={<BarChart3 className="w-4 h-4" />}
                >
                  View Reports
                </Button>
                <Button 
                  variant="secondary" 
                  size="default" 
                  className="w-full justify-start"
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  Settings
                </Button>
              </div>
              
              <Separator className="my-6 bg-white/10" />
              
              <div className="space-y-4">
                <div className="p-4 rounded-[var(--border-radius-lg)] bg-gradient-to-br from-[var(--warm-amber-500)]/10 to-[var(--warm-amber-600)]/5 border border-[var(--warm-amber-500)]/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-[var(--border-radius-sm)] bg-[var(--warm-amber-500)]/20">
                      <TrendingUp className="w-4 h-4 text-[var(--warm-amber-600)]" />
                    </div>
                    <div>
                      <p className="apple-text-body font-medium mb-1">Revenue Goal</p>
                      <p className="apple-text-caption text-[var(--text-muted)] mb-2">
                        ₹45,280 of ₹50,000 target
                      </p>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[var(--warm-amber-500)] to-[var(--warm-amber-600)] h-2 rounded-full transition-all duration-500"
                          style={{ width: '90.6%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AppleGradeDashboard