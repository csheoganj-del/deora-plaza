"use server"

import { adminAuth, adminDb } from './admin'
import { cookies } from 'next/headers'

// Verify Firebase ID token and get user data
export async function verifyAuth() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value

        if (!token) {
            return { authenticated: false, user: null }
        }

        // Verify the token
        const decodedToken = await adminAuth.verifyIdToken(token)

        // Get user data from Firestore
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()

        if (!userDoc.exists) {
            return { authenticated: false, user: null }
        }

        const userData = userDoc.data()

        return {
            authenticated: true,
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                ...userData
            }
        }
    } catch (error) {
        console.error('Auth verification error:', error)
        return { authenticated: false, user: null }
    }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    })
}

// Clear auth cookie
export async function clearAuthCookie() {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
}

// Get user by UID
export async function getUserByUid(uid: string) {
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get()

        if (!userDoc.exists) {
            return null
        }

        return {
            uid: userDoc.id,
            ...userDoc.data()
        }
    } catch (error) {
        console.error('Error getting user:', error)
        return null
    }
}
