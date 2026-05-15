'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Clock
} from 'lucide-react'

export function RecentActivity() {
  const activities = [
    {
      type: 'order',
      title: 'New order received',
      description: 'Order #ORD-005 from Neha Gupta',
      time: '2 min ago',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      type: 'payment',
      title: 'Payment completed',
      description: '₹420 received for Order #ORD-002',
      time: '5 min ago',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: 'inventory',
      title: 'Low stock alert',
      description: 'Coffee beans running low (12kg remaining)',
      time: '8 min ago',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      type: 'order',
      title: 'Order completed',
      description: 'Order #ORD-001 ready for pickup',
      time: '12 min ago',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: 'staff',
      title: 'Staff check-in',
      description: 'Priya Singh started shift',
      time: '15 min ago',
      icon: User,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      type: 'order',
      title: 'Order cancelled',
      description: 'Order #ORD-003 cancelled by customer',
      time: '18 min ago',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all activity
          </button>
        </div>
      </CardContent>
    </Card>
  )
}