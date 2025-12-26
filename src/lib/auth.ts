import { supabaseServer } from "@/lib/supabase/server"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

// SECURE: Get JWT secret from environment variables only
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
)

if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
  throw new Error("JWT_SECRET or NEXTAUTH_SECRET must be set in environment variables")
}

export interface AuthUser {
  id: string
  email: string
  username: string
  role: string
  businessUnit: string
  permissions: string[]
  isActive: boolean
}

// Create JWT token for authenticated user
export async function createAuthToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    businessUnit: user.businessUnit,
    permissions: user.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)

  return token
}

// Verify JWT token and return user data
export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      id: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as string,
      businessUnit: payload.businessUnit as string,
      permissions: payload.permissions as string[],
      isActive: true,
    }
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// Get current authenticated user from request
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("deora-auth-token")?.value

    if (!token) {
      return null
    }

    return await verifyAuthToken(token)
  } catch (error) {
    console.error("Failed to get current user:", error)
    return null
  }
}

// Supabase-only authentication verification
export async function verifySupabaseAuth(request: Request): Promise<{ authenticated: boolean; user: AuthUser | null }> {
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
    
    // Get additional user metadata from Supabase database
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (userError || !userData) {
      return { authenticated: false, user: null }
    }
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email || '',
      username: userData.username || '',
      role: userData.role || 'viewer',
      businessUnit: userData.businessUnit || '',
      permissions: userData.permissions || [],
      isActive: userData.isActive !== false,
    }
    
    return {
      authenticated: true,
      user: authUser
    }
  } catch (error) {
    console.error("Supabase auth verification failed:", error)
    return { authenticated: false, user: null }
  }
}

// Set authentication cookie
export async function setAuthCookie(user: AuthUser): Promise<void> {
  const token = await createAuthToken(user)
  const cookieStore = await cookies()
  
  cookieStore.set("deora-auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })
}

// Clear authentication cookie
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("deora-auth-token")
}

// Check if user has specific permission
export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user || !user.isActive) return false
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true
  
  // Check if user has the specific permission
  return user.permissions.includes(permission)
}

// Check if user has any of the specified roles
export function hasRole(user: AuthUser | null, roles: string | string[]): boolean {
  if (!user || !user.isActive) return false
  
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(user.role)
}

// Verify authentication for API routes
export async function verifyAuth(request: Request): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.headers.get('x-auth-token') ||
                  // Try to get from cookie if no header
                  request.headers.get('cookie')?.split(';')
                    .find(c => c.trim().startsWith('deora-auth-token='))
                    ?.split('=')[1];

    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }

    const result = await verifyAuthToken(token);
    if (!result) {
      return { success: false, error: 'Invalid or expired token' };
    }

    return { success: true, user: result };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Authentication verification failed' };
  }
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

