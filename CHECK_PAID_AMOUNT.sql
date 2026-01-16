-- Check if paidAmount column exists and has data
SELECT 
    id,
    "guestName",
    "totalAmount",
    "advancePayment",
    "paidAmount",
    "remainingBalance",
    "paymentStatus",
    payments
FROM bookings 
WHERE type = 'hotel'
ORDER BY "createdAt" DESC
LIMIT 5;
