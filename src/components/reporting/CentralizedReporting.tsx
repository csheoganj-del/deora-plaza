"use client";

import { useState, useEffect } from "react";
import { BusinessUnitType } from "@/lib/business-units";

interface ReportData {
  period: string;
  businessUnit: string;
  revenue: number;
  orders: number;
  customers: number;
  staffCost: number;
  inventoryCost: number;
  profit: number;
}

interface KPIData {
  name: string;
  value: number;
  change: number;
  unit: string;
}

export function CentralizedReporting() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnitType | 'all'>('all');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [kpis, setKpis] = useState<KPIData[]>([]);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod, selectedBusinessUnit]);

  const loadReportData = () => {
    setLoading(true);
    
    // Mock data generation
    const mockData: ReportData[] = [];
    const mockKPIs: KPIData[] = [
      { name: 'Total Revenue', value: 125000, change: 12.5, unit: '$' },
      { name: 'Total Orders', value: 3450, change: 8.2, unit: '' },
      { name: 'Active Customers', value: 1250, change: 15.3, unit: '' },
      { name: 'Profit Margin', value: 23.5, change: 2.1, unit: '%' },
      { name: 'Staff Utilization', value: 87.2, change: -1.5, unit: '%' },
      { name: 'Inventory Turnover', value: 4.2, change: 0.8, unit: 'x' }
    ];

    // Generate sample report data
    const businessUnits = ['CAFE', 'RESTAURANT', 'BAR', 'HOTEL', 'MARRIAGE_GARDEN'];
    const periods = selectedPeriod === 'week' ? 4 : selectedPeriod === 'month' ? 12 : 24;
    
    for (let i = 0; i < periods; i++) {
      businessUnits.forEach(bu => {
        if (selectedBusinessUnit === 'all' || selectedBusinessUnit === bu) {
          mockData.push({
            period: `Period ${i + 1}`,
            businessUnit: bu,
            revenue: Math.floor(Math.random() * 50000) + 10000,
            orders: Math.floor(Math.random() * 500) + 100,
            customers: Math.floor(Math.random() * 200) + 50,
            staffCost: Math.floor(Math.random() * 15000) + 5000,
            inventoryCost: Math.floor(Math.random() * 10000) + 2000,
            profit: 0
          });
          mockData[mockData.length - 1].profit = 
            mockData[mockData.length - 1].revenue - 
            mockData[mockData.length - 1].staffCost - 
            mockData[mockData.length - 1].inventoryCost;
        }
      });
    }

    setReportData(mockData);
    setKpis(mockKPIs);
    setLoading(false);
  };

  const getBusinessUnitLabel = (bu: string) => {
    return bu.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading report data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Centralized Reporting</h1>
          <p className="text-[#6B7280]">Comprehensive analytics across all business units</p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          >
            <option value="week">Last 4 Weeks</option>
            <option value="month">Last 12 Months</option>
            <option value="year">Last 24 Months</option>
          </select>
          
          <select
            value={selectedBusinessUnit}
            onChange={(e) => setSelectedBusinessUnit(e.target.value as BusinessUnitType | 'all')}
            className="px-4 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
          >
            <option value="all">All Business Units</option>
            <option value={BusinessUnitType.CAFE}>Cafe</option>
            <option value={BusinessUnitType.RESTAURANT}>Restaurant</option>
            <option value={BusinessUnitType.BAR}>Bar</option>
            <option value={BusinessUnitType.HOTEL}>Hotel</option>
            <option value={BusinessUnitType.MARRIAGE_GARDEN}>Marriage Garden</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">{kpi.name}</p>
                <p className="text-2xl font-bold text-[#111827]">
                  {kpi.unit === '$' ? formatCurrency(kpi.value) : 
                   kpi.unit === '%' ? `${kpi.value}%` :
                   formatNumber(kpi.value)}
                </p>
                <div className="flex items-center mt-1">
                  <svg 
                    className={`w-4 h-4 mr-1 ${kpi.change >= 0 ? 'text-[#DCFCE7]0' : 'text-[#FEE2E2]0'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d={kpi.change >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
                    />
                  </svg>
                  <span className={`text-sm ${kpi.change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {Math.abs(kpi.change)}% from last period
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
                <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h4V9H4v10zm6 0h4V5h-4v14zm6 0h4V13h-4v6z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Revenue Analysis</h3>
          <p className="text-sm text-[#6B7280]">Revenue trends by business unit</p>
        </div>
        <div className="p-4">
          <div className="h-64 flex items-center justify-center bg-[#F8FAFC] rounded-lg">
            <div className="text-center">
              <svg className="w-12 h-12 text-[#9CA3AF] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-[#9CA3AF]">Chart visualization would go here</p>
              <p className="text-sm text-[#9CA3AF]">Revenue trends over time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Detailed Performance</h3>
          <p className="text-sm text-[#6B7280]">Business unit performance metrics</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Business Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Customers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Staff Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Inventory Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Profit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.slice(0, 10).map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-[#111827]">{row.period}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{getBusinessUnitLabel(row.businessUnit)}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{formatNumber(row.orders)}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{formatNumber(row.customers)}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{formatCurrency(row.staffCost)}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{formatCurrency(row.inventoryCost)}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{formatCurrency(row.profit)}</td>
                  <td className="px-4 py-3 text-sm text-[#111827]">{row.revenue > 0 ? `${((row.profit / row.revenue) * 100).toFixed(1)}%` : '0%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

