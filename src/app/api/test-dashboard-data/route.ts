import { NextResponse } from 'next/server';
import { getDailyRevenue } from '@/actions/billing';

export async function GET() {
  try {
    // Simulate exactly what the dashboard does
    const cafeRev = await getDailyRevenue("cafe");
    const barRev = await getDailyRevenue("bar");
    const hotelRev = await getDailyRevenue("hotel");
    const gardenRev = await getDailyRevenue("garden");

    const total = cafeRev.total + barRev.total + hotelRev.total + gardenRev.total;
    
    return NextResponse.json({
      revenue: {
        cafe: cafeRev.total,
        bar: barRev.total,
        hotel: hotelRev.total,
        garden: gardenRev.total,
        total
      },
      details: {
        cafe: cafeRev,
        bar: barRev,
        hotel: hotelRev,
        garden: gardenRev
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

