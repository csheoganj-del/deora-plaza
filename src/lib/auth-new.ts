import { supabaseServer } from "@/lib/supabase/server"

// Simple auth verification function for Supabase
export async function verifyAuth(request: Request) {
  try {
    // Extract session token from cookies
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return { authenticated: false, user: null }
    }
    
    // Parse cookies to find Supabase session
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim())
    const sessionCookie = cookies.find(cookie => cookie.startsWith('sb-access-token='))
    
    if (!sessionCookie) {
      return { authenticated: false, user: null }
    }
    
    // Extract token from cookie
    const token = sessionCookie.split('=')[1]
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    
    if (error || !user) {
      return { authenticated: false, user: null }
    }
    
    // Get additional user metadata from your Supabase database
    // Assuming you have a 'users' table that stores user roles and business units
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      return { authenticated: false, user: null }
    }
    
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: userData.username,
        role: userData.role,
        businessUnit: userData.businessUnit,
        ...userData
      }
    }
  } catch (error) {
    console.error("Auth verification error:", error)
    return { authenticated: false, user: null }
  }
}

// Set auth cookie - this would typically be handled by Supabase auth helpers
export function setAuthCookie(token: string) {
  // In a real implementation, Supabase handles this automatically
  // This is just a placeholder
  console.log("Setting auth cookie with token:", token)
}

// Clear auth cookie - this would typically be handled by Supabase auth helpers
export function clearAuthCookie() {
  // In a real implementation, Supabase handles this automatically
  // This is just a placeholder
  console.log("Clearing auth cookie")
}

// Get user by ID
export async function getUserById(id: string) {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return {
      id: data.id,
      ...data
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

