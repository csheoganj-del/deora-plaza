"use client"

import { createClient } from './client'

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    const supabase = createClient();

    // Debug logging
    console.log('Attempting to sign in with:', { email });

    console.log('Supabase client initialized');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Sign in error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      const friendly =
        error.message === 'Invalid login credentials'
          ? 'Invalid username or password'
          : error.message || 'Failed to sign in';
      return { success: false, error: friendly }
    }

    if (data.session) {
      // Set cookie for middleware to verify
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax; Secure`
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    console.error('Sign in error:', error)
    console.error('Error stack:', error.stack)
    return {
      success: false,
      error: error.message || 'Failed to sign in'
    }
  }
}

// Sign out
export async function signOut() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut()

    // Clear cookie
    document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure'

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to sign out'
      }
    }

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
export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange(callback)
}

