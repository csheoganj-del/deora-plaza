"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  IndianRupee,
  LayoutDashboard,
  UtensilsCrossed,
  Wine,
  Building2,
  Flower2,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight
} from "lucide-react";

// Import the premium liquid glass components
import { 
  PremiumLiquidGlass, 
  PremiumStatsCard, 
  PremiumActionCard, 
  PremiumContainer 
} from "@/components/ui/premium-liquid-glass";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { SystemStatus } from "@/components/ui/system-status";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

export function LiquidGlassDashboardDemo() {
  const [stats] = useState({
    totalRevenue: 125000,
    pendingRevenue: 15000,
    totalBookings: 45,
    activeOrders: 12,
    totalCustomers: 234,
    activeBookings: 8,
    revenueGrowth: 12.5
  });

  return (
    <div className="min-h-screen p-6 space-y-8" data-dashboard>
      {/* Header with Premium Glass Effect */}
      <PremiumContainer delay={0}>
        <div className="flex flex-col space-y-4">
          <BreadcrumbNav 
            items={[
              { label: 'Dashboard Overview', active: true }
            ]}
          />
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight adaptive-text-primary ios-text-depth">
                DEORA Plaza Dashboard
              </h1>
              <p className="adaptive-text-secondary">
                Premium Liquid Glass Experience
              </p>
            </div>
            <SystemStatus />
          </div>
        </div>
      </PremiumContainer>
      {/* Stats Section with Premium Glass Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PremiumStatsCard delay={0.1}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium adaptive-text-secondary">Total Revenue</h3>
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20">
              <IndianRupee className="h-4 w-4 text-green-400" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold adaptive-text-primary ios-text-depth">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <TrendIndicator 
              value={stats.revenueGrowth}
              label="vs last month"
            />
          </div>
        </PremiumStatsCard>

        <PremiumStatsCard delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium adaptive-text-secondary">Pending Revenue</h3>
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold adaptive-text-primary ios-text-depth">
              ₹{stats.pendingRevenue.toLocaleString()}
            </div>
            <p className="text-xs adaptive-text-secondary">Unpaid bookings</p>
          </div>
        </PremiumStatsCard>

        <PremiumStatsCard delay={0.3}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium adaptive-text-secondary">Total Bookings</h3>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <Calendar className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold adaptive-text-primary ios-text-depth">
              {stats.totalBookings}
            </div>
            <p className="text-xs adaptive-text-secondary">Hotel & Garden</p>
          </div>
        </PremiumStatsCard>

        <PremiumStatsCard delay={0.4}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium adaptive-text-secondary">Active Orders</h3>
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20">
              <LayoutDashboard className="h-4 w-4 text-red-400" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold adaptive-text-primary ios-text-depth">
              {stats.activeOrders}
            </div>
            <p className="text-xs adaptive-text-secondary">In progress</p>
          </div>
        </PremiumStatsCard>
      </div>

      {/* Quick Actions Section */}
      <PremiumContainer delay={0.5}>
        <h2 className="text-lg font-semibold adaptive-text-primary mb-6 ios-text-depth">
          Quick Access
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <PremiumActionCard delay={0.6}>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold adaptive-text-primary mb-1">Hotel Management</h3>
                <p className="text-sm adaptive-text-secondary">Manage rooms & bookings</p>
              </div>
              <ArrowUpRight className="h-4 w-4 adaptive-text-secondary group-hover:adaptive-text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
          </PremiumActionCard>

          <PremiumActionCard delay={0.7}>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                <Wine className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold adaptive-text-primary mb-1">Bar & POS</h3>
                <p className="text-sm adaptive-text-secondary">Handle bar orders</p>
              </div>
              <ArrowUpRight className="h-4 w-4 adaptive-text-secondary group-hover:adaptive-text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
          </PremiumActionCard>

          <PremiumActionCard delay={0.8}>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20">
                <Flower2 className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold adaptive-text-primary mb-1">Garden Events</h3>
                <p className="text-sm adaptive-text-secondary">Event bookings</p>
              </div>
              <ArrowUpRight className="h-4 w-4 adaptive-text-secondary group-hover:adaptive-text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
          </PremiumActionCard>

          <PremiumActionCard delay={0.9}>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                <UtensilsCrossed className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold adaptive-text-primary mb-1">Cafe Operations</h3>
                <p className="text-sm adaptive-text-secondary">Table orders</p>
              </div>
              <ArrowUpRight className="h-4 w-4 adaptive-text-secondary group-hover:adaptive-text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </div>
          </PremiumActionCard>
        </div>
      </PremiumContainer>

      {/* Insights Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <PremiumLiquidGlass variant="card" delay={1.0}>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium adaptive-text-primary mb-1 ios-text-depth">
                Revenue Growth
              </h4>
              <p className="text-sm adaptive-text-secondary mb-3">
                Strong performance with 12.5% growth this month
              </p>
              <motion.button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Report
              </motion.button>
            </div>
          </div>
        </PremiumLiquidGlass>

        <PremiumLiquidGlass variant="card" delay={1.1}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium adaptive-text-primary mb-1 ios-text-depth">
                Pending Payments
              </h4>
              <p className="text-sm adaptive-text-secondary mb-3">
                ₹15,000 in unpaid bookings require attention
              </p>
              <motion.button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Review Payments
              </motion.button>
            </div>
          </div>
        </PremiumLiquidGlass>
      </div>

      {/* Demo Note */}
      <PremiumContainer delay={1.2}>
        <div className="text-center py-8">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="mb-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </motion.div>
          <h3 className="text-xl font-bold adaptive-text-primary mb-2 ios-text-depth">
            Premium Liquid Glass Dashboard
          </h3>
          <p className="adaptive-text-secondary">
            Same beautiful glass effect as your login window, now applied to the dashboard
          </p>
        </div>
      </PremiumContainer>
    </div>
  );
}