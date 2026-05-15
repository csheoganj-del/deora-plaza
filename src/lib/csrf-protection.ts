// CSRF Protection System for DEORA
// Provides comprehensive CSRF protection with token generation and validation

import { getCache } from './redis-cache';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomBytes } from 'crypto';

export interface CSRFConfig {
  tokenLength: number;
  tokenExpiry: number; // in seconds
  cookieName: string;
  headerName: string;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  domain?: string;
}

export class CSRFProtection {
  private config: CSRFConfig;
  private cache = getCache();

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      tokenLength: 32,
      tokenExpiry: 3600, // 1 hour
      cookieName: 'csrf-token',
      headerName: 'x-csrf-token',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.CSRF_DOMAIN,
      ...config
    };
  }

  private generateRandomToken(): string { // Renamed to avoid duplicate
    return randomBytes(this.config.tokenLength).toString('hex');
  }

  private async getSessionKey(sessionId: string): Promise<string> {
    return `csrf:${sessionId}`;
  }

  public getClientIP(request: NextRequest, headersList: Headers): string {
    // Try to get client IP from various sources
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = headersList.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = headersList.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback - NextRequest doesn't have direct IP access
    return 'unknown';
  }

  private async getSessionId(request: NextRequest): Promise<string> {
    // Try to get session ID from various sources
    const headersList = await headers();
    
    // Check for session cookie
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      return `session:${sessionCookie}`;
    }

    // Check for authorization header
    const authHeader = headersList.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      return `token:${token}`;
    }

    // Fallback to IP-based session (less secure but better than nothing)
    const ip = this.getClientIP(request, headersList);
    return `ip:${ip}`;
  }

  async generateToken(request: NextRequest): Promise<string> {
    const sessionId = await this.getSessionId(request);
    const sessionKey = await this.getSessionKey(sessionId);
    const token = this.generateRandomToken();

    // Store token in cache with expiry
    await this.cache.set(sessionKey, {
      token,
      createdAt: Date.now(),
      userAgent: (await headers()).get('user-agent') || '',
      ip: this.getClientIP(request, await headers())
    }, this.config.tokenExpiry);

    return token;
  }

  async validateToken(request: NextRequest): Promise<boolean> {
    const sessionId = await this.getSessionId(request);
    const sessionKey = await this.getSessionKey(sessionId);
    
    // Get stored token data
    const storedData = await this.cache.get<{
      token: string;
      createdAt: number;
      userAgent: string;
      ip: string;
    }>(sessionKey);

    if (!storedData) {
      return false;
    }

    // Get token from header or body
    const headersList = await headers();
    const headerToken = headersList.get(this.config.headerName);
    
    let requestToken = headerToken;
    
    // If not in header, check request body (for POST requests)
    if (!requestToken && request.method === 'POST') {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.text();
        const parsedBody = JSON.parse(body);
        requestToken = parsedBody.csrfToken;
      } catch (error) {
        // Ignore parsing errors
      }
    }

    if (!requestToken || requestToken !== storedData.token) {
      return false;
    }

    // Additional security checks
    const currentIP = this.getClientIP(request, await headers());
    const currentUserAgent = headersList.get('user-agent') || '';

    // Allow some flexibility for IP changes (mobile networks, etc.)
    if (storedData.ip !== currentIP && !this.isIPInSameSubnet(storedData.ip, currentIP)) {
      console.warn('CSRF: IP address changed significantly', {
        stored: storedData.ip,
        current: currentIP
      });
      // Don't reject for IP changes alone, but log for monitoring
    }

    if (storedData.userAgent !== currentUserAgent) {
      console.warn('CSRF: User agent changed', {
        stored: storedData.userAgent,
        current: currentUserAgent
      });
      // Don't reject for user agent changes alone
    }

    return true;
  }

  private isIPInSameSubnet(ip1: string, ip2: string): boolean {
    // Simple subnet comparison for IPv4
    const parts1 = ip1.split('.').map(Number);
    const parts2 = ip2.split('.').map(Number);
    
    if (parts1.length !== 4 || parts2.length !== 4) {
      return false;
    }

    // Check if first 3 octets are the same (same /24 subnet)
    return parts1.slice(0, 3).every((part, index) => part === parts2[index]);
  }

  async middleware(request: NextRequest): Promise<NextResponse | null> {
    // Skip CSRF protection for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return null;
    }

    // Skip for API routes that don't need CSRF protection
    const skipPaths = ['/api/auth', '/api/health', '/api/webhook'];
    const pathname = request.nextUrl.pathname;
    if (skipPaths.some(path => pathname.startsWith(path))) {
      return null;
    }

    // Validate token
    const isValid = await this.validateToken(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    return null;
  }

  async setTokenCookie(response: NextResponse, token: string): Promise<void> {
    const cookieOptions = [
      `${this.config.cookieName}=${token}`,
      'HttpOnly',
      `SameSite=${this.config.sameSite}`,
      `Max-Age=${this.config.tokenExpiry}`,
      'Path=/'
    ];

    if (this.config.secure) {
      cookieOptions.push('Secure');
    }

    if (this.config.domain) {
      cookieOptions.push(`Domain=${this.config.domain}`);
    }

    response.headers.set('Set-Cookie', cookieOptions.join('; '));
  }

  async getTokenFromRequest(request: NextRequest): Promise<string | null> {
    const sessionId = await this.getSessionId(request);
    const sessionKey = await this.getSessionKey(sessionId);
    const storedData = await this.cache.get<{
      token: string;
      createdAt: number;
      userAgent: string;
      ip: string;
    }>(sessionKey);

    return storedData?.token || null;
  }

  async refreshToken(request: NextRequest): Promise<string> {
    const sessionId = await this.getSessionId(request);
    const sessionKey = await this.getSessionKey(sessionId);
    
    // Delete old token
    await this.cache.delete(sessionKey);
    
    // Generate new token
    const newToken = this.generateRandomToken();
    await this.cache.set(sessionKey, {
      token: newToken,
      createdAt: Date.now(),
      userAgent: (await headers()).get('user-agent') || '',
      ip: this.getClientIP(request, await headers())
    }, this.config.tokenExpiry);
    
    return newToken;
  }

  async revokeToken(request: NextRequest): Promise<void> {
    const sessionId = await this.getSessionId(request);
    const sessionKey = await this.getSessionKey(sessionId);
    await this.cache.delete(sessionKey);
  }

  // Utility methods
  async cleanup(): Promise<void> {
    // Clean up expired tokens (handled automatically by Redis TTL)
  }

  async getStats(): Promise<{
    activeTokens: number;
    config: CSRFConfig;
  }> {
    // This would require implementing a way to count active tokens
    // For now, return basic info
    return {
      activeTokens: 0, // Would need to implement counting
      config: this.config
    };
  }
}

