import { format } from "date-fns";

interface HotelReceiptServerProps {
  booking: any;
  receiptNumber: string;
  paymentType: "advance" | "full";
  businessSettings?: any;
}

export function HotelReceiptServer({
  booking,
  receiptNumber,
  paymentType,
  businessSettings,
}: HotelReceiptServerProps) {
  const hotelName = businessSettings?.hotelName || "Deora Plaza Hotel";
  const hotelAddress = businessSettings?.hotelAddress || "Near Deora Plaza, Kesarpura Road, Sheoganj";
  const hotelMobile = businessSettings?.hotelMobile || "9001160228";
  const gstEnabled = businessSettings?.hotelGstEnabled || false;
  const gstNumber = businessSettings?.hotelGstNumber || "";

  const subtotal = booking.basePrice || booking.totalAmount || 0;
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

  // Override paymentType if we're printing a specific payment
  const effectivePaymentType = currentPayment
    ? (currentPayment.type === "advance" ? "advance" : "full")
    : paymentType;

  const remainingBalance = effectivePaymentType === "advance"
    ? totalAmount - amountPaid
    : totalAmount - (booking.totalPaid || amountPaid);

  // Find advance payment for reference (if this is a final receipt)
  const advancePayment = paymentType !== "advance" && !currentPayment
    ? booking.payments?.find((p: any) => p.type === "advance") || null
    : (currentPayment && currentPayment.type !== "advance"
      ? booking.payments?.find((p: any) => p.type === "advance") || null
      : null);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '80mm',
      margin: '0 auto',
      padding: '5mm',
      fontSize: '11px',
      lineHeight: '1.4'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 2px 0' }}>
          {hotelName}
        </h1>
        <p style={{ fontSize: '10px', margin: '0 0 1px 0' }}>{hotelAddress}</p>
        <p style={{ fontSize: '10px', margin: '0 0 1px 0' }}>Mobile: {hotelMobile}</p>
        {gstEnabled && gstNumber && (
          <p style={{ fontSize: '10px', margin: '0' }}>GSTIN: {gstNumber}</p>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #1a1a1a', margin: '5px 0' }}></div>

      {/* Booking Details */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Receipt No:</span>
          <span style={{ fontWeight: 'bold' }}>{receiptNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Date:</span>
          <span>{format(new Date(), "dd/MM/yyyy")}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Time:</span>
          <span>{format(new Date(), "hh:mm a")}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Guest:</span>
          <span>{booking.guestName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Mobile:</span>
          <span>{booking.guestMobile}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Room:</span>
          <span>{booking.roomNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Check-in:</span>
          <span>{format(new Date(booking.startDate), "dd/MM/yyyy hh:mm a")}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Check-out:</span>
          <span>{format(new Date(booking.endDate), "dd/MM/yyyy hh:mm a")}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #1a1a1a', margin: '5px 0' }}></div>

      {/* Charges */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Room Charges:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {booking.discountPercent > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Discount ({booking.discountPercent}%):</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        {gstEnabled && booking.gstPercentage > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>GST ({booking.gstPercentage}%):</span>
            <span>₹{gstAmount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #1a1a1a' }}>
          <span>Total Amount:</span>
          <span>₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Payment Type:</span>
          <span style={{ textTransform: 'capitalize' }}>{effectivePaymentType}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Amount Paid:</span>
          <span>₹{amountPaid.toFixed(2)}</span>
        </div>
        {advancePayment && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Advance Paid:</span>
            <span>₹{advancePayment.amount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #1a1a1a' }}>
          <span>Remaining Balance:</span>
          <span>₹{remainingBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
        <p style={{ margin: '0 0 5px 0' }}>Thank you for staying with us!</p>
        <p style={{ margin: '0' }}>Visit Again</p>
      </div>
    </div>
  );
}

