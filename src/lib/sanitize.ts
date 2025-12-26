/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * Use this for user-generated content that will be displayed in the UI
 */
export function sanitizeString(input: string): string {
    if (!input) return '';

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Sanitize HTML input - strips all HTML tags
 * Use for fields that should never contain HTML
 */
export function stripHtml(input: string): string {
    if (!input) return '';

    return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize mobile number - only allows digits
 */
export function sanitizeMobile(input: string): string {
    if (!input) return '';

    return input.replace(/\D/g, '').slice(0, 10);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
    if (!input) return '';

    return input.toLowerCase().trim();
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number {
    const num = typeof input === 'string' ? parseFloat(input) : input;
    return isNaN(num) ? 0 : num;
}

/**
 * Sanitize object for safe JSON serialization
 * Removes functions and undefined values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
    const sanitized: any = {};

    for (const key in obj) {
        const value = obj[key];

        if (value === undefined || typeof value === 'function') {
            continue;
        }

        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                sanitized[key] = value.map((item: any) =>
                    typeof item === 'string' ? sanitizeString(item) : item
                );
            } else {
                sanitized[key] = sanitizeObject(value);
            }
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Validate and sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
    if (!path) return '';

    // Remove any path traversal attempts
    return path
        .replace(/\.\./g, '')
        .replace(/[<>:"|?*]/g, '')
        .trim();
}

/**
 * Sanitize SQL-like input (for display purposes only - use parameterized queries for actual SQL)
 */
export function sanitizeSqlInput(input: string): string {
    if (!input) return '';

    // Remove common SQL injection patterns
    return input
        .replace(/['";\\]/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '')
        .trim();
}

