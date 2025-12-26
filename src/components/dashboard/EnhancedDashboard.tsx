"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BusinessUnit, getBusinessUnitManager, DEFAULT_BUSINESS_UNITS } from "@/lib/business-units";
import { BusinessUnitSwitcher } from "./BusinessUnitSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import {
  Calendar,
  Users,
  IndianRupee,
  Plus,
  LayoutDashboard,
  UtensilsCrossed,
  Wine,
  Building2,
  Flower2,
  Clock,
  TrendingUp
} from "lucide-react";
import { useSyncEngine } from "@/lib/realtime/sync-engine";
import { useAudioNotifications } from "@/lib/audio/notification-system";

// Enhanced Components with Liquid Glass
import { DashboardGrid, StatsSection, ActionsSection, InsightsSection } from "./dashboard-grid";
import { PremiumStatsCard, PremiumActionCard } from "@/components/ui/premium-liquid-glass";
import { InsightCard } from "@/components/ui/insight-card";
import { SystemStatus } from "@/components/ui/system-status";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { DashboardBackgroundCustomizer } from "@/components/ui/dashboard-background-customizer";

// Define the Global Overview Unit
const GLOBAL_OVERVIEW_UNIT: BusinessUnit = {
  id: 'global_overview',
  name: 'All Dashboard',
  type: 'all' as any,
  description: 'Global Overview of all business units',
  isActive: true,
  settings: {} as any,
  operatingHours: {} as any,
  contact: {} as any,
  features: []
};

