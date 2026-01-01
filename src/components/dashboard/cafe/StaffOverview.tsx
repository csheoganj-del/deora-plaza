'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Clock, User } from 'lucide-react'

export function StaffOverview() {
  const staff = [
    {
      name: 'Rajesh Kumar',
      role: 'Barista',
      status: 'active',
      shift: '9:00 AM - 5:00 PM',
      avatar: 'RK'
    },
    {
      name: 'Priya Singh',
      role: 'Cashier',
      status: 'active',
      shift: '10:00 AM - 6:00 PM',
      avatar: 'PS'
    },
    {
      name: 'Amit Patel',
      role: 'Kitchen',
      status: 'break',
      shift: '8:00 AM - 4:00 PM',
      avatar: 'AP'
    },
    {
      name: 'Sarah Wilson',
      role: 'Manager',
      status: 'active',
      shift: '9:00 AM - 7:00 PM',
      avatar: 'SW'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'break': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activeStaff = staff.filter(member => member.status === 'active').length

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Staff Overview</CardTitle>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            {activeStaff}/{staff.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {staff.map((member, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{member.role}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{member.shift}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge className={`text-xs ${getStatusColor(member.status)}`}>
              {member.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}