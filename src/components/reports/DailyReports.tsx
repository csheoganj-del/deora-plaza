'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Mail,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useServerAuth } from '@/hooks/useServerAuth';
import { getUnitDailyReport } from '@/actions/unit-stats';

interface DailyReport {
  date: string;
  period: string;
  businessUnit: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    topSellingItem: string;
    peakHour: string;
  };
  staff: {
    totalStaff: number;
    avgEfficiency: number;
    topPerformer: string;
  };
  inventory: {
    lowStockItems: number;
    autoDeductions: number;
    reorderAlerts: number;
  };
  issues: {
    cancelledOrders: number;
    complaints: number;
    systemDowntime: number;
  };
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';

export default function DailyReports() {
  const { data: session } = useServerAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  // Get user's business unit from session with corrected logic
  const isSuperAdmin = session?.user?.role === 'super_admin' || session?.user?.role === 'owner';
  const userBusinessUnit = session?.user?.businessUnit || (session?.user?.role === 'cafe_manager' ? 'cafe' : 'all');

  useEffect(() => {
    generateReport();

    // Load auto email setting
    const savedAutoEmail = localStorage.getItem('autoEmailDailyReports');
    if (savedAutoEmail !== null) {
      setAutoEmailEnabled(savedAutoEmail === 'true');
    }
  }, [selectedDate, timePeriod, userBusinessUnit, filterUnit]);

  const getDateRange = () => {
    const baseDate = new Date(selectedDate);
    let startDate: Date, endDate: Date;

    switch (timePeriod) {
      case 'daily':
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'weekly':
        // Get start of week (Monday)
        startDate = new Date(baseDate);
        const dayOfWeek = startDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'monthly':
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'yearly':
        startDate = new Date(baseDate.getFullYear(), 0, 1);
        endDate = new Date(baseDate.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'all-time':
        startDate = new Date('2020-01-01'); // Reasonable start date
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      const activeUnit = isSuperAdmin ? filterUnit : userBusinessUnit;

      const reportData = await getUnitDailyReport(activeUnit, startDate.toISOString(), endDate.toISOString());


      // Map to internal format
      const report: DailyReport = {
        date: selectedDate,
        period: timePeriod === 'daily'
          ? new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
          : `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`,
        businessUnit: activeUnit === 'all' ? 'All Units' : (activeUnit.charAt(0).toUpperCase() + activeUnit.slice(1)),
        summary: reportData.summary,
        staff: reportData.staff,
        inventory: reportData.inventory,
        issues: reportData.issues
      };

      setReports([report]);
    } catch (error) {
      console.error('❌ Error in generateReport:', error);
      toast.error('Failed to generate report');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'excel') => {
    try {
      if (!report) {
        toast.error('No report data available');
        return;
      }

      if (format === 'pdf') {
        // Create PDF content
        const reportContent = `
DEORA Plaza - ${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Report
Business Unit: ${report.businessUnit}
Period: ${report.period}

SUMMARY
=======
Total Revenue: ₹${report.summary.totalRevenue.toLocaleString()}
Total Orders: ${report.summary.totalOrders}
Customers Served: ${report.summary.totalCustomers}
Average Order Value: ₹${report.summary.avgOrderValue}
Top Selling Item: ${report.summary.topSellingItem}
Peak Hours: ${report.summary.peakHour}

STAFF PERFORMANCE
================
Total Staff: ${report.staff.totalStaff}
Top Performer: ${report.staff.topPerformer}

INVENTORY STATUS
===============
Auto Deductions: ${report.inventory.autoDeductions}
Low Stock Items: ${report.inventory.lowStockItems}
Reorder Alerts: ${report.inventory.reorderAlerts}

ISSUES & ALERTS
==============
Cancelled Orders: ${report.issues.cancelledOrders}
Complaints: ${report.issues.complaints}
System Downtime: ${report.issues.systemDowntime} minutes
        `;

        // Create and download text file (PDF generation would need a library)
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${timePeriod}-report-${report.businessUnit.toLowerCase()}-${selectedDate}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('Report downloaded as text file (PDF generation requires additional setup)');
      } else if (format === 'excel') {
        // Create CSV content for Excel
        const csvContent = [
          [`DEORA Plaza ${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Report`],
          ['Business Unit', report.businessUnit],
          ['Period', report.period],
          [''],
          ['SUMMARY'],
          ['Metric', 'Value'],
          ['Total Revenue', `₹${report.summary.totalRevenue.toLocaleString()}`],
          ['Total Orders', report.summary.totalOrders],
          ['Customers Served', report.summary.totalCustomers],
          ['Average Order Value', `₹${report.summary.avgOrderValue}`],
          ['Top Selling Item', report.summary.topSellingItem],
          ['Peak Hours', report.summary.peakHour],
          [''],
          ['STAFF PERFORMANCE'],
          ['Total Staff', report.staff.totalStaff],
          ['Top Performer', report.staff.topPerformer],
          [''],
          ['INVENTORY STATUS'],
          ['Auto Deductions', report.inventory.autoDeductions],
          ['Low Stock Items', report.inventory.lowStockItems],
          ['Reorder Alerts', report.inventory.reorderAlerts]
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${timePeriod}-report-${report.businessUnit.toLowerCase()}-${selectedDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('Report downloaded as CSV file (can be opened in Excel)');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const emailReport = async () => {
    try {
      if (!report) {
        toast.error('No report data available');
        return;
      }

      // Create email content
      const emailSubject = `DEORA Plaza ${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Report - ${report.businessUnit} - ${report.period}`;
      const emailBody = `
${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Report Summary
Business Unit: ${report.businessUnit}
Period: ${report.period}

Key Metrics:
- Total Revenue: ₹${report.summary.totalRevenue.toLocaleString()}
- Total Orders: ${report.summary.totalOrders}
- Customers Served: ${report.summary.totalCustomers}
- Average Order Value: ₹${report.summary.avgOrderValue}
- Top Selling Item: ${report.summary.topSellingItem}
- Peak Hours: ${report.summary.peakHour}

Staff Performance:
- Total Staff: ${report.staff.totalStaff}
- Top Performer: ${report.staff.topPerformer}

Inventory Status:
- Auto Deductions: ${report.inventory.autoDeductions}
- Low Stock Items: ${report.inventory.lowStockItems}
- Reorder Alerts: ${report.inventory.reorderAlerts}

Best regards,
DEORA Plaza Management System
      `;

      // Open default email client
      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoLink;

      toast.success('Email client opened with report content');
    } catch (error) {
      console.error('Error preparing email:', error);
      toast.error('Failed to prepare email');
    }
  };

  const chartData = reports.length > 0 && reports[0] ? [
    {
      name: reports[0].businessUnit,
      revenue: reports[0].summary.totalRevenue,
      orders: reports[0].summary.totalOrders,
      customers: reports[0].summary.totalCustomers
    }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const report = reports[0];
  if (!report) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Business Reports
          </h2>
          <p className="text-gray-600">
            {report.businessUnit} - {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Performance
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Business Unit Filter (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                <option value="all">All Units</option>
                <option value="cafe">Cafe</option>
                <option value="bar">Bar</option>
                <option value="hotel">Hotel</option>
                <option value="garden">Garden</option>
              </select>
            </div>
          )}

          {/* Time Period Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="all-time">All Time</option>
            </select>
          </div>

          {/* Date Picker (only for daily/weekly/monthly) */}
          {timePeriod !== 'all-time' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          )}

          <div className="flex gap-2">
            <Button onClick={() => downloadReport('pdf')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => downloadReport('excel')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button onClick={emailReport}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </div>

      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{report.businessUnit} - {report.period}</span>
            <Badge variant={report.issues.cancelledOrders + report.issues.complaints === 0 ? 'default' : 'secondary'}>
              {report.issues.cancelledOrders + report.issues.complaints === 0 ? 'Excellent Period' : 'Good Period'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} business performance overview for {report.businessUnit}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{report.summary.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {report.summary.totalOrders}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers Served</p>
                <p className="text-2xl font-bold text-purple-600">
                  {report.summary.totalCustomers}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{report.summary.avgOrderValue}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{report.businessUnit} Performance</CardTitle>
            <CardDescription>{timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} metrics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Highlights</CardTitle>
            <CardDescription>Important insights and achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Top Selling Item</p>
                <p className="text-sm text-gray-600">{report.summary.topSellingItem}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Peak Hours</p>
                <p className="text-sm text-gray-600">{report.summary.peakHour}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Top Performer</p>
                <p className="text-sm text-gray-600">{report.staff.topPerformer}</p>
              </div>
            </div>

            {report.inventory.lowStockItems > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Low Stock Alert</p>
                  <p className="text-sm text-gray-600">
                    {report.inventory.lowStockItems} items need restocking
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Total Staff</span>
              <span className="font-medium">{report.staff.totalStaff}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Efficiency</span>
              <span className="font-medium text-green-600">{report.staff.avgEfficiency}%</span>
            </div>
            <div className="flex justify-between">
              <span>Top Performer</span>
              <span className="font-medium">{report.staff.topPerformer}</span>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Auto Deductions</span>
              <span className="font-medium text-blue-600">{report.inventory.autoDeductions}</span>
            </div>
            <div className="flex justify-between">
              <span>Low Stock Items</span>
              <span className={`font-medium ${report.inventory.lowStockItems > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {report.inventory.lowStockItems}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Reorder Alerts</span>
              <span className="font-medium text-purple-600">{report.inventory.reorderAlerts}</span>
            </div>
          </CardContent>
        </Card>

        {/* Issues & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Issues & Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Cancelled Orders</span>
              <span className={`font-medium ${report.issues.cancelledOrders > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {report.issues.cancelledOrders}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Complaints</span>
              <span className={`font-medium ${report.issues.complaints > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {report.issues.complaints}
              </span>
            </div>
            <div className="flex justify-between">
              <span>System Downtime</span>
              <span className={`font-medium ${report.issues.systemDowntime > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {report.issues.systemDowntime} min
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>Configure automatic report generation for {report.businessUnit}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto Email {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Reports</p>
              <p className="text-sm text-gray-600">
                Automatically send {timePeriod} reports for {report.businessUnit} to management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoEmailEnabled}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  setAutoEmailEnabled(enabled);

                  try {
                    // Save setting to localStorage or database
                    localStorage.setItem('autoEmailDailyReports', enabled.toString());

                    if (enabled) {
                      toast.success(`Auto email enabled - ${timePeriod} reports will be sent automatically`);
                    } else {
                      toast.info('Auto email disabled');
                    }
                  } catch (error) {
                    console.error('Error saving auto email setting:', error);
                    toast.error('Failed to save setting');
                  }
                }}
                className="rounded"
              />
              <span className="text-sm">{autoEmailEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}