import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, today, week, month, year
    
    // Build date filter based on period using local timezone
    let dateFilter = '';
    const now = new Date();
    
    switch (period) {
      case 'today':
        // Create start of today in local timezone
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = startOfToday.toISOString();
        break;
      case 'week':
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        dateFilter = weekAgo.toISOString();
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = monthAgo.toISOString();
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear(), 0, 1);
        dateFilter = yearAgo.toISOString();
        break;
    }
    
    // Fetch all garden bookings with payments
    let query = supabaseServer
      .from('bookings')
      .select(`
        id,
        customerMobile,
        eventType,
        startDate,
        endDate,
        basePrice,
        totalAmount,
        payments,
        guestCount,
        createdAt,
        updatedAt
      `)
      .eq('type', 'garden');
      
    // Apply date filter if needed
    if (dateFilter) {
      query = query.gte('createdAt', dateFilter);
    }
    
    const { data: bookings, error } = await query.order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching garden bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch garden bookings' }, { status: 500 });
    }
    
    // Process payments and calculate statistics
    let totalRevenue = 0;
    let advancePayments = 0;
    let finalPayments = 0;
    let totalBookings = bookings.length;
    let totalGuests = 0;
    let paymentRecords: any[] = [];
    let totalExpectedRevenue = 0; // Total amount that should be collected
    let totalPendingRevenue = 0;  // Amount still pending collection

    // Process each booking
    for (const booking of bookings) {
      totalGuests += booking.guestCount || 0;
      
      // Add to expected revenue (total amount that should be collected)
      totalExpectedRevenue += booking.totalAmount || 0;
      
      // Process each payment in the booking
      if (booking.payments && Array.isArray(booking.payments)) {
        for (const payment of booking.payments) {
          const paymentRecord = {
            id: payment.id,
            bookingId: booking.id,
            customerMobile: booking.customerMobile,
            eventType: booking.eventType,
            amount: payment.amount,
            type: payment.type,
            date: payment.date,
            receiptNumber: payment.receiptNumber,
            bookingStartDate: booking.startDate,
            bookingEndDate: booking.endDate,
          };
          
          paymentRecords.push(paymentRecord);
          totalRevenue += payment.amount;
          
          if (payment.type === 'advance') {
            advancePayments += payment.amount;
          } else if (payment.type === 'final') {
            finalPayments += payment.amount;
          }
        }
      }
    }
    
    // Calculate pending revenue (expected - received)
    totalPendingRevenue = totalExpectedRevenue - totalRevenue;

    // Sort payments by date (newest first)
    paymentRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Prepare response
    const stats = {
      totalRevenue,
      advancePayments,
      finalPayments,
      totalBookings,
      totalGuests,
      paymentRecords,
      period,
      totalExpectedRevenue,
      totalPendingRevenue,
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in garden stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

