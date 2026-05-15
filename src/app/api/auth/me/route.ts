import { NextRequest } from 'next/server';
import { getCurrentCustomUser } from '@/actions/custom-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentCustomUser();
    
    if (user) {
      return Response.json({ 
        user: {
          id: user.userId,
          username: user.username,
          role: user.role,
          businessUnit: user.businessUnit
        }
      });
    } else {
      return Response.json({ user: null }, { status: 401 });
    }
  } catch (error) {
    console.error('Error getting auth status:', error);
    return Response.json({ error: 'Authentication check failed' }, { status: 500 });
  }
}