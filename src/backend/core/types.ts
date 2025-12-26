// Core System Types and Interfaces for Redundant Backend Architecture

export interface ServerConfig {
  id: 'A' | 'B';
  name: string;
  host: string;
  port: number;
  isHealthy: boolean;
  lastHealthCheck: Date;
  weight: number;
  priority: number;
}

export interface LoadBalancerConfig {
  mode: 'round_robin' | 'failover' | 'weighted';
  primary_weight: number;
  secondary_weight: number;
  health_check_interval: number;
  timeout: number;
  max_retries: number;
}

export interface DatabaseConfig {
  primary: {
    type: 'firebase' | 'mongodb' | 'postgresql';
    connectionString: string;
    isHealthy: boolean;
    lastSync: Date;
  };
  secondary: {
    type: 'firebase' | 'mongodb' | 'postgresql';
    connectionString: string;
    isHealthy: boolean;
    lastSync: Date;
  };
  sync_interval: number;
  auto_failover: boolean;
}

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    isHealthy: boolean;
  };
  fallback: {
    type: 'memory' | 'file';
    maxSize: number;
    ttl: number;
  };
}

export interface QueueConfig {
  maxSize: number;
  retryAttempts: number;
  retryDelay: number;
  persistToDisk: boolean;
  flushInterval: number;
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  outputs: ('console' | 'file' | 'database')[];
  logFile: string;
  maxFileSize: string;
  includeTimestamp: boolean;
  includeServerInfo: boolean;
}

export interface HealthCheckResult {
  server: 'A' | 'B';
  isHealthy: boolean;
  responseTime: number;
  timestamp: Date;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  server: 'A' | 'B';
  fallback_used: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  responseTime: number;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryConditions: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface QueueItem {
  id: string;
  operation: string;
  data: any;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  nextRetry: Date;
  priority: number;
}

export interface SystemMetrics {
  uptime: number;
  activeConnections: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  memoryUsage: {
    used: number;
    total: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
  };
}

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  server: 'A' | 'B' | 'LoadBalancer';
  operation?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}

export interface ServerStatus {
  server: 'A' | 'B';
  isHealthy: boolean;
  uptime: number;
  lastRequest: Date;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  isActive: boolean;
  load: number;
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
}

export interface DatabaseOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'query';
  collection: string;
  data?: any;
  filters?: any;
  options?: any;
}

export interface SyncStatus {
  lastSync: Date;
  isInSync: boolean;
  pendingOperations: number;
  conflictCount: number;
  syncErrors: string[];
}

export interface BackendSystemConfig {
  servers: {
    primary: ServerConfig;
    secondary: ServerConfig;
  };
  loadBalancer: LoadBalancerConfig;
  database: DatabaseConfig;
  cache: CacheConfig;
  queue: QueueConfig;
  logger: LoggerConfig;
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  monitoring: {
    metricsInterval: number;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
}

export interface RequestContext {
  id: string;
  userId?: string;
  operation: string;
  startTime: Date;
  server?: 'A' | 'B';
  retryCount: number;
  metadata: Record<string, any>;
}

// Events
export interface SystemEvent {
  type: string;
  timestamp: Date;
  server: string;
  data: any;
}

export interface HealthCheckEvent extends SystemEvent {
  type: 'health_check';
  data: {
    server: 'A' | 'B';
    isHealthy: boolean;
    responseTime: number;
    error?: string;
  };
}

export interface FailoverEvent extends SystemEvent {
  type: 'failover';
  data: {
    from: string;
    to: string;
    reason: string;
    automatic: boolean;
  };
}

export interface CacheEvent extends SystemEvent {
  type: 'cache_hit' | 'cache_miss' | 'cache_set' | 'cache_invalidate';
  data: {
    key: string;
    operation: string;
    success: boolean;
  };
}

export interface QueueEvent extends SystemEvent {
  type: 'queue_add' | 'queue_process' | 'queue_retry' | 'queue_fail';
  data: {
    itemId: string;
    operation: string;
    attempts: number;
    success: boolean;
  };
}

// Error Types
export class SystemError extends Error {
  public server?: string;
  public operation?: string;
  public retryable: boolean;
  public code: string;

  constructor(message: string, code: string, retryable = true) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
    this.retryable = retryable;
  }
}

export class ServerError extends SystemError {
  constructor(message: string, server: string, operation?: string) {
    super(message, 'SERVER_ERROR');
    this.server = server;
    this.operation = operation;
  }
}

export class DatabaseError extends SystemError {
  constructor(message: string, retryable = true) {
    super(message, 'DATABASE_ERROR', retryable);
  }
}

export class CacheError extends SystemError {
  constructor(message: string, retryable = true) {
    super(message, 'CACHE_ERROR', retryable);
  }
}

export class LoadBalancerError extends SystemError {
  constructor(message: string, retryable = true) {
    super(message, 'LOAD_BALANCER_ERROR', retryable);
  }
}

export class QueueError extends SystemError {
  constructor(message: string, retryable = true) {
    super(message, 'QUEUE_ERROR', retryable);
  }
}

// Utility Types
export type Awaitable<T> = T | Promise<T>;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface Middleware<T = any> {
  name: string;
  handler: (context: RequestContext, next: () => Promise<T>) => Promise<T>;
  priority: number;
}

export interface Plugin {
  name: string;
  version: string;
  initialize: (system: any) => Promise<void>;
  cleanup: () => Promise<void>;
}

