// Print utilities for receipts and invoices

export interface HotelBooking {
  id: string
  customer_name: string
  customer_phone?: string
  room_number: string
  check_in_date: string
  check_out_date: string
  total_amount: number
  advance_paid: number
  balance_amount: number
  status: string
  created_at: string
  payments?: Payment[]
  roomServiceCharges?: any[]
}

export interface GardenBooking {
  id: string
  customerName: string
  customerMobile?: string
  eventType: string
  startDate: string
  endDate: string
  guestCount: number
  basePrice: number
  gstEnabled: boolean
  gstPercentage: number
  discountPercent?: number
  totalAmount: number
  totalPaid: number // Changed from advance_paid to track all payments
  remainingBalance: number
  status: string
  paymentStatus: string
  createdAt: string
  receiptNumber?: string
  notes?: string
  payments?: any[] // Using any to avoid complex nested type matching for now, or define Payment interface better
}

export interface Payment {
  id: string
  amount: number
  payment_method: string
  created_at: string
}

import { getBusinessSettings } from "@/actions/businessSettings";

/**
 * Print hotel booking receipt
 */
export async function printHotelReceipt(booking: HotelBooking | any, settings?: any, type: 'advance' | 'full' = 'full'): Promise<void> {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print receipts')
    return
  }

  // Use provided settings OR fetch dynamically as fallback (for backward compatibility)
  const finalSettings = settings || await getBusinessSettings();
  const receiptHTML = generateHotelReceiptHTML(booking, finalSettings, type)

  printWindow.document.write(receiptHTML)
  printWindow.document.close()

  // Wait for content to load then print
  printWindow.setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

/**
 * Print garden booking receipt
 */
export async function printGardenReceipt(booking: GardenBooking | any, settings?: any): Promise<void> {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print receipts')
    return
  }

  // Use provided settings OR fetch dynamically as fallback
  const finalSettings = settings || await getBusinessSettings();
  const receiptHTML = generateGardenReceiptHTML(booking as any, finalSettings)

  printWindow.document.write(receiptHTML)
  printWindow.document.close()

  // Wait for content to load then print
  printWindow.setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

/**
 * Generate HTML for hotel receipt (Professional A4 Style like Garden)
 */
