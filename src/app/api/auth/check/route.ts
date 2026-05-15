import { NextRequest, NextResponse } from 'next/server';
import { getCurrentCustomUser } from '@/actions/custom-auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from JWT token
    const user = await getCurrentCustomUser();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authentication token found or token invalid' 
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      currentUser: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        role: user.role,
        businessUnit: user.businessUnit
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication verification failed' 
    }, { status: 500 });
  }
}