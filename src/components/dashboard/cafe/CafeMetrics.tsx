'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coffee, 
  Users, 
  Clock 
} from 'lucide-react'

export function CafeMetrics() {
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
      trend: 'up', // Down wait time is good
      icon: Clock,
      color: 'text-[#d93025]',
      bgColor: 'bg-[#fce8e6]'
    }
  ]

  return (
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
  )
}