import { NextResponse } from 'next/server';
import { getGardenDailyRevenue } from '@/actions/garden';
import { getDailyRevenue } from '@/actions/billing';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const testType = url.searchParams.get('type') || 'basic';
    
    if (testType === 'refresh') {
      // Simulate what happens when refresh button is clicked
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
        timestamp: new Date().toISOString()
      });
    }
    
    // Test the specific garden revenue function
    const gardenRevenue = await getGardenDailyRevenue();
    
    // Test the general revenue function with garden parameter
    const gardenRevenueFromBilling = await getDailyRevenue("garden");
    
    // Test all revenue units
    const cafeRev = await getDailyRevenue("cafe");
    const barRev = await getDailyRevenue("bar");
    const hotelRev = await getDailyRevenue("hotel");
    
    const total = cafeRev.total + barRev.total + hotelRev.total + gardenRevenueFromBilling.total;
    
    return NextResponse.json({
      gardenRevenue,
      gardenRevenueFromBilling,
      cafeRev,
      barRev,
      hotelRev,
      totalCalculated: total,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing garden revenue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

