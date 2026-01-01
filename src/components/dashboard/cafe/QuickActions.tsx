'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  QrCode, 
  FileText, 
  Settings, 
  Users, 
  Package,
  BarChart3,
  Bell
} from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      label: 'New Order',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => console.log('New order')
    },
    {
      label: 'QR Menu',
      icon: QrCode,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => console.log('QR menu')
    },
    {
      label: 'Daily Report',
      icon: FileText,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => console.log('Daily report')
    },
    {
      label: 'Staff',
      icon: Users,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => console.log('Staff management')
    },
    {
      label: 'Inventory',
      icon: Package,
      color: 'bg-teal-600 hover:bg-teal-700',
      action: () => console.log('Inventory')
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => console.log('Analytics')
    }
  ]

  return (
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
                onClick={action.action}
                className="h-20 flex flex-col items-center justify-center gap-2 border border-[#dadce0] rounded-lg hover:bg-[#f8f9fa] hover:border-[#1a73e8] transition-colors"
              >
                <Icon className="h-5 w-5 text-[#5f6368]" />
                <span className="text-[12px] font-medium text-[#202124]">{action.label}</span>
              </button>
            )
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-[#e0e0e0]">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#dadce0] rounded-lg hover:bg-[#f8f9fa] hover:border-[#1a73e8] transition-colors">
            <Settings className="h-4 w-4 text-[#5f6368]" />
            <span className="text-[14px] font-medium text-[#202124]">Cafe Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}