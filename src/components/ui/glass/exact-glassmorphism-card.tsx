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