'use client'

import { useState } from 'react'
import { 
  Coffee, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Clock, 
  DollarSign,
  Plus,
  RefreshCw,
  Filter,
  Search,
  Package,
  BarChart3,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Settings,
  QrCode,
  FileText,
  Bell,
  Zap,
  Trophy
} from 'lucide-react'

export function MaterialCafeDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  // KPI Metrics Data
  const metrics = [
    {
      title: 'Total Revenue',
      value: '₹12,450',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-[#1e8e3e]',
      bgColor: 'bg-[#e8f5e8]'
    },
    {
      title: 'Orders Completed',
      value: '89',
      change: '+8.2%',
      trend: 'up',
      icon: Coffee,
      color: 'text-[#1a73e8]',
      bgColor: 'bg-[#e8f0fe]'
    },
    {
      title: 'Active Customers',
      value: '23',
      change: '-2.1%',
      trend: 'down',
      icon: Users,
      color: 'text-[#f9ab00]',
      bgColor: 'bg-[#fef7e0]'
    },
    {
      title: 'Avg. Wait Time',
      value: '8 min',
      change: '-15.3%',
      trend: 'up',
      icon: Clock,
      color: 'text-[#d93025]',
      bgColor: 'bg-[#fce8e6]'
    }
  ]

  // Active Orders Data
  const orders = [
    {
      id: 'ORD-001',
      customer: 'Rahul Sharma',
      items: ['Cappuccino', 'Croissant', 'Americano'],
      total: '₹340',
      status: 'preparing',
      time: '5 min ago',
      type: 'takeaway',
      priority: 'normal'
    },
    {
      id: 'ORD-002',
      customer: 'Priya Patel',
      items: ['Latte', 'Sandwich', 'Cookie'],
      total: '₹420',
      status: 'ready',
      time: '2 min ago',
      type: 'dine-in',
      priority: 'high'
    },
    {
      id: 'ORD-003',
      customer: 'Amit Kumar',
      items: ['Espresso', 'Muffin'],
      total: '₹180',
      status: 'pending',
      time: '1 min ago',
      type: 'takeaway',
      priority: 'normal'
    }
  ]

  // Quick Actions Data
  const actions = [
    { label: 'New Order', icon: Plus },
    { label: 'QR Menu', icon: QrCode },
    { label: 'Daily Report', icon: FileText },
    { label: 'Staff', icon: Users },
    { label: 'Inventory', icon: Package },
    { label: 'Analytics', icon: BarChart3 }
  ]

  // Inventory Data
  const inventory = [
    { item: 'Coffee Beans', current: 12, unit: 'kg', status: 'low' },
    { item: 'Milk', current: 8, unit: 'L', status: 'critical' },
    { item: 'Sugar', current: 25, unit: 'kg', status: 'good' },
    { item: 'Croissants', current: 5, unit: 'pcs', status: 'critical' }
  ]

  // Staff Data
  const staff = [
    { name: 'Rajesh Kumar', role: 'Barista', status: 'active', shift: '9:00 AM - 5:00 PM', avatar: 'RK' },
    { name: 'Priya Singh', role: 'Cashier', status: 'active', shift: '10:00 AM - 6:00 PM', avatar: 'PS' },
    { name: 'Amit Patel', role: 'Kitchen', status: 'break', shift: '8:00 AM - 4:00 PM', avatar: 'AP' },
    { name: 'Sarah Wilson', role: 'Manager', status: 'active', shift: '9:00 AM - 7:00 PM', avatar: 'SW' }
  ]

  // Recent Activity Data
  const activities = [
    {
      type: 'order',
      title: 'New order received',
      description: 'Order #ORD-005 from Neha Gupta',
      time: '2 min ago',
      icon: Coffee,
      color: 'text-[#1a73e8]',
      bgColor: 'bg-[#e8f0fe]'
    },
    {
      type: 'payment',
      title: 'Payment completed',
      description: '₹420 received for Order #ORD-002',
      time: '5 min ago',
      icon: DollarSign,
      color: 'text-[#1e8e3e]',
      bgColor: 'bg-[#e8f5e8]'
    },
    {
      type: 'inventory',
      title: 'Low stock alert',
      description: 'Coffee beans running low (12kg remaining)',
      time: '8 min ago',
      icon: AlertTriangle,
      color: 'text-[#f9ab00]',
      bgColor: 'bg-[#fef7e0]'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#fef7e0] text-[#b45309] border-[#f9ab00]'
      case 'preparing': return 'bg-[#e8f0fe] text-[#1a73e8] border-[#4285f4]'
      case 'ready': return 'bg-[#e8f5e8] text-[#1e8e3e] border-[#34a853]'
      default: return 'bg-[#f8f9fa] text-[#5f6368] border-[#e0e0e0]'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-[#fce8e6] text-[#d93025]'
      case 'high': return 'bg-[#fef7e0] text-[#b45309]'
      default: return 'bg-[#f8f9fa] text-[#5f6368]'
    }
  }

  const getInventoryStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-[#fce8e6] text-[#d93025] border-[#ea4335]'
      case 'low': return 'bg-[#fef7e0] text-[#b45309] border-[#f9ab00]'
      case 'good': return 'bg-[#e8f5e8] text-[#1e8e3e] border-[#34a853]'
      default: return 'bg-[#f8f9fa] text-[#5f6368] border-[#e0e0e0]'
    }
  }

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#e8f5e8] text-[#1e8e3e]'
      case 'break': return 'bg-[#fef7e0] text-[#b45309]'
      case 'offline': return 'bg-[#f8f9fa] text-[#5f6368]'
      default: return 'bg-[#f8f9fa] text-[#5f6368]'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top App Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#202124] leading-7">Cafe Management</h1>
          <p className="text-[12px] text-[#5f6368] mt-1">DEORA Plaza - Cafe Operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-[14px] font-medium text-[#1a73e8] border border-[#dadce0] rounded-md hover:bg-[#f8f9fa] hover:border-[#1a73e8] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="px-4 py-2 text-[14px] font-medium text-white bg-[#1a73e8] rounded-md hover:bg-[#1557b0] transition-colors">
            <Plus className="h-4 w-4 mr-2 inline" />
            New Order
          </button>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="p-4 bg-white rounded-lg border border-[#e0e0e0] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#1e8e3e] rounded-full"></div>
            <span className="text-[14px] font-medium text-[#202124]">System Online</span>
          </div>
          <div className="h-4 w-px bg-[#e0e0e0]"></div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#5f6368]" />
            <span className="text-[14px] text-[#5f6368]">Last sync: 2 min ago</span>
          </div>
          <div className="h-4 w-px bg-[#e0e0e0]"></div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#5f6368]" />
            <span className="text-[14px] text-[#5f6368]">4 staff active</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-[#e0e0e0] rounded-lg shadow-sm">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'overview' 
                ? 'text-[#1a73e8] border-[#1a73e8] bg-[#f8f9fa]' 
                : 'text-[#5f6368] border-transparent hover:text-[#202124] hover:bg-[#f8f9fa]'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-6 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'orders' 
                ? 'text-[#1a73e8] border-[#1a73e8] bg-[#f8f9fa]' 
                : 'text-[#5f6368] border-transparent hover:text-[#202124] hover:bg-[#f8f9fa]'
            }`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 px-6 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'inventory' 
                ? 'text-[#1a73e8] border-[#1a73e8] bg-[#f8f9fa]' 
                : 'text-[#5f6368] border-transparent hover:text-[#202124] hover:bg-[#f8f9fa]'
            }`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-1 px-6 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'reports' 
                ? 'text-[#1a73e8] border-[#1a73e8] bg-[#f8f9fa]' 
                : 'text-[#5f6368] border-transparent hover:text-[#202124] hover:bg-[#f8f9fa]'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              const isPositive = metric.trend === 'up'
              
              return (
                <div key={index} className="bg-white border border-[#e0e0e0] rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <p className="text-[12px] font-medium text-[#5f6368] uppercase tracking-wide">{metric.title}</p>
                      <p className="text-[28px] font-semibold text-[#202124] leading-none">{metric.value}</p>
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3 text-[#1e8e3e]" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-[#d93025]" />
                        )}
                        <span className={`text-[12px] font-medium ${
                          isPositive ? 'text-[#1e8e3e]' : 'text-[#d93025]'
                        }`}>
                          {metric.change}
                        </span>
                        <span className="text-[12px] text-[#5f6368]">vs yesterday</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <Icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Active Orders */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-[#e0e0e0] rounded-lg shadow-sm">
                <div className="p-6 border-b border-[#e0e0e0]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold text-[#202124]">Active Orders</h2>
                    <div className="px-3 py-1 bg-[#e8f0fe] text-[#1a73e8] text-[12px] font-medium rounded-full border border-[#4285f4]">
                      {orders.length} active
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-4 border border-[#e0e0e0] rounded-lg hover:bg-[#f8f9fa] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[14px] font-semibold text-[#202124]">{order.id}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-3 w-3 text-[#5f6368]" />
                              <span className="text-[12px] text-[#5f6368]">{order.customer}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.priority !== 'normal' && (
                            <div className={`px-2 py-1 text-[10px] font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                              {order.priority.toUpperCase()}
                            </div>
                          )}
                          <div className={`px-2 py-1 text-[10px] font-medium rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-[#5f6368]" />
                          <span className="text-[12px] text-[#5f6368] capitalize">{order.type}</span>
                        </div>
                        <div className="text-[12px] text-[#5f6368]">
                          Items: {order.items.join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[12px] text-[#5f6368]">
                          <Clock className="h-3 w-3" />
                          {order.time}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-semibold text-[#202124]">{order.total}</span>
                          {order.status === 'ready' ? (
                            <button className="px-4 py-2 text-[12px] font-medium text-white bg-[#1e8e3e] rounded-md hover:bg-[#137333] transition-colors">
                              Complete
                            </button>
                          ) : (
                            <button className="px-4 py-2 text-[12px] font-medium text-[#1a73e8] border border-[#dadce0] rounded-md hover:bg-[#f8f9fa] transition-colors">
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white border border-[#e0e0e0] rounded-lg shadow-sm">
                <div className="p-6 border-b border-[#e0e0e0]">
                  <h2 className="text-[16px] font-semibold text-[#202124]">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {actions.map((action, index) => {
                      const Icon = action.icon
                      return (
                        <button
                          key={index}
                          className="h-20 flex flex-col items-center justify-center gap-2 border border-[#dadce0] rounded-lg hover:bg-[#f8f9fa] hover:border-[#1a73e8] transition-colors"
                        >
                          <Icon className="h-5 w-5 text-[#5f6368]" />
                          <span className="text-[12px] font-medium text-[#202124]">{action.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Inventory Status */}
              <div className="bg-white border border-[#e0e0e0] rounded-lg shadow-sm">
                <div className="p-6 border-b border-[#e0e0e0]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold text-[#202124]">Inventory Status</h2>
                    <div className="px-3 py-1 bg-[#fce8e6] text-[#d93025] text-[12px] font-medium rounded-full border border-[#ea4335]">
                      <AlertTriangle className="h-3 w-3 mr-1 inline" />
                      2 alerts
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {inventory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-[#e0e0e0] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-[#5f6368]" />
                        <div>
                          <p className="text-[14px] font-medium text-[#202124]">{item.item}</p>
                          <p className="text-[12px] text-[#5f6368]">
                            {item.current} {item.unit} remaining
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-[10px] font-medium rounded-full border ${getInventoryStatusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Overview */}
              <div className="bg-white border border-[#e0e0e0] rounded-lg shadow-sm">
                <div className="p-6 border-b border-[#e0e0e0]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-semibold text-[#202124]">Staff Overview</h2>
                    <div className="px-3 py-1 bg-[#e8f0fe] text-[#1a73e8] text-[12px] font-medium rounded-full border border-[#4285f4]">
                      3/4 active
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {staff.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-[#e0e0e0] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#f8f9fa] rounded-full flex items-center justify-center border border-[#e0e0e0]">
                          <span className="text-[12px] font-medium text-[#5f6368]">{member.avatar}</span>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-[#202124]">{member.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[12px] text-[#5f6368]">{member.role}</span>
                            <span className="text-[12px] text-[#9aa0a6]">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#5f6368]" />
                              <span className="text-[12px] text-[#5f6368]">{member.shift}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-[10px] font-medium rounded-full ${getStaffStatusColor(member.status)}`}>
                        {member.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tab Contents */}
      {activeTab !== 'overview' && (
        <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm">
          <div className="p-6 border-b border-[#e0e0e0]">
            <h2 className="text-[16px] font-semibold text-[#202124]">
              {activeTab === 'orders' && 'Order Management'}
              {activeTab === 'inventory' && 'Inventory Management'}
              {activeTab === 'reports' && 'Reports & Analytics'}
            </h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12 text-[#5f6368]">
              {activeTab === 'orders' && <Coffee className="h-12 w-12 mx-auto mb-4 text-[#9aa0a6]" />}
              {activeTab === 'inventory' && <Package className="h-12 w-12 mx-auto mb-4 text-[#9aa0a6]" />}
              {activeTab === 'reports' && <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[#9aa0a6]" />}
              <p className="text-[14px]">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} interface will be implemented here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}