function generateHotelReceiptHTML(booking: HotelBooking | any, settings?: any, type: 'advance' | 'full' = 'full'): string {

  // --- Formatters ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  // --- Branding Resolution ---
  // Prioritize Hotel specific, then Global, then Default
  // Support both camelCase and snake_case for resiliency
  const hName = settings?.hotelName || settings?.hotel_name;
  const hAddress = settings?.hotelAddress || settings?.hotel_address;
  const hMobile = settings?.hotelMobile || settings?.hotel_mobile;
  const hGst = settings?.hotelGstNumber || settings?.hotel_gst_number || settings?.hotelGst;
  const hEmail = settings?.hotelEmail || settings?.hotel_email;

  const businessName = hName || settings?.name || settings?.businessName || settings?.business_name || "DEORA PLAZA";
  const businessAddress = hAddress || settings?.address || settings?.businessAddress || settings?.business_address || "Kesarpura Road, Sheoganj";
  const businessMobile = hMobile || settings?.mobile || settings?.businessMobile || settings?.business_mobile || "9001160228";
  const businessEmail = hEmail || settings?.email || settings?.businessEmail || settings?.business_email || "contact@deoraplaza.com";
  const businessGST = hGst || settings?.gstNumber || settings?.gst_number || "";

  // Debug info in HTML comment for troubleshooting (like Garden does)
  const debugComment = `<!-- 
    Branding Debug Info:
    Hotel Name: ${hName || 'N/A'}
    Main Name: ${settings?.name || 'N/A'}
    Main (Alt): ${settings?.businessName || 'N/A'}
    Hotel Mobile: ${hMobile || 'N/A'}
    Main Mobile: ${settings?.mobile || 'N/A'}
    Hotel Address: ${hAddress || 'N/A'}
    GST Number: ${hGst || 'N/A'}
    Resolved Name: ${businessName}
    Resolved Address: ${businessAddress}
    Resolved Mobile: ${businessMobile}
    RAW JSON (partial): ${JSON.stringify(settings || {}).slice(0, 500)}
  -->`;

  // --- Financial Calculations ---

  // Ensure we have numbers
  const basePrice = Number(booking.basePrice || booking.total_amount || 0); // fallback if basePrice missing
  const totalAmount = Number(booking.totalAmount || booking.total_amount || 0);
  // Use paidAmount (new field) or fall back to totalPaid or advance_paid
  const totalPaid = Number(booking.paidAmount || booking.totalPaid || booking.paid_amount || booking.advance_paid || 0);

  // Calculate remaining balance - use the field from booking if available
  const remainingBalance = Number(booking.remainingBalance || booking.remaining_balance || (totalAmount - totalPaid));

  // Calculate Discounts
  const discountPercent = Number(booking.discountPercent || 0);
  const discountAmount = (basePrice * discountPercent) / 100;
  const priceAfterDiscount = basePrice - discountAmount;

  // Calculate GST
  const gstEnabled = booking.gstEnabled || false;
  const gstPercentage = Number(booking.gstPercentage || 12); // Default hotel GST usually 12%
  const gstAmount = gstEnabled ? (priceAfterDiscount * gstPercentage) / 100 : 0;

  // Split GST
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  const safeId = (booking.id || "").toString().slice(0, 8).toUpperCase();
  const receiptNo = booking.receiptNumber || `HOT-${safeId || 'NEW'}`;
  const invoiceDate = formatDate(new Date().toISOString());

  // --- Receipt Specific Logic ---
  const isAdvance = type === 'advance';
  const title = isAdvance ? "Advance Payment Receipt" : "Final Tax Invoice";
  const watermarkText = isAdvance ? "ADVANCE" : "PAID";
  const themeColor = isAdvance ? "#b45309" : "#15803d"; // Amber for Advance, Green for Final
  const themeLight = isAdvance ? "#fffbeb" : "#f0fdf4";
  const themeBorder = isAdvance ? "#fcd34d" : "#86efac";

  // Payment we are currently printing (if specific) - simplified logic for now:
  // If 'advance', we emphasize the advance amount.
  // If 'full', we show the full breakdown.

  return `
    ${debugComment}
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title} #${receiptNo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', Helvetica, Arial, sans-serif;
          color: #334155; /* Slate 700 */
          line-height: 1.5;
          margin: 0;
          padding: 20px;
          background: #f8fafc;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page-frame {
          background: white;
          width: 210mm;
          min-height: 297mm; /* A4 */
          margin: 0 auto;
          box-sizing: border-box;
          padding: 40px;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          font-weight: 800;
          color: ${themeColor};
          opacity: 0.05;
          z-index: 0;
          pointer-events: none;
          white-space: nowrap;
          border: 10px solid ${themeColor};
          padding: 20px 50px;
          border-radius: 20px;
        }

        /* Decorative Corners */
        .corner {
          position: absolute;
          width: 50px;
          height: 50px;
          border-color: ${themeColor};
          border-style: solid;
          opacity: 0.6;
        }
        .top-left { top: 20px; left: 20px; border-width: 4px 0 0 4px; }
        .top-right { top: 20px; right: 20px; border-width: 4px 4px 0 0; }
        .bottom-left { bottom: 20px; left: 20px; border-width: 0 0 4px 4px; }
        .bottom-right { bottom: 20px; right: 20px; border-width: 0 4px 4px 0; }

        .header {
          text-align: center;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
          border-bottom: 2px solid ${themeColor};
          padding-bottom: 10px;
        }

        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 800;
          color: ${themeColor};
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .sub-header {
          font-size: 10px;
          color: #64748b;
          margin: 1px 0;
        }

        .invoice-title {
          background: ${themeColor};
          color: white;
          display: inline-block;
          padding: 8px 30px;
          border-radius: 50px;
          margin-top: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }

        .section-box {
          background: #f8fafc;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
          flex: 1;
        }

        .box-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: ${themeColor};
          font-weight: 700;
          margin-bottom: 6px;
          border-bottom: 1px dashed #cbd5e1;
          padding-bottom: 4px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 10px;
        }

        .info-label {
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          font-weight: 600;
          color: #0f172a;
          text-align: right;
        }

        /* Stay Highlights */
        .stay-highlights {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 10px;
          background: linear-gradient(135deg, ${themeColor}15 0%, ${themeColor}05 100%);
          padding: 8px;
          border-radius: 4px;
          border: 1px solid ${themeColor}30;
          position: relative;
          z-index: 1;
        }

        .stay-item {
          text-align: center;
          border-right: 1px solid ${themeBorder};
        }
        .stay-item:last-child { border-right: none; }

        .stay-label {
          font-size: 8px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 2px;
        }
        .stay-value {
          font-size: 10px;
          font-weight: 600;
          color: #1e293b;
        }

        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 13px;
          position: relative;
          z-index: 1;
        }

        th {
          background: ${themeColor};
          color: white;
          padding: 6px 10px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        td {
          padding: 6px 10px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
          font-size: 10px;
        }

        .amount-col {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .total-row td {
          border-top: 2px solid ${themeColor};
          font-weight: 700;
          font-size: 11px;
          color: #0f172a;
          background: #f8fafc;
        }

        .grand-total {
          font-size: 14px;
          color: ${themeColor};
        }

        .terms {
          margin-top: 8px;
          margin-bottom: 8px;
          padding: 8px;
          background: #f8fafc;
          border-left: 2px solid ${themeColor};
          font-size: 8px;
          line-height: 1.3;
        }

        .terms-title {
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .terms-list {
          margin: 0;
          padding-left: 12px;
          color: #64748b;
        }

        .terms-list li {
          margin-bottom: 1px;
        }

        .signatures {
          margin-top: auto; /* Push to bottom */
          margin-bottom: 40px; /* Space for footer */
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }

        .sign-box {
          text-align: center;
          width: 200px; /* Increased width */
        }

        .sign-line {
          border-bottom: 1px solid #94a3b8;
          margin-bottom: 4px;
        }

        .sign-label {
          font-size: 8px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer {
          position: absolute;
          bottom: 15px;
          left: 0;
          width: 100%;
          text-align: center;
          font-size: 8px;
          color: #94a3b8;
        }

        @media print {
          body { 
            background: none; 
            padding: 0; 
            margin: 0;
          }
          .page-frame {
            box-shadow: none;
            width: 100%;
            margin: 0;
            page-break-after: always;
          }
           @page {
             size: A4;
             margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="page-frame">
        <div class="watermark">${watermarkText}</div>
        
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <div class="header">
          <h1 class="logo-text">${businessName}</h1>
          <div class="sub-header">${businessAddress}</div>
          <div class="sub-header">Ph: ${businessMobile} | Email: ${businessEmail}</div>
          ${businessGST ? `<div class="sub-header">GSTIN: ${businessGST}</div>` : ''}
          <div class="invoice-title">${title}</div>
        </div>

        <div class="grid-2">
          <div class="section-box">
            <div class="box-title">Full Guest Details</div>
            <div class="info-row">
              <span class="info-label">Guest Name</span>
              <span class="info-value">${booking.guestName || booking.customer_name || 'Guest'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Mobile No</span>
              <span class="info-value">${booking.customerMobile || booking.customer_phone || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Room No</span>
              <span class="info-value">#${booking.roomNumber || booking.room_number || '-'}</span>
            </div>
          </div>

          <div class="section-box" style="text-align: right;">
            <div class="box-title">Invoice Details</div>
            <div class="info-row">
              <span class="info-label">Receipt No</span>
              <span class="info-value">${receiptNo}</span>
            </div>
             <div class="info-row">
              <span class="info-label">Date</span>
              <span class="info-value">${formatDate(booking.createdAt || booking.created_at)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value" style="text-transform: capitalize;">${booking.status}</span>
            </div>
          </div>
        </div>

        <div class="stay-highlights">
          <div class="stay-item">
            <div class="stay-label">Check In</div>
            <div class="stay-value">${formatDateTime(booking.checkIn || booking.check_in || booking.startDate || booking.check_in_date)}</div>
          </div>
          <div class="stay-item">
            <div class="stay-label">Check Out</div>
            <div class="stay-value">${formatDateTime(booking.checkOut || booking.check_out || booking.endDate || booking.check_out_date)}</div>
          </div>
          <div class="stay-item">
            <div class="stay-label">Guests</div>
            <div class="stay-value">${booking.adults || booking.guestCount || 1} Adult${(booking.children || 0) > 0 ? `, ${booking.children} Child` : ''}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 600; color: #334155;">Room Charges</div>
                <div style="font-size: 11px; color: #94a3b8;">Room #${booking.roomNumber || booking.room_number || 'N/A'}</div>
              </td>
              <td class="amount-col">${formatCurrency(basePrice)}</td>
            </tr>

            <!-- Room Service Breakdown -->
            ${booking.roomServiceCharges && booking.roomServiceCharges.length > 0 ? (() => {
      return booking.roomServiceCharges.map((service: any) => {
        const dateStr = service.createdAt ? new Date(service.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '-';

        const itemsRows = (service.items || []).map((item: any) => {
          const itemBase = (Number(item.price) || 0) * (Number(item.quantity) || 1);
          const itemGst = itemBase * 0.05; // 5% GST for Food
          const itemTotal = itemBase + itemGst;

          return `
                   <tr>
                     <td style="padding-left: 15px; font-size: 10px;">
                       <div style="font-weight: 600; color: #334155;">${item.item_name || item.name} <span style="font-weight: 400; color: #64748b;">x ${item.quantity}</span></div>
                       <div style="font-size: 8px; color: #64748b; margin-top: 2px;">
                         Base: ${formatCurrency(itemBase)} <span style="color: #cbd5e1; margin: 0 4px;">|</span> GST (5%): ${formatCurrency(itemGst)}
                       </div>
                     </td>
                     <td class="amount-col" style="font-size: 10px; vertical-align: top; padding-top: 8px;">${formatCurrency(itemTotal)}</td>
                   </tr>
                   `;
        }).join('');

        return `
                 <tr style="background-color: #f8fafc; border-top: 1px dashed #e2e8f0;">
                    <td colspan="2" style="font-weight: 700; font-size: 9px; color: #475569; padding: 6px 10px;">
                      ROOM SERVICE #${service.orderNumber || (service.orderId || '').slice(0, 6).toUpperCase()} <span style="font-weight: 400; font-size: 8px; margin-left:8px; color:#94a3b8;">${dateStr}</span>
                    </td>
                 </tr>
                 ${itemsRows}
                 `;
      }).join('');
    })() : ''}

            ${discountAmount > 0 ? `
            <tr>
              <td>Less: Discount (${discountPercent}%)</td>
              <td class="amount-col" style="color: #ef4444;">- ${formatCurrency(discountAmount)}</td>
            </tr>
            ` : ''}

            ${gstEnabled && gstAmount > 0 ? `
            <tr>
              <td>CGST (${gstPercentage / 2}%)</td>
              <td class="amount-col">${formatCurrency(cgstAmount)}</td>
            </tr>
            <tr>
              <td>SGST (${gstPercentage / 2}%)</td>
              <td class="amount-col">${formatCurrency(sgstAmount)}</td>
            </tr>
            ` : ''}

            <!-- Total Calculation -->
            <tr class="total-row">
              <td>Total Amount</td>
              <td class="amount-col">${formatCurrency(totalAmount)}</td>
            </tr>

            <!-- Advance / Final Logic -->
            ${isAdvance ? `
              <!-- Advance Receipt View -->
              <tr style="background-color: #fffbeb;">
                <td style="color: #b45309; font-weight: 600;">Advance Paid (Current)</td>
                <td class="amount-col" style="color: #b45309; font-weight: 700;">${formatCurrency(totalPaid)}</td>
              </tr>
              <tr>
                <td style="color: #ef4444; font-weight: 600;">Balance Due</td>
                <td class="amount-col" style="color: #ef4444; font-weight: 700;">${formatCurrency(remainingBalance)}</td>
              </tr>
            ` : `
              <!-- Final Receipt View -->
              <tr>
                <td>Less: Advance / Previous Payments</td>
                <td class="amount-col">- ${formatCurrency(totalPaid)}</td>
              </tr>
              <tr style="background-color: #f0fdf4;">
                 <td style="color: #15803d; font-weight: 600;">Net Payable / Settled</td>
                 <td class="amount-col grand-total">${formatCurrency(remainingBalance <= 0 ? 0 : remainingBalance)}</td>
              </tr>
            `}
            
          </tbody>
        </table>

         <!-- Payment History Table (Enhanced) -->
         ${booking.payments && booking.payments.length > 0 ? `
          <div style="margin-top: 10px; margin-bottom: 10px;">
            <h3 style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;">Payment History</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #e2e8f0;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                   <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #475569; font-size: 9px;">Date</th>
                   <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #475569; font-size: 9px;">Type</th>
                   <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #475569; font-size: 9px;">Receipt No.</th>
                   <th style="padding: 6px 8px; text-align: right; font-weight: 600; color: #475569; font-size: 9px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${booking.payments.map((p: any, index: number) => `
                  <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 0 ? 'background: #ffffff;' : 'background: #f8fafc;'}">
                    <td style="padding: 5px 8px; font-size: 9px;">${formatDate(p.date || p.created_at)}</td>
                    <td style="padding: 5px 8px; text-transform: capitalize; font-weight: 500; font-size: 9px;">${p.type || 'Payment'}</td>
                    <td style="padding: 5px 8px; font-family: 'Courier New', monospace; font-size: 8px; color: #64748b;">${p.receiptNumber || '-'}</td>
                    <td style="padding: 5px 8px; text-align: right; font-weight: 600; color: #0f172a; font-size: 9px;">${formatCurrency(p.amount)}</td>
                  </tr>
                `).join('')}
                <tr style="background: #f0fdf4; border-top: 1px solid #10b981;">
                  <td colspan="3" style="padding: 6px 8px; font-weight: 700; color: #047857; font-size: 10px;">Total Paid</td>
                  <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #047857; font-size: 10px;">${formatCurrency(booking.payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
         ` : ''}

        <!-- Terms and Conditions -->
        <div class="terms">
          <div class="terms-title">Terms & Conditions</div>
          <ul class="terms-list">
            <li>Check-in time: 12:00 PM | Check-out time: 11:00 AM</li>
            <li>Late check-out subject to availability and may incur additional charges</li>
            <li>Guests are responsible for any damage to hotel property during their stay</li>
            <li>Outside food and beverages are not permitted in the rooms</li>
            <li>Smoking is strictly prohibited in all rooms and indoor areas</li>
            <li>Valid ID proof is mandatory at the time of check-in</li>
            <li>The hotel reserves the right to refuse service to anyone</li>
            <li>All payments are non-refundable unless otherwise specified</li>
          </ul>
        </div>

        <div class="signatures">
          <div class="sign-box">
             <div class="sign-line"></div>
             <div class="sign-label">Guest Signature</div>
          </div>
          <div class="sign-box">
             <div class="sign-line"></div>
             <div class="sign-label">Manager Signature</div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing ${businessName}! We hope you had a pleasant stay.</p>
          <p>Computer Generated Receipt | Valid without Seal</p>
        </div>

      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML for garden booking receipt (Professional Invoice)
 */