// Default CSRF protection instance
export const csrfProtection = new CSRFProtection();

// Middleware wrapper
export function createCSRFMiddleware(config?: Partial<CSRFConfig>) {
  const csrf = new CSRFProtection(config);
  
  return async function csrfMiddleware(request: NextRequest) {
    return await csrf.middleware(request);
  };
}

// Higher-order function for Next.js route handlers
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: Partial<CSRFConfig>
) {
  const csrf = new CSRFProtection(config);
  
  return async function csrfProtectedHandler(request: NextRequest): Promise<NextResponse> {
    // Check CSRF protection
    const csrfResponse = await csrf.middleware(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // Execute the actual handler
    try {
      const response = await handler(request);
      
      // Add CSRF token to response for GET requests
      if (request.method === 'GET') {
        const token = await csrf.getTokenFromRequest(request);
        if (!token) {
          const newToken = await csrf.generateToken(request);
          await csrf.setTokenCookie(response, newToken);
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
}

// React hook for client-side CSRF token
export function useCSRFToken() {
  // This would be implemented in a separate client-side file
  // For now, just return the interface
  return {
    token: '',
    refreshToken: () => {},
    isLoading: false
  };
}

// Helper function to add CSRF token to fetch requests
export function addCSRFToken(url: string, options: RequestInit = {}): RequestInit {
  const token = getCSRFTokenFromCookie();
  
  if (token && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': token
    };
  }
  
  return options;
}

function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return value;
    }
  }
  
  return null;
}

export default CSRFProtection;

