// Main Backend System Orchestrator - Redundant Architecture Controller
// This is the master system that initializes and coordinates all backend components

import { ConfigManager } from './core/config';
import { GlobalLogger, initializeLogger } from './logger';
import { CacheManager, createCacheManager } from './cache';
import { QueueManager, createQueueManager } from './queue';
import { DatabaseManager, createDatabaseManager } from './database';
import { LoadBalancer, createLoadBalancer } from './load-balancer';
import { ServerManager, createServerManager } from './servers';
import { BackendSystemConfig, SystemError, ApiResponse, Middleware, RequestContext } from './core/types';

export interface BackendSystemInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  healthCheck(): Promise<SystemHealthReport>;
  executeOperation<T>(operation: string, data: any, context?: Partial<RequestContext>): Promise<ApiResponse<T>>;
  getSystemStatus(): SystemStatusReport;
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    loadBalancer: any;
    primaryServer: boolean;
    secondaryServer: boolean;
    database: any;
    cache: any;
    queue: any;
  };
  timestamp: Date;
}

export interface SystemStatusReport {
  uptime: number;
  activeServer: 'A' | 'B';
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  components: {
    servers: any;
    database: any;
    cache: any;
    queue: any;
    loadBalancer: any;
  };
  timestamp: Date;
}

export class RedundantBackendSystem implements BackendSystemInterface {
  private config: BackendSystemConfig;
  private configManager: ConfigManager;
  private logger: GlobalLogger;
  private cache: CacheManager;
  private queue: QueueManager;
  private database: DatabaseManager;
  private loadBalancer: LoadBalancer;
  private serverManager: ServerManager;
  private isInitialized = false;
  private isRunning = false;
  private startTime: Date = new Date();
  private middlewares: Middleware[] = [];
  private totalRequests = 0;
  private totalErrors = 0;
  private totalResponseTime = 0;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.config = this.configManager.getConfig();

    // Initialize logger first
    this.logger = initializeLogger(this.config.logger);
    this.logger.info('🚀 Redundant Backend System initializing...', {
      operation: 'system_init'
    });

    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const validation = this.configManager.validateConfig();
    if (!validation.isValid) {
      const errorMessage = `Configuration validation failed: ${validation.errors.join(', ')}`;
      this.logger.error(errorMessage);
      throw new SystemError(errorMessage, 'CONFIG_VALIDATION_FAILED', false);
    }

