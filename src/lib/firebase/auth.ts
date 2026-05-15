"use client"

import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth'
import { auth } from './config'

// Sign in with email and password
export async function signIn(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return { success: true, user: userCredential.user }
    } catch (error: any) {
        console.error('Sign in error:', error)
        return {
            success: false,
            error: error.message || 'Failed to sign in'
        }
    }
}

// Sign out
export async function signOut() {
    try {
        await firebaseSignOut(auth)
        return { success: true }
    } catch (error: any) {
        console.error('Sign out error:', error)
        return {
            success: false,
            error: error.message || 'Failed to sign out'
        }
    }
}

// Get current user
export function getCurrentUser(): User | null {
    return auth.currentUser
}

// Listen to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
}

// Get ID token for API calls
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null

    try {
        return await user.getIdToken()
    } catch (error) {
        console.error('Error getting ID token:', error)
        return null
    }
}
