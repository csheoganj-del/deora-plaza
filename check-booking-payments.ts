import { getDocument } from './src/lib/supabase/database'

async function checkBooking() {
    console.log('Checking booking data...')

    // Get the booking
    const booking = await getDocument('bookings', 'a5589b1f')

    console.log('\n=== BOOKING DATA ===')
    console.log('ID:', booking?.id)
    console.log('Guest:', booking?.guestName)
    console.log('Room:', booking?.roomNumber)
    console.log('Total Amount:', booking?.totalAmount)
    console.log('Paid Amount:', booking?.paidAmount)
    console.log('Remaining Balance:', booking?.remainingBalance)
    console.log('Payment Status:', booking?.paymentStatus)
    console.log('Status:', booking?.status)
    console.log('\n=== PAYMENTS ===')
    console.log('Number of payments:', booking?.payments?.length || 0)
    if (booking?.payments) {
        booking.payments.forEach((p: any, i: number) => {
            console.log(`\nPayment ${i + 1}:`)
            console.log('  Amount:', p.amount)
            console.log('  Type:', p.type)
            console.log('  Method:', p.method)
            console.log('  Date:', p.date)
        })
    }
}

checkBooking().catch(console.error)
