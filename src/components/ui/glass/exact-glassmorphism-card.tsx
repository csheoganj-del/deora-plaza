"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bookmark, MapPin, Clock, DollarSign, Building2 } from 'lucide-react'

interface ExactGlassmorphismCardProps {
  title: string
  company: string
  timeAgo: string
  jobType: string[]
  salary: string
  location: string
  saved?: boolean
  onSave?: () => void
  onApply?: () => void
  backgroundImage?: string
  companyLogo?: string
}

export function ExactGlassmorphismCard({
  title,
  company,
  timeAgo,
  jobType,
  salary,
  location,
  saved = false,
  onSave,
  onApply,
  backgroundImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
  companyLogo
}: ExactGlassmorphismCardProps) {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[500px] rounded-[32px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
      
      {/* Glass Card Content */}
      <div className="relative h-full p-6 flex flex-col justify-between">
        
        {/* Top Section */}
        <div className="flex items-start justify-between">
          {/* Company Logo */}
          <div className="w-14 h-14 rounded-[18px] bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
            {companyLogo ? (
              <img src={companyLogo} alt={company} className="w-8 h-8 rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
            )}
          </div>
          
          {/* Save Button */}
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium hover:bg-black/30 transition-all duration-300 flex items-center gap-2 shadow-lg"
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
            Saved
          </button>
        </div>

        {/* Middle Section */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Company & Time */}
          <div className="mb-3">
            <div className="text-white/80 text-sm font-medium mb-1">
              {company} <span className="text-white/60">• {timeAgo}</span>
            </div>
          </div>

          {/* Job Title */}
          <h2 className="text-white text-3xl font-bold mb-6 leading-tight">
            {title}
          </h2>

          {/* Job Type Tags */}
          <div className="flex gap-3 mb-8">
            {jobType.map((type, index) => (
              <div
                key={index}
                className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg"
              >
                {type}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div>
          {/* Divider Line */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6" />
          
          <div className="flex items-end justify-between">
            {/* Salary & Location */}
            <div>
              <div className="text-white text-xl font-bold mb-1">{salary}</div>
              <div className="text-white/70 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {location}
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={onApply}
              className="px-6 py-3 rounded-[18px] bg-black/30 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-black/40 transition-all duration-300 shadow-lg hover:scale-105"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// DEORA Plaza specific cards
export function DEORAOrderCard({
  orderId,
  customerName,
  items,
  total,
  status,
  timeAgo,
  unit,
  backgroundImage
}: {
  orderId: string
  customerName: string
  items: number
  total: string
  status: "pending" | "preparing" | "ready" | "completed"
  timeAgo: string
  unit: "restaurant" | "cafe" | "bar" | "hotel" | "garden"
  backgroundImage?: string
}) {
  const unitConfig = {
    restaurant: { name: "Restaurant", bg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop" },
    cafe: { name: "Cafe", bg: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop" },
    bar: { name: "Bar", bg: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop" },
    hotel: { name: "Hotel", bg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop" },
    garden: { name: "Garden", bg: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop" }
  }

  const statusColors = {
    pending: "bg-yellow-500/30 text-yellow-200",
    preparing: "bg-blue-500/30 text-blue-200",
    ready: "bg-green-500/30 text-green-200",
    completed: "bg-gray-500/30 text-gray-200"
  }

  return (
    <ExactGlassmorphismCard
      title={`Order #${orderId.slice(-3)}`}
      company={`DEORA ${unitConfig[unit].name}`}
      timeAgo={timeAgo}
      jobType={[`${items} Items`, status.charAt(0).toUpperCase() + status.slice(1)]}
      salary={total}
      location={customerName}
      backgroundImage={backgroundImage || unitConfig[unit].bg}
      companyLogo="/logo.png"
    />
  )
}

export function DEORABusinessUnitCard({
  unit,
  activeOrders,
  revenue,
  occupancy,
  backgroundImage
}: {
  unit: "restaurant" | "cafe" | "bar" | "hotel" | "garden"
  activeOrders: number
  revenue: string
  occupancy: string
  backgroundImage?: string
}) {
  const unitConfig = {
    restaurant: { 
      name: "Restaurant", 
      description: "Full-Service Dining",
      bg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop" 
    },
    cafe: { 
      name: "Cafe", 
      description: "Quick Service & Takeaway",
      bg: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop" 
    },
    bar: { 
      name: "Bar", 
      description: "Premium Beverages",
      bg: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop" 
    },
    hotel: { 
      name: "Hotel", 
      description: "Room Service & Bookings",
      bg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop" 
    },
    garden: { 
      name: "Garden", 
      description: "Event Space & Catering",
      bg: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop" 
    }
  }

  return (
    <ExactGlassmorphismCard
      title={unitConfig[unit].name}
      company="DEORA Plaza"
      timeAgo="Live"
      jobType={[`${activeOrders} Orders`, occupancy]}
      salary={revenue}
      location={unitConfig[unit].description}
      backgroundImage={backgroundImage || unitConfig[unit].bg}
      companyLogo="/logo.png"
    />
  )
}

// Demo Component
export function ExactGlassmorphismDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Exact Glassmorphism UI</h1>
          <p className="text-white/70 text-lg">Matching your reference design perfectly</p>
        </div>

        {/* Original Style Demo */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Original Job Card Style</h2>
          <div className="flex justify-center">
            <ExactGlassmorphismCard
              title="UI/UX Designer"
              company="Google"
              timeAgo="20 days ago"
              jobType={["Full-Time", "Flexible Schedule"]}
              salary="$150 - $220k"
              location="Mountain View, CA"
              saved={true}
              backgroundImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
            />
          </div>
        </div>

        {/* DEORA Plaza Adaptations */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">DEORA Plaza Business Units</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DEORABusinessUnitCard
              unit="restaurant"
              activeOrders={12}
              revenue="₹25,400"
              occupancy="8/15 Tables"
            />
            <DEORABusinessUnitCard
              unit="cafe"
              activeOrders={8}
              revenue="₹12,800"
              occupancy="3 in Queue"
            />
            <DEORABusinessUnitCard
              unit="bar"
              activeOrders={6}
              revenue="₹18,600"
              occupancy="Peak Hours"
            />
          </div>
        </div>

        {/* Order Cards */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Order Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DEORAOrderCard
              orderId="ORD001"
              customerName="Rajesh Kumar"
              items={3}
              total="₹1,250"
              status="preparing"
              timeAgo="5 min ago"
              unit="restaurant"
            />
            <DEORAOrderCard
              orderId="ORD002"
              customerName="Priya Sharma"
              items={2}
              total="₹850"
              status="ready"
              timeAgo="2 min ago"
              unit="cafe"
            />
          </div>
        </div>
      </div>
    </div>
  )
}