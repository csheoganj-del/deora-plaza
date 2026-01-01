import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const allCookies: Record<string, string> = {};
    
    cookies.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value;
    });
    
    return NextResponse.json({
      success: true,
      cookies: allCookies,
      cookieHeader: request.headers.get('cookie'),
      hasAuthToken: !!cookies.get('deora-auth-token'),
      authTokenLength: cookies.get('deora-auth-token')?.value?.length || 0
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}