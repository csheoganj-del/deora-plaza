import { NextResponse } from 'next/server'
import { getBarMenu } from '@/actions/bar'

export async function GET() {
  try {
    const menu = await getBarMenu()
    return NextResponse.json(menu)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bar menu' }, 
      { status: 500 }
    )
  }
}

