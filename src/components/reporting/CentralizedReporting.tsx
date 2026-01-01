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

  const loadReportData = async ({
    setLoading(true);
    
    try {
      // Fetch real report data from API
      const response = await fetc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          period: selectedPeriod, 
          businessUnit: selectedBusinessUnit 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data.reportData;
      setKpis(data.kpis || []);
    } catch (error) {
      console.error('Failed to fetch r);
      // Set empty state for uction
      setReportData([]);
      setKpis([
        { name: 'Total Revenue', value: 0, change: 0, unit: ,
        { name: 'Total Orders', value: 0, change: 0, unit: '' },
        { name: 'Active Customers', value: 0, change: 0, unit: '' },
        { name: 'Prof
        { nam
        { name: 'Inventory Turnover', value: 0, c }
      ]);
    } finally {
      setLoading(false);
    }
  };


    return bu.replace('_', 'e());
  };

  co{
'en-IN', {
      style: 'currency',
      currency: 'INR'
    );
  };

  const formatNumber = (value: number) => {
    return new Intl.Numb;
  };

  if {
rn (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-</div>
    p>
v>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* He
      
   
1>
          </p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            cl6D5DFB]"
        
            <option value="week">Last 4 option>
            <optin>
            <option value="year">Lon>
          </select>
          
          <elect
            value={selectedBusinessUnit}
            onChange={(e) => setSelectedBusinessUnit(e.ta
            className="px-4 py-2 border border-[#9CA3AF]
          >
          
            <optin>
            <option value="restaurant">R
            <option value="bar">Bar</option>
            <option value="hotel">Hotel</option>
           
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((> (
          <div6">
            
>
                <p clas</p>
                <p className="text-2xl font-bold text-[#111827]">
                  {kpi.unit === '₹': 
                   kpi.unit === '%' ? `${kpi.value}%` :
                   formatNumber(kpi.value)}
                </p>
                <div className="flex items-center mt-1">
                  <svg 
                    className={`w-4 h-4 mr-1 ${kpi.change >= 0 ? '
                    fill="none" 
                    stroke="currentColor" 
                    "
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinend" 
                      strokeWidth={2} 
                      d={kpi.change >= 7V3"}
                   
                  </svg>
                  <span className={`text-sm >
                    {Math.abs(kpi.change)}% fd
                  </span>
                </div>
              </div>
              <div classd-lg">
                <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Ch*/}
      <div classNar">
        <div cla
          </h3>
          <p/p>
>
        <div className="p-4
          {reportData.length > 0 ? (
            <div className="h-64 flex d-lg">
              <div className="text-center">
                <svg className="w-12 h-12 text-[#9CA3AF] mx-auto mb-2" fill="none" 
              2-2z" />
                </svg>
                <p className="text-[#9CA3AF]">Chart visualization would go here</p>
                <p className="text-sm texme</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-[#F8FAFC] rog">
              <div className="text-center">
                <s">
                " />
                </svg>
            </p>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white roundr">
        <div className="p-4 border-b">
          <h3 clash3>
          <p className="text-sm text-[#6B7280]">Business unit performance metrics</p>
        </div>
        <div className="overflow-x-auto">
          {reportData.length > 0 ? (
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Business </th>
                  <>
                  <ters</th>
                  <th className="px-4 py-3 text-left texh>
                  <th className="px-4 py-3 text-left text-xs
                  <th className=>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3h>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-[#111827]">{row.period}</td>
                    <td className="px-4 py-3 text-sm text-[#111827]">{getBusinessUnitLabel(row.businessUnit)}</td>
                    <}</td>
                 )}</td>
                    s)}</td>
                  d>
              >
            td>
          %'}</td>
    >
 ))}
dy>
);
}v>
  </di      </div>
 /div>
        <
         )}v>
          </di>
      /pte reports.<s to generaperation business ogingnaers and maordssing oceStart pr]">t-[#6B7280e="tex<p classNam       3>
       /ha<o Report Dat7] mb-2">Nxt-[#11182um tent-meditext-lg fo="className       <h3       g>
   </sv        
    >1-2-2z" /a2 2 0 02 2h-2a2 2 0 01- 012 2v14h2a2 2 02 2 0 012-2 0V5a002-2m0 0 002 2h2a2 2 2 0 0a22v10m-6 012 2 2 0 2a 0 012-2hV9a2 22zm0 0 002- 2 0 2h2a26a2 2 0 002-2 2v 2 0 002H5a200-2- 0 9v-6a2 2} d="M9 1okeWidth={2 strnd"nejoin="roueLiound" strok"rinecap= strokeL<path               24">
 x="0 0 24  viewBoor"Colrrentstroke="cunone" ll="o mb-4" fi3AF] mx-aut9CAext-[#2 t"w-12 h-1lassName=<svg c      
        nter">8 text-ceme="p-sNav clas<di       : (
     )       ble>
       </ta         