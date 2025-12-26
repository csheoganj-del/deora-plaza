import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Tailwind CSS configuration is working properly!',
    status: 'success',
    testPage: 'http://localhost:3000/tailwind-test'
  });
}