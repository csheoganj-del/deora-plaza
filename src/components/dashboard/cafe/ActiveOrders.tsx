'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, User, MapPin } from 'lucide-react'

export function ActiveOrders() {
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
    },
    {
      id: 'ORD-004',
      customer: 'Sarah Johnson',
      items: ['Mocha', 'Bagel', 'Juice'],
      total: '₹380',
      status: 'preparing',
      time: '8 min ago',
      type: 'dine-in',
      priority: 'urgent'
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

  return (
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
  )
}