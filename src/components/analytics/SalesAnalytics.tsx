'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface BusinessUnitData {
  unit: string;
  revenue: number;
  orders: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SalesAnalytics() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitData[]>([]);
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    avgOrderValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const supabase = createClient();
      
      // Get today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: todayBills } = await supabase
        .from('bills')
        .select('totalAmount, customerId')
        .gte('createdAt', `${today}T00:00:00`)
        .lt('createdAt', `${today}T23:59:59`);

      if (todayBills) {
        const revenue = todayBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
        const orders = todayBills.length;
        const uniqueCustomers = new Set(todayBills.map(bill => bill.customerId)).size;
        
        setTodayStats({
          revenue,
          orders,
          customers: uniqueCustomers,
          avgOrderValue: orders > 0 ? revenue / orders : 0
        });
      }

      // Get last 7 days sales data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: weeklyBills } = await supabase
        .from('bills')
        .select('totalAmount, customerId, createdAt')
        .gte('createdAt', sevenDaysAgo.toISOString());

      if (weeklyBills) {
        const dailyData: { [key: string]: { revenue: number; orders: number; customers: Set<string> } } = {};
        
        weeklyBills.forEach(bill => {
          const date = bill.createdAt.split('T')[0];
          if (!dailyData[date]) {
            dailyData[date] = { revenue: 0, orders: 0, customers: new Set() };
          }
          dailyData[date].revenue += bill.totalAmount || 0;
          dailyData[date].orders += 1;
          if (bill.customerId) dailyData[date].customers.add(bill.customerId);
        });

        const chartData = Object.entries(dailyData).map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: data.revenue,
          orders: data.orders,
          customers: data.customers.size
        }));

        setSalesData(chartData);
      }

      // Get top selling items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_items (name, price)
        `)
        .gte('createdAt', sevenDaysAgo.toISOString());

      if (orderItems) {
        const itemStats: { [key: string]: { quantity: number; revenue: number } } = {};
        
        orderItems.forEach(item => {
          if (item.menu_items) {
            const name = item.menu_items.name;
            if (!itemStats[name]) {
              itemStats[name] = { quantity: 0, revenue: 0 };
            }
            itemStats[name].quantity += item.quantity;
            itemStats[name].revenue += item.quantity * (item.menu_items.price || 0);
          }
        });

        const topItemsData = Object.entries(itemStats)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        setTopItems(topItemsData);
      }

      // Get business unit performance
      const { data: unitBills } = await supabase
        .from('bills')
        .select('totalAmount, businessUnit')
        .gte('createdAt', sevenDaysAgo.toISOString());

      if (unitBills) {
        const unitStats: { [key: string]: { revenue: number; orders: number } } = {};
        
        unitBills.forEach(bill => {
          const unit = bill.businessUnit || 'Unknown';
          if (!unitStats[unit]) {
            unitStats[unit] = { revenue: 0, orders: 0 };
          }
          unitStats[unit].revenue += bill.totalAmount || 0;
          unitStats[unit].orders += 1;
        });

        const unitData = Object.entries(unitStats).map(([unit, stats], index) => ({
          unit,
          revenue: stats.revenue,
          orders: stats.orders,
          color: COLORS[index % COLORS.length]
        }));

        setBusinessUnits(unitData);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayStats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.customers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayStats.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="items">Top Items</TabsTrigger>
          <TabsTrigger value="units">Business Units</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Revenue Trend</CardTitle>
              <CardDescription>Daily revenue and order count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue (₹)" />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Most popular items in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Unit Performance</CardTitle>
              <CardDescription>Revenue distribution across business units</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={businessUnits}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ unit, revenue }) => `${unit}: ₹${revenue.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {businessUnits.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}