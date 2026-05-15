"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  DollarSign, 
  Receipt, 
  Package, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import { StaffManagement } from '@/components/staff/StaffManagement';
import { getStaffSummary } from '@/actions/staff';
import { getAttendanceSummary, getTodayAttendance } from '@/actions/attendance';
import { getSalarySummary, getAdvanceRequests } from '@/actions/salary';
import { getExpenseSummary, getProfitabilityAnalysis } from '@/actions/expenses';
import { getInventorySummary, getLowStockItems } from '@/actions/inventory';

export function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    staff: { totalEmployees: 0, presentToday: 0, absentToday: 0, onBreak: 0 },
    attendance: { date: '', totalPresent: 0, totalAbsent: 0, totalLate: 0, averageHours: 0 },
    salary: { month: '', totalPayroll: 0, pendingPayments: 0, advancesPaid: 0, totalDeductions: 0 },
    expenses: { month: '', totalExpenses: 0, byCategory: {}, pendingApprovals: 0 },
    inventory: { totalItems: 0, lowStockItems: 0, outOfStockItems: 0, totalValue: 0 },
    profitability: { month: '', totalRevenue: 0, totalCosts: 0, grossProfit: 0, profitMargin: 0 }
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [pendingAdvances, setPendingAdvances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const [
        staffData,
        attendanceData,
        salaryData,
        expenseData,
        inventoryData,
        profitabilityData,
        lowStock,
        advances
      ] = await Promise.all([
        getStaffSummary(),
        getAttendanceSummary(),
        getSalarySummary(currentMonth),
        getExpenseSummary(currentMonth),
        getInventorySummary(),
        getProfitabilityAnalysis(currentMonth),
        getLowStockItems(),
        getAdvanceRequests(undefined, 'pending')
      ]);

      setDashboardData({
        staff: staffData,
        attendance: attendanceData,
        salary: salaryData,
        expenses: expenseData,
        inventory: inventoryData,
        profitability: profitabilityData
      });

      setLowStockItems(lowStock);
      setPendingAdvances(advances);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Management</h1>
        <p className="text-muted-foreground">
          Comprehensive staff, attendance, salary, expense, and inventory management
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.staff.totalEmployees}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.staff.presentToday} present today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.salary.totalPayroll)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(dashboardData.salary.pendingPayments)} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.expenses.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.expenses.pendingApprovals} pending approvals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(dashboardData.inventory.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.inventory.lowStockItems} items low stock
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profitability Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Profitability Overview
              </CardTitle>
              <CardDescription>
                Current month financial performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData.profitability.totalRevenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Costs</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(dashboardData.profitability.totalCosts)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Gross Profit</p>
                  <p className={`text-2xl font-bold ${dashboardData.profitability.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboardData.profitability.grossProfit)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className={`text-2xl font-bold ${dashboardData.profitability.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.profitability.profitMargin}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts and Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockItems.length > 0 ? (
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.currentStock} {item.unit} remaining
                          </p>
                        </div>
                        <Badge variant="destructive">Low Stock</Badge>
                      </div>
                    ))}
                    {lowStockItems.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{lowStockItems.length - 5} more items
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All items well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Advance Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Pending Advance Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAdvances.length > 0 ? (
                  <div className="space-y-2">
                    {pendingAdvances.slice(0, 5).map((advance: any) => (
                      <div key={advance.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">Employee {advance.employeeId}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(advance.amount)}
                          </p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    ))}
                    {pendingAdvances.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{pendingAdvances.length - 5} more requests
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('staff')}
                >
                  <Users className="h-6 w-6" />
                  Manage Staff
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('attendance')}
                >
                  <Clock className="h-6 w-6" />
                  View Attendance
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('expenses')}
                >
                  <Receipt className="h-6 w-6" />
                  Add Expense
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('inventory')}
                >
                  <Package className="h-6 w-6" />
                  Update Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <StaffManagement />
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Management</CardTitle>
              <CardDescription>
                Track employee attendance, clock-in/out, and working hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Attendance System</h3>
                <p className="text-muted-foreground">
                  Attendance management component will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary Management</CardTitle>
              <CardDescription>
                Manage payroll, advance requests, and salary calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Salary System</h3>
                <p className="text-muted-foreground">
                  Salary management component will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expense Management</CardTitle>
              <CardDescription>
                Track business expenses, approvals, and profitability analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Expense System</h3>
                <p className="text-muted-foreground">
                  Expense management component will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Manage stock levels, track movements, and monitor low stock alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inventory System</h3>
                <p className="text-muted-foreground">
                  Inventory management component will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}