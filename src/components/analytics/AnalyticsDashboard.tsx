"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
} from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  dailyRevenue: { date: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  peakHours: { hour: number; orders: number }[];
}

export function AnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        // Mock data - replace with actual API call
        const mockData: AnalyticsData = {
          totalRevenue: 245678,
          totalOrders: 1234,
          totalCustomers: 567,
          averageOrderValue: 199.5,
          revenueGrowth: 12.5,
          orderGrowth: 8.3,
          customerGrowth: 15.2,
          dailyRevenue: [
            { date: '2024-01-01', revenue: 5432 },
            { date: '2024-01-02', revenue: 6789 },
            { date: '2024-01-03', revenue: 4567 },
            { date: '2024-01-04', revenue: 7890 },
            { date: '2024-01-05', revenue: 8901 },
            { date: '2024-01-06', revenue: 6234 },
            { date: '2024-01-07', revenue: 7568 },
          ],
          topProducts: [
            { name: 'Coffee Latte', quantity: 234, revenue: 4680 },
            { name: 'Sandwich Combo', quantity: 189, revenue: 5670 },
            { name: 'Fresh Juice', quantity: 156, revenue: 2340 },
            { name: 'Pizza Margherita', quantity: 145, revenue: 4350 },
            { name: 'Caesar Salad', quantity: 123, revenue: 2460 },
          ],
          peakHours: [
            { hour: 8, orders: 45 },
            { hour: 12, orders: 78 },
            { hour: 14, orders: 65 },
            { hour: 18, orders: 89 },
            { hour: 20, orders: 56 },
          ],
        };
        setAnalyticsData(mockData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon,
    format = 'number' 
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    icon: any;
    format?: 'number' | 'currency';
  }) => (
    <div className="premium-card">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold">
          {format === 'currency' ? formatCurrency(value) : value.toLocaleString()}
        </div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {change > 0 ? (
              <ArrowUpRight className="h-3 w-3 text-[#DCFCE7]0 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-[#FEE2E2]0 mr-1" />
            )}
            <span className={change > 0 ? 'text-[#DCFCE7]0' : 'text-[#FEE2E2]0'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">from last period</span>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div className="premium-card" key={i}>
              <div className="p-6 pb-2">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="premium-card">
            <div className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
          <div className="premium-card">
            <div className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={analyticsData.totalRevenue}
          change={analyticsData.revenueGrowth}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Total Orders"
          value={analyticsData.totalOrders}
          change={analyticsData.orderGrowth}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Total Customers"
          value={analyticsData.totalCustomers}
          change={analyticsData.customerGrowth}
          icon={Users}
        />
        <MetricCard
          title="Avg Order Value"
          value={analyticsData.averageOrderValue}
          icon={IndianRupee}
          format="currency"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827]">Daily Revenue</h2>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {analyticsData.dailyRevenue.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{day.date}</span>
                  <span className="font-medium">{formatCurrency(day.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827]">Top Products</h2>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {analyticsData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span>{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.quantity} sold</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827]">Peak Hours</h2>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {analyticsData.peakHours.map((peak) => (
                <div key={peak.hour} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{peak.hour}:00 - {peak.hour + 1}:00</span>
                  </div>
                  <span className="font-medium">{peak.orders} orders</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827]">Performance Metrics</h2>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Revenue per Customer</span>
                <span className="font-medium">
                  {formatCurrency(analyticsData.totalRevenue / analyticsData.totalCustomers)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orders per Customer</span>
                <span className="font-medium">
                  {(analyticsData.totalOrders / analyticsData.totalCustomers).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Average Revenue</span>
                <span className="font-medium">
                  {formatCurrency(analyticsData.totalRevenue / 30)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Average Orders</span>
                <span className="font-medium">
                  {Math.round(analyticsData.totalOrders / 30)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

