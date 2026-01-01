// Comprehensive Logging System for DEORA
// Provides structured logging with multiple levels and destinations

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogCategory {
  SYSTEM = 'system',
  API = 'api',
  DATABASE = 'database',
  AUTH = 'auth',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USER = 'user',
  CACHE = 'cache',
  NETWORK = 'network'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

export interface LogDestination {
  name: string;
  write: (entry: LogEntry) => Promise<void> | void;
  level: LogLevel;
  enabled: boolean;
}

export class Logger {
  private static instance: Logger;
  private destinations: LogDestination[] = [];
  private minLevel: LogLevel = LogLevel.INFO;
  private context: Record<string, any> = {};

  private constructor() {
    this.setupDefaultDestinations();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Setup default logging destinations
  private setupDefaultDestinations(): void {
    // Console destination (always enabled)
    this.addDestination({
      name: 'console',
      write: (entry) => this.writeToConsole(entry),
      level: LogLevel.DEBUG,
      enabled: true
    });

    // File destination (in production)
    if (process.env.NODE_ENV === 'production') {
      this.addDestination({
        name: 'file',
        write: (entry) => this.writeToFile(entry),
        level: LogLevel.INFO,
        enabled: process.env.LOG_TO_FILE === 'true'
      });
    }

    // External service destination (in production)
    if (process.env.NODE_ENV === 'production' && process.env.LOG_SERVICE_URL) {
      this.addDestination({
        name: 'external',
        write: (entry) => this.writeToExternalService(entry),
        level: LogLevel.WARN,
        enabled: true
      });
    }
  }

  // Add custom logging destination
  addDestination(destination: LogDestination): void {
    this.destinations.push(destination);
  }

  // Remove logging destination
  removeDestination(name: string): void {
    this.destinations = this.destinations.filter(d => d.name !== name);
  }

  // Set minimum log level
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  // Set global context
  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  // Clear global context
  clearContext(): void {
    this.context = {};
  }

  // Core logging method
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      category,
      message,
      context: { ...this.context, ...context },
      metadata: {}
    };

    // Add error information if provided
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    // Add request context if available
    this.addRequestContext(entry);

    // Write to all enabled destinations
    this.destinations.forEach(destination => {
      if (destination.enabled && this.shouldLog(level, destination.level)) {
        try {
          destination.write(entry);
        } catch (writeError) {
          // Fallback to console if destination fails
          console.error('Failed to write to log destination:', destination.name, writeError);
        }
      }
    });
  }

  // Add request context from headers
  private addRequestContext(entry: LogEntry): void {
    try {
      // This would need to be called from server context
      // For now, we'll add placeholders
      if (typeof window === 'undefined') {
        // Server-side context
        entry.requestId = this.generateRequestId();
        entry.ip = 'unknown'; // Would be extracted from request
        entry.userAgent = 'server';
      } else {
        // Client-side context
        entry.userAgent = navigator.userAgent;
        entry.ip = 'client';
      }
    } catch (error) {
      // Ignore context errors
    }
  }

  // Check if entry should be logged based on levels
  private shouldLog(entryLevel: LogLevel, destinationLevel: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const entryIndex = levels.indexOf(entryLevel);
    const destinationIndex = levels.indexOf(destinationLevel);
    return entryIndex >= destinationIndex;
  }

  // Generate unique log ID
  private generateLogId(): string {
    return `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate request ID
  private generateRequestId(): string {
    return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Write to console
  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category.toUpperCase()}]`;
    
    const logData = {
      id: entry.id,
      message: entry.message,
      context: entry.context,
      error: entry.error,
      metadata: entry.metadata
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, logData);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, logData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, logData);
        break;
      default:
        console.log(prefix, entry.message, logData);
    }
  }

  // Write to file (server-side only)
  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      
      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });
      
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  // Write to external service
  private async writeToExternalService(entry: LogEntry): Promise<void> {
    try {
      await fetch(process.env.LOG_SERVICE_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_SERVICE_TOKEN}`
        },
        body: JSON.stringify({
          service: 'deora-pos',
          environment: process.env.NODE_ENV,
          entry
        })
      });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, LogCategory.SYSTEM, message, context);
  }

  info(message: string, category: LogCategory = LogCategory.SYSTEM, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, category, message, context);
  }

  warn(message: string, category: LogCategory = LogCategory.SYSTEM, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, category, message, context);
  }

  error(message: string, error?: Error, category: LogCategory = LogCategory.SYSTEM, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, category, message, context, error);
  }

  fatal(message: string, error?: Error, category: LogCategory = LogCategory.SYSTEM, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, category, message, context, error);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.PERFORMANCE, `${operation} completed in ${duration}ms`, {
      ...context,
      operation,
      duration
    });
  }

  // Security logging
  security(event: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, LogCategory.SECURITY, `Security event: ${event}`, {
      ...context,
      event
    });
  }

  // API logging
  api(method: string, url: string, statusCode: number, duration: number, context?: Record<string, any>): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, LogCategory.API, `${method} ${url} - ${statusCode}`, {
      ...context,
      method,
      url,
      statusCode,
      duration
    });
  }

  // Database logging
  database(operation: string, table: string, duration: number, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, LogCategory.DATABASE, `DB ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      duration
    });
  }

  // Cache logging
  cache(operation: string, key: string, hit: boolean, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, LogCategory.CACHE, `Cache ${operation} for ${key} - ${hit ? 'HIT' : 'MISS'}`, {
      ...context,
      operation,
      key,
      hit
    });
  }

  // User action logging
  user(action: string, userId?: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.USER, `User action: ${action}`, {
      ...context,
      action,
      userId
    });
  }

  // Business event logging
  business(event: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, LogCategory.BUSINESS, `Business event: ${event}`, {
      ...context,
      event
    });
  }

  // Get logger with preset category
  withCategory(category: LogCategory): {
    debug: (message: string, context?: Record<string, any>) => void;
    info: (message: string, context?: Record<string, any>) => void;
    warn: (message: string, context?: Record<string, any>) => void;
    error: (message: string, error?: Error, context?: Record<string, any>) => void;
    fatal: (message: string, error?: Error, context?: Record<string, any>) => void;
  } {
    return {
      debug: (message, context) => this.log(LogLevel.DEBUG, category, message, context),
      info: (message, context) => this.log(LogLevel.INFO, category, message, context),
      warn: (message, context) => this.log(LogLevel.WARN, category, message, context),
      error: (message, error, context) => this.log(LogLevel.ERROR, category, message, context, error),
      fatal: (message, error, context) => this.log(LogLevel.FATAL, category, message, context, error)
    };
  }

  // Performance measurement utility
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.performance(operation, duration);
    };
  }

  // Get logging statistics
  getStats(): {
    destinations: Array<{ name: string; enabled: boolean; level: LogLevel }>;
    minLevel: LogLevel;
    context: Record<string, any>;
  } {
    return {
      destinations: this.destinations.map(d => ({
        name: d.name,
        enabled: d.enabled,
        level: d.level
      })),
      minLevel: this.minLevel,
      context: this.context
    };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Utility functions for specific logging scenarios
export const logApiRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string,
  context?: Record<string, any>
) => {
  logger.api(method, url, statusCode, duration, { ...context, userId });
};