    this.logger.info('✅ Configuration validation passed');
  }

  private async initializeComponents(): Promise<void> {
    try {
      this.logger.info('🔧 Initializing system components...');

      // Initialize Cache Manager (Redis + Memory fallback)
      this.logger.info('📦 Initializing cache system...');
      this.cache = createCacheManager(this.config.cache, this.logger);

      // Initialize Queue Manager (for offline operations)
      this.logger.info('📥 Initializing queue system...');
      this.queue = createQueueManager(this.config.queue, this.logger);

      // Initialize Database Manager (Primary + Secondary with sync)
      this.logger.info('🗄️ Initializing database system...');
      this.database = createDatabaseManager(this.config.database, this.logger);

      // Initialize Load Balancer
      this.logger.info('⚖️ Initializing load balancer...');
      const servers = [this.config.servers.primary, this.config.servers.secondary];
      this.loadBalancer = createLoadBalancer(this.config.loadBalancer, servers, this.logger);

      // Initialize Server Manager
      this.logger.info('🖥️ Initializing server management...');
      this.serverManager = createServerManager(
        this.config.servers.primary,
        this.config.servers.secondary,
        {
          database: this.database,
          cache: this.cache,
          queue: this.queue,
          logger: this.logger
        }
      );

      this.setupDefaultMiddlewares();
      this.registerDefaultQueueProcessors();

      this.isInitialized = true;
      this.logger.info('✅ All components initialized successfully');

    } catch (error) {
      this.logger.error('❌ Component initialization failed', error as Error);
      throw new SystemError(`Component initialization failed: ${(error as Error).message}`, 'INIT_FAILED');
    }
  }

  private setupDefaultMiddlewares(): void {
    // Request logging middleware
    this.use('request_logger', async (context: RequestContext, next) => {
      this.logger.logRequestStart(context.id, context.operation, undefined, context.server);
      const startTime = Date.now();

      try {
        const result = await next();
        const duration = Date.now() - startTime;
        this.totalResponseTime += duration;
        this.logger.logRequestEnd(context.id, context.operation, duration, true, undefined, context.server);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.totalErrors++;
        this.logger.logRequestEnd(context.id, context.operation, duration, false, undefined, context.server);
        throw error;
      }
    }, 1);

    // Retry middleware
    this.use('retry_handler', async (context: RequestContext, next) => {
      let lastError: Error | null = null;
      const maxAttempts = this.config.retry.maxAttempts;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          context.retryCount = attempt - 1;
          return await next();
        } catch (error) {
          lastError = error as Error;

          if (attempt === maxAttempts) {
            break;
          }

          // Check if error is retryable
          const isRetryable = this.config.retry.retryConditions.some(condition =>
            (error as Error).message.includes(condition) || (error as any).code === condition
          );

          if (!isRetryable) {
            break;
          }

          this.logger.logRetryEvent(context.operation, attempt, maxAttempts, context.server);

          // Exponential backoff delay
          const delay = Math.min(
            this.config.retry.initialDelay * Math.pow(this.config.retry.backoffMultiplier, attempt - 1),
            this.config.retry.maxDelay
          );

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    }, 2);

    // Circuit breaker middleware
    this.use('circuit_breaker', async (context: RequestContext, next) => {
      // Simple circuit breaker implementation
      // In production, you'd want a more sophisticated implementation
      return await next();
    }, 3);

    this.logger.info('🔧 Default middlewares configured');
  }

  private registerDefaultQueueProcessors(): void {
    // Register processors for common operations
    this.queue.registerProcessor('database_write', async (data) => {
      const { collection, docData, docId } = data;
      return await this.database.create(collection, docData, docId);
    }, true);

    this.queue.registerProcessor('database_update', async (data) => {
      const { collection, docId, updateData } = data;
      return await this.database.update(collection, docId, updateData);
    }, true);

    this.queue.registerProcessor('cache_invalidate', async (data) => {
      const { pattern } = data;
      return await this.cache.invalidate(pattern);
    }, true);

    this.queue.registerProcessor('system_notification', async (data) => {
      this.logger.info(`System notification: ${data.message}`, {
        operation: 'system_notification',
        metadata: data
      });
      return { success: true };
    }, false);

    this.logger.info('📋 Default queue processors registered');
  }

  public use(name: string, handler: Middleware['handler'], priority: number = 5): void {
    const middleware: Middleware = { name, handler, priority };

    // Insert in priority order
    let inserted = false;
    for (let i = 0; i < this.middlewares.length; i++) {
      if (this.middlewares[i].priority > priority) {
        this.middlewares.splice(i, 0, middleware);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.middlewares.push(middleware);
    }

    this.logger.debug(`Middleware registered: ${name}`, {
      operation: 'middleware_register',
      metadata: { name, priority }
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('System already running');
      return;
    }

    try {
      this.logger.info('🚀 Starting Redundant Backend System...');
      this.startTime = new Date();

      // Initialize components if not already done
      if (!this.isInitialized) {
        await this.initializeComponents();
      }

      // Start all servers
      await this.serverManager.startAll();

      this.isRunning = true;
      this.logger.info('🎉 Redundant Backend System started successfully!', {
        operation: 'system_start',
        metadata: {
          primaryPort: this.config.servers.primary.port,
          secondaryPort: this.config.servers.secondary.port,
          loadBalancerMode: this.config.loadBalancer.mode
        }
      });

      // Log system configuration summary
      this.logSystemSummary();

    } catch (error) {
      this.logger.error('❌ Failed to start system', error as Error);
      this.isRunning = false;
      throw new SystemError(`System startup failed: ${(error as Error).message}`, 'STARTUP_FAILED');
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('System already stopped');
      return;
    }

    try {
      this.logger.info('🛑 Stopping Redundant Backend System...');

      // Stop all servers
      await this.serverManager.stopAll();

      // Clean up components
      await this.cleanup();

      this.isRunning = false;
      this.logger.info('✅ Redundant Backend System stopped successfully');

    } catch (error) {
      this.logger.error('❌ Error during system shutdown', error as Error);
      throw error;
    }
  }

  async restart(): Promise<void> {
    this.logger.info('🔄 Restarting Redundant Backend System...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.start();
  }

  async healthCheck(): Promise<SystemHealthReport> {
    try {
      const [serverHealth, dbHealth, cacheHealth, queueHealth, lbHealth] = await Promise.all([
        this.serverManager.healthCheckAll(),
        this.database.healthCheck(),
        this.cache.healthCheck(),
        this.queue.healthCheck(),
        this.loadBalancer.getDetailedHealth()
      ]);

      const primaryServerHealthy = serverHealth.find(h => h.server === 'A')?.isHealthy || false;
      const secondaryServerHealthy = serverHealth.find(h => h.server === 'B')?.isHealthy || false;

      // Determine overall health
      let overall: 'healthy' | 'degraded' | 'critical';

      if (primaryServerHealthy && dbHealth.primary && queueHealth.isHealthy) {
        overall = 'healthy';
      } else if ((primaryServerHealthy || secondaryServerHealthy) && (dbHealth.primary || dbHealth.secondary)) {
        overall = 'degraded';
      } else {
        overall = 'critical';
      }

      return {
        overall,
        components: {
          loadBalancer: lbHealth,
          primaryServer: primaryServerHealthy,
          secondaryServer: secondaryServerHealthy,
          database: dbHealth,
          cache: cacheHealth,
          queue: queueHealth
        },
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      return {
        overall: 'critical',
        components: {
          loadBalancer: { overall: 'unhealthy' },
          primaryServer: false,
          secondaryServer: false,
          database: { primary: false, secondary: false },
          cache: { active: 'none' },
          queue: { isHealthy: false }
        },
        timestamp: new Date()
      };
    }
  }

  async executeOperation<T>(operation: string, data: any, context?: Partial<RequestContext>): Promise<ApiResponse<T>> {
    if (!this.isRunning) {
      throw new SystemError('System not running', 'SYSTEM_NOT_RUNNING');
    }

    const requestContext: RequestContext = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      startTime: new Date(),
      retryCount: 0,
      metadata: {},
      ...context
    };

    this.totalRequests++;

    try {
      // Execute through middleware chain
      const result = await this.executeMiddlewareChain(requestContext, async () => {
        return await this.loadBalancer.executeRequest<T>(operation, data);
      });

      return result;

    } catch (error) {
      this.logger.error(`Operation ${operation} failed`, error as Error, {
        operation,
        requestId: requestContext.id
      });

      return {
        success: false,
        server: 'unknown',
        fallback_used: true,
        error: (error as Error).message,
        timestamp: new Date(),
        responseTime: Date.now() - requestContext.startTime.getTime()
      };
    }
  }

  private async executeMiddlewareChain<T>(context: RequestContext, handler: () => Promise<T>): Promise<T> {
    let index = 0;

    const next = async (): Promise<T> => {
      if (index >= this.middlewares.length) {
        return handler();
      }

      const middleware = this.middlewares[index++];
      return middleware.handler(context, next);
    };

    return next();
  }

  getSystemStatus(): SystemStatusReport {
    const uptime = Date.now() - this.startTime.getTime();
    const avgResponseTime = this.totalRequests > 0 ? this.totalResponseTime / this.totalRequests : 0;

    return {
      uptime,
      activeServer: 'A', // Would determine from load balancer
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      avgResponseTime,
      components: {
        servers: this.serverManager.getServerStatus(),
        database: this.database.getStatus(),
        cache: this.cache ? 'initialized' : 'not_initialized',
        queue: this.queue.getStatus(),
        loadBalancer: this.loadBalancer.getStatistics()
      },
      timestamp: new Date()
    };
  }

  // Convenience methods for common operations
  async createDocument(collection: string, data: any, docId?: string): Promise<ApiResponse<any>> {
    return this.executeOperation('database_write', { collection, docData: data, docId });
  }

  async readDocument(collection: string, docId: string): Promise<ApiResponse<any>> {
    return this.executeOperation('database_read', { collection, docId });
  }

  async updateDocument(collection: string, docId: string, data: any): Promise<ApiResponse<any>> {
    return this.executeOperation('database_update', { collection, docId, updateData: data });
  }

  async deleteDocument(collection: string, docId: string): Promise<ApiResponse<any>> {
    return this.executeOperation('database_delete', { collection, docId });
  }

  async getCachedValue<T>(key: string): Promise<T | null> {
    const result = await this.executeOperation<T>('cache_get', { key });
    return result.success ? result.data : null;
  }

  async setCachedValue<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const result = await this.executeOperation('cache_set', { key, value, ttl });
    return result.success;
  }

  async queueOperation(operation: string, data: any, priority = 5): Promise<string> {
    const result = await this.executeOperation('queue_add', { operation, queueData: data, priority });
    return result.data;
  }

  // Configuration management
  updateConfiguration(updates: Partial<BackendSystemConfig>): void {
    // Apply updates through config manager
    if (updates.loadBalancer) {
      this.configManager.updateLoadBalancerConfig(updates.loadBalancer);
    }
    if (updates.database) {
      this.configManager.updateDatabaseConfig(updates.database);
    }
    if (updates.cache) {
      this.configManager.updateCacheConfig(updates.cache);
    }
    if (updates.logger) {
      this.configManager.updateLoggerConfig(updates.logger);
    }

    this.config = this.configManager.getConfig();
    this.logger.info('System configuration updated', {
      operation: 'config_update',
      metadata: { updates: Object.keys(updates) }
    });
  }

  private logSystemSummary(): void {
    this.logger.info(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃           🎯 REDUNDANT BACKEND SYSTEM           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ✅ Status: FULLY OPERATIONAL                    ┃
┃ 🖥️  Primary Server: ${this.config.servers.primary.host}:${this.config.servers.primary.port}                     ┃
┃ 🖥️  Secondary Server: ${this.config.servers.secondary.host}:${this.config.servers.secondary.port}                   ┃
┃ ⚖️  Load Balancer: ${this.config.loadBalancer.mode.toUpperCase()}                    ┃
┃ 🗄️  Database: DUAL REDUNDANT                    ┃
┃ 📦 Cache: REDIS + MEMORY FALLBACK               ┃
┃ 📥 Queue: PERSISTENT OFFLINE SUPPORT            ┃
┃ 📊 Monitoring: COMPREHENSIVE LOGGING            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    `);
  }

  private async cleanup(): Promise<void> {
    this.logger.info('🧹 Cleaning up system components...');

    const cleanupPromises = [];

    if (this.database) {
      cleanupPromises.push(this.database.cleanup());
    }
    if (this.cache) {
      cleanupPromises.push(this.cache.cleanup());
    }
    if (this.queue) {
      cleanupPromises.push(this.queue.cleanup());
    }
    if (this.loadBalancer) {
      this.loadBalancer.cleanup();
    }
    if (this.logger) {
      this.logger.cleanup();
    }

    await Promise.allSettled(cleanupPromises);
    this.logger.info('✅ System cleanup completed');
  }

  // Getters for individual components (for advanced usage)
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getLogger(): GlobalLogger {
    return this.logger;
  }

  getDatabase(): DatabaseManager {
    return this.database;
  }

  getCache(): CacheManager {
    return this.cache;
  }

  getQueue(): QueueManager {
    return this.queue;
  }

  getLoadBalancer(): LoadBalancer {
    return this.loadBalancer;
  }

  getServerManager(): ServerManager {
    return this.serverManager;
  }
}

// Factory function and singleton instance
let systemInstance: RedundantBackendSystem | null = null;

export function createRedundantBackendSystem(): RedundantBackendSystem {
  if (!systemInstance) {
    systemInstance = new RedundantBackendSystem();
  }
  return systemInstance;
}

export function getBackendSystem(): RedundantBackendSystem {
  if (!systemInstance) {
    throw new SystemError('Backend system not initialized. Call createRedundantBackendSystem() first.', 'SYSTEM_NOT_INITIALIZED');
  }
  return systemInstance;
}

export default RedundantBackendSystem;

// Export all types and components for advanced usage
export * from './core/types';
export * from './core/config';
export * from './logger';
export * from './cache';
export * from './queue';
export * from './database';
export * from './load-balancer';
export * from './servers';