function generateGardenReceiptHTML(booking: GardenBooking, settings?: any): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  // Calculate detailed amounts
  const basePrice = booking.basePrice || 0
  const discountPercent = booking.discountPercent || 0
  const discountAmount = basePrice * (discountPercent / 100)
  const taxableAmount = basePrice - discountAmount

  const gstPercentage = booking.gstEnabled ? (booking.gstPercentage || 18) : 0
  const gstAmount = taxableAmount * (gstPercentage / 100)

  // Split GST (CGST + SGST)
  const cgstAmount = gstAmount / 2
  const sgstAmount = gstAmount / 2

  const receiptNo = booking.receiptNumber || `INV-${booking.id.slice(0, 8).toUpperCase()}`
  const invoiceDate = formatDate(booking.createdAt)

  console.log("generateGardenReceiptHTML: Resolving branding from settings:", {
    gardenName: settings?.gardenName,
    mainName: settings?.name,
    gardenAddress: settings?.gardenAddress,
    mainAddress: settings?.address
  });

  // Resolve Business Details with extra resilience
  // Prioritize Garden specific (both cases), then Global (both cases), then Default
  const gardenName = settings?.gardenName || settings?.garden_name;
  const gardenAddress = settings?.gardenAddress || settings?.garden_address;
  const gardenMobile = settings?.gardenMobile || settings?.garden_mobile;
  const gardenGST = settings?.gardenGstNumber || settings?.garden_gst_number;

  const businessName = gardenName || settings?.name || "DEORA PLAZA";
  const businessAddress = gardenAddress || settings?.address || "Kesarpura Road, Sheoganj";
  const businessMobile = gardenMobile || settings?.mobile || "9001160228";
  const businessEmail = settings?.email || settings?.gardenEmail || "contact@deoraplaza.com";
  const businessGST = gardenGST || settings?.gst_number || settings?.gstNumber || "";

  // No longer need HEURISTIC since we fixed the database source
  let finalBusinessName = businessName;

  // Debug info in HTML comment for troubleshooting
  const debugComment = `<!-- 
    Debug Info:
    Garden Name: ${settings?.gardenName || 'N/A'}
    Main Name: ${settings?.name || 'N/A'}
    Garden Mobile: ${settings?.gardenMobile || 'N/A'}
    Garden Address: ${settings?.gardenAddress || 'N/A'}
    GST Number: ${settings?.gardenGstNumber || 'N/A'}
    RAW JSON: ${JSON.stringify(settings || {}).slice(0, 500)}
  -->`;

  return `
    ${debugComment}
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation #${receiptNo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        
        body {
          font-family: 'Inter', Helvetica, Arial, sans-serif;
          color: #3f3f46; /* Zinc 700 */
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page-frame {
          border: 4px double #b45309; /* Amber 700 / Gold-ish */
          padding: 30px;
          margin: 0 auto;
          max-width: 210mm;
          min-height: 290mm;
          position: relative;
          background: #ffffff;
        }

        /* Decorative Corners */
        .corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: #9f1239; /* Rose 800 / Maroon */
          border-style: solid;
        }
        .top-left { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
        .top-right { top: 10px; right: 10px; border-width: 2px 2px 0 0; }
        .bottom-left { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }
        .bottom-right { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

        /* Header */
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 20px;
        }

        .shubh-vivah {
          font-family: 'Playfair Display', serif;
          color: #9f1239; /* Maroon */
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .venue-name {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          color: #be123c; /* Rose 700 */
          margin: 0;
          text-transform: uppercase;
        }

        .venue-address {
          font-size: 12px;
          color: #52525b;
          margin-top: 5px;
        }

        .doc-title {
          margin-top: 20px;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #b45309; /* Gold */
          font-weight: 600;
          text-transform: uppercase;
          border: 1px solid #b45309;
          display: inline-block;
          padding: 5px 20px;
          border-radius: 50px;
        }

        /* Info Grid */
        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          background: #fff1f2; /* Rose 50 */
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #fecdd3;
        }

        .info-col h3 {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          color: #9f1239;
          margin: 0 0 10px 0;
          border-bottom: 1px solid #fda4af;
          padding-bottom: 3px;
          display: inline-block;
        }

        .info-col p {
          margin: 3px 0;
          font-size: 13px;
        }

        .highlight {
          font-weight: 600;
          color: #000;
        }

        /* Event Details */
        .event-details {
          margin-bottom: 30px;
        }
        
        .event-timeline {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .timeline-box {
          flex: 1;
          border-left: 3px solid #b45309;
          padding-left: 15px;
          background: #fffbeb; /* Amber 50 */
          padding: 10px 15px;
        }

        .timeline-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #92400e;
          font-weight: 600;
        }

        /* Financials */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }

        th {
          background: #881337; /* Rose 900 */
          color: #fff;
          padding: 8px 12px;
          text-align: left;
          font-family: 'Playfair Display', serif;
          font-weight: 500;
          font-size: 11px;
        }

        td {
          padding: 8px 12px;
          border-bottom: 1px solid #fce7f3;
          font-size: 11px;
        }

        .amount-col { text-align: right; }
        
        .total-row td {
          border-top: 2px solid #881337;
          border-bottom: none;
          font-weight: 700;
          color: #881337;
          font-size: 16px;
        }

        /* Terms */
        .terms-section {
          font-size: 11px;
          color: #52525b;
          border-top: 1px dashed #e5e7eb;
          padding-top: 20px;
        }

        .terms-title {
          font-family: 'Playfair Display', serif;
          color: #9f1239;
          font-weight: 700;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .terms-list {
          padding-left: 15px;
          margin: 0;
        }

        .terms-list li {
          margin-bottom: 4px;
        }

        .signatures {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
        }

        .sign-box {
          text-align: center;
        }

        .sign-line {
          width: 100px;
          border-bottom: 1px solid #000;
          margin-bottom: 5px;
        }

        .sign-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #71717a;
        }

        @media print {
          body { 
            background: none; 
            padding: 0; 
          }
          .page-frame {
            border: 4px double #b45309;
            margin: 0;
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="page-frame">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>

        <div class="header">
          <div class="shubh-vivah">|| Welcome to ||</div>
          <h1 class="venue-name">${finalBusinessName}</h1>
          <div class="venue-address">${businessAddress} • ${businessMobile}</div>
          ${businessGST && booking.gstEnabled ? `<div class="venue-address" style="font-size: 10px; margin-top: 0;">GSTIN: ${businessGST}</div>` : ''}
          <div class="doc-title">Booking Confirmation</div>
        </div>

        <div class="info-grid">
          <div class="info-col">
            <h3>Guest Details</h3>
            <p><strong>${booking.customerName}</strong></p>
            <p>${booking.customerMobile}</p>
          </div>
          <div class="info-col" style="text-align: right;">
            <h3>Booking Info</h3>
            <p>Ref No: <span class="highlight">#${receiptNo}</span></p>
            <p>Date: ${invoiceDate}</p>
            <p>Event: <span class="highlight capitalize">${booking.eventType}</span> (${booking.guestCount} Guests)</p>
          </div>
        </div>

        <div class="event-details">
          <div class="event-timeline">
            <div class="timeline-box">
              <div class="timeline-label">Function Start</div>
              <div style="font-weight: 600; font-size: 14px;">${formatDateTime(booking.startDate)}</div>
            </div>
            <div class="timeline-box">
              <div class="timeline-label">Function End</div>
              <div style="font-weight: 600; font-size: 14px;">${formatDateTime(booking.endDate)}</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount-col">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Venue Charges & Services</strong>
                <br><span style="font-size: 12px; color: #71717a;">${booking.eventType} package including standard amenities</span>
                ${booking.notes ? `<br><span style="font-size: 12px; font-style: italic;">Note: ${booking.notes}</span>` : ''}
              </td>
              <td class="amount-col">${formatCurrency(basePrice)}</td>
            </tr>
            
            ${discountAmount > 0 ? `
            <tr>
              <td style="color: #9f1239;">Less: Discount (${discountPercent}%)</td>
              <td class="amount-col" style="color: #9f1239;">- ${formatCurrency(discountAmount)}</td>
            </tr>
            ` : ''}

            ${booking.gstEnabled ? `
            <tr>
              <td> CGST (${gstPercentage / 2}%)</td>
              <td class="amount-col">${formatCurrency(cgstAmount)}</td>
            </tr>
            <tr>
              <td> SGST (${gstPercentage / 2}%)</td>
              <td class="amount-col">${formatCurrency(sgstAmount)}</td>
            </tr>
            ` : ''}

            <tr class="total-row">
              <td>Total Payable Amount</td>
              <td class="amount-col">${formatCurrency(booking.totalAmount)}</td>
            </tr>
          </tbody>
        </table>

        ${booking.payments && booking.payments.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-family: 'Playfair Display', serif; color: #9f1239; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #fda4af; padding-bottom: 5px;">Payment History</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #fff1f2; border-bottom: 2px solid #fda4af;">
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #881337;">Date</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #881337;">Type</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #881337;">Receipt No.</th>
                <th style="padding: 8px; text-align: right; font-weight: 600; color: #881337;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${booking.payments.map((payment: any) => `
                <tr style="border-bottom: 1px solid #fce7f3;">
                  <td style="padding: 8px;">${formatDate(payment.date)}</td>
                  <td style="padding: 8px; text-transform: capitalize;">${payment.type || 'Payment'}</td>
                  <td style="padding: 8px; font-family: monospace; font-size: 11px;">${payment.receiptNumber || '-'}</td>
                  <td style="padding: 8px; text-align: right; font-weight: 600;">${formatCurrency(payment.amount)}</td>
                </tr>
              `).join('')}
              <tr style="background: #f8fafc; border-top: 2px solid #881337;">
                <td colspan="3" style="padding: 10px; font-weight: 700; color: #881337;">Total Paid</td>
                <td style="padding: 10px; text-align: right; font-weight: 700; color: #881337;">${formatCurrency(booking.totalPaid)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <div style="background: ${booking.remainingBalance > 0 ? '#fef2f2' : '#f0fdf4'}; padding: 15px; border-radius: 6px; margin-bottom: 30px; border: 2px solid ${booking.remainingBalance > 0 ? '#fca5a5' : '#86efac'};">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: ${booking.remainingBalance > 0 ? '#b91c1c' : '#15803d'};">
            <span>${booking.remainingBalance > 0 ? 'Balance Due:' : 'Payment Status:'}</span>
            <span>${booking.remainingBalance > 0 ? formatCurrency(booking.remainingBalance) : '✓ PAID IN FULL'}</span>
          </div>
        </div>

        <div class="terms-section">
          <div class="terms-title">Terms & Conditions (Marriage Garden)</div>
          <ul class="terms-list">
             <li><strong>DJ & Sound:</strong> As per government regulations, loud music/DJ is strictly prohibited after 10:00 PM.</li>
             <li><strong>Alcohol Policy:</strong> Serving alcohol requires a mandatory P-10 License from the Excise Department. The host is responsible for procuring this license.</li>
             <li><strong>Payments:</strong> Advance payments are non-refundable. Full balance must be cleared 7 days prior to the event.</li>
             <li><strong>Property Damage:</strong> Any damage to the venue property (plants, lights, structures) will be charged to the host.</li>
             <li><strong>Waste Disposal:</strong> Use designated bins. Littering the garden area may attract a cleaning penalty.</li>
             <li><strong>Force Majeure:</strong> Management is not liable for disruptions due to rain or natural calamities.</li>
          </ul>
        </div>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">Guest Signature</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-label">Manager Signature</div>
          </div>
        </div>

      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `
}

/**
 * Download receipt as PDF (requires additional setup)
 */
export function downloadReceiptAsPDF(html: string, filename: string): void {
  // This would require a PDF generation library like jsPDF or Puppeteer
  // For now, we'll just trigger the print dialog
  console.log('PDF download would be implemented here')
  alert('PDF download feature coming soon. Please use print for now.')
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format time for display
 */
export function formatTime(timeString: string): string {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}