export const logDatabaseQuery = (
  operation: string,
  table: string,
  duration: number,
  rowCount?: number,
  context?: Record<string, any>
) => {
  logger.database(operation, table, duration, { ...context, rowCount });
};

export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  userId?: string,
  ip?: string,
  context?: Record<string, any>
) => {
  const level = severity === 'critical' ? LogLevel.FATAL : 
                severity === 'high' ? LogLevel.ERROR :
                severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
  const message = `Security event: ${event}`;
  const baseContext = {
    ...context,
    event,
    severity,
    userId,
    ip
  };
  switch (level) {
    case LogLevel.FATAL:
      logger.fatal(message, undefined, LogCategory.SECURITY, baseContext);
      break;
    case LogLevel.ERROR:
      logger.error(message, undefined, LogCategory.SECURITY, baseContext);
      break;
    case LogLevel.WARN:
      logger.warn(message, LogCategory.SECURITY, baseContext);
      break;
    default:
      logger.info(message, LogCategory.SECURITY, baseContext);
  }
};

// Higher-order function for performance measurement
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>,
  context?: Record<string, any>
): T | Promise<T> {
  const endTimer = logger.startTimer(operation);
  
  try {
    const result = fn();
    
    if (result && typeof result === 'object' && 'then' in result) {
      // Async function
      return result.finally(() => {
        endTimer();
      });
    } else {
      // Sync function
      endTimer();
      return result;
    }
  } catch (error) {
    endTimer();
    throw error;
  }
}

// Export default logger
export default logger;

