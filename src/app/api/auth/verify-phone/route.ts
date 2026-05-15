import { NextRequest, NextResponse } from 'next/server'
import { getDocument } from '@/lib/firebase/firestore'

export async function POST(request: NextRequest) {
    try {
        const { phoneNumber } = await request.json()

        if (!phoneNumber) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            )
        }

        // Look up user by phone number
        const userId = `phone_${phoneNumber.replace(/\+/g, '')}`
        const user = await getDocument('users', userId)

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Phone number not registered' },
                { status: 404 }
            )
        }

        // Return user data (without password)
        const { password, ...userWithoutPassword } = user as any

        return NextResponse.json({
            success: true,
            user: userWithoutPassword
        })
    } catch (error) {
        console.error('Error verifying phone:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
