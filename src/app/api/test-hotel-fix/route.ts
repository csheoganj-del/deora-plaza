import { NextResponse } from 'next/server';
import { getHotelDailyRevenue } from '@/actions/hotel';
import { getGardenDailyRevenue } from '@/actions/garden';

export async function GET() {
  try {
    const hotelRevenue = await getHotelDailyRevenue();
    const gardenRevenue = await getGardenDailyRevenue();
    
    return NextResponse.json({
      hotelRevenue,
      gardenRevenue,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing revenue fix:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