export function EnhancedDashboard() {
  const searchParams = useSearchParams();
  const { data: session } = useSupabaseSession();
  const syncEngine = useSyncEngine();
  const { playNotification } = useAudioNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnit | null>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    activeOrders: 0,
    percentageChange: 0,
    pendingRevenue: 0
  });

  // Load business units
  useEffect(() => {
    const loadBusinessUnits = async () => {
      try {
        let units = getBusinessUnitManager().getActiveBusinessUnits();
        if (units.length === 0) {
          units = DEFAULT_BUSINESS_UNITS.map(u => ({ ...u, id: u.name?.toLowerCase().replace(/\s+/g, '_') || 'id' })) as BusinessUnit[];
        }

        const allUnits = [GLOBAL_OVERVIEW_UNIT, ...units];
        setBusinessUnits(allUnits);

        const unitId = searchParams.get('unit');
        const unit = unitId ? allUnits.find(u => u.id === unitId) : allUnits[0];
        setSelectedUnit(unit || allUnits[0]);
      } catch (error) {
        console.error("Failed to load business units:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessUnits();
  }, [searchParams]);

  // Load stats function
  const fetchStats = async () => {
    if (!selectedUnit) return;

    try {
      const manager = getBusinessUnitManager();
      let aggregatedStats = {
        totalBookings: 0,
        activeBookings: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        activeOrders: 0,
        pendingRevenue: 0
      };

      if (selectedUnit.id === 'global_overview') {
        const stats = await manager.getBusinessUnitStats('global_overview');
        if (stats) {
          aggregatedStats.totalRevenue = stats.totalRevenue;
          aggregatedStats.activeOrders = stats.ordersCount;
          aggregatedStats.pendingRevenue = 0; // Default value since property doesn't exist
          if (stats.percentageChange !== undefined) {
            (aggregatedStats as any).percentageChange = stats.percentageChange;
          }
        }
      } else {
        const stats = await manager.getBusinessUnitStats(selectedUnit.id);
        if (stats) {
          aggregatedStats.totalRevenue = stats.totalRevenue;
          aggregatedStats.activeOrders = stats.ordersCount;
          aggregatedStats.pendingRevenue = 0; // Default value since property doesn't exist
          if (stats.percentageChange !== undefined) {
            (aggregatedStats as any).percentageChange = stats.percentageChange;
          }
        }
      }

      setStats(aggregatedStats as any);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!selectedUnit) return;

    const tables = ['orders', 'bookings', 'customers', 'bills'];
    
    tables.forEach(table => {
      syncEngine.subscribe(table, selectedUnit.id !== 'global_overview' ? `business_unit.eq.${selectedUnit.id}` : undefined);
    });

    const handleRealtimeUpdate = (event: any) => {
      if (event.type === 'insert') {
        if (event.table === 'orders') {
          playNotification({
            type: 'order_new',
            title: 'New Order',
            message: `Order #${event.record.id} received`,
            priority: 'high',
            businessUnit: selectedUnit.id
          });
        } else if (event.table === 'bookings') {
          playNotification({
            type: 'booking_new',
            title: 'New Booking',
            message: `Booking for ${event.record.customer_name}`,
            priority: 'medium',
            businessUnit: selectedUnit.id
          });
        }
      }
      
      setTimeout(() => {
        fetchStats();
      }, 500);
    };

    syncEngine.on('sync-event', handleRealtimeUpdate);

    return () => {
      syncEngine.removeListener('sync-event', handleRealtimeUpdate);
    };
  }, [selectedUnit, syncEngine, playNotification]);

  // Load stats when selected unit changes
  useEffect(() => {
    fetchStats();
  }, [selectedUnit]);

  const handleUnitChange = (unitId: string) => {
    const unit = businessUnits.find(u => u.id === unitId);
    if (unit) setSelectedUnit(unit);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedUnit) return null;

  const isGlobal = selectedUnit.id === 'global_overview';

  // Generate insights based on data
  const insights = [];
  
  if (stats.pendingRevenue > 0) {
    insights.push({
      type: 'warning' as const,
      title: 'Pending Payments',
      description: `₹${stats.pendingRevenue.toLocaleString()} in unpaid bookings require attention`,
      actionLabel: 'Review Payments',
      onAction: () => window.location.href = '/dashboard/billing?status=pending'
    });
  }

  if (stats.activeOrders > 10) {
    insights.push({
      type: 'info' as const,
      title: 'High Order Volume',
      description: `${stats.activeOrders} active orders - consider additional kitchen support`,
      actionLabel: 'View Kitchen',
      onAction: () => window.location.href = '/dashboard/kitchen'
    });
  }

  if (stats.totalRevenue > 0 && stats.percentageChange > 15) {
    insights.push({
      type: 'success' as const,
      title: 'Revenue Growth',
      description: `Strong performance with ${stats.percentageChange.toFixed(1)}% growth this month`,
      actionLabel: 'View Report',
      onAction: () => window.location.href = '/dashboard/statistics'
    });
  }

  return (
    <div className="min-h-screen p-6 space-y-6" data-dashboard>
      {/* Dashboard Background Customizer */}
      <DashboardBackgroundCustomizer />
      
      {/* Header with Breadcrumb */}
      <div className="flex flex-col space-y-4">
        <BreadcrumbNav 
          items={[
            { label: selectedUnit.name === 'All Dashboard' ? 'Overview' : selectedUnit.name, active: true }
          ]}
        />
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-high-contrast">
              {selectedUnit.name === 'All Dashboard' ? 'Dashboard Overview' : `${selectedUnit.name} Dashboard`}
            </h1>
            <p className="text-neutral-text">
              Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SystemStatus />
            <BusinessUnitSwitcher
              businessUnits={businessUnits}
              currentUnitId={selectedUnit.id}
              onUnitChange={handleUnitChange}
            />
          </div>
        </div>
      </div>

      <DashboardGrid>
        {/* Stats Section */}
        <StatsSection>
          <PremiumStatsCard
            delay={0}
            onClick={() => window.location.href = '/dashboard/billing'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Total Revenue</p>
                <p className="text-2xl font-bold text-high-contrast">{`₹${stats.totalRevenue.toLocaleString()}`}</p>
                <p className="text-xs text-neutral-text">Cash in hand</p>
              </div>
              <IndianRupee className="h-8 w-8 text-success-data" />
            </div>
            {stats.percentageChange !== undefined && (
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 mr-1 text-success-data" />
                <span className="text-success-data font-medium">{stats.percentageChange.toFixed(1)}%</span>
                <span className="text-neutral-text ml-1">vs last month</span>
              </div>
            )}
          </PremiumStatsCard>

          <PremiumStatsCard
            delay={1}
            onClick={() => window.location.href = '/dashboard/billing?status=pending'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Pending Revenue</p>
                <p className="text-2xl font-bold text-high-contrast">{`₹${stats.pendingRevenue.toLocaleString()}`}</p>
                <p className="text-xs text-neutral-text">Unpaid bookings</p>
              </div>
              <Clock className="h-8 w-8 text-warning-data" />
            </div>
          </PremiumStatsCard>

          <PremiumStatsCard
            delay={2}
            onClick={() => window.location.href = '/dashboard/bookings'}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-text">Total Bookings</p>
                <p className="text-2xl font-bold text-high-contrast">{stats.totalBookings}</p>
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
                <p className="text-2xl font-bold text-high-contrast">{stats.activeOrders}</p>
                <p className="text-xs text-neutral-text">In progress</p>
              </div>
              <LayoutDashboard className="h-8 w-8 text-error-data" />
            </div>
          </PremiumStatsCard>
        </StatsSection>

        {/* Quick Actions Section */}
        <ActionsSection>
          {isGlobal ? (
            <>
              <PremiumActionCard
                delay={0}
                onClick={() => window.location.href = '/dashboard/hotel'}
              >
                <div className="flex items-center space-x-4">
                  <Building2 className="h-8 w-8 text-primary-action" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">Hotel Management</h3>
                    <p className="text-sm text-neutral-text">Manage rooms, bookings, and guest services</p>
                  </div>
                </div>
              </PremiumActionCard>

              <PremiumActionCard
                delay={1}
                onClick={() => window.location.href = '/dashboard/bar'}
              >
                <div className="flex items-center space-x-4">
                  <Wine className="h-8 w-8 text-primary-action" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">Bar & POS</h3>
                    <p className="text-sm text-neutral-text">Handle bar orders and point of sale</p>
                  </div>
                </div>
              </PremiumActionCard>

              <PremiumActionCard
                delay={2}
                onClick={() => window.location.href = '/dashboard/garden'}
              >
                <div className="flex items-center space-x-4">
                  <Flower2 className="h-8 w-8 text-success-data" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">Garden Events</h3>
                    <p className="text-sm text-neutral-text">Manage event bookings and catering</p>
                  </div>
                </div>
              </PremiumActionCard>

              <PremiumActionCard
                delay={3}
                onClick={() => window.location.href = '/dashboard/tables'}
              >
                <div className="flex items-center space-x-4">
                  <UtensilsCrossed className="h-8 w-8 text-warning-data" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">Cafe Operations</h3>
                    <p className="text-sm text-neutral-text">Handle table orders and quick service</p>
                  </div>
                </div>
              </PremiumActionCard>

              <PremiumActionCard
                delay={4}
                onClick={() => window.location.href = '/dashboard/customers'}
              >
                <div className="flex items-center space-x-4">
                  <Users className="h-8 w-8 text-primary-action" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">Customer Management</h3>
                    <p className="text-sm text-neutral-text">View and manage customer profiles</p>
                  </div>
                </div>
              </PremiumActionCard>

              <PremiumActionCard
                delay={5}
                onClick={() => window.location.href = '/dashboard/statistics'}
              >
                <div className="flex items-center space-x-4">
                  <TrendingUp className="h-8 w-8 text-success-data" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">Financial Reports</h3>
                    <p className="text-sm text-neutral-text">View revenue and performance analytics</p>
                  </div>
                </div>
              </PremiumActionCard>
            </>
          ) : (
            <>
              <PremiumActionCard
                delay={0}
                onClick={() => window.location.href = `/dashboard/${selectedUnit.type}/bookings/new`}
              >
                <div className="flex items-center space-x-4">
                  <Plus className="h-8 w-8 text-primary-action" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">New Booking</h3>
                    <p className="text-sm text-neutral-text">{`Create a new ${selectedUnit.type === 'hotel' ? 'room' : 'table'} booking`}</p>
                  </div>
                </div>
              </PremiumActionCard>

              <PremiumActionCard
                delay={1}
                onClick={() => window.location.href = `/dashboard/${selectedUnit.type}/orders`}
              >
                <div className="flex items-center space-x-4">
                  <UtensilsCrossed className="h-8 w-8 text-primary-action" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">Manage Orders</h3>
                    <p className="text-sm text-neutral-text">{`View and manage ${selectedUnit.type === 'hotel' ? 'room service' : 'food and beverage'} orders`}</p>
                  </div>
                </div>
              </PremiumActionCard>

              <PremiumActionCard
                delay={2}
                onClick={() => window.location.href = `/dashboard/${selectedUnit.type}/reports`}
              >
                <div className="flex items-center space-x-4">
                  <TrendingUp className="h-8 w-8 text-success-data" />
                  <div>
                    <h3 className="font-semibold text-high-contrast">View Reports</h3>
                    <p className="text-sm text-neutral-text">{`${selectedUnit.type} performance and analytics`}</p>
                  </div>
                </div>
              </PremiumActionCard>
            </>
          )}
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
      </DashboardGrid>
    </div>
  );
}