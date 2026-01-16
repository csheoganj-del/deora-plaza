'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PremiumLiquidGlass, PremiumStatsCard } from '@/components/ui/glass/premium-liquid-glass';

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

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
              Analytics Dashboard
            </h1>
          </div>
          <div className="text-white/50 mt-1 pl-[3.5rem] flex items-center gap-2">
            <span>Track sales performance, customer trends, and business insights</span>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <PremiumStatsCard
          title="Revenue"
          value={`₹${todayStats.revenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-green-400" />}
          trend={{ value: 0, label: "Today", positive: true }}
        />
        <PremiumStatsCard
          title="Orders"
          value={todayStats.orders.toString()}
          icon={<ShoppingCart className="h-4 w-4 text-blue-400" />}
        />
        <PremiumStatsCard
          title="Customers"
          value={todayStats.customers.toString()}
          icon={<Users className="h-4 w-4 text-purple-400" />}
        />
        <PremiumStatsCard
          title="Avg Order"
          value={`₹${Math.round(todayStats.avgOrderValue).toLocaleString()}`}
          icon={<TrendingUp className="h-4 w-4 text-orange-400" />}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="revenue" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">Revenue Trend</TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">Top Items</TabsTrigger>
          <TabsTrigger value="units" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">Business Units</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <PremiumLiquidGlass title="7-Day Revenue Trend">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#ffffff60" fontSize={12} />
                <YAxis stroke="#ffffff60" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#ffffff20', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} name="Revenue" activeDot={{ r: 6, fill: '#fff' }} />
                <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </PremiumLiquidGlass>
        </TabsContent>

        <TabsContent value="items">
          <PremiumLiquidGlass title="Top Selling Items">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topItems}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
                <YAxis stroke="#ffffff60" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#ffffff20', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="quantity" fill="#8884d8" name="Quantity Sold" radius={[4, 4, 0, 0]}>
                  {topItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </PremiumLiquidGlass>
        </TabsContent>

        <TabsContent value="units">
          <PremiumLiquidGlass title="Business Unit Performance">
            <div className="flex flex-col md:flex-row items-center justify-around">
              <div className="w-full md:w-1/2 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={businessUnits}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ unit, percent }) => `${unit} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {businessUnits.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#1a1a20" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a20', borderColor: '#ffffff20', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                {businessUnits.map((unit, i) => (
                  <div key={unit.unit} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: unit.color }}></div>
                      <span className="text-white font-medium">{unit.unit}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">₹{unit.revenue.toLocaleString()}</div>
                      <div className="text-xs text-white/50">{unit.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PremiumLiquidGlass>
        </TabsContent>
      </Tabs>
    </div>
  );
}