/**
 * Location Analytics Dashboard
 * Provides insights and statistics about user locations
 */

"use client";

import { useMemo } from 'react';
;
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp,
  Building,
  Smartphone,
  Signal,
  Activity
} from 'lucide-react';

interface UserLocationData {
  userId: string;
  username: string;
  role: string;
  businessUnit: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  source: 'gps' | 'ip' | 'manual';
  isOnline: boolean;
  lastSeen: string;
}

interface LocationAnalyticsProps {
  users: UserLocationData[];
}

const COLORS = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#6b7280'];

export function LocationAnalytics({ users }: LocationAnalyticsProps) {
  const analytics = useMemo(() => {
    // Role distribution
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roleData = Object.entries(roleStats).map(([role, count]) => ({
      role: role.replace('_', ' ').toUpperCase(),
      count,
      percentage: (count / users.length) * 100
    }));

    // Business unit distribution
    const unitStats = users.reduce((acc, user) => {
      acc[user.businessUnit] = (acc[user.businessUnit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const unitData = Object.entries(unitStats).map(([unit, count]) => ({
      unit: unit.toUpperCase(),
      count,
      percentage: (count / users.length) * 100
    }));

    // Source distribution
    const sourceStats = users.reduce((acc, user) => {
      acc[user.source] = (acc[user.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceData = Object.entries(sourceStats).map(([source, count]) => ({
      source: source.toUpperCase(),
      count,
      percentage: (count / users.length) * 100
    }));

    // Online status
    const onlineCount = users.filter(u => u.isOnline).length;
    const offlineCount = users.length - onlineCount;

    // Accuracy stats (for GPS users only)
    const gpsUsers = users.filter(u => u.source === 'gps' && u.accuracy);
    const avgAccuracy = gpsUsers.length > 0 
      ? gpsUsers.reduce((sum, u) => sum + (u.accuracy || 0), 0) / gpsUsers.length 
      : 0;

    // Time-based analysis
    const now = Date.now();
    const recentUsers = users.filter(u => now - new Date(u.timestamp).getTime() < 5 * 60 * 1000); // Last 5 minutes
    const activeUsers = users.filter(u => now - new Date(u.timestamp).getTime() < 30 * 60 * 1000); // Last 30 minutes

    // Geographic spread (simplified)
    const lats = users.map(u => u.latitude);
    const lngs = users.map(u => u.longitude);
    const latSpread = lats.length > 0 ? Math.max(...lats) - Math.min(...lats) : 0;
    const lngSpread = lngs.length > 0 ? Math.max(...lngs) - Math.min(...lngs) : 0;
    const geographicSpread = Math.sqrt(latSpread * latSpread + lngSpread * lngSpread);

    return {
      roleData,
      unitData,
      sourceData,
      onlineCount,
      offlineCount,
      avgAccuracy,
      recentUsers: recentUsers.length,
      activeUsers: activeUsers.length,
      geographicSpread,
      totalUsers: users.length
    };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-[#DCFCE7]0" />
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">{analytics.recentUsers}</p>
                <p className="text-xs text-muted-foreground">Last 5 minutes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-[#EFF6FF]0" />
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold">{analytics.onlineCount}</p>
                <p className="text-xs text-muted-foreground">
                  {((analytics.onlineCount / analytics.totalUsers) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <Signal className="h-8 w-8 text-[#EDEBFF]0" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">
                  {analytics.avgAccuracy > 0 ? `${analytics.avgAccuracy.toFixed(0)}m` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">GPS users only</p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="p-8 p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Coverage</p>
                <p className="text-2xl font-bold">
                  {analytics.geographicSpread.toFixed(3)}°
                </p>
                <p className="text-xs text-muted-foreground">Geographic spread</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users by Role
            </h2>
          </div>
          <div className="p-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.roleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Unit Distribution */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
              <Building className="h-5 w-5" />
              Users by Business Unit
            </h2>
          </div>
          <div className="p-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.unitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.unitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location Source Distribution */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Location Sources
            </h2>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {analytics.sourceData.map((source, index) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{source.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{source.count}</span>
                      <Badge variant="secondary">{source.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                  <Progress value={source.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Online Status */}
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB]">
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Status
            </h2>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Online Users</span>
                  <span className="text-sm text-muted-foreground">
                    {analytics.onlineCount} / {analytics.totalUsers}
                  </span>
                </div>
                <Progress 
                  value={(analytics.onlineCount / analytics.totalUsers) * 100} 
                  className="h-3"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recently Active</span>
                  <span className="text-sm text-muted-foreground">
                    {analytics.activeUsers} / {analytics.totalUsers}
                  </span>
                </div>
                <Progress 
                  value={(analytics.activeUsers / analytics.totalUsers) * 100} 
                  className="h-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#22C55E]">{analytics.onlineCount}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#6B7280]">{analytics.offlineCount}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Detailed Statistics</h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">LOCATION ACCURACY</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>GPS Users:</span>
                  <span className="font-medium">
                    {analytics.sourceData.find(s => s.source === 'GPS')?.count || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average Accuracy:</span>
                  <span className="font-medium">
                    {analytics.avgAccuracy > 0 ? `±${analytics.avgAccuracy.toFixed(0)}m` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">ACTIVITY LEVELS</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active (5min):</span>
                  <span className="font-medium text-[#22C55E]">{analytics.recentUsers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active (30min):</span>
                  <span className="font-medium text-[#6D5DFB]">{analytics.activeUsers}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">COVERAGE</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Geographic Spread:</span>
                  <span className="font-medium">{analytics.geographicSpread.toFixed(3)}°</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Tracked:</span>
                  <span className="font-medium">{analytics.totalUsers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

