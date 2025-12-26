"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bookmark, MapPin, Clock, DollarSign } from 'lucide-react'

interface GlassmorphismCardProps {
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
}

export function GlassmorphismCard({
  title,
  company,
  timeAgo,
  jobType,
  salary,
  location,
  saved = false,
  onSave,
  onApply,
  backgroundImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
}: GlassmorphismCardProps) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 rounded-3xl bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 rounded-3xl bg-black/40 backdrop-blur-sm" />
      
      {/* Glass Card */}
      <div className="relative p-6 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Company Logo */}
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
          </div>
          
          {/* Save Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            className="h-10 px-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white"
          >
            <Bookmark className={`w-4 h-4 mr-2 ${saved ? 'fill-current' : ''}`} />
            Saved
          </Button>
        </div>

        {/* Company & Time */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
            <span className="font-medium">{company}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Job Title */}
        <h2 className="text-2xl font-bold text-white mb-6 leading-tight">
          {title}
        </h2>

        {/* Job Type Tags */}
        <div className="flex gap-2 mb-8">
          {jobType.map((type, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/25 transition-all duration-300"
            >
              {type}
            </Badge>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6" />

        {/* Bottom Section */}
        <div className="flex items-center justify-between">
          {/* Salary & Location */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold text-lg">{salary}</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={onApply}
            className="px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-medium transition-all duration-300 hover:scale-105"
          >
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  )
}

// Sample usage component
export function GlassmorphismCardDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Job Card Sample */}
        <GlassmorphismCard
          title="UI/UX Designer"
          company="Google"
          timeAgo="20 days ago"
          jobType={["Full-Time", "Flexible Schedule"]}
          salary="$150 - $220k"
          location="Mountain View, CA"
          saved={true}
          backgroundImage="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
        />

        {/* Restaurant Order Card */}
        <GlassmorphismCard
          title="Table Order #001"
          company="DEORA Plaza"
          timeAgo="2 minutes ago"
          jobType={["Dine-In", "Table 5"]}
          salary="₹1,250"
          location="Restaurant Floor"
          saved={false}
          backgroundImage="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop"
        />

        {/* Hotel Booking Card */}
        <GlassmorphismCard
          title="Deluxe Room Booking"
          company="DEORA Hotel"
          timeAgo="1 hour ago"
          jobType={["3 Nights", "Premium"]}
          salary="₹15,000"
          location="Room 101"
          saved={true}
          backgroundImage="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop"
        />
      </div>
    </div>
  )
}