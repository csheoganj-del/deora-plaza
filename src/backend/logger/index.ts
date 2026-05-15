// Global Logger System for Redundant Backend Architecture

import { LogEntry, LoggerConfig, SystemEvent } from '../core/types';
import fs from 'fs';
import path from 'path';
import util from 'util';

export class GlobalLogger {
  private static instance: GlobalLogger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private logFile: string;
  private isInitialized = false;

  private constructor(config: LoggerConfig) {
    this.config = config;
    this.logFile = path.join(process.cwd(), this.config.logFile);
    this.initialize();
  }

  public static getInstance(config?: LoggerConfig): GlobalLogger {
    if (!GlobalLogger.instance && config) {
      GlobalLogger.instance = new GlobalLogger(config);
    } else if (!GlobalLogger.instance) {
      throw new Error('Logger not initialized. Provide config on first call.');
    }
    return GlobalLogger.instance;
  }

  private initialize(): void {
    try {
      // Ensure log directory exists
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Start buffer flush interval
      setInterval(() => {
        this.flushBuffer();
      }, 1000);

      this.isInitialized = true;
      this.info('Logger system initialized', { system: 'Logger' });
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    metadata: Partial<LogEntry> = {}
  ): LogEntry {
    return {
      id: this.generateId(),
      level,
      message,
      timestamp: new Date(),
      server: metadata.server || 'System',
      operation: metadata.operation,
      userId: metadata.userId,
      requestId: metadata.requestId,
      metadata: metadata.metadata || {},
      duration: metadata.duration,
      error: metadata.error
    };
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = this.config.includeTimestamp ?
      `[${entry.timestamp.toISOString()}] ` : '';

    const serverInfo = this.config.includeServerInfo ?
      `[${entry.server}] ` : '';

    const level = `[${entry.level.toUpperCase()}] `;

    const operation = entry.operation ? `[${entry.operation}] ` : '';

    const duration = entry.duration ? `(${entry.duration}ms) ` : '';

    const userId = entry.userId ? `{user:${entry.userId}} ` : '';

    const requestId = entry.requestId ? `{req:${entry.requestId}} ` : '';

    let message = `${timestamp}${serverInfo}${level}${operation}${duration}${userId}${requestId}${entry.message}`;

    // Add metadata if present
    if (Object.keys(entry.metadata || {}).length > 0) {
      message += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
    }

    // Add error details if present
    if (entry.error) {
      message += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return message;
  }

  private writeToConsole(entry: LogEntry): void {
    const formattedMessage = this.formatLogEntry(entry);

    switch (entry.level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const formattedMessage = this.formatLogEntry(entry) + '\n';
      fs.appendFileSync(this.logFile, formattedMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private writeToDatabase(entry: LogEntry): void {
    // Implementation depends on your database choice
    // For now, we'll add it to a buffer that can be processed
    this.logBuffer.push(entry);
  }

  private flushBuffer(): void {
    if (this.logBuffer.length === 0) return;

    // Process buffered log entries
    const entriesToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Here you would implement database writing logic
    // For example, batch insert into your database
    try {
      // Example: await this.insertLogBatch(entriesToFlush);
      console.log(`Flushed ${entriesToFlush.length} log entries to database`);
    } catch (error) {
      // If database write fails, put entries back in buffer
      this.logBuffer.unshift(...entriesToFlush);
      console.error('Failed to flush log buffer to database:', error);
    }
  }

  private processLogEntry(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Write to configured outputs
    this.config.outputs.forEach(output => {
      try {
        switch (output) {
          case 'console':
            this.writeToConsole(entry);
            break;
          case 'file':
            this.writeToFile(entry);
            break;
          case 'database':
            this.writeToDatabase(entry);
            break;
        }
      } catch (error) {
        console.error(`Failed to write to ${output}:`, error);
      }
    });
  }

  // Public logging methods
  public debug(message: string, metadata: Partial<LogEntry> = {}): void {
    const entry = this.createLogEntry('debug', message, metadata);
    this.processLogEntry(entry);
  }

  public info(message: string, metadata: Partial<LogEntry> = {}): void {
    const entry = this.createLogEntry('info', message, metadata);
    this.processLogEntry(entry);
  }

  public warn(message: string, metadata: Partial<LogEntry> = {}): void {
    const entry = this.createLogEntry('warn', message, metadata);
    this.processLogEntry(entry);
  }

  public error(message: string, error?: Error, metadata: Partial<LogEntry> = {}): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack || ''
    } : undefined;

    const entry = this.createLogEntry('error', message, {
      ...metadata,
      error: errorData
    });
    this.processLogEntry(entry);
  }

  // Specialized logging methods
  public logServerEvent(server: 'A' | 'B', event: string, metadata: Record<string, any> = {}): void {
    this.info(`Server ${server}: ${event}`, {
      server,
      operation: 'server_event',
      metadata
    });
  }

  public logFailoverEvent(from: string, to: string, reason: string, automatic: boolean): void {
    this.warn(`Failover: ${from} -> ${to}`, {
      server: 'LoadBalancer',
      operation: 'failover',
      metadata: { from, to, reason, automatic }
    });
  }

  public logRetryEvent(operation: string, attempt: number, maxAttempts: number, server?: string): void {
    this.warn(`Retry attempt ${attempt}/${maxAttempts} for ${operation}`, {
      server: server || 'System',
      operation: 'retry',
      metadata: { operation, attempt, maxAttempts }
    });
  }

  public logDatabaseEvent(event: string, database: 'primary' | 'secondary', metadata: Record<string, any> = {}): void {
    this.info(`Database ${database}: ${event}`, {
      server: 'Database',
      operation: 'database_event',
      metadata: { database, ...metadata }
    });
  }

  public logCacheEvent(event: string, key: string, success: boolean, metadata: Record<string, any> = {}): void {
    const level = success ? 'debug' : 'warn';
    this[level](`Cache ${event}: ${key}`, {
      server: 'Cache',
      operation: 'cache_event',
      metadata: { key, success, ...metadata }
    });
  }

  public logHealthCheck(server: 'A' | 'B', isHealthy: boolean, responseTime: number, error?: string): void {
    const level = isHealthy ? 'debug' : 'error';
    const message = `Health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'} (${responseTime}ms)`;

    this[level](message, {
      server,
      operation: 'health_check',
      duration: responseTime,
      metadata: { isHealthy, error }
    });
  }

  public logRequestStart(requestId: string, operation: string, userId?: string, server?: 'A' | 'B'): void {
    this.debug(`Request started: ${operation}`, {
      server,
      operation,
      userId,
      requestId,
      metadata: { phase: 'start' }
    });
  }

  public logRequestEnd(requestId: string, operation: string, duration: number, success: boolean, userId?: string, server?: 'A' | 'B'): void {
    const level = success ? 'info' : 'error';
    const message = `Request ${success ? 'completed' : 'failed'}: ${operation}`;

    this[level](message, {
      server,
      operation,
      userId,
      requestId,
      duration,
      metadata: { phase: 'end', success }
    });
  }

  public logSystemMetrics(metrics: Record<string, any>, server?: string): void {
    this.debug('System metrics', {
      server: server || 'System',
      operation: 'metrics',
      metadata: metrics
    });
  }

  public logQueueEvent(event: string, itemId: string, operation: string, attempts: number, success: boolean): void {
    const level = success ? 'debug' : 'warn';
    this[level](`Queue ${event}: ${operation}`, {
      server: 'Queue',
      operation: 'queue_event',
      metadata: { itemId, operation, attempts, success }
    });
  }

  // Utility methods
  public setLevel(level: LoggerConfig['level']): void {
    this.config.level = level;
    this.info(`Log level changed to: ${level}`, {
      server: 'Logger',
      operation: 'config_change'
    });
  }

  public addOutput(output: 'console' | 'file' | 'database'): void {
    if (!this.config.outputs.includes(output)) {
      this.config.outputs.push(output);
      this.info(`Added log output: ${output}`, {
        server: 'Logger',
        operation: 'config_change'
      });
    }
  }

  public removeOutput(output: 'console' | 'file' | 'database'): void {
    this.config.outputs = this.config.outputs.filter(o => o !== output);
    this.info(`Removed log output: ${output}`, {
      server: 'Logger',
      operation: 'config_change'
    });
  }

  public getStats(): { totalLogs: number; bufferSize: number; level: string; outputs: string[] } {
    return {
      totalLogs: 0, // You could track this if needed
      bufferSize: this.logBuffer.length,
      level: this.config.level,
      outputs: this.config.outputs
    };
  }

  public rotateLogFile(): void {
    if (this.config.outputs.includes('file')) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = this.logFile.replace('.log', `_${timestamp}.log`);

        if (fs.existsSync(this.logFile)) {
          fs.renameSync(this.logFile, rotatedFile);
          this.info('Log file rotated', {
            server: 'Logger',
            operation: 'log_rotation',
            metadata: { rotatedFile }
          });
        }
      } catch (error) {
        this.error('Failed to rotate log file', error as Error, {
          server: 'Logger',
          operation: 'log_rotation'
        });
      }
    }
  }

  public cleanup(): void {
    this.info('Logger system shutting down', { server: 'Logger' });
    this.flushBuffer();
  }

  // Static helper methods for easy access
  public static debug(message: string, metadata?: Partial<LogEntry>): void {
    if (GlobalLogger.instance) {
      GlobalLogger.instance.debug(message, metadata);
    }
  }

  public static info(message: string, metadata?: Partial<LogEntry>): void {
    if (GlobalLogger.instance) {
      GlobalLogger.instance.info(message, metadata);
    }
  }

  public static warn(message: string, metadata?: Partial<LogEntry>): void {
    if (GlobalLogger.instance) {
      GlobalLogger.instance.warn(message, metadata);
    }
  }

  public static error(message: string, error?: Error, metadata?: Partial<LogEntry>): void {
    if (GlobalLogger.instance) {
      GlobalLogger.instance.error(message, error, metadata);
    }
  }
}

// Logger factory function
export function createLogger(config: LoggerConfig): GlobalLogger {
  return GlobalLogger.getInstance(config);
}

// Default logger instance (will be initialized when config is available)
let logger: GlobalLogger | null = null;

export function getLogger(): GlobalLogger {
  if (!logger) {
    throw new Error('Logger not initialized. Call createLogger first.');
  }
  return logger;
}

export function initializeLogger(config: LoggerConfig): GlobalLogger {
  logger = GlobalLogger.getInstance(config);
  return logger;
}

export default GlobalLogger;

