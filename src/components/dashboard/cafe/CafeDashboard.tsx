'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Coffee, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Package,
  DollarSign,
  BarChart3,
  Filter,
  Search,
  Plus,
  RefreshCw
} from 'lucide-react'
import { CafeMetrics } from './CafeMetrics'
import { ActiveOrders } from './ActiveOrders'
import { QuickActions } from './QuickActions'
import { InventoryStatus } from './InventoryStatus'
import { StaffOverview } from './StaffOverview'
import { RecentActivity } from './RecentActivity'

export function CafeDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Top App Bar - Google Style */}
      <div className="bg-white border-b border-[#e0e0e0] px-6 py-4">
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
      </div>

      {/* Main Content */}
      <div className="p-6 bg-[#f8f9fa]">
        {/* Status Bar */}
        <div className="mb-8 p-4 bg-white rounded-lg border border-[#e0e0e0] shadow-sm">
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
        <div className="mb-8">
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
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <CafeMetrics />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <ActiveOrders />
                <RecentActivity />
              </div>
              <div className="space-y-8">
                <QuickActions />
                <InventoryStatus />
                <StaffOverview />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm">
            <div className="p-6 border-b border-[#e0e0e0]">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[#202124]">Order Management</h2>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-[14px] font-medium text-[#5f6368] border border-[#dadce0] rounded-md hover:bg-[#f8f9fa] transition-colors">
                    <Filter className="h-4 w-4 mr-2 inline" />
                    Filter
                  </button>
                  <button className="px-4 py-2 text-[14px] font-medium text-[#5f6368] border border-[#dadce0] rounded-md hover:bg-[#f8f9fa] transition-colors">
                    <Search className="h-4 w-4 mr-2 inline" />
                    Search
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-[#5f6368]">
                <Coffee className="h-12 w-12 mx-auto mb-4 text-[#9aa0a6]" />
                <p className="text-[14px]">Order management interface will be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm">
            <div className="p-6 border-b border-[#e0e0e0]">
              <h2 className="text-[16px] font-semibold text-[#202124]">Inventory Management</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-[#5f6368]">
                <Package className="h-12 w-12 mx-auto mb-4 text-[#9aa0a6]" />
                <p className="text-[14px]">Inventory management interface will be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm">
            <div className="p-6 border-b border-[#e0e0e0]">
              <h2 className="text-[16px] font-semibold text-[#202124]">Reports & Analytics</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-[#5f6368]">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[#9aa0a6]" />
                <p className="text-[14px]">Reports and analytics interface will be implemented here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}