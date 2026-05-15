// Security Headers Implementation for DEORA
// Provides comprehensive protection against common web vulnerabilities

import { NextRequest, NextResponse } from 'next/server';
import { logger, LogCategory } from './logging-system';

export interface SecurityHeaderConfig {
  // Content Security Policy
  cspEnabled: boolean;
  cspDirectives: CSPDirectives;
  
  // Transport Security
  hstsEnabled: boolean;
  hstsMaxAge: number;
  hstsIncludeSubdomains: boolean;
  hstsPreload: boolean;
  
  // Other Headers
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  contentTypeOptions: boolean;
  referrerPolicy: string;
  permissionsPolicy: string;
  
  // Custom Headers
  customHeaders: Record<string, string>;
}

export interface CSPDirectives {
  'default-src'?: string;
  'script-src'?: string;
  'style-src'?: string;
  'img-src'?: string;
  'font-src'?: string;
  'connect-src'?: string;
  'media-src'?: string;
  'object-src'?: string;
  'child-src'?: string;
  'frame-src'?: string;
  'worker-src'?: string;
  'manifest-src'?: string;
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export class SecurityHeaderManager {
  private static instance: SecurityHeaderManager;
  private config: SecurityHeaderConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.loadEnvironmentConfig();
  }

  public static getInstance(): SecurityHeaderManager {
    if (!SecurityHeaderManager.instance) {
      SecurityHeaderManager.instance = new SecurityHeaderManager();
    }
    return SecurityHeaderManager.instance;
  }

  // Get default configuration
  private getDefaultConfig(): SecurityHeaderConfig {
    return {
      cspEnabled: true,
      cspDirectives: {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://vercel.live",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'img-src': "'self' data: https: blob:",
        'font-src': "'self' https://fonts.gstatic.com",
        'connect-src': "'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* wss://localhost:*",
        'media-src': "'self'",
        'object-src': "'none'",
        'child-src': "'self'",
        'frame-src': "'none'",
        'worker-src': "'self' blob:",
        'manifest-src': "'self'",
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': false // Allow mixed content in development
      },
      hstsEnabled: process.env.NODE_ENV === 'production',
      hstsMaxAge: 31536000, // 1 year
      hstsIncludeSubdomains: true,
      hstsPreload: false,
      frameOptions: 'DENY',
      contentTypeOptions: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
      customHeaders: {}
    };
  }

  // Load configuration from environment variables
  private loadEnvironmentConfig(): void {
    // CSP Configuration
    if (process.env.CSP_ENABLED === 'false') {
      this.config.cspEnabled = false;
    }

    if (process.env.CSP_SCRIPT_SRC) {
      this.config.cspDirectives['script-src'] = process.env.CSP_SCRIPT_SRC;
    }

    if (process.env.CSP_STYLE_SRC) {
      this.config.cspDirectives['style-src'] = process.env.CSP_STYLE_SRC;
    }

    if (process.env.CSP_CONNECT_SRC) {
      this.config.cspDirectives['connect-src'] = process.env.CSP_CONNECT_SRC;
    }

    // HSTS Configuration
    if (process.env.HSTS_ENABLED === 'false') {
      this.config.hstsEnabled = false;
    }

    if (process.env.HSTS_MAX_AGE) {
      this.config.hstsMaxAge = parseInt(process.env.HSTS_MAX_AGE);
    }

    if (process.env.HSTS_INCLUDE_SUBDOMAINS === 'false') {
      this.config.hstsIncludeSubdomains = false;
    }

    if (process.env.HSTS_PRELOAD === 'true') {
      this.config.hstsPreload = true;
    }

    // Frame Options
    if (process.env.FRAME_OPTIONS) {
      this.config.frameOptions = process.env.FRAME_OPTIONS as 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    }

    // Custom Headers
    if (process.env.CUSTOM_SECURITY_HEADERS) {
      try {
        this.config.customHeaders = JSON.parse(process.env.CUSTOM_SECURITY_HEADERS);
      } catch (error) {
        logger.warn('Failed to parse CUSTOM_SECURITY_HEADERS', LogCategory.SYSTEM, {
          error: (error as Error).message
        });
      }
    }
  }

