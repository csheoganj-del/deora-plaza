// Advanced Rate Limiting System for DEORA
// Provides configurable rate limiting with Redis backend

import { getCache } from './redis-cache';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  keyGenerator?: (request: NextRequest) => Promise<string>; // Custom key generator
  message?: string; // Custom error message
  statusCode?: number; // HTTP status code for rate limit exceeded
  headers?: boolean; // Include rate limit headers in response
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class RateLimiter {
  public config: RateLimitConfig; // Changed from private to public
  private cache = getCache();

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: undefined,
      message: 'Too many requests, please try again later.',
      statusCode: 429,
      headers: true,
      ...config
    };
  }

  public async getKey(request: NextRequest): Promise<string> { // Changed from private to public
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // Default key generation based on IP and user ID if available
    const headersList = await headers();
    const ip = this.getClientIP(request, headersList);
    const userAgent = headersList.get('user-agent') || '';
    
    // Try to get user ID from session for authenticated requests
    let userId = '';
    try {
      const authHeader = headersList.get('authorization');
      if (authHeader) {
        // Extract user info from token or session
        const token = authHeader.replace('Bearer ', '');
        const sessionKey = `session:${token}`;
        const session = await this.cache.get(sessionKey) as any;
        if (session && session.userId) {
          userId = session.userId;
        }
      }
    } catch (error) {
      // Ignore errors in session extraction
    }

    const keyParts = ['rate_limit'];
    if (userId) {
      keyParts.push(`user:${userId}`);
    } else {
      keyParts.push(`ip:${ip}`);
    }
    
    // Add path for more granular limiting
    const path = request.nextUrl.pathname;
    keyParts.push(`path:${path}`);

    return keyParts.join(':');
  }

  public getClientIP(request: NextRequest, headersList: Headers): string { // Changed from private to public
    // Try various headers for real IP
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const cfConnectingIP = headersList.get('cf-connecting-ip'); // Cloudflare
    
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // Fallback to request IP - NextRequest doesn't have direct IP access
    return 'unknown';
  }

  async check(request: NextRequest): Promise<RateLimitResult> {
    const key = await this.getKey(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get current request data
    const requestData = await this.cache.get<{
      count: number;
      resetTime: number;
      requests: Array<{ timestamp: number; success?: boolean }>;
    }>(key);

    if (!requestData) {
      // First request in window
      const resetTime = now + this.config.windowMs;
      const newData = {
        count: 1,
        resetTime,
        requests: [{ timestamp: now }]
      };
      
      await this.cache.set(key, newData, Math.ceil(this.config.windowMs / 1000));
      
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(resetTime)
      };
    }

    // Clean old requests outside the window
    const validRequests = requestData.requests.filter(req => req.timestamp > windowStart);
    const currentCount = validRequests.length;

    if (currentCount >= this.config.maxRequests) {
      const oldestRequest = validRequests[0];
      const retryAfter = Math.ceil((oldestRequest.timestamp + this.config.windowMs - now) / 1000);
      
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: new Date(requestData.resetTime),
        retryAfter
      };
    }

    // Add new request
    validRequests.push({ timestamp: now });
    
    // Update cache
    const updatedData = {
      count: currentCount + 1,
      resetTime: requestData.resetTime,
      requests: validRequests
    };
    
    await this.cache.set(key, updatedData, Math.ceil(this.config.windowMs / 1000));
    
    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - (currentCount + 1),
      resetTime: new Date(requestData.resetTime)
    };
  }

  async middleware(request: NextRequest): Promise<NextResponse | null> {
    const result = await this.check(request);
    
    if (!result.success) {
      const response = NextResponse.json(
        { 
          error: this.config.message,
          retryAfter: result.retryAfter 
        },
        { status: this.config.statusCode }
      );
      
      if (this.config.headers) {
        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());
        if (result.retryAfter) {
          response.headers.set('Retry-After', result.retryAfter.toString());
        }
      }
      
      return response;
    }
    
    return null; // Allow request to proceed
  }

  // Utility methods for management
  async reset(keyOrRequest: string | NextRequest): Promise<void> {
    const key = typeof keyOrRequest === 'string' 
      ? keyOrRequest 
      : await this.getKey(keyOrRequest);
    
    await this.cache.delete(key);
  }

  async getStats(request: NextRequest): Promise<{
    current: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  }> {
    const key = await this.getKey(request);
    const requestData = await this.cache.get<{
      count: number;
      resetTime: number;
      requests: Array<{ timestamp: number }>;
    }>(key);

    if (!requestData) {
      return {
        current: 0,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs)
      };
    }

    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const validRequests = requestData.requests.filter(req => req.timestamp > windowStart);
    const currentCount = validRequests.length;

    return {
      current: currentCount,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - currentCount),
      resetTime: new Date(requestData.resetTime)
    };
  }
}

