"use client";

import { useState, useEffect } from "react";
import { TableQRCode, qrCodeManager } from "@/lib/qr-code";
import { BusinessUnitType } from "@/lib/business-units";

interface QRCodeDisplayProps {
  tableId: string;
  businessUnit: BusinessUnitType;
  restaurantId: string;
  className?: string;
}

export function QRCodeDisplay({ tableId, businessUnit, restaurantId, className = "" }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<TableQRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const qrCodeData = await qrCodeManager.generateQRCodeImage(
          qrCodeManager.generateQRCodeUrl(tableId, businessUnit, restaurantId)
        );
        
        const newQRCode: TableQRCode = {
          id: `qr_${tableId}_${Date.now()}`,
          tableNumber: tableId,
          businessUnit,
          qrCodeData: qrCodeManager.generateQRCodeData(tableId, businessUnit, restaurantId),
          qrCodeUrl: qrCodeManager.generateQRCodeUrl(tableId, businessUnit, restaurantId),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          scanCount: 0
        };
        
        setQrCode(newQRCode);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate QR code");
      } finally {
        setLoading(false);
      }
    };

    generateQRCode();
  }, [tableId, businessUnit, restaurantId]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border rounded-lg bg-[#F8FAFC] ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D5DFB] mb-4"></div>
        <p className="text-[#6B7280]">Generating QR Code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-[#FEE2E2] ${className}`}>
        <div className="text-[#EF4444] mb-2">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[#DC2626] font-medium">Error</p>
        <p className="text-[#EF4444] text-sm">{error}</p>
      </div>
    );
  }

  if (!qrCode) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center p-6 border rounded-lg bg-white shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#111827] text-center">
          Table {qrCode.tableNumber}
        </h3>
        <p className="text-sm text-[#6B7280] text-center capitalize">
          {qrCode.businessUnit} Ordering
        </p>
      </div>
      
      <div className="relative mb-4">
        <div className="w-48 h-48 bg-white p-2 border-2 border-[#9CA3AF] rounded-lg">
          <img 
            src={qrCode.qrCodeUrl} 
            alt={`QR Code for Table ${qrCode.tableNumber}`}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="absolute -top-2 -right-2 bg-[#DCFCE7]0 text-white rounded-full p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-[#9CA3AF]">
          Scan to order from your table
        </p>
        <div className="flex items-center space-x-4 text-xs text-[#9CA3AF]">
          <span>Created: {new Date(qrCode.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>Scans: {qrCode.scanCount}</span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.download = `qr-table-${qrCode.tableNumber}.png`;
            link.href = qrCode.qrCodeUrl;
            link.click();
          }}
          className="px-3 py-1 text-sm bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90 transition-colors"
        >
          Download
        </button>
        <button
          onClick={() => window.print()}
          className="px-3 py-1 text-sm bg-[#6B7280] text-white rounded hover:bg-[#111827] transition-colors"
        >
          Print
        </button>
      </div>
    </div>
  );
}

interface QRCodeGridProps {
  tables: Array<{ id: string; number: string; businessUnit: BusinessUnitType }>;
  restaurantId: string;
  className?: string;
}

export function QRCodeGrid({ tables, restaurantId, className = "" }: QRCodeGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {tables.map((table) => (
        <QRCodeDisplay
          key={table.id}
          tableId={table.id}
          businessUnit={table.businessUnit}
          restaurantId={restaurantId}
        />
      ))}
    </div>
  );
}

