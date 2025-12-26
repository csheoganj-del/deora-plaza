import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    // Fetch all garden bookings to check payment dates
    const { data: bookings, error } = await supabaseServer
      .from('bookings')
      .select('*')
      .eq('type', 'garden');

    if (error) {
      console.error('Error fetching garden bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch garden bookings' }, { status: 500 });
    }

    // Analyze payments
    let dailyTotal = 0;
    let paymentCount = 0;
    let allPayments: any[] = [];

    bookings.forEach((booking: any) => {
      if (booking.payments && Array.isArray(booking.payments)) {
        booking.payments.forEach((payment: any) => {
          const paymentDate = new Date(payment.date);
          const paymentInfo = {
            id: payment.id,
            amount: payment.amount,
            date: payment.date,
            paymentDate: paymentDate,
            startOfDay: startOfDay,
            isToday: paymentDate >= startOfDay,
            bookingId: booking.id
          };
          
          allPayments.push(paymentInfo);
          
          if (paymentDate >= startOfDay) {
            dailyTotal += payment.amount;
            paymentCount++;
          }
        });
      }
    });

    return NextResponse.json({
      dailyTotal,
      paymentCount,
      startOfDay: startOfDay.toISOString(),
      allPayments,
      bookingsCount: bookings.length
    });
  } catch (error) {
    console.error('Error in debug garden API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

