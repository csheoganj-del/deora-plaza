"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
;


export default function InventoryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Inventory</h1>
        <p className="text-[#9CA3AF] text-sm">
          Manage inventory items and stock levels
        </p>
      </div>

      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Inventory Management</h2>
        </div>
        <div className="p-8">
          <p className="text-[#6B7280]">
            Inventory functionality is being restored. Please check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}

