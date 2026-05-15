import { addHotelPayment } from './src/actions/hotel'

async function testPayment() {
    console.log('Testing payment recording...')

    // Use the booking ID from the browser test
    const bookingId = 'a5589b1f'  // Replace with actual booking ID

    const payment = {
        amount: 100,
        type: 'partial',
        method: 'cash',
        notes: 'Test payment'
    }

    const result = await addHotelPayment(bookingId, payment)
    console.log('Result:', JSON.stringify(result, null, 2))
}

testPayment().catch(console.error)
