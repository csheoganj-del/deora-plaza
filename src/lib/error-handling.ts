/**
 * Error handling utilities for consistent error responses
 */

export interface ApiError {
    success: false;
    error: string;
    code?: string;
    details?: any;
}

export interface ApiSuccess<T = any> {
    success: true;
    data?: T;
    message?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
    error: string | Error,
    code?: string,
    details?: any
): ApiError {
    const errorMessage = error instanceof Error ? error.message : error;

    // Don't expose internal error details in production
    const safeDetails = process.env.NODE_ENV === 'production' ? undefined : details;

    return {
        success: false,
        error: errorMessage,
        code,
        details: safeDetails,
    };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
    data?: T,
    message?: string
): ApiSuccess<T> {
    return {
        success: true,
        data,
        message,
    };
}

/**
 * Handle errors safely without exposing sensitive information
 */
export function handleError(error: unknown): ApiError {
    if (error instanceof Error) {
        // Known error types
        if (error.name === 'ValidationError') {
            return createErrorResponse(error.message, 'VALIDATION_ERROR');
        }

        if (error.name === 'UnauthorizedError') {
            return createErrorResponse('Unauthorized access', 'UNAUTHORIZED');
        }

        if (error.name === 'ForbiddenError') {
            return createErrorResponse('Access forbidden', 'FORBIDDEN');
        }

        // Generic error - don't expose details in production
        if (process.env.NODE_ENV === 'production') {
            return createErrorResponse('An error occurred', 'INTERNAL_ERROR');
        }

        return createErrorResponse(error.message, 'ERROR', error.stack);
    }

    // Unknown error type
    return createErrorResponse('An unexpected error occurred', 'UNKNOWN_ERROR');
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T
): (...args: Parameters<T>) => Promise<ApiResponse> {
    return async (...args: Parameters<T>) => {
        try {
            const result = await fn(...args);

            // If result is already an ApiResponse, return it
            if (result && typeof result === 'object' && 'success' in result) {
                return result;
            }

            // Otherwise wrap in success response
            return createSuccessResponse(result);
        } catch (error) {
            return handleError(error);
        }
    };
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends Error {
    constructor(resource: string) {
        super(`${resource} not found`);
        this.name = 'NotFoundError';
    }
}

/**
 * Log errors securely
 */
export function logError(error: unknown, context?: string) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';

    if (error instanceof Error) {
        console.error(`${timestamp} ${contextStr} Error:`, {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    } else {
        console.error(`${timestamp} ${contextStr} Unknown error:`, error);
    }
}

