"use client";

import { QROrderConfirmation } from "@/components/qr-ordering/QROrderConfirmation";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function QROrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <QROrderConfirmation />
      </div>
      <SiteFooter />
    </div>
  );
}

