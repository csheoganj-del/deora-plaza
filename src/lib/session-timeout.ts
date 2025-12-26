/**
 * Session timeout configuration and utilities
 */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes warning

export interface SessionConfig {
    timeoutMs: number;
    warningBeforeTimeoutMs: number;
    onTimeout?: () => void;
    onWarning?: (remainingMs: number) => void;
}

/**
 * Session timeout manager for client-side
 */
export class SessionTimeoutManager {
    private timeoutId: NodeJS.Timeout | null = null;
    private warningId: NodeJS.Timeout | null = null;
    private lastActivityTime: number = Date.now();
    private config: SessionConfig;

    constructor(config?: Partial<SessionConfig>) {
        this.config = {
            timeoutMs: config?.timeoutMs || SESSION_TIMEOUT_MS,
            warningBeforeTimeoutMs: config?.warningBeforeTimeoutMs || WARNING_BEFORE_TIMEOUT_MS,
            onTimeout: config?.onTimeout,
            onWarning: config?.onWarning,
        };
    }

    /**
     * Start the session timeout timer
     */
    start() {
        this.resetTimer();
        this.setupActivityListeners();
    }

    /**
     * Stop the session timeout timer
     */
    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.warningId) {
            clearTimeout(this.warningId);
            this.warningId = null;
        }
        this.removeActivityListeners();
    }

    /**
     * Reset the timer (called on user activity)
     */
    private resetTimer() {
        this.lastActivityTime = Date.now();

        // Clear existing timers
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.warningId) clearTimeout(this.warningId);

        // Set warning timer
        this.warningId = setTimeout(() => {
            const remainingMs = this.config.timeoutMs - this.config.warningBeforeTimeoutMs;
            this.config.onWarning?.(remainingMs);
        }, this.config.timeoutMs - this.config.warningBeforeTimeoutMs);

        // Set timeout timer
        this.timeoutId = setTimeout(() => {
            this.handleTimeout();
        }, this.config.timeoutMs);
    }

    /**
     * Handle session timeout
     */
    private handleTimeout() {
        this.config.onTimeout?.();
        this.stop();
    }

    /**
     * Handle user activity
     */
    private handleActivity = () => {
        this.resetTimer();
    };

    /**
     * Setup event listeners for user activity
     */
    private setupActivityListeners() {
        if (typeof window === 'undefined') return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            window.addEventListener(event, this.handleActivity);
        });
    }

    /**
     * Remove event listeners
     */
    private removeActivityListeners() {
        if (typeof window === 'undefined') return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            window.removeEventListener(event, this.handleActivity);
        });
    }

    /**
     * Get remaining time until timeout
     */
    getRemainingTime(): number {
        const elapsed = Date.now() - this.lastActivityTime;
        return Math.max(0, this.config.timeoutMs - elapsed);
    }

    /**
     * Check if session is about to expire
     */
    isNearExpiry(): boolean {
        return this.getRemainingTime() <= this.config.warningBeforeTimeoutMs;
    }
}

/**
 * Server-side session validation
 */
export function isSessionExpired(lastActivityTime: Date, timeoutMs: number = SESSION_TIMEOUT_MS): boolean {
    const now = Date.now();
    const lastActivity = lastActivityTime.getTime();
    return (now - lastActivity) > timeoutMs;
}

/**
 * Update last activity time in session
 */
export function updateSessionActivity() {
    return new Date().toISOString();
}

