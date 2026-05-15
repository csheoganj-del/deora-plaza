"use client"

import { auth } from './config'
import {
    signInWithPhoneNumber,
    RecaptchaVerifier,
    ConfirmationResult,
    PhoneAuthProvider,
    signInWithCredential
} from 'firebase/auth'

let recaptchaVerifier: RecaptchaVerifier | null = null
let confirmationResult: ConfirmationResult | null = null

/**
 * Initialize reCAPTCHA verifier
 * Call this once when the component mounts
 */
export function initializeRecaptcha(containerId: string = 'recaptcha-container') {
    if (recaptchaVerifier) {
        return recaptchaVerifier
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
            // reCAPTCHA solved
        },
        'expired-callback': () => {
            // Response expired
            console.warn('reCAPTCHA expired')
        }
    })

    return recaptchaVerifier
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!recaptchaVerifier) {
            initializeRecaptcha()
        }

        if (!recaptchaVerifier) {
            return { success: false, error: 'Failed to initialize reCAPTCHA' }
        }

        // Ensure phone number has country code
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`

        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)

        return { success: true }
    } catch (error: any) {
        console.error('Error sending OTP:', error)

        // Reset reCAPTCHA on error
        if (recaptchaVerifier) {
            recaptchaVerifier.clear()
            recaptchaVerifier = null
        }

        return {
            success: false,
            error: error.message || 'Failed to send OTP'
        }
    }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(code: string): Promise<{ success: boolean; error?: string; phoneNumber?: string }> {
    try {
        if (!confirmationResult) {
            return { success: false, error: 'No OTP request found. Please request OTP first.' }
        }

        const result = await confirmationResult.confirm(code)
        const phoneNumber = result.user.phoneNumber

        if (!phoneNumber) {
            return { success: false, error: 'Phone number not found' }
        }

        return {
            success: true,
            phoneNumber
        }
    } catch (error: any) {
        console.error('Error verifying OTP:', error)
        return {
            success: false,
            error: error.message || 'Invalid OTP code'
        }
    }
}

/**
 * Clean up reCAPTCHA
 * Call this when component unmounts
 */
export function cleanupRecaptcha() {
    if (recaptchaVerifier) {
        recaptchaVerifier.clear()
        recaptchaVerifier = null
    }
    confirmationResult = null
}
