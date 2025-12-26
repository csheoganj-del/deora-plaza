"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface GardenReceiptProps {
    booking: any;
    receiptNumber: string;
    paymentType: "advance" | "full";
    businessSettings?: any;
}

export function GardenReceipt({
    booking,
    receiptNumber,
    paymentType,
    businessSettings,
}: GardenReceiptProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const gardenName = businessSettings?.gardenName || "Deora Marriage Garden";
    const gardenAddress = businessSettings?.gardenAddress || "Near Deora Plaza, Kesarpura Road, Sheoganj";
    const gardenMobile = businessSettings?.gardenMobile || "9001160228";
    const gstEnabled = businessSettings?.gardenGstEnabled || false;
    const gstNumber = businessSettings?.gardenGstNumber || "";

    const subtotal = booking.basePrice || 0;
    const discountAmount = (subtotal * (booking.discountPercent || 0)) / 100;
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = booking.gstEnabled ? (afterDiscount * (booking.gstPercentage || 0)) / 100 : 0;
    const totalAmount = booking.totalAmount || 0;
    
    // Find the current payment in the booking payments
    const currentPayment = booking.payments?.find((p: any) => p.receiptNumber === receiptNumber) || null;
    
    // Determine amount paid based on current payment or booking data
    const amountPaid = currentPayment 
        ? currentPayment.amount 
        : (paymentType === "advance" ? (booking.advancePayment || 0) : totalAmount);
        
    const remainingBalance = totalAmount - (booking.totalPaid || amountPaid);

    // Find advance payment for reference (if this is a final receipt)
    const advancePayment = paymentType !== "advance" && !currentPayment 
        ? booking.payments?.find((p: any) => p.type === "advance") || null
        : (currentPayment && currentPayment.type !== "advance" 
            ? booking.payments?.find((p: any) => p.type === "advance") || null
            : null);

    // Override paymentType if we're printing a specific payment
    const effectivePaymentType = currentPayment 
        ? (currentPayment.type === "advance" ? "advance" : "full")
        : paymentType;

    return (
        <div className="hidden print:block">
            <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            font-size: 12px;
          }
        }
        
        .receipt-container {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 15px;
          box-sizing: border-box;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .business-name {
          font-size: 22px;
          font-weight: bold;
          color: #2c5530;
          margin-bottom: 3px;
        }
        
        .business-details {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .receipt-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin: 10px 0;
          padding: 8px;
          border: 2px solid #333;
          border-radius: 3px;
        }
        
        .receipt-type-advance {
          background-color: #fff3cd;
          border-color: #ffc107;
          color: #856404;
        }
        
        .receipt-type-final {
          background-color: #d4edda;
          border-color: #28a745;
          color: #155724;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .info-box {
          border: 1px solid #ddd;
          border-radius: 3px;
          padding: 10px;
        }
        
        .info-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #2c5530;
          border-bottom: 1px solid #eee;
          padding-bottom: 3px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .info-label {
          font-weight: 600;
        }
        
        .billing-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 12px;
        }
        
        .billing-table th {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 6px;
          text-align: left;
          font-weight: 600;
        }
        
        .billing-table td {
          border: 1px solid #dee2e6;
          padding: 6px;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        
        .highlight-row {
          background-color: #e9ecef;
        }
        
        .terms-box {
          border: 1px solid #ddd;
          border-radius: 3px;
          padding: 10px;
          margin: 15px 0;
          background-color: #f8f9fa;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 30px;
        }
        
        .signature-box {
          text-align: center;
          font-size: 12px;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          height: 40px;
          margin-top: 5px;
        }
        
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #eee;
          font-size: 10px;
          color: #666;
        }
        
        .watermark {
          position: fixed;
          bottom: 20mm;
          right: 20mm;
          opacity: 0.1;
          font-size: 80px;
          transform: rotate(-45deg);
          pointer-events: none;
          z-index: -1;
        }
      `}</style>

            <div className="receipt-container">
                {/* Watermark for professional look */}
                <div className="watermark">
                    {effectivePaymentType === "advance" ? "ADVANCE" : "FINAL"}
                </div>
                
                {/* Header */}
                <div className="header">
                    <div className="business-name">{gardenName}</div>
                    <div className="business-details">{gardenAddress}</div>
                    <div className="business-details">Phone: {gardenMobile}</div>
                    {gstEnabled && gstNumber && (
                        <div className="business-details">GST No: {gstNumber}</div>
                    )}
                </div>
                
                {/* Receipt Title */}
                <div className={`receipt-title ${effectivePaymentType === "advance" ? "receipt-type-advance" : "receipt-type-final"}`}>
                    {effectivePaymentType === "advance" ? "ADVANCE PAYMENT RECEIPT" : "FINAL PAYMENT RECEIPT"}
                </div>
                
                {/* Receipt Info */}
                <div className="info-grid">
                    <div className="info-box">
                        <div className="info-title">Booking Information</div>
                        <div className="info-row">
                            <span className="info-label">Receipt No:</span>
                            <span>{receiptNumber}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Booking ID:</span>
                            <span>{booking.id?.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Date:</span>
                            <span>{format(new Date(), "dd MMM yyyy")}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Time:</span>
                            <span>{format(new Date(), "hh:mm a")}</span>
                        </div>
                        {advancePayment && (
                            <div className="info-row">
                                <span className="info-label">Advance Ref:</span>
                                <span>{advancePayment.receiptNumber}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="info-box">
                        <div className="info-title">Customer Information</div>
                        <div className="info-row">
                            <span className="info-label">Name:</span>
                            <span>{booking.customerName}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Mobile:</span>
                            <span>{booking.customerMobile}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Event Type:</span>
                            <span>{booking.eventType?.toUpperCase()}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Guests:</span>
                            <span>{booking.guestCount || "N/A"}</span>
                        </div>
                    </div>
                </div>
                
                {/* Event Details */}
                <div className="info-box">
                    <div className="info-title">Event Schedule</div>
                    <div className="info-grid">
                        <div className="info-row">
                            <span className="info-label">Start:</span>
                            <span>{format(new Date(booking.startDate), "dd MMM yyyy, hh:mm a")}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">End:</span>
                            <span>{format(new Date(booking.endDate), "dd MMM yyyy, hh:mm a")}</span>
                        </div>
                    </div>
                    {booking.notes && (
                        <div className="info-row">
                            <span className="info-label">Notes:</span>
                            <span>{booking.notes}</span>
                        </div>
                    )}
                </div>
                
                {/* Billing Details */}
                <div className="info-box">
                    <div className="info-title">Payment Details</div>
                    <table className="billing-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Base Hall Price</td>
                                <td className="text-right">{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {booking.discountPercent > 0 && (
                                <tr className="highlight-row">
                                    <td>Discount ({booking.discountPercent}%)</td>
                                    <td className="text-right">-{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            {booking.gstEnabled && (
                                <tr>
                                    <td>GST ({booking.gstPercentage}%)</td>
                                    <td className="text-right">{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            <tr className="total-row">
                                <td><strong>Total Amount</strong></td>
                                <td className="text-right"><strong>{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></td>
                            </tr>
                            <tr className="highlight-row">
                                <td><strong>Amount Paid ({paymentType === "advance" ? "Advance" : "Final"})</strong></td>
                                <td className="text-right"><strong>{amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></td>
                            </tr>
                            <tr className="total-row">
                                <td><strong>Remaining Balance</strong></td>
                                <td className="text-right"><strong>{remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                {/* Payment Reference */}
                {advancePayment && (
                    <div className="info-box">
                        <div className="info-title">Payment Reference</div>
                        <p style={{ fontSize: "11px", margin: "5px 0" }}>This final receipt is issued against advance payment receipt <strong>#{advancePayment.receiptNumber}</strong> dated {format(new Date(advancePayment.date), "dd MMM yyyy")} for ₹{advancePayment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.</p>
                    </div>
                )}
                
                {/* Terms & Conditions */}
                <div className="terms-box">
                    <div className="info-title">Terms & Conditions</div>
                    <ol style={{ fontSize: "10px", paddingLeft: "15px", margin: "5px 0" }}>
                        <li>Advance payment is non-refundable and will be adjusted in final billing.</li>
                        <li>Full payment must be made 7 days before the event.</li>
                        <li>Cancellation charges: 50% if cancelled 15 days before, 100% if less than 7 days.</li>
                        <li>Decorations and catering arrangements are customer's responsibility.</li>
                        <li>Event timings must be strictly adhered to.</li>
                        <li>Any damage to property will be charged separately.</li>
                        <li>Management reserves the right to cancel booking in case of force majeure.</li>
                    </ol>
                </div>
                
                {/* Signatures */}
                <div className="signature-section">
                    <div className="signature-box">
                        <div>----------------------</div>
                        <div className="signature-line"></div>
                        <div><strong>Customer Signature</strong></div>
                    </div>
                    <div className="signature-box">
                        <div>----------------------</div>
                        <div className="signature-line"></div>
                        <div><strong>Authorized Signature</strong></div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="footer">
                    <p>Thank you for choosing {gardenName}! | Computer-generated receipt</p>
                    <p>Contact: {gardenMobile} | Generated: {format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
                </div>
            </div>
        </div>
    );
}

