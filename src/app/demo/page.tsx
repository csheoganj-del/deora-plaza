"use client"

import React from 'react'
import { Bookmark, MapPin } from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8 flex items-center justify-center">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🌟 DEORA Plaza Glassmorphism UI Demo</h1>
          <p className="text-white/70 text-lg">Exact match to your reference design</p>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Original Job Card Style */}
          <div className="relative w-full max-w-sm mx-auto h-[500px] rounded-[32px] overflow-hidden">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop)` }}
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
            
            {/* Glass Card Content */}
            <div className="relative h-full p-6 flex flex-col justify-between">
              
              {/* Top Section */}
              <div className="flex items-start justify-between">
                {/* Company Logo */}
                <div className="w-14 h-14 rounded-[18px] bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                </div>
                
                {/* Save Button */}
                <button className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium hover:bg-black/30 transition-all duration-300 flex items-center gap-2 shadow-lg">
                  <Bookmark className="w-4 h-4 fill-white" />
                  Saved
                </button>
              </div>

              {/* Middle Section */}
              <div className="flex-1 flex flex-col justify-center">
                {/* Company & Time */}
                <div className="mb-3">
                  <div className="text-white/80 text-sm font-medium mb-1">
                    Google <span className="text-white/60">• 20 days ago</span>
                  </div>
                </div>

                {/* Job Title */}
                <h2 className="text-white text-3xl font-bold mb-6 leading-tight">
                  UI/UX Designer
                </h2>

                {/* Job Type Tags */}
                <div className="flex gap-3 mb-8">
                  <div className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg">
                    Full-Time
                  </div>
                  <div className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg">
                    Flexible Schedule
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div>
                {/* Divider Line */}
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6" />
                
                <div className="flex items-end justify-between">
                  {/* Salary & Location */}
                  <div>
                    <div className="text-white text-xl font-bold mb-1">$150 - $220k</div>
                    <div className="text-white/70 text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Mountain View, CA
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button className="px-6 py-3 rounded-[18px] bg-black/30 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-black/40 transition-all duration-300 shadow-lg hover:scale-105">
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DEORA Restaurant Card */}
          <div className="relative w-full max-w-sm mx-auto h-[500px] rounded-[32px] overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
            
            <div className="relative h-full p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-[18px] bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">D</span>
                  </div>
                </div>
                
                <button className="px-4 py-2 rounded-[16px] bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-200 text-sm font-medium shadow-lg">
                  Active
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-3">
                  <div className="text-white/80 text-sm font-medium mb-1">
                    DEORA Plaza <span className="text-white/60">• Live</span>
                  </div>
                </div>

                <h2 className="text-white text-3xl font-bold mb-6 leading-tight">
                  Restaurant
                </h2>

                <div className="flex gap-3 mb-8">
                  <div className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg">
                    12 Orders
                  </div>
                  <div className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg">
                    8/15 Tables
                  </div>
                </div>
              </div>

              <div>
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6" />
                
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-white text-xl font-bold mb-1">₹25,400</div>
                    <div className="text-white/70 text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Today's Revenue
                    </div>
                  </div>

                  <button className="px-6 py-3 rounded-[18px] bg-black/30 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-black/40 transition-all duration-300 shadow-lg hover:scale-105">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DEORA Order Card */}
          <div className="relative w-full max-w-sm mx-auto h-[500px] rounded-[32px] overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105"
              style={{ backgroundImage: `url(https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
            
            <div className="relative h-full p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-[18px] bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">#01</span>
                </div>
                
                <button className="px-4 py-2 rounded-[16px] bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-200 text-sm font-medium shadow-lg">
                  Preparing
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-3">
                  <div className="text-white/80 text-sm font-medium mb-1">
                    Order #001 <span className="text-white/60">• 5 min ago</span>
                  </div>
                </div>

                <h2 className="text-white text-3xl font-bold mb-6 leading-tight">
                  Rajesh Kumar
                </h2>

                <div className="flex gap-3 mb-8">
                  <div className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg">
                    3 Items
                  </div>
                  <div className="px-4 py-2 rounded-[16px] bg-black/20 backdrop-blur-md border border-white/10 text-white text-sm font-medium shadow-lg">
                    Table 5
                  </div>
                </div>
              </div>

              <div>
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6" />
                
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-white text-xl font-bold mb-1">₹1,250</div>
                    <div className="text-white/70 text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Restaurant Floor
                    </div>
                  </div>

                  <button className="px-6 py-3 rounded-[18px] bg-black/30 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-black/40 transition-all duration-300 shadow-lg hover:scale-105">
                    View Order
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-white/60 text-sm">
            ✨ This is the exact glassmorphism style from your reference image ✨
          </p>
          <p className="text-white/40 text-xs mt-2">
            Ready to implement across your entire DEORA Plaza system!
          </p>
        </div>
      </div>
    </div>
  )
}