'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, TrendingDown } from 'lucide-react'

export function InventoryStatus() {
  const inventory = [
    {
      item: 'Coffee Beans',
      current: 12,
      unit: 'kg',
      status: 'low',
      threshold: 15
    },
    {
      item: 'Milk',
      current: 8,
      unit: 'L',
      status: 'critical',
      threshold: 10
    },
    {
      item: 'Sugar',
      current: 25,
      unit: 'kg',
      status: 'good',
      threshold: 20
    },
    {
      item: 'Croissants',
      current: 5,
      unit: 'pcs',
      status: 'critical',
      threshold: 20
    },
    {
      item: 'Paper Cups',
      current: 150,
      unit: 'pcs',
      status: 'good',
      threshold: 100
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-[#fce8e6] text-[#d93025] border-[#ea4335]'
      case 'low': return 'bg-[#fef7cd] text-[#b45309] border-[#fbbf24]'
      case 'good': return 'bg-[#e6f4ea] text-[#137333] border-[#34a853]'
      default: return 'bg-[#f8f9fa] text-[#5f6368] border-[#dadce0]'
    }
  }

  const criticalItems = inventory.filter(item => item.status === 'critical').length
  const lowItems = inventory.filter(item => item.status === 'low').length

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Inventory Status</CardTitle>
          {(criticalItems > 0 || lowItems > 0) && (
            <Badge className="bg-red-100 text-red-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {criticalItems + lowItems} alerts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {inventory.slice(0, 4).map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.item}</p>
                <p className="text-xs text-gray-500">
                  {item.current} {item.unit} remaining
                </p>
              </div>
            </div>
            <Badge className={`text-xs border ${getStatusColor(item.status)}`}>
              {item.status}
            </Badge>
          </div>
        ))}
        
        <div className="pt-3 border-t border-gray-200">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-gray-200 hover:bg-gray-50"
          >
            <TrendingDown className="h-4 w-4 mr-2 text-gray-600" />
            <span className="text-gray-700">View All Inventory</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}