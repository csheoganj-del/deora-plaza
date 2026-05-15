// Comprehensive Error Handling System for DEORA
// Provides centralized error handling, logging, and user feedback

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input'
}

export interface AppError {
  id: string;
  message: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  context?: Record<string, any>;
  stack?: string;
  userMessage?: string;
  action?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    id: string;
    message: string;
    code?: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    userMessage?: string;
    action?: string;
  };
  requestId?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  requestId?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];
  private maxErrors = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Create standardized error
  createError(
    message: string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    context?: Record<string, any>,
    userMessage?: string,
    action?: string
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      message,
      code,
      severity,
      category,
      timestamp: new Date(),
      context,
      userMessage: userMessage || this.getDefaultUserMessage(category, severity),
      action: action || this.getDefaultAction(category, severity)
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      error.stack = new Error().stack;
    }

    this.logError(error);
    this.storeError(error);
    return error;
  }

  // Handle caught errors
  handleError(error: any, context?: Record<string, any>): AppError {
    if (error instanceof Error) {
      return this.createError(
        error.message,
        this.categorizeError(error),
        this.determineSeverity(error),
        error.name,
        context
      );
    }

    if (typeof error === 'string') {
      return this.createError(
        error,
        ErrorCategory.USER_INPUT,
        ErrorSeverity.MEDIUM,
        undefined,
        context
      );
    }

    if (error && typeof error === 'object') {
      return this.createError(
        error.message || 'Unknown error occurred',
        ErrorCategory.SYSTEM,
        ErrorSeverity.MEDIUM,
        error.code,
        context
      );
    }

    return this.createError(
      'Unknown error occurred',
      ErrorCategory.SYSTEM,
      ErrorSeverity.MEDIUM,
      undefined,
      context
    );
  }

  // Create error response for API
  createErrorResponse(error: AppError, requestId?: string): ErrorResponse {
    return {
      success: false,
      error: {
        id: error.id,
        message: error.message,
        code: error.code,
        severity: error.severity,
        category: error.category,
        userMessage: error.userMessage,
        action: error.action
      },
      requestId
    };
  }

  // Create success response
  createSuccessResponse<T>(data: T, message?: string, requestId?: string): SuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      requestId
    };
  }

  // Wrap async functions with error handling
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<{ success: boolean; data?: T; error?: AppError }> {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const appError = this.handleError(error, context);
      return { success: false, error: appError };
    }
  }

  // Wrap sync functions with error handling
  wrapSync<T>(
    fn: () => T,
    context?: Record<string, any>
  ): { success: boolean; data?: T; error?: AppError } {
    try {
      const data = fn();
      return { success: true, data };
    } catch (error) {
      const appError = this.handleError(error, context);
      return { success: false, error: appError };
    }
  }

  // Get user-friendly error message
  private getDefaultUserMessage(category: ErrorCategory, severity: ErrorSeverity): string {
    const messages = {
      [ErrorCategory.VALIDATION]: {
        [ErrorSeverity.LOW]: 'Please check your input and try again.',
        [ErrorSeverity.MEDIUM]: 'Invalid information provided. Please correct and retry.',
        [ErrorSeverity.HIGH]: 'Critical validation error. Please contact support.',
        [ErrorSeverity.CRITICAL]: 'System validation error. Please contact administrator.'
      },
      [ErrorCategory.NETWORK]: {
        [ErrorSeverity.LOW]: 'Connection issue. Please check your internet.',
        [ErrorSeverity.MEDIUM]: 'Network error occurred. Please try again.',
        [ErrorSeverity.HIGH]: 'Unable to connect. Please check connection.',
        [ErrorSeverity.CRITICAL]: 'Critical network failure. Contact support immediately.'
      },
      [ErrorCategory.DATABASE]: {
        [ErrorSeverity.LOW]: 'Data loading issue. Please refresh.',
        [ErrorSeverity.MEDIUM]: 'Database error occurred. Please try again.',
        [ErrorSeverity.HIGH]: 'Data access error. Please contact support.',
        [ErrorSeverity.CRITICAL]: 'Critical database failure. Contact administrator.'
      },
      [ErrorCategory.AUTHENTICATION]: {
        [ErrorSeverity.LOW]: 'Please check your credentials.',
        [ErrorSeverity.MEDIUM]: 'Authentication failed. Please log in again.',
        [ErrorSeverity.HIGH]: 'Access denied. Please contact administrator.',
        [ErrorSeverity.CRITICAL]: 'Critical authentication error. Contact support.'
      },
      [ErrorCategory.AUTHORIZATION]: {
        [ErrorSeverity.LOW]: 'You don\'t have permission for this action.',
        [ErrorSeverity.MEDIUM]: 'Access denied. Contact your manager.',
        [ErrorSeverity.HIGH]: 'Unauthorized access. Contact administrator.',
        [ErrorSeverity.CRITICAL]: 'Critical authorization error. Contact security team.'
      },
      [ErrorCategory.BUSINESS_LOGIC]: {
        [ErrorSeverity.LOW]: 'Operation not allowed in current context.',
        [ErrorSeverity.MEDIUM]: 'Business rule violation. Please check requirements.',
        [ErrorSeverity.HIGH]: 'Critical business logic error. Contact support.',
        [ErrorSeverity.CRITICAL]: 'System business error. Contact administrator.'
      },
      [ErrorCategory.SYSTEM]: {
        [ErrorSeverity.LOW]: 'System error occurred. Please try again.',
        [ErrorSeverity.MEDIUM]: 'Unexpected error. Please refresh and retry.',
        [ErrorSeverity.HIGH]: 'System malfunction. Please contact support.',
        [ErrorSeverity.CRITICAL]: 'Critical system failure. Contact administrator immediately.'
      },
      [ErrorCategory.USER_INPUT]: {
        [ErrorSeverity.LOW]: 'Invalid input. Please check and retry.',
        [ErrorSeverity.MEDIUM]: 'Input error. Please correct and submit again.',
        [ErrorSeverity.HIGH]: 'Invalid data format. Contact support if needed.',
        [ErrorSeverity.CRITICAL]: 'Critical input error. Contact administrator.'
      }
    };

    return messages[category]?.[severity] || 'An error occurred. Please try again.';
  }

  // Get recommended action
  private getDefaultAction(category: ErrorCategory, severity: ErrorSeverity): string {
    const actions = {
      [ErrorCategory.VALIDATION]: 'Please review your input and correct any errors.',
      [ErrorCategory.NETWORK]: 'Please check your internet connection and try again.',
      [ErrorCategory.DATABASE]: 'Please refresh the page and try again.',
      [ErrorCategory.AUTHENTICATION]: 'Please log out and log in again.',
      [ErrorCategory.AUTHORIZATION]: 'Please contact your administrator for access.',
      [ErrorCategory.BUSINESS_LOGIC]: 'Please review business rules and requirements.',
      [ErrorCategory.SYSTEM]: 'Please refresh the page or contact support if the issue persists.',
      [ErrorCategory.USER_INPUT]: 'Please check your input and try again.'
    };

    return actions[category] || 'Please try again or contact support if the issue continues.';
  }

  // Categorize errors based on type and message
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return ErrorCategory.DATABASE;
    }
    
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (message.includes('permission') || message.includes('access') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }
    
    return ErrorCategory.SYSTEM;
  }

  // Determine error severity
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('high') || message.includes('severe')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('low') || message.includes('minor')) {
      return ErrorSeverity.LOW;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  // Generate unique error ID
  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log error to console and external services
  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    
    console[logLevel](`[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`, {
      id: error.id,
      code: error.code,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack
    });

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
      this.sendToExternalService(error);
    }
  }

  // Get appropriate console log level
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  // Send critical errors to external service
  private sendToExternalService(error: AppError): void {
    // Implementation would depend on your logging service
    // This could be Sentry, LogRocket, custom webhook, etc.
    try {
      // Example: Send to monitoring service
      fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      }).catch(() => {
        // Silent fail to avoid infinite loops
      });
    } catch (e) {
      // Silent fail
    }
  }

  // Store error for analytics
  private storeError(error: AppError): void {
    this.errors.push(error);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byCategory = {} as Record<ErrorCategory, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    this.errors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byCategory,
      bySeverity,
      recent: this.errors.slice(-10) // Last 10 errors
    };
  }

  // Clear error history
  clearErrors(): void {
    this.errors = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error patterns
export const createValidationError = (message: string, field?: string): AppError => 
  errorHandler.createError(
    message,
    ErrorCategory.VALIDATION,
    ErrorSeverity.MEDIUM,
    'VALIDATION_ERROR',
    field ? { field } : undefined
  );

export const createNetworkError = (message: string, url?: string): AppError =>
  errorHandler.createError(
    message,
    ErrorCategory.NETWORK,
    ErrorSeverity.MEDIUM,
    'NETWORK_ERROR',
    url ? { url } : undefined
  );

export const createAuthError = (message: string): AppError =>
  errorHandler.createError(
    message,
    ErrorCategory.AUTHENTICATION,
    ErrorSeverity.HIGH,
    'AUTH_ERROR'
  );

export const createDatabaseError = (message: string, query?: string): AppError =>
  errorHandler.createError(
    message,
    ErrorCategory.DATABASE,
    ErrorSeverity.HIGH,
    'DATABASE_ERROR',
    query ? { query } : undefined
  );

// Higher-order function for API route handlers
export function withErrorHandler<T = any>(
  handler: (request: Request, ...args: any[]) => Promise<T>
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    try {
      const result = await handler(request, ...args);
      
      if (result && typeof result === 'object' && 'success' in result) {
        return Response.json(result as any);
      }
      
      return Response.json(errorHandler.createSuccessResponse(result));
    } catch (error) {
      const appError = errorHandler.handleError(error, {
        url: request.url,
        method: request.method
      });
      
      const errorResponse = errorHandler.createErrorResponse(appError);
      
      return Response.json(errorResponse, { 
        status: appError.severity === ErrorSeverity.CRITICAL ? 500 : 400 
      });
    }
  };
}

export default errorHandler;

