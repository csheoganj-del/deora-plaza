"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PremiumStatsCard, PremiumActionCard, PremiumContainer } from "@/components/ui/premium-liquid-glass";
import { InsightCard } from "@/components/ui/insight-card";
import { SystemStatus } from "@/components/ui/system-status";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { DashboardGrid, StatsSection, ActionsSection, InsightsSection } from "./dashboard-grid";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Clock,
  Hotel,
  Wine,
  Flower2,
  Coffee,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { BookingDetailsDialog } from "./BookingDetailsDialog";

interface DashboardContentProps {
  initialStats: any;
  initialBookings: any[];
  userName: string;
}

export default function DashboardContent({
  initialStats,
  initialBookings,
  userName,
}: DashboardContentProps) {
  const [stats] = useState(initialStats);
  const [allBookings] = useState(initialBookings);
  const [isLoading, setIsLoading] = useState(false);

  const quickLinks = [
    {
      title: "Hotel Management",
      description: "Manage rooms, bookings, and guest services",
      icon: Hotel,
      href: "/dashboard/hotel",
      color: "text-primary-action",
    },
    {
      title: "Bar & POS",
      description: "Handle bar orders and point of sale",
      icon: Wine,
      href: "/dashboard/bar",
      color: "text-primary-action",
    },
    {
      title: "Garden Events",
      description: "Manage event bookings and catering",
      icon: Flower2,
      href: "/dashboard/garden",
      color: "text-success-data",
    },
    {
      title: "Cafe Operations",
      description: "Handle table orders and quick service",
      icon: Coffee,
      href: "/dashboard/tables",
      color: "text-warning-data",
    },
  ];

  // Generate insights
  const insights = [];
  
  if (stats?.pendingRevenue > 0) {
    insights.push({
      type: 'warning' as const,
      title: 'Pending Payments',
      description: `₹${stats.pendingRevenue.toLocaleString()} in unpaid bookings require attention`,
      actionLabel: 'Review Payments',
      onAction: () => window.location.href = '/dashboard/billing?status=pending'
    });
  }

  if (stats?.activeOrders > 10) {
    insights.push({
      type: 'info' as const,
      title: 'High Order Volume',
      description: `${stats.activeOrders} active orders - consider additional kitchen support`,
      actionLabel: 'View Kitchen',
      onAction: () => window.location.href = '/dashboard/kitchen'
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        
        <div className="space-y-4 md:space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-8" data-dashboard>
      {/* Header with Breadcrumb */}
      <div className="flex flex-col space-y-4">
        <BreadcrumbNav 
          items={[
            { label: 'Overview', active: true }
          ]}
        />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-high-contrast tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-neutral-text mt-1 text-base">
              Welcome back, {userName}
            </p>
          </div>
          <SystemStatus />
        </div>
      </div>

      <DashboardGrid>
        {/* Stats Section */}
        <StatsSection>
          <PremiumStatsCard
            delay={0}
            onClick={() => window.location.href = '/dashboard/billing?unit=all'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Total Revenue</p>
                <p className="text-2xl font-bold text-high-contrast">{`₹${stats?.totalRevenue?.toLocaleString('en-IN') || "0"}`}</p>
                <p className="text-xs text-neutral-text">Cash in hand</p>
              </div>
              <IndianRupee className="h-8 w-8 text-success-data" />
            </div>
          </PremiumStatsCard>

          <PremiumStatsCard
            delay={1}
            onClick={() => {
              // Open booking details dialog for pending payments
              const pendingBookings = allBookings.filter(b => {
                const paid = b.totalPaid || 0;
                const total = b.totalAmount || paid;
                const pending = Math.max(0, total - paid);
                return pending > 0 && b.status !== 'cancelled';
              });
              // This would need to be handled by a state management solution
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Pending Revenue</p>
                <p className="text-2xl font-bold text-high-contrast">{`₹${stats?.pendingRevenue?.toLocaleString('en-IN') || "0"}`}</p>
                <p className="text-xs text-neutral-text">Unpaid bookings</p>
              </div>
              <Clock className="h-8 w-8 text-warning-data" />
            </div>
          </PremiumStatsCard>

          <PremiumStatsCard
            delay={2}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Total Bookings</p>
                <p className="text-2xl font-bold text-high-contrast">{(stats?.transactionCounts?.hotel || 0) + (stats?.transactionCounts?.garden || 0) || "0"}</p>
                <p className="text-xs text-neutral-text">Hotel & Garden</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-action" />
            </div>
          </PremiumStatsCard>

          <PremiumStatsCard
            delay={3}
            onClick={() => window.location.href = '/dashboard/orders'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Active Orders</p>
                <p className="text-2xl font-bold text-high-contrast">{stats?.activeOrders || "0"}</p>
                <p className="text-xs text-neutral-text">In progress</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-error-data" />
            </div>
          </PremiumStatsCard>

          <PremiumStatsCard
            delay={4}
            onClick={() => window.location.href = '/dashboard/customers'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Total Customers</p>
                <p className="text-2xl font-bold text-high-contrast">{stats?.totalCustomers || "0"}</p>
                <p className="text-xs text-neutral-text">Registered guests</p>
              </div>
              <Users className="h-8 w-8 text-primary-action" />
            </div>
          </PremiumStatsCard>

          <PremiumStatsCard
            delay={5}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Active Bookings</p>
                <p className="text-2xl font-bold text-high-contrast">{stats?.activeBookings || 0}</p>
                <p className="text-xs text-neutral-text">Ongoing & Pending</p>
              </div>
              <Clock className="h-8 w-8 text-warning-data" />
            </div>
          </PremiumStatsCard>
        </StatsSection>

        {/* Quick Actions Section */}
        <ActionsSection>
          {quickLinks.map((link, index) => (
            <PremiumActionCard
              key={link.title}
              delay={index * 0.1}
              onClick={() => window.location.href = link.href}
            >
              <div className="flex items-center space-x-4">
                <link.icon className={`h-8 w-8 ${link.color}`} />
                <div>
                  <h3 className="font-semibold text-high-contrast">{link.title}</h3>
                  <p className="text-sm text-neutral-text">{link.description}</p>
                </div>
              </div>
            </PremiumActionCard>
          ))}
        </ActionsSection>

        {/* Insights Section */}
        {insights.length > 0 && (
          <InsightsSection>
            {insights.map((insight, index) => (
              <InsightCard
                key={index}
                type={insight.type}
                title={insight.title}
                description={insight.description}
                actionLabel={insight.actionLabel}
                onAction={insight.onAction}
              />
            ))}
          </InsightsSection>
        )}

        {/* Recent Activity Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-high-contrast">
            Recent Activity
          </h2>
          <PremiumContainer delay={0.6}>
            {allBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-neutral-text" />
                <div className="text-lg font-medium text-high-contrast mb-2">No bookings yet</div>
                <div className="text-neutral-text mb-4">
                  Create your first booking to see activity here
                </div>
                <Link 
                  href="/dashboard/hotel" 
                  className="inline-flex items-center px-4 py-2 bg-primary-action text-white rounded-lg hover:bg-primary-action/90 transition-colors"
                >
                  ➕ New Booking
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {allBookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center gap-4 border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={`capitalize w-fit ${booking.type === 'garden'
                          ? 'text-success-data border-success-data/20 bg-success-data/10'
                          : 'text-primary-action border-primary-action/20 bg-primary-action/10'
                          }`}
                      >
                        {booking.type}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] w-fit ${booking.status === 'confirmed' ? 'bg-success-data/10 text-success-data border-success-data/20' :
                          booking.status === 'pending' ? 'bg-warning-data/10 text-warning-data border-warning-data/20' :
                            'bg-neutral-text/10 text-neutral-text border-neutral-text/20'
                          }`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-high-contrast truncate">
                        {booking.customer?.name || "Guest"}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-neutral-text">
                        <span>{new Date(booking.startDate).toLocaleDateString('en-IN')}</span>
                        <span>•</span>
                        <span className="font-medium text-high-contrast">
                          ₹{booking.totalAmount?.toLocaleString('en-IN') || "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumContainer>
        </div>
      </DashboardGrid>
    </div>
  );
}