// Predefined rate limiters for different use cases
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'API rate limit exceeded, please try again later.',
  headers: true
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Stricter for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  headers: true
});

export const orderRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // Higher for orders
  message: 'Order creation rate limit exceeded, please try again later.',
  headers: true
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // Stricter for uploads
  message: 'Upload rate limit exceeded, please try again later.',
  headers: true
});

// Middleware wrapper function
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async function rateLimitMiddleware(request: NextRequest) {
    return await limiter.middleware(request);
  };
}

// Higher-order function for Next.js route handlers
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: RateLimiter = apiRateLimiter
) {
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    // Check rate limit
    const rateLimitResponse = await limiter.middleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute the actual handler
    try {
      const response = await handler(request);
      
      // Add rate limit headers to successful responses
      if (limiter.config.headers) {
        const stats = await limiter.getStats(request);
        response.headers.set('X-RateLimit-Limit', stats.limit.toString());
        response.headers.set('X-RateLimit-Remaining', stats.remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(stats.resetTime.getTime() / 1000).toString());
      }
      
      return response;
    } catch (error) {
      // Don't count failed requests if configured
      if (limiter.config.skipFailedRequests) {
        const key = await limiter.getKey(request);
        await limiter.reset(key);
      }
      
      throw error;
    }
  };
}

// Utility functions
export async function getRateLimitStats(request: NextRequest, limiter: RateLimiter = apiRateLimiter) {
  return await limiter.getStats(request);
}

export async function resetRateLimit(request: NextRequest, limiter: RateLimiter = apiRateLimiter) {
  return await limiter.reset(request);
}

// Custom key generators for different scenarios
export const ipBasedKeyGenerator = async (request: NextRequest): Promise<string> => {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
             headersList.get('x-real-ip') || 
             headersList.get('cf-connecting-ip') ||
             'unknown';
  return `rate_limit:ip:${ip}`;
};

export const userBasedKeyGenerator = async (request: NextRequest): Promise<string> => {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    // This would need to be implemented based on your auth system
    const userId = await getUserIdFromToken(token);
    if (userId) {
      return `rate_limit:user:${userId}`;
    }
  }
  
  // Fallback to IP-based limiting
  return ipBasedKeyGenerator(request);
};

export const pathBasedKeyGenerator = async (request: NextRequest): Promise<string> => {
  const path = request.nextUrl.pathname;
  return `rate_limit:path:${path}`;
};

// Helper function to get user ID from token (implement based on your auth system)
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    // This would need to be implemented based on your JWT/session verification
    // For now, return null to fallback to IP-based limiting
    return null;
  } catch (error) {
    return null;
  }
}

// Rate limit configuration presets
export const RATE_LIMIT_PRESETS = {
  STRICT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: 'Rate limit exceeded. Please try again in a few minutes.'
  },
  MODERATE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.'
  },
  LOOSE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Rate limit exceeded. Please try again later.'
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.'
  },
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Upload rate limit exceeded. Please try again later.'
  }
} as const;

export default RateLimiter;

