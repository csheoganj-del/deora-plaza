"use client";

import { useState } from "react";
import { BillGenerator } from "@/components/billing/BillGenerator";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export default function BillingPage() {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing Management</h1>
          <p className="text-sm text-gray-400">Generate bills and manages receipts</p>
        </div>
      </div>

      {showGenerator && selectedOrder ? (
        <BillGenerator
          order={selectedOrder}
          onClose={() => setShowGenerator(false)}
          onBillGenerated={() => setShowGenerator(false)}
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Billing Center</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            Select an active order from Tables or Orders dashboard to generate a bill.
          </p>
          <Button onClick={() => (window.location.href = "/dashboard/tables")}>
            Go to Tables
          </Button>
        </div>
      )}
    </div>
  );
}
