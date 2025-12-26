// Core System Configuration Manager for Redundant Backend Architecture

import { BackendSystemConfig, ServerConfig, LoadBalancerConfig, DatabaseConfig, CacheConfig, QueueConfig, LoggerConfig, RetryConfig, CircuitBreakerConfig } from './types';
import fs from 'fs';
import path from 'path';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: BackendSystemConfig;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config');
    this.config = this.loadDefaultConfig();
    this.ensureConfigDirectory();
    this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private ensureConfigDirectory(): void {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }
  }

  private loadDefaultConfig(): BackendSystemConfig {
    const primaryServer: ServerConfig = {
      id: 'A',
      name: 'Primary Server',
      host: process.env.SERVER_A_HOST || 'localhost',
      port: parseInt(process.env.SERVER_A_PORT || '3000'),
      isHealthy: true,
      lastHealthCheck: new Date(),
      weight: 70,
      priority: 1
    };

    const secondaryServer: ServerConfig = {
      id: 'B',
      name: 'Secondary Server',
      host: process.env.SERVER_B_HOST || 'localhost',
      port: parseInt(process.env.SERVER_B_PORT || '3001'),
      isHealthy: true,
      lastHealthCheck: new Date(),
      weight: 30,
      priority: 2
    };

    const loadBalancer: LoadBalancerConfig = {
      mode: (process.env.LOAD_BALANCER_MODE as any) || 'weighted',
      primary_weight: parseInt(process.env.PRIMARY_WEIGHT || '70'),
      secondary_weight: parseInt(process.env.SECONDARY_WEIGHT || '30'),
      health_check_interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5000'),
      timeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
      max_retries: parseInt(process.env.MAX_RETRIES || '3')
    };

    const database: DatabaseConfig = {
      primary: {
        type: 'firebase',
        connectionString: process.env.FIREBASE_PRIMARY_CONFIG || '',
        isHealthy: true,
        lastSync: new Date()
      },
      secondary: {
        type: 'firebase',
        connectionString: process.env.FIREBASE_SECONDARY_CONFIG || '',
        isHealthy: true,
        lastSync: new Date()
      },
      sync_interval: parseInt(process.env.DB_SYNC_INTERVAL || '60000'),
      auto_failover: process.env.DB_AUTO_FAILOVER === 'true'
    };

    const cache: CacheConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        isHealthy: true
      },
      fallback: {
        type: 'memory',
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100'),
        ttl: parseInt(process.env.CACHE_TTL || '3600')
      }
    };

    const queue: QueueConfig = {
      maxSize: parseInt(process.env.QUEUE_MAX_SIZE || '1000'),
      retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || '5000'),
      persistToDisk: process.env.QUEUE_PERSIST === 'true',
      flushInterval: parseInt(process.env.QUEUE_FLUSH_INTERVAL || '10000')
    };

    const logger: LoggerConfig = {
      level: (process.env.LOG_LEVEL as any) || 'info',
      outputs: (process.env.LOG_OUTPUTS?.split(',') as any) || ['console', 'file'],
      logFile: process.env.LOG_FILE || 'logs/system.log',
      maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10MB',
      includeTimestamp: process.env.LOG_INCLUDE_TIMESTAMP !== 'false',
      includeServerInfo: process.env.LOG_INCLUDE_SERVER_INFO !== 'false'
    };

    const retry: RetryConfig = {
      maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
      initialDelay: parseInt(process.env.RETRY_INITIAL_DELAY || '1000'),
      maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '10000'),
      backoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2'),
      retryConditions: process.env.RETRY_CONDITIONS?.split(',') || [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'SERVER_ERROR_5XX'
      ]
    };

    const circuitBreaker: CircuitBreakerConfig = {
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET || '60000'),
      monitoringPeriod: parseInt(process.env.CIRCUIT_BREAKER_MONITORING || '60000')
    };

    return {
      servers: {
        primary: primaryServer,
        secondary: secondaryServer
      },
      loadBalancer,
      database,
      cache,
      queue,
      logger,
      retry,
      circuitBreaker,
      monitoring: {
        metricsInterval: parseInt(process.env.METRICS_INTERVAL || '30000'),
        alertThresholds: {
          errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.1'),
          responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '5000'),
          memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '0.8'),
          cpuUsage: parseFloat(process.env.ALERT_CPU_USAGE || '0.8')
        }
      }
    };
  }

  private loadConfig(): void {
    try {
      // Load individual config files
      this.loadServersConfig();
      this.loadLoadBalancerConfig();
      this.loadDatabaseConfig();
      this.loadCacheConfig();
      this.loadLoggerConfig();
    } catch (error) {
      console.warn('Failed to load some config files, using defaults:', error);
    }
  }

  private loadServersConfig(): void {
    const serversConfigPath = path.join(this.configPath, 'servers.json');
    if (fs.existsSync(serversConfigPath)) {
      const serversConfig = JSON.parse(fs.readFileSync(serversConfigPath, 'utf8'));
      this.config.servers = { ...this.config.servers, ...serversConfig };
    } else {
      this.saveServersConfig();
    }
  }

  private loadLoadBalancerConfig(): void {
    const lbConfigPath = path.join(this.configPath, 'loadbalancer.json');
    if (fs.existsSync(lbConfigPath)) {
      const lbConfig = JSON.parse(fs.readFileSync(lbConfigPath, 'utf8'));
      this.config.loadBalancer = { ...this.config.loadBalancer, ...lbConfig };
    } else {
      this.saveLoadBalancerConfig();
    }
  }

  private loadDatabaseConfig(): void {
    const dbConfigPath = path.join(this.configPath, 'database.json');
    if (fs.existsSync(dbConfigPath)) {
      const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
      this.config.database = { ...this.config.database, ...dbConfig };
    } else {
      this.saveDatabaseConfig();
    }
  }

  private loadCacheConfig(): void {
    const cacheConfigPath = path.join(this.configPath, 'cache.json');
    if (fs.existsSync(cacheConfigPath)) {
      const cacheConfig = JSON.parse(fs.readFileSync(cacheConfigPath, 'utf8'));
      this.config.cache = { ...this.config.cache, ...cacheConfig };
    } else {
      this.saveCacheConfig();
    }
  }

  private loadLoggerConfig(): void {
    const loggerConfigPath = path.join(this.configPath, 'logger.json');
    if (fs.existsSync(loggerConfigPath)) {
      const loggerConfig = JSON.parse(fs.readFileSync(loggerConfigPath, 'utf8'));
      this.config.logger = { ...this.config.logger, ...loggerConfig };
    } else {
      this.saveLoggerConfig();
    }
  }

  public getConfig(): BackendSystemConfig {
    return this.config;
  }

  public getServerConfig(serverId: 'A' | 'B'): ServerConfig {
    return serverId === 'A' ? this.config.servers.primary : this.config.servers.secondary;
  }

  public getLoadBalancerConfig(): LoadBalancerConfig {
    return this.config.loadBalancer;
  }

  public getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  public getCacheConfig(): CacheConfig {
    return this.config.cache;
  }

  public getQueueConfig(): QueueConfig {
    return this.config.queue;
  }

  public getLoggerConfig(): LoggerConfig {
    return this.config.logger;
  }

  public getRetryConfig(): RetryConfig {
    return this.config.retry;
  }

  public getCircuitBreakerConfig(): CircuitBreakerConfig {
    return this.config.circuitBreaker;
  }

  public updateServerConfig(serverId: 'A' | 'B', config: Partial<ServerConfig>): void {
    if (serverId === 'A') {
      this.config.servers.primary = { ...this.config.servers.primary, ...config };
    } else {
      this.config.servers.secondary = { ...this.config.servers.secondary, ...config };
    }
    this.saveServersConfig();
  }

  public updateLoadBalancerConfig(config: Partial<LoadBalancerConfig>): void {
    this.config.loadBalancer = { ...this.config.loadBalancer, ...config };
    this.saveLoadBalancerConfig();
  }

  public updateDatabaseConfig(config: Partial<DatabaseConfig>): void {
    this.config.database = { ...this.config.database, ...config };
    this.saveDatabaseConfig();
  }

  public updateCacheConfig(config: Partial<CacheConfig>): void {
    this.config.cache = { ...this.config.cache, ...config };
    this.saveCacheConfig();
  }

  public updateLoggerConfig(config: Partial<LoggerConfig>): void {
    this.config.logger = { ...this.config.logger, ...config };
    this.saveLoggerConfig();
  }

  private saveServersConfig(): void {
    const serversConfigPath = path.join(this.configPath, 'servers.json');
    fs.writeFileSync(serversConfigPath, JSON.stringify({
      primary: this.config.servers.primary,
      secondary: this.config.servers.secondary
    }, null, 2));
  }

  private saveLoadBalancerConfig(): void {
    const lbConfigPath = path.join(this.configPath, 'loadbalancer.json');
    fs.writeFileSync(lbConfigPath, JSON.stringify(this.config.loadBalancer, null, 2));
  }

  private saveDatabaseConfig(): void {
    const dbConfigPath = path.join(this.configPath, 'database.json');
    const sanitizedConfig = {
      ...this.config.database,
      primary: {
        ...this.config.database.primary,
        connectionString: '[REDACTED]'
      },
      secondary: {
        ...this.config.database.secondary,
        connectionString: '[REDACTED]'
      }
    };
    fs.writeFileSync(dbConfigPath, JSON.stringify(sanitizedConfig, null, 2));
  }

  private saveCacheConfig(): void {
    const cacheConfigPath = path.join(this.configPath, 'cache.json');
    const sanitizedConfig = {
      ...this.config.cache,
      redis: {
        ...this.config.cache.redis,
        password: this.config.cache.redis.password ? '[REDACTED]' : undefined
      }
    };
    fs.writeFileSync(cacheConfigPath, JSON.stringify(sanitizedConfig, null, 2));
  }

  private saveLoggerConfig(): void {
    const loggerConfigPath = path.join(this.configPath, 'logger.json');
    fs.writeFileSync(loggerConfigPath, JSON.stringify(this.config.logger, null, 2));
  }

  public generateAllConfigs(): void {
    this.saveServersConfig();
    this.saveLoadBalancerConfig();
    this.saveDatabaseConfig();
    this.saveCacheConfig();
    this.saveLoggerConfig();
    console.log('✅ All configuration files generated successfully!');
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate servers
    if (!this.config.servers.primary.host || !this.config.servers.primary.port) {
      errors.push('Primary server configuration incomplete');
    }
    if (!this.config.servers.secondary.host || !this.config.servers.secondary.port) {
      errors.push('Secondary server configuration incomplete');
    }

    // Validate load balancer
    const totalWeight = this.config.loadBalancer.primary_weight + this.config.loadBalancer.secondary_weight;
    if (totalWeight !== 100) {
      errors.push(`Server weights should sum to 100, current sum: ${totalWeight}`);
    }

    // Validate database
    if (!this.config.database.primary.connectionString && !this.config.database.secondary.connectionString) {
      errors.push('At least one database connection string is required');
    }

    // Validate cache
    if (!this.config.cache.redis.host || !this.config.cache.redis.port) {
      errors.push('Redis cache configuration incomplete');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public reload(): void {
    this.config = this.loadDefaultConfig();
    this.loadConfig();
    console.log('✅ Configuration reloaded successfully!');
  }

  public getEnvironmentTemplate(): string {
    return `# Backend System Configuration Environment Variables
# Copy this to your .env file and update the values

# Server Configuration
SERVER_A_HOST=localhost
SERVER_A_PORT=3000
SERVER_B_HOST=localhost
SERVER_B_PORT=3001

# Load Balancer Configuration
LOAD_BALANCER_MODE=weighted
PRIMARY_WEIGHT=70
SECONDARY_WEIGHT=30
HEALTH_CHECK_INTERVAL=5000
REQUEST_TIMEOUT=30000
MAX_RETRIES=3

# Database Configuration
FIREBASE_PRIMARY_CONFIG=your_primary_firebase_config
FIREBASE_SECONDARY_CONFIG=your_secondary_firebase_config
DB_SYNC_INTERVAL=60000
DB_AUTO_FAILOVER=true

# Redis Cache Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
CACHE_MAX_SIZE=100
CACHE_TTL=3600

# Queue Configuration
QUEUE_MAX_SIZE=1000
QUEUE_RETRY_ATTEMPTS=3
QUEUE_RETRY_DELAY=5000
QUEUE_PERSIST=true
QUEUE_FLUSH_INTERVAL=10000

# Logger Configuration
LOG_LEVEL=info
LOG_OUTPUTS=console,file
LOG_FILE=logs/system.log
LOG_MAX_FILE_SIZE=10MB
LOG_INCLUDE_TIMESTAMP=true
LOG_INCLUDE_SERVER_INFO=true

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000
RETRY_MAX_DELAY=10000
RETRY_BACKOFF_MULTIPLIER=2
RETRY_CONDITIONS=NETWORK_ERROR,TIMEOUT_ERROR,SERVER_ERROR_5XX

# Circuit Breaker Configuration
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_RESET=60000
CIRCUIT_BREAKER_MONITORING=60000

# Monitoring Configuration
METRICS_INTERVAL=30000
ALERT_ERROR_RATE=0.1
ALERT_RESPONSE_TIME=5000
ALERT_MEMORY_USAGE=0.8
ALERT_CPU_USAGE=0.8
`;
  }
}

export const config = ConfigManager.getInstance();
export default config;

