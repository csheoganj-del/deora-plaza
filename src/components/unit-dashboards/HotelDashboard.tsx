"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  TrendingUp,
  Clock,
  Bed,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { PremiumLiquidGlass, PremiumStatsCard, PremiumActionCard, PremiumContainer } from "@/components/ui/glass/premium-liquid-glass";
import { GlassButton } from "@/components/ui/glass/GlassFormComponents";
import { motion } from "framer-motion";
import { getHotelMetrics } from "@/actions/hotel";
import { toast } from "sonner";

// Types
interface HotelMetrics {
  dailyRevenue: number;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
  checkInsToday: number;
  checkOutsToday: number;
  averageRoomRate: number;
  upcomingCheckIns: Array<{ time: string; guest: string; room: string }>;
  roomStatusCounts: {
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
  };
  staffOnDuty: number;
  maintenanceRequests: number;
  reservations: number;
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
  delay?: number;
}

// Components
const StatCard = ({ title, value, change, isPositive, icon: Icon, delay = 0 }: StatCardProps) => (
  <PremiumStatsCard delay={delay} className="group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
        <Icon className="w-6 h-6 text-white/90" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${isPositive
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
        {change}
      </div>
    </div>
    <div>
      <h3 className="text-sm font-medium text-white/60 mb-1">{title}</h3>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
    </div>
  </PremiumStatsCard>
);

const CheckInRow = ({ checkIn, index }: { checkIn: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 + (index * 0.1) }}
    className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 group cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 font-medium text-sm">
        {checkIn.room}
      </div>
      <div>
        <h4 className="text-white font-medium">{checkIn.guest}</h4>
        <p className="text-sm text-white/50">Room {checkIn.room}</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right">
        <div className="text-white font-medium">{checkIn.time}</div>
        <div className="text-xs text-white/50">Expected</div>
      </div>
      <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors z-10">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

const RoomStatusBadge = ({ status, count }: { status: string, count: number }) => {
  // Use static classes for proper Tailwind compilation
  const statusStyles = {
    available: {
      container: 'bg-emerald-500/5 border-emerald-500/20',
      icon: 'bg-emerald-500/20 text-emerald-400',
      Icon: CheckCircle2,
      label: 'Available'
    },
    occupied: {
      container: 'bg-blue-500/5 border-blue-500/20',
      icon: 'bg-blue-500/20 text-blue-400',
      Icon: Bed,
      label: 'Occupied'
    },
    cleaning: {
      container: 'bg-amber-500/5 border-amber-500/20',
      icon: 'bg-amber-500/20 text-amber-400',
      Icon: Sparkles,
      label: 'Cleaning'
    },
    maintenance: {
      container: 'bg-rose-500/5 border-rose-500/20',
      icon: 'bg-rose-500/20 text-rose-400',
      Icon: AlertCircle,
      label: 'Maintenance'
    }
  };

  const config = statusStyles[status as keyof typeof statusStyles] || {
    container: 'bg-white/5 border-white/20',
    icon: 'bg-white/20 text-white/40',
    Icon: XCircle,
    label: status
  };

  const IconComponent = config.Icon;

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${config.container} cursor-pointer hover:bg-white/5 transition-all`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.icon}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-medium text-white/60">{config.label}</div>
          <div className="text-2xl font-bold text-white">{count}</div>
        </div>
      </div>
    </div>
  );
};

export function HotelDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HotelMetrics | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await getHotelMetrics();

      if (result.success && result.metrics) {
        setMetrics(result.metrics);
      } else {
        toast.error("Failed to load hotel metrics");
        console.error("Metrics error:", result.error);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Map real data to UI
  const stats = [
    {
      title: "Occupancy Rate",
      value: `${metrics?.occupancyRate || 0}%`,
      change: `${metrics?.occupiedRooms || 0}/${metrics?.totalRooms || 0}`,
      isPositive: (metrics?.occupancyRate || 0) >= 60,
      icon: Building2
    },
    {
      title: "Daily Revenue",
      value: `₹${metrics?.dailyRevenue.toLocaleString() || '0'}`,
      change: metrics && metrics.dailyRevenue > 0 ? "+100%" : "0%",
      isPositive: true,
      icon: TrendingUp
    },
    {
      title: "Avg Room Rate",
      value: `₹${metrics?.averageRoomRate.toLocaleString() || '0'}`,
      change: "Per night",
      isPositive: true,
      icon: Bed
    },
    {
      title: "Check-ins/Outs",
      value: `${metrics?.checkInsToday || 0}/${metrics?.checkOutsToday || 0}`,
      change: "Today",
      isPositive: true,
      icon: Users
    },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0f0f13] text-white selection:bg-purple-500/30">

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 p-8 max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70"
            >
              Hotel Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 mt-1"
            >
              {loading ? "Updating data..." : "Real-time hotel operations and performance"}
            </motion.p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
            />
            <GlassButton
              variant="secondary"
              onClick={loadDashboardData}
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </GlassButton>
            <GlassButton variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </GlassButton>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} delay={i * 0.1} />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Upcoming Check-ins */}
          <div className="lg:col-span-2">
            <PremiumContainer delay={0.4} className="h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Upcoming Check-ins</h2>
                <GlassButton variant="ghost" size="sm">View All</GlassButton>
              </div>

              <div className="space-y-2">
                {metrics?.upcomingCheckIns && metrics.upcomingCheckIns.length > 0 ? (
                  metrics.upcomingCheckIns.map((checkIn, i) => (
                    <CheckInRow key={i} checkIn={checkIn} index={i} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-white/30">
                    <Building2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>No upcoming check-ins for today</p>
                  </div>
                )}
              </div>
            </PremiumContainer>
          </div>

          {/* Side Panel (Room Status & Quick Actions) */}
          <div className="space-y-6">
            <PremiumActionCard delay={0.5}>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group text-left cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Check-in</div>
                </button>
                <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group text-left cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Check-out</div>
                </button>
                <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group text-left cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Room Service</div>
                </button>
                <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group text-left cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-white">Maintenance</div>
                </button>
              </div>
            </PremiumActionCard>

            <PremiumContainer delay={0.6}>
              <h3 className="text-lg font-semibold text-white mb-4">Room Status</h3>
              <div className="space-y-3">
                {metrics?.roomStatusCounts && (
                  <>
                    <RoomStatusBadge status="available" count={metrics.roomStatusCounts.available} />
                    <RoomStatusBadge status="occupied" count={metrics.roomStatusCounts.occupied} />
                    <RoomStatusBadge status="cleaning" count={metrics.roomStatusCounts.cleaning} />
                    <RoomStatusBadge status="maintenance" count={metrics.roomStatusCounts.maintenance} />
                  </>
                )}
              </div>
            </PremiumContainer>
          </div>

        </div>

      </div>
    </div>
  );
}