  // Generate Content Security Policy header value
  private generateCSP(): string {
    const directives: string[] = [];

    Object.entries(this.config.cspDirectives).forEach(([directive, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          directives.push(directive);
        }
      } else if (value) {
        directives.push(`${directive} ${value}`);
      }
    });

    return directives.join('; ');
  }

  // Apply security headers to response
  applySecurityHeaders(response: NextResponse, request?: NextRequest): NextResponse {
    // Content Security Policy
    if (this.config.cspEnabled) {
      const csp = this.generateCSP();
      response.headers.set('Content-Security-Policy', csp);
    }

    // HTTP Strict Transport Security (HTTPS only)
    if (this.config.hstsEnabled && request?.url.startsWith('https://')) {
      let hsts = `max-age=${this.config.hstsMaxAge}`;
      if (this.config.hstsIncludeSubdomains) {
        hsts += '; includeSubDomains';
      }
      if (this.config.hstsPreload) {
        hsts += '; preload';
      }
      response.headers.set('Strict-Transport-Security', hsts);
    }

    // X-Frame-Options
    response.headers.set('X-Frame-Options', this.config.frameOptions);

    // X-Content-Type-Options
    if (this.config.contentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer Policy
    response.headers.set('Referrer-Policy', this.config.referrerPolicy);

    // Permissions Policy
    response.headers.set('Permissions-Policy', this.config.permissionsPolicy);

    // X-XSS-Protection (deprecated but still useful for older browsers)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // X-Permitted-Cross-Domain-Policies
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

    // Clear Site Data on logout (if requested)
    if (request?.url.includes('logout')) {
      response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
    }

    // Custom security headers
    Object.entries(this.config.customHeaders).forEach(([name, value]) => {
      response.headers.set(name, value);
    });

    // Remove server information
    response.headers.delete('Server');
    response.headers.delete('X-Powered-By');

    return response;
  }

  // Middleware function for Next.js
  middleware(request: NextRequest): NextResponse {
    const response = NextResponse.next();
    return this.applySecurityHeaders(response, request);
  }

  // Higher-order function for API routes
  withSecurityHeaders(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const response = await handler(request);
      return this.applySecurityHeaders(response, request);
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<SecurityHeaderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    logger.info('Security headers configuration updated', LogCategory.SECURITY, {
      cspEnabled: this.config.cspEnabled,
      hstsEnabled: this.config.hstsEnabled,
      frameOptions: this.config.frameOptions
    });
  }

  // Get current configuration
  getConfig(): SecurityHeaderConfig {
    return { ...this.config };
  }

  // Validate CSP directives
  validateCSP(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const csp = this.generateCSP();

    // Basic CSP validation
    if (!csp.includes('default-src')) {
      errors.push('CSP should include default-src directive');
    }

    if (csp.includes('unsafe-inline') && csp.includes('unsafe-eval')) {
      errors.push('CSP contains both unsafe-inline and unsafe-eval - consider reducing attack surface');
    }

    if (!csp.includes('script-src')) {
      errors.push('CSP should include explicit script-src directive');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate security report
  generateSecurityReport(): {
    timestamp: Date;
    headers: Record<string, string>;
    validation: { valid: boolean; errors: string[] };
    recommendations: string[];
  } {
    const mockResponse = new NextResponse();
    const securedResponse = this.applySecurityHeaders(mockResponse);
    
    const headers: Record<string, string> = {};
    securedResponse.headers.forEach((value, name) => {
      if (this.isSecurityHeader(name)) {
        headers[name] = value;
      }
    });

    const validation = this.validateCSP();
    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date(),
      headers,
      validation,
      recommendations
    };
  }

  // Check if header is a security header
  private isSecurityHeader(headerName: string): boolean {
    const securityHeaders = [
      'content-security-policy',
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy',
      'x-xss-protection',
      'x-permitted-cross-domain-policies',
      'clear-site-data'
    ];

    return securityHeaders.includes(headerName.toLowerCase());
  }

  // Generate security recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.config.cspEnabled) {
      recommendations.push('Enable Content Security Policy for XSS protection');
    }

    if (!this.config.hstsEnabled && process.env.NODE_ENV === 'production') {
      recommendations.push('Enable HSTS in production for HTTPS enforcement');
    }

    if (this.config.cspDirectives['script-src']?.includes('unsafe-eval')) {
      recommendations.push('Remove unsafe-eval from script-src to reduce XSS risk');
    }

    if (this.config.cspDirectives['script-src']?.includes('unsafe-inline')) {
      recommendations.push('Consider using nonce or hash-based CSP instead of unsafe-inline');
    }

    if (this.config.frameOptions !== 'DENY') {
      recommendations.push('Consider using DENY for X-Frame-Options unless framing is required');
    }

    if (!this.config.hstsPreload && this.config.hstsEnabled) {
      recommendations.push('Consider enabling HSTS preload for better security');
    }

    return recommendations;
  }

  // Test security headers
  async testHeaders(url: string): Promise<{
    success: boolean;
    results: Record<string, { present: boolean; value?: string; recommended?: string }>;
    score: number;
  }> {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      const results: Record<string, any> = {};
      let score = 0;
      const totalChecks = 8;

      // Test each security header
      const headers = [
        { name: 'Content-Security-Policy', present: !!response.headers.get('content-security-policy') },
        { name: 'Strict-Transport-Security', present: !!response.headers.get('strict-transport-security') },
        { name: 'X-Frame-Options', present: !!response.headers.get('x-frame-options') },
        { name: 'X-Content-Type-Options', present: !!response.headers.get('x-content-type-options') },
        { name: 'Referrer-Policy', present: !!response.headers.get('referrer-policy') },
        { name: 'Permissions-Policy', present: !!response.headers.get('permissions-policy') },
        { name: 'X-XSS-Protection', present: !!response.headers.get('x-xss-protection') },
        { name: 'X-Permitted-Cross-Domain-Policies', present: !!response.headers.get('x-permitted-cross-domain-policies') }
      ];

      headers.forEach(header => {
        const value = response.headers.get(header.name.toLowerCase());
        results[header.name] = {
          present: header.present,
          value: value || undefined,
          recommended: this.getRecommendedValue(header.name)
        };
        
        if (header.present) {
          score++;
        }
      });

      const finalScore = Math.round((score / totalChecks) * 100);

      return {
        success: true,
        results,
        score: finalScore
      };
    } catch (error) {
      logger.error('Failed to test security headers', error as Error, LogCategory.SECURITY, {
        url
      });

      return {
        success: false,
        results: {},
        score: 0
      };
    }
  }

  // Get recommended value for a header
  private getRecommendedValue(headerName: string): string {
    const recommendations: Record<string, string> = {
      'Content-Security-Policy': this.generateCSP(),
      'Strict-Transport-Security': `max-age=${this.config.hstsMaxAge}${this.config.hstsIncludeSubdomains ? '; includeSubDomains' : ''}`,
      'X-Frame-Options': this.config.frameOptions,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': this.config.referrerPolicy,
      'Permissions-Policy': this.config.permissionsPolicy,
      'X-XSS-Protection': '1; mode=block',
      'X-Permitted-Cross-Domain-Policies': 'none'
    };

    return recommendations[headerName] || '';
  }
}

// Export singleton instance
export const securityHeaderManager = SecurityHeaderManager.getInstance();

// Utility functions
export const applySecurityHeaders = (response: NextResponse, request?: NextRequest): NextResponse => {
  return securityHeaderManager.applySecurityHeaders(response, request);
};

export const withSecurityHeaders = <T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>
) => {
  return securityHeaderManager.withSecurityHeaders(handler as any);
};

// CSP directive builders
export const buildCSPDirectives = (directives: Partial<CSPDirectives>): CSPDirectives => {
  const defaultDirectives: CSPDirectives = {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'connect-src': "'self'",
    'font-src': "'self'",
    'object-src': "'none'",
    'child-src': "'self'",
    'frame-src': "'none'",
    'worker-src': "'self'",
    'manifest-src': "'self'"
  };

  return { ...defaultDirectives, ...directives };
};

export default securityHeaderManager;

