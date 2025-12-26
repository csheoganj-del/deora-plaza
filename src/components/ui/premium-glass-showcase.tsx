"use client";

import { useState } from 'react';
import { usePremiumGlassEffects } from '@/hooks/usePremiumGlassEffects';
import {
  IndianRupee,
  Users,
  Calendar,
  ShoppingBag,
  Hotel,
  Wine,
  Flower2,
  Coffee,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

/**
 * Premium Glass Showcase Component
 * Demonstrates all the advanced glassmorphism effects
 */
export function PremiumGlassShowcase() {
  const { addButtonRipple } = usePremiumGlassEffects();
  const [isDark, setIsDark] = useState(false);

  const statsData = [
    {
      label: "Total Revenue",
      value: "₹2,45,680",
      change: "Paid (Cash in Hand)",
      icon: IndianRupee,
      color: "text-[#22C55E]",
      changeColor: "text-[#22C55E]",
    },
    {
      label: "Pending Revenue", 
      value: "₹45,200",
      change: "Unpaid Balance",
      icon: IndianRupee,
      color: "text-[#F59E0B]",
      changeColor: "text-[#F59E0B]",
    },
    {
      label: "Total Bookings",
      value: "156",
      change: "Hotel & Garden",
      icon: Calendar,
      color: "text-[#6D5DFB]",
      changeColor: "text-[#6B7280]",
    },
    {
      label: "Active Bookings",
      value: "23",
      change: "Ongoing & Pending",
      icon: Clock,
      color: "text-[#C084FC]",
      changeColor: "text-[#C084FC]",
    },
    {
      label: "Total Customers",
      value: "1,247",
      change: "Registered guests",
      icon: Users,
      color: "text-[#8B5CF6]",
      changeColor: "text-[#6B7280]",
    },
    {
      label: "Active Orders",
      value: "8",
      change: "In progress",
      icon: ShoppingBag,
      color: "text-[#EF4444]",
      changeColor: "text-[#EF4444]",
    },
  ];

  const quickAccessData = [
    {
      title: "Hotel",
      icon: Hotel,
      color: "text-[#6D5DFB]",
      bg: "bg-[#EDEBFF]/30",
    },
    {
      title: "Bar & POS",
      icon: Wine,
      color: "text-[#C084FC]",
      bg: "bg-[#EDEBFF]",
    },
    {
      title: "Garden Events",
      icon: Flower2,
      color: "text-[#22C55E]",
      bg: "bg-[#DCFCE7]",
    },
    {
      title: "Cafe Tables",
      icon: Coffee,
      color: "text-[#F59E0B]",
      bg: "bg-[#F59E0B]/10",
    },
  ];

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addButtonRipple(e.currentTarget, e.nativeEvent);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'dark' : ''}`}>
      <div className="route-dashboard min-h-screen p-8 space-y-8">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">
              Premium Glass Dashboard
            </h1>
            <p className="text-[#6B7280] mt-1 text-base">
              VisionOS-level glassmorphism effects
            </p>
          </div>
          
          <button
            onClick={() => setIsDark(!isDark)}
            onMouseDown={handleButtonClick}
            className="btn-primary px-6 py-3"
          >
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        {/* Stats Grid with Premium Glass Effects */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statsData.map((stat, index) => (
            <div key={stat.label} className="stats-card" style={{ '--float-delay': index } as any}>
              <div className="flex items-center justify-between mb-3">
                <span className="stats-label">{stat.label}</span>
                <div className="icon-container">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="stats-number">{stat.value}</div>
              <div className={`stats-change ${stat.changeColor}`}>
                {stat.label.includes('Revenue') && (
                  <ArrowUpRight className="h-3 w-3" />
                )}
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Access with Floating Animation */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[#111827]">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccessData.map((item, index) => (
              <div 
                key={item.title} 
                className="premium-card-interactive p-6 text-center group"
                style={{ '--float-delay': index } as any}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="icon-container p-4 group-hover:scale-110 transition-transform">
                    <item.icon className={`h-8 w-8 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111827] text-base mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      Manage {item.title.toLowerCase()} →
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[#111827]">
            Premium Glass Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature List */}
            <div className="premium-card p-6">
              <h3 className="font-bold text-[#111827] mb-4">✨ Active Effects</h3>
              <ul className="space-y-3 text-sm text-[#6B7280]">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#22C55E] rounded-full"></span>
                  Liquid Glass with Multi-layer Depth
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#6D5DFB] rounded-full"></span>
                  Cursor-Depth Parallax (3D Rotation)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#C084FC] rounded-full"></span>
                  VisionOS Floating Animation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#F59E0B] rounded-full"></span>
                  Light Refraction Edge Shimmer
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#EF4444] rounded-full"></span>
                  Liquid Button Press Effects
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#8B5CF6] rounded-full"></span>
                  Premium Glow & Shadow System
                </li>
              </ul>
            </div>

            {/* Interactive Demo */}
            <div className="premium-card p-6">
              <h3 className="font-bold text-[#111827] mb-4">🎮 Try Interactive Effects</h3>
              <div className="space-y-4">
                <p className="text-sm text-[#6B7280] mb-4">
                  Hover over cards to see 3D parallax, watch the floating animation, 
                  and click buttons for ripple effects.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onMouseDown={handleButtonClick}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    Ripple Effect
                  </button>
                  <button
                    onMouseDown={handleButtonClick}
                    className="btn-secondary py-2 px-4 text-sm border border-[#E5E7EB] bg-white/50"
                  >
                    Glass Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Note */}
        <div className="premium-card p-6 border-l-4 border-[#22C55E]">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#22C55E]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#22C55E] text-sm">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-[#111827] mb-2">
                Production Ready
              </h3>
              <p className="text-sm text-[#6B7280]">
                All effects are optimized with hardware acceleration, 
                60fps animations, and graceful fallbacks for older browsers. 
                The system automatically adapts to device capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}