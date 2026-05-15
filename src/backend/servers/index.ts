// Primary and Secondary Server Managers for Redundant Backend Architecture

import { ServerConfig, ServerStatus, HealthCheckResult, SystemError } from '../core/types';
import { GlobalLogger } from '../logger';
import { DatabaseManager } from '../database';
import { CacheManager } from '../cache';
import { QueueManager } from '../queue';
import http from 'http';
import https from 'https';
import express from 'express';
import { URL } from 'url';

export interface ServerInterface {
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
  getStatus(): ServerStatus;
  executeOperation(operation: string, data: any): Promise<any>;
  isHealthy(): boolean;
}

export interface ServerDependencies {
  database: DatabaseManager;
  cache: CacheManager;
  queue: QueueManager;
  logger: GlobalLogger;
}

class BaseServer implements ServerInterface {
  protected config: ServerConfig;
  protected dependencies: ServerDependencies;
  protected server: http.Server | https.Server | null = null;
  protected app: express.Application;
  protected startTime: Date = new Date();
  protected requestCount = 0;
  protected errorCount = 0;
  protected totalResponseTime = 0;
  protected isRunning = false;
  protected logger: GlobalLogger;

  constructor(config: ServerConfig, dependencies: ServerDependencies) {
    this.config = config;
    this.dependencies = dependencies;
    this.logger = dependencies.logger;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Request logging middleware
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      req.requestId = requestId;
      this.requestCount++;

      this.logger.logRequestStart(requestId, `${req.method} ${req.path}`, undefined, this.config.id);

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.totalResponseTime += duration;

        if (res.statusCode >= 400) {
          this.errorCount++;
        }

        this.logger.logRequestEnd(
          requestId,
          `${req.method} ${req.path}`,
          duration,
          res.statusCode < 400,
          undefined,
          this.config.id
        );
      });

      next();
    });

    // JSON parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Server identification middleware
    this.app.use((req, res, next) => {
      res.setHeader('X-Server-ID', this.config.id);
      res.setHeader('X-Server-Name', this.config.name);
      next();
    });

    // Error handling middleware
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.errorCount++;
      this.logger.error(`Server ${this.config.id} request error`, error, {
        operation: 'server_request_error',
        requestId: req.requestId,
        path: req.path,
        method: req.method
      });

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          server: this.config.id,
          error: 'Internal server error',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const healthResult = await this.performHealthCheck();

        res.status(healthResult.isHealthy ? 200 : 503).json({
          success: healthResult.isHealthy,
          server: this.config.id,
          timestamp: healthResult.timestamp,
          responseTime: healthResult.responseTime,
          status: {
            database: this.dependencies.database ? await this.dependencies.database.healthCheck() : null,
            cache: this.dependencies.cache ? await this.dependencies.cache.healthCheck() : null,
            queue: this.dependencies.queue ? await this.dependencies.queue.healthCheck() : null
          },
          uptime: Date.now() - this.startTime.getTime(),
          requests: this.requestCount,
          errors: this.errorCount
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          server: this.config.id,
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Server status endpoint
    this.app.get('/status', (req, res) => {
      const status = this.getStatus();
      res.json({
        success: true,
        server: this.config.id,
        status,
        timestamp: new Date().toISOString()
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.getMetrics();
        res.json({
          success: true,
          server: this.config.id,
          metrics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          server: this.config.id,
          error: 'Failed to get metrics',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Generic API operation endpoint
    this.app.post('/api/:operation', async (req, res) => {
      try {
        const operation = req.params.operation;
        const data = req.body;

        const result = await this.executeOperation(operation, data);

        res.json({
          success: true,
          server: this.config.id,
          data: result,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      } catch (error) {
        this.logger.error(`Operation ${req.params.operation} failed`, error as Error, {
          operation: req.params.operation,
          requestId: req.requestId,
          server: this.config.id
        });

        res.status(500).json({
          success: false,
          server: this.config.id,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        });
      }
    });

    // Catch-all route
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        server: this.config.id,
        error: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.config.host.startsWith('https')
          ? https.createServer(this.app)
          : http.createServer(this.app);

        this.server.listen(this.config.port, () => {
          this.isRunning = true;
          this.startTime = new Date();
          this.config.isHealthy = true;

          this.logger.logServerEvent(this.config.id, 'Server started', {
            port: this.config.port,
            host: this.config.host
          });

          resolve();
        });

        this.server.on('error', (error) => {
          this.logger.error(`Server ${this.config.id} error`, error);
          this.config.isHealthy = false;
          reject(error);
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());

      } catch (error) {
        this.logger.error(`Failed to start server ${this.config.id}`, error as Error);
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server && this.isRunning) {
        this.server.close(() => {
          this.isRunning = false;
          this.config.isHealthy = false;

          this.logger.logServerEvent(this.config.id, 'Server stopped');
          resolve();
        });

        // Force close after 30 seconds
        setTimeout(() => {
          if (this.isRunning) {
            this.server?.destroy();
            this.isRunning = false;
            this.config.isHealthy = false;
            resolve();
          }
        }, 30000);
      } else {
        resolve();
      }
    });
  }

  async restart(): Promise<void> {
    this.logger.logServerEvent(this.config.id, 'Server restarting');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await this.start();
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check if server is running
      if (!this.isRunning || !this.server) {
        return {
          server: this.config.id,
          isHealthy: false,
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
          error: 'Server not running'
        };
      }

      // Check dependencies
      const dbHealth = this.dependencies.database ? await this.dependencies.database.healthCheck() : { primary: true };
      const cacheHealth = this.dependencies.cache ? await this.dependencies.cache.healthCheck() : { active: 'memory' };
      const queueHealth = this.dependencies.queue ? await this.dependencies.queue.healthCheck() : { isHealthy: true };

      const isHealthy = dbHealth.primary && queueHealth.isHealthy;
      const responseTime = Date.now() - startTime;

      this.config.isHealthy = isHealthy;
      this.config.lastHealthCheck = new Date();

      return {
        server: this.config.id,
        isHealthy,
        responseTime,
        timestamp: new Date()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.config.isHealthy = false;

      return {
        server: this.config.id,
        isHealthy: false,
        responseTime,
        timestamp: new Date(),
        error: (error as Error).message
      };
    }
  }

  getStatus(): ServerStatus {
    const uptime = Date.now() - this.startTime.getTime();
    const avgResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;

    return {
      id: this.config.id,
      name: this.config.name,
      isHealthy: this.config.isHealthy,
      isActive: this.isRunning,
      weight: this.config.weight,
      priority: this.config.priority,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      avgResponseTime,
      lastRequest: null, // Would need to track this
      uptime
    };
  }

  async executeOperation(operation: string, data: any): Promise<any> {
    this.logger.debug(`Executing operation: ${operation}`, {
      operation,
      server: this.config.id,
      metadata: { dataKeys: Object.keys(data || {}) }
    });

    try {
      // Route operations to appropriate handlers
      switch (operation) {
        case 'database_read':
          return await this.handleDatabaseRead(data);
        case 'database_write':
          return await this.handleDatabaseWrite(data);
        case 'database_update':
          return await this.handleDatabaseUpdate(data);
        case 'database_delete':
          return await this.handleDatabaseDelete(data);
        case 'cache_get':
          return await this.handleCacheGet(data);
        case 'cache_set':
          return await this.handleCacheSet(data);
        case 'queue_add':
          return await this.handleQueueAdd(data);
        default:
          throw new SystemError(`Unknown operation: ${operation}`, 'UNKNOWN_OPERATION');
      }
    } catch (error) {
      this.logger.error(`Operation ${operation} failed on server ${this.config.id}`, error as Error);
      throw error;
    }
  }

  private async handleDatabaseRead(data: any): Promise<any> {
    const { collection, docId } = data;
    return await this.dependencies.database.read(collection, docId);
  }

  private async handleDatabaseWrite(data: any): Promise<any> {
    const { collection, docData, docId } = data;
    return await this.dependencies.database.create(collection, docData, docId);
  }

  private async handleDatabaseUpdate(data: any): Promise<any> {
    const { collection, docId, updateData } = data;
    return await this.dependencies.database.update(collection, docId, updateData);
  }

  private async handleDatabaseDelete(data: any): Promise<any> {
    const { collection, docId } = data;
    return await this.dependencies.database.delete(collection, docId);
  }

  private async handleCacheGet(data: any): Promise<any> {
    const { key } = data;
    return await this.dependencies.cache.get(key);
  }

  private async handleCacheSet(data: any): Promise<any> {
    const { key, value, ttl } = data;
    return await this.dependencies.cache.set(key, value, ttl);
  }

  private async handleQueueAdd(data: any): Promise<any> {
    const { operation, queueData, priority } = data;
    return await this.dependencies.queue.queueOperation(operation, queueData, priority);
  }

  private async getMetrics(): Promise<any> {
    const status = this.getStatus();
    const dbHealth = this.dependencies.database ? await this.dependencies.database.healthCheck() : null;
    const cacheStats = this.dependencies.cache ? await this.dependencies.cache.stats() : null;
    const queueHealth = this.dependencies.queue ? await this.dependencies.queue.healthCheck() : null;

    return {
      server: status,
      database: dbHealth,
      cache: cacheStats,
      queue: queueHealth,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      },
      cpu: process.cpuUsage()
    };
  }

  isHealthy(): boolean {
    return this.config.isHealthy && this.isRunning;
  }

  // Configuration methods
  updateConfig(newConfig: Partial<ServerConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.info(`Server ${this.config.id} configuration updated`, {
      operation: 'server_config_update',
      metadata: { updates: Object.keys(newConfig) }
    });
  }

  getConfig(): ServerConfig {
    return { ...this.config };
  }
}

export class PrimaryServer extends BaseServer {
  constructor(config: ServerConfig, dependencies: ServerDependencies) {
    super(config, dependencies);
    this.logger.info('Primary server initialized', {
      operation: 'primary_server_init',
      metadata: { serverId: config.id, port: config.port }
    });
  }

  async executeOperation(operation: string, data: any): Promise<any> {
    // Primary server handles all operations normally
    this.logger.debug(`Primary server executing: ${operation}`, {
      operation: `primary_${operation}`,
      server: this.config.id
    });

    return await super.executeOperation(operation, data);
  }
}

export class SecondaryServer extends BaseServer {
  constructor(config: ServerConfig, dependencies: ServerDependencies) {
    super(config, dependencies);
    this.logger.info('Secondary server initialized', {
      operation: 'secondary_server_init',
      metadata: { serverId: config.id, port: config.port }
    });
  }

  async executeOperation(operation: string, data: any): Promise<any> {
    // Secondary server can handle all operations but logs them as fallback
    this.logger.info(`Secondary server handling fallback operation: ${operation}`, {
      operation: `fallback_${operation}`,
      server: this.config.id
    });

    return await super.executeOperation(operation, data);
  }
}

export class ServerManager {
  private primaryServer: PrimaryServer;
  private secondaryServer: SecondaryServer | null = null;
  private logger: GlobalLogger;

  constructor(
    primaryConfig: ServerConfig,
    secondaryConfig: ServerConfig | null,
    dependencies: ServerDependencies
  ) {
    this.logger = dependencies.logger;

    // Initialize primary server
    this.primaryServer = new PrimaryServer(primaryConfig, dependencies);

    // Initialize secondary server if provided
    if (secondaryConfig) {
      this.secondaryServer = new SecondaryServer(secondaryConfig, dependencies);
    }

    this.logger.info('Server manager initialized', {
      operation: 'server_manager_init',
      metadata: {
        hasPrimary: true,
        hasSecondary: !!this.secondaryServer
      }
    });
  }

  async startAll(): Promise<void> {
    try {
      // Start primary server
      await this.primaryServer.start();
      this.logger.info('Primary server started successfully');

      // Start secondary server if available
      if (this.secondaryServer) {
        await this.secondaryServer.start();
        this.logger.info('Secondary server started successfully');
      }

      this.logger.info('All servers started successfully');
    } catch (error) {
      this.logger.error('Failed to start servers', error as Error);
      throw error;
    }
  }

  async stopAll(): Promise<void> {
    try {
      const stopPromises: Promise<void>[] = [];

      stopPromises.push(this.primaryServer.stop());
      if (this.secondaryServer) {
        stopPromises.push(this.secondaryServer.stop());
      }

      await Promise.all(stopPromises);
      this.logger.info('All servers stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping servers', error as Error);
      throw error;
    }
  }

  async restartAll(): Promise<void> {
    this.logger.info('Restarting all servers');
    await this.stopAll();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await this.startAll();
  }

  async healthCheckAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    try {
      results.push(await this.primaryServer.healthCheck());
      if (this.secondaryServer) {
        results.push(await this.secondaryServer.healthCheck());
      }
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
    }

    return results;
  }

  getServerStatus(): { primary: ServerStatus; secondary: ServerStatus | null } {
    return {
      primary: this.primaryServer.getStatus(),
      secondary: this.secondaryServer ? this.secondaryServer.getStatus() : null
    };
  }

  getPrimaryServer(): PrimaryServer {
    return this.primaryServer;
  }

  getSecondaryServer(): SecondaryServer | null {
    return this.secondaryServer;
  }

  async getServerByHealthiness(): Promise<BaseServer> {
    const primaryHealthy = this.primaryServer.isHealthy();
    const secondaryHealthy = this.secondaryServer ? this.secondaryServer.isHealthy() : false;

    if (primaryHealthy) {
      return this.primaryServer;
    } else if (secondaryHealthy && this.secondaryServer) {
      this.logger.warn('Primary server unhealthy, using secondary server');
      return this.secondaryServer;
    } else {
      throw new SystemError('No healthy servers available', 'NO_HEALTHY_SERVERS');
    }
  }
}

// Factory functions
export function createPrimaryServer(config: ServerConfig, dependencies: ServerDependencies): PrimaryServer {
  return new PrimaryServer(config, dependencies);
}

export function createSecondaryServer(config: ServerConfig, dependencies: ServerDependencies): SecondaryServer {
  return new SecondaryServer(config, dependencies);
}

export function createServerManager(
  primaryConfig: ServerConfig,
  secondaryConfig: ServerConfig | null,
  dependencies: ServerDependencies
): ServerManager {
  return new ServerManager(primaryConfig, secondaryConfig, dependencies);
}

export default ServerManager;

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

