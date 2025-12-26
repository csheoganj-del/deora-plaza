"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QROrderingInterface } from "@/components/qr-ordering/QROrderingInterface";
import { qrCodeManager, QRGeneratedOrder } from "@/lib/qr-code";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function QROrderPage({ params }: { params: { qrData: string } }) {
  const router = useRouter();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateQRCode = () => {
      try {
        const decodedData = qrCodeManager.decodeQRData(params.qrData);
        if (!decodedData) {
          setError('Invalid QR code format');
          setIsValid(false);
          return;
        }

        const isValidData = qrCodeManager.validateQRData(decodedData);
        if (!isValidData) {
          setError('QR code is expired or invalid');
          setIsValid(false);
          return;
        }

        // Track the scan
        qrCodeManager.trackQRScan(decodedData.tableId, decodedData.businessUnit);
        setIsValid(true);

      } catch (err) {
        setError('Failed to process QR code');
        setIsValid(false);
      }
    };

    validateQRCode();
  }, [params.qrData]);

  const handleOrderComplete = (order: QRGeneratedOrder) => {
    // In a real app, this would handle order completion
    console.log('Order completed:', order);
    
    // Redirect to confirmation page
    router.push(`/qr-order/confirmation?orderId=${order.sessionId}`);
  };

  if (isValid === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div id="main" className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Validating QR code...</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div id="main" className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 max-w-md">
            <div className="text-[#EF4444] mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">Invalid QR Code</h2>
            <p className="text-[#6B7280] mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#6D5DFB] text-white rounded hover:bg-[#6D5DFB]/90 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div id="main" className="flex-1">
        <QROrderingInterface 
          qrData={params.qrData} 
          onOrderComplete={handleOrderComplete}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
