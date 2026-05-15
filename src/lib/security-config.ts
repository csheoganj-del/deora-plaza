// DEORA Plaza - Comprehensive Security Configuration
// This file centralizes all security settings and validation

import { NextRequest } from 'next/server';

export interface SecurityConfig {
  jwt: {
    secret: string;
    expirationTime: string;
    algorithm: string;
  };
  passwords: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAttempts: number;
    lockoutDuration: number; // in minutes
  };
  sessions: {
    maxAge: number; // in seconds
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  audit: {
    logAllOperations: boolean;
    logFailedAttempts: boolean;
    retentionDays: number;
  };
  deletion: {
    requirePassword: boolean;
    requireTwoFactor: boolean;
    softDeleteDays: number;
  };
}

// Get security configuration from environment variables
export function getSecurityConfig(): SecurityConfig {
  // Validate required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'ADMIN_DELETION_PASSWORD'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`SECURITY ERROR: ${envVar} environment variable is required but not set`);
    }
  }

  return {
    jwt: {
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!,
      expirationTime: process.env.JWT_EXPIRATION || '24h',
      algorithm: 'HS256'
    },
    passwords: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
      maxAttempts: parseInt(process.env.PASSWORD_MAX_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_MINUTES || '15')
    },
    sessions: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      skipSuccessfulRequests: false
    },
    audit: {
      logAllOperations: process.env.AUDIT_LOG_ALL !== 'false',
      logFailedAttempts: process.env.AUDIT_LOG_FAILURES !== 'false',
      retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '90')
    },
    deletion: {
      requirePassword: process.env.DELETION_REQUIRE_PASSWORD !== 'false',
      requireTwoFactor: process.env.DELETION_REQUIRE_2FA === 'true',
      softDeleteDays: parseInt(process.env.SOFT_DELETE_DAYS || '30')
    }
  };
}

// Password validation function
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const config = getSecurityConfig().passwords;
  const errors: string[] = [];

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Rate limiting helper
export function getRateLimitKey(request: NextRequest, identifier?: string): string {
  const ip = request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  return identifier ? `${ip}:${identifier}` : ip;
}

// Security headers configuration
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent XSS attacks
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    
    // HTTPS enforcement
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'"
    ].join('; '),
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
}

// Audit log levels
export enum AuditLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Audit log entry interface
export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  level: AuditLevel;
  action: string;
  userId?: string;
  userRole?: string;
  businessUnit?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

// Create audit log entry
export function createAuditEntry(
  action: string,
  success: boolean,
  details?: Record<string, any>,
  level: AuditLevel = AuditLevel.INFO
): Omit<AuditLogEntry, 'id' | 'timestamp'> {
  return {
    level,
    action,
    success,
    details,
    timestamp: new Date()
  } as AuditLogEntry;
}

// Sensitive data sanitization
export function sanitizeForLogging(data: any): any {
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'ssn', 'social', 'credit', 'card', 'cvv', 'pin'
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

// Environment validation
export function validateSecurityEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  const required = [
    'JWT_SECRET',
    'ADMIN_DELETION_PASSWORD',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check JWT secret strength
  const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long');
  }

  // Check deletion password strength
  const deletionPassword = process.env.ADMIN_DELETION_PASSWORD;
  if (deletionPassword) {
    const validation = validatePassword(deletionPassword);
    if (!validation.isValid) {
      errors.push(`ADMIN_DELETION_PASSWORD is weak: ${validation.errors.join(', ')}`);
    }
  }

  // Check production settings
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'CHANGE_THIS_IMMEDIATELY_IN_PRODUCTION') {
      errors.push('JWT_SECRET must be changed in production');
    }
    if (process.env.ADMIN_DELETION_PASSWORD === 'CHANGE_THIS_IMMEDIATELY_IN_PRODUCTION') {
      errors.push('ADMIN_DELETION_PASSWORD must be changed in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Initialize security validation on module load
if (typeof window === 'undefined') { // Server-side only
  const validation = validateSecurityEnvironment();
  if (!validation.isValid) {
    console.error('🚨 SECURITY CONFIGURATION ERRORS:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Security configuration errors detected in production');
    }
  }
}

