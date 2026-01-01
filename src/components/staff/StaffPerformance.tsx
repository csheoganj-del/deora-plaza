'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  Star, 
  Users, 
  Target,
  Award,
  Zap,
  ThumbsUp,
  Timer
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  businessUnit: string;
  avatar?: string;
  performance: {
    ordersProcessed: number;
    avgServiceTime: number; // minutes
    customerRating: number;
    efficiency: number; // percentage
    punctuality: number; // percentage
    teamwork: number; // rating out of 5
  };
  achievements: string[];
  shift: {
    start: string;
    end: string;
    hoursWorked: number;
  };
  todayStats: {
    ordersCompleted: number;
    revenue: number;
    customerFeedback: number;
  };
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  unit: string;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function StaffPerformance() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffPerformance();
  }, [selectedPeriod]);

  const fetchStaffPerformance = async () => {
    try {
      // TODO: Fetch real staff performance data from database
      const emptyStaff: StaffMember[] = [];

      setStaffMembers(emptyStaff);
    } catch (error) {
      console.error('Error fetching staff performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (value: number, type: 'rating' | 'percentage') => {
    if (type === 'rating') {
      if (value >= 4.5) return 'text-green-600';
      if (value >= 4.0) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 90) return 'text-green-600';
      if (value >= 80) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getPerformanceBadge = (efficiency: number) => {
    if (efficiency >= 95) return { label: 'Excellent', variant: 'default' as const };
    if (efficiency >= 90) return { label: 'Great', variant: 'secondary' as const };
    if (efficiency >= 80) return { label: 'Good', variant: 'outline' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  const topPerformers = staffMembers
    .sort((a, b) => b.performance.efficiency - a.performance.efficiency)
    .slice(0, 3);

  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'Avg Efficiency',
      value: Math.round(staffMembers.reduce((sum, staff) => sum + staff.performance.efficiency, 0) / staffMembers.length),
      change: 5.2,
      unit: '%',
      color: '#0088FE'
    },
    {
      name: 'Customer Rating',
      value: Number((staffMembers.reduce((sum, staff) => sum + staff.performance.customerRating, 0) / staffMembers.length).toFixed(1)),
      change: 0.3,
      unit: '/5',
      color: '#00C49F'
    },
    {
      name: 'Orders/Hour',
      value: Math.round(staffMembers.reduce((sum, staff) => sum + (staff.performance.ordersProcessed / staff.shift.hoursWorked), 0) / staffMembers.length),
      change: 2.1,
      unit: '',
      color: '#FFBB28'
    },
    {
      name: 'Punctuality',
      value: Math.round(staffMembers.reduce((sum, staff) => sum + staff.performance.punctuality, 0) / staffMembers.length),
      change: -1.5,
      unit: '%',
      color: '#FF8042'
    }
  ];

  const chartData = staffMembers.map(staff => ({
    name: staff.name.split(' ')[0],
    efficiency: staff.performance.efficiency,
    rating: staff.performance.customerRating * 20, // Scale to 100 for chart
    orders: staff.performance.ordersProcessed
  }));

  const businessUnitData = staffMembers.reduce((acc, staff) => {
    const unit = staff.businessUnit;
    if (!acc[unit]) {
      acc[unit] = { unit, count: 0, avgEfficiency: 0, totalEfficiency: 0 };
    }
    acc[unit].count++;
    acc[unit].totalEfficiency += staff.performance.efficiency;
    acc[unit].avgEfficiency = Math.round(acc[unit].totalEfficiency / acc[unit].count);
    return acc;
  }, {} as Record<string, any>);

  const pieData = Object.values(businessUnitData).map((data: any, index) => ({
    name: data.unit,
    value: data.count,
    color: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Staff Performance
          </h2>
          <p className="text-gray-600">Track team productivity and achievements</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <p className="text-2xl font-bold" style={{ color: metric.color }}>
                    {metric.value}{metric.unit}
                  </p>
                </div>
                <div className={`text-sm ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-4 w-4 inline mr-1 ${metric.change < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(metric.change)}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Highest efficiency ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((staff, index) => (
                <div key={staff.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{staff.name}</h4>
                    <p className="text-sm text-gray-600 capitalize">
                      {staff.role.replace('_', ' ')} • {staff.businessUnit}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {staff.performance.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600">
                      ⭐ {staff.performance.customerRating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Charts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Staff efficiency and customer ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="efficiency" className="space-y-4">
              <TabsList>
                <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="efficiency">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#8884d8" name="Efficiency %" />
                    <Bar dataKey="rating" fill="#82ca9d" name="Rating (x20)" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Staff Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Details
          </CardTitle>
          <CardDescription>Individual performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffMembers.map(staff => (
              <div key={staff.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-lg">{staff.name}</h4>
                    <p className="text-gray-600 capitalize">
                      {staff.role.replace('_', ' ')} • {staff.businessUnit}
                    </p>
                    <p className="text-sm text-gray-500">
                      Shift: {staff.shift.start} - {staff.shift.end} ({staff.shift.hoursWorked}h)
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {staff.achievements.map((achievement, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">Orders</div>
                    <div className="text-lg font-bold text-blue-600">
                      {staff.todayStats.ordersCompleted}
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">Efficiency</div>
                    <div className={`text-lg font-bold ${getPerformanceColor(staff.performance.efficiency, 'percentage')}`}>
                      {staff.performance.efficiency}%
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">Rating</div>
                    <div className={`text-lg font-bold ${getPerformanceColor(staff.performance.customerRating, 'rating')}`}>
                      {staff.performance.customerRating}
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">Avg Time</div>
                    <div className="text-lg font-bold text-orange-600">
                      {staff.performance.avgServiceTime}m
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium">Punctuality</div>
                    <div className={`text-lg font-bold ${getPerformanceColor(staff.performance.punctuality, 'percentage')}`}>
                      {staff.performance.punctuality}%
                    </div>
                  </div>
                  
                  {staff.todayStats.revenue > 0 && (
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-medium">Revenue</div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{staff.todayStats.revenue.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge {...getPerformanceBadge(staff.performance.efficiency)}>
                    {getPerformanceBadge(staff.performance.efficiency).label}
                  </Badge>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      Teamwork: {staff.performance.teamwork}/5
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {staff.performance.ordersProcessed} orders processed
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}