"use client";

import React, { useState, useEffect } from "react";
import { requireAuth } from "@/lib/auth-helpers";
import { getBills } from "@/actions/billing";
;

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Printer, IndianRupee, Calendar, Clock, User, Building2, Download, Upload, RefreshCw } from "lucide-react";
import ReprintBill from "@/components/billing/ReprintBill";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

type Bill = {
  id: string;
  billNumber: string;
  orderId: string;
  businessUnit: string;
  customerName?: string;
  customerMobile?: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod?: string;
  paymentStatus: string;
  source?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
};

export default function BarBillingPage() {
  const { data: session } = useSupabaseSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBills, setSelectedBills] = useState<string[]>([]);
  
  // Create ref for file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Check if user has permission to access bar billing
  const allowedRoles = ['super_admin', 'owner', 'bar_manager', 'bartender'];
  const userRole = session?.user?.role || "";
  const userBusinessUnit = session?.user?.businessUnit || "";
  const isAuthorized = allowedRoles.includes(userRole) && userBusinessUnit === 'bar';
  
  useEffect(() => {
    if (isAuthorized) {
      loadBills();
    }
  }, [isAuthorized]);

  const loadBills = async () => {
    setLoading(true);
    try {
      // Get bills for the bar business unit only
      const data = await getBills("bar");
      setBills(data);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBillSelection = (billId: string) => {
    setSelectedBills(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBills.length === bills.length && bills.length > 0) {
      setSelectedBills([]);
    } else {
      setSelectedBills(bills.map(bill => bill.id));
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(bills, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bar-bills-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        // For now, just show an alert that import is not fully implemented
        alert('Import functionality would be implemented here. In a real application, this would parse and import the bills.');
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#EF4444]">Access Denied</h2>
          <p className="text-[#6B7280] mt-2">You don't have permission to view bar billing.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D5DFB] mx-auto"></div>
          <p className="mt-4 text-[#6B7280]">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bar Billing</h2>
          <p className="text-muted-foreground">
            Manage bar bills and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToJSON}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={triggerFileInput}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadBills}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={importFromJSON}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBills.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-lg">
          <div className="text-sm text-[#111827]">
            {selectedBills.length} bill{selectedBills.length !== 1 ? 's' : ''} selected
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            className="bg-[#EF4444] hover:bg-[#DC2626]"
          >
            Delete Selected
          </Button>
        </div>
      )}

      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">
            Bar Bills
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({bills.length} {bills.length === 1 ? 'bill' : 'bills'})
            </span>
          </h2>
        </div>
        <div className="p-8">
          {bills.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="mx-auto h-12 w-12 text-[#9CA3AF]" />
              <h3 className="mt-2 text-sm font-medium text-[#111827]">
                No bills found
              </h3>
              <p className="mt-1 text-sm text-[#9CA3AF]">
                Bar bills will appear here once payments are completed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedBills.length === bills.length && bills.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-[var(--glass-border)] text-[#6D5DFB] focus:ring-[#6D5DFB]"
                      />
                    </TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id} className="hover:bg-[#F8FAFC]">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedBills.includes(bill.id)}
                          onChange={() => toggleBillSelection(bill.id)}
                          className="h-4 w-4 rounded border-[#9CA3AF] text-[#6D5DFB] focus:ring-[#6D5DFB]"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-[#9CA3AF]">
                          <Calendar className="h-4 w-4" />
                          {bill.createdAt ? format(new Date(bill.createdAt), 'dd/MM/yyyy') : 'N/A'}
                          <Clock className="h-4 w-4 ml-2" />
                          {bill.createdAt ? format(new Date(bill.createdAt), 'HH:mm') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-4 w-4 text-[#9CA3AF]" />
                          <div>
                            <div>{bill.customerName || 'Guest'}</div>
                            {bill.customerMobile && (
                              <div className="text-xs text-[#9CA3AF]">
                                {bill.customerMobile}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">₹{bill.grandTotal?.toFixed(2) || '0.00'}</div>
                        {bill.discountAmount > 0 && (
                          <div className="text-xs text-[#22C55E]">
                            (-₹{bill.discountAmount.toFixed(2)})
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={bill.paymentStatus === 'paid' ? 'default' : 'secondary'}
                          className={bill.paymentStatus === 'paid' ? 'bg-[#BBF7D0] text-green-800' : 'bg-[#F59E0B]/10 text-[#F59E0B]800'}
                        >
                          {bill.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ReprintBill bill={bill} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

