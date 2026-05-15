// Comprehensive Load Balancer with Multiple Modes - Redundant Backend Architecture

import { LoadBalancerConfig, ServerConfig, HealthCheckResult, ApiResponse, LoadBalancerError } from '../core/types';
import { GlobalLogger } from '../logger';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export interface LoadBalancerInterface {
  selectServer(): ServerConfig | null;
  executeRequest<T>(operation: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>>;
  addServer(server: ServerConfig): void;
  removeServer(serverId: string): void;
  updateServerConfig(serverId: string, config: Partial<ServerConfig>): void;
  getServerStatus(): ServerStatus[];
  healthCheck(serverId?: string): Promise<HealthCheckResult[]>;
  setMode(mode: LoadBalancerConfig['mode']): void;
  pause(): void;
  resume(): void;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

export interface ServerStatus {
  id: string;
  name: string;
  isHealthy: boolean;
  isActive: boolean;
  weight: number;
  priority: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  lastRequest: Date | null;
  uptime: number;
}

class RoundRobinBalancer {
  private servers: ServerConfig[] = [];
  private currentIndex = 0;
  private logger: GlobalLogger;

  constructor(servers: ServerConfig[], logger: GlobalLogger) {
    this.servers = servers.filter(s => s.isHealthy);
    this.logger = logger;
  }

  selectServer(): ServerConfig | null {
    if (this.servers.length === 0) {
      this.logger.warn('No healthy servers available for round robin');
      return null;
    }

    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;

    this.logger.debug(`Round robin selected server: ${server.id}`, {
      operation: 'load_balancer_select',
      metadata: { serverId: server.id, algorithm: 'round_robin' }
    });

    return server;
  }

  updateServers(servers: ServerConfig[]): void {
    this.servers = servers.filter(s => s.isHealthy);
    if (this.currentIndex >= this.servers.length) {
      this.currentIndex = 0;
    }
  }
}

class WeightedBalancer {
  private servers: ServerConfig[] = [];
  private weights: number[] = [];
  private totalWeight = 0;
  private logger: GlobalLogger;

  constructor(servers: ServerConfig[], logger: GlobalLogger) {
    this.logger = logger;
    this.updateServers(servers);
  }

  selectServer(): ServerConfig | null {
    if (this.servers.length === 0 || this.totalWeight === 0) {
      this.logger.warn('No healthy servers available for weighted selection');
      return null;
    }

    const random = Math.random() * this.totalWeight;
    let currentWeight = 0;

    for (let i = 0; i < this.servers.length; i++) {
      currentWeight += this.weights[i];
      if (random <= currentWeight) {
        const server = this.servers[i];
        this.logger.debug(`Weighted selection chose server: ${server.id}`, {
          operation: 'load_balancer_select',
          metadata: { serverId: server.id, weight: server.weight, algorithm: 'weighted' }
        });
        return server;
      }
    }

    // Fallback to first server
    const fallback = this.servers[0];
    this.logger.warn(`Weighted selection fallback to server: ${fallback.id}`);
    return fallback;
  }

  updateServers(servers: ServerConfig[]): void {
    this.servers = servers.filter(s => s.isHealthy);
    this.weights = this.servers.map(s => s.weight || 1);
    this.totalWeight = this.weights.reduce((sum, weight) => sum + weight, 0);
  }
}

class FailoverBalancer {
  private servers: ServerConfig[] = [];
  private logger: GlobalLogger;

  constructor(servers: ServerConfig[], logger: GlobalLogger) {
    this.logger = logger;
    this.updateServers(servers);
  }

  selectServer(): ServerConfig | null {
    if (this.servers.length === 0) {
      this.logger.warn('No healthy servers available for failover');
      return null;
    }

    // Return highest priority healthy server
    const server = this.servers[0];
    this.logger.debug(`Failover selected server: ${server.id}`, {
      operation: 'load_balancer_select',
      metadata: { serverId: server.id, priority: server.priority, algorithm: 'failover' }
    });

    return server;
  }

  updateServers(servers: ServerConfig[]): void {
    this.servers = servers
      .filter(s => s.isHealthy)
      .sort((a, b) => (a.priority || 1) - (b.priority || 1)); // Lower number = higher priority
  }
}

export class LoadBalancer implements LoadBalancerInterface {
  private config: LoadBalancerConfig;
  private servers: Map<string, ServerConfig> = new Map();
  private serverStats: Map<string, ServerStatus> = new Map();
  private balancer: RoundRobinBalancer | WeightedBalancer | FailoverBalancer;
  private logger: GlobalLogger;
  private isPaused = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor(config: LoadBalancerConfig, servers: ServerConfig[], logger: GlobalLogger) {
    this.config = config;
    this.logger = logger;

    // Initialize servers
    servers.forEach(server => {
      this.servers.set(server.id, server);
      this.initializeServerStats(server);
    });

    // Initialize balancer based on mode
    this.balancer = this.createBalancer();

    // Start health checking
    this.startHealthChecking();

    this.logger.info('Load balancer initialized', {
      operation: 'load_balancer_init',
      metadata: {
        mode: config.mode,
        serverCount: servers.length,
        healthCheckInterval: config.health_check_interval
      }
    });
  }

  private createBalancer(): RoundRobinBalancer | WeightedBalancer | FailoverBalancer {
    const serverArray = Array.from(this.servers.values());

    switch (this.config.mode) {
      case 'round_robin':
        return new RoundRobinBalancer(serverArray, this.logger);
      case 'weighted':
        return new WeightedBalancer(serverArray, this.logger);
      case 'failover':
        return new FailoverBalancer(serverArray, this.logger);
      default:
        this.logger.warn(`Unknown load balancer mode: ${this.config.mode}, defaulting to round_robin`);
        return new RoundRobinBalancer(serverArray, this.logger);
    }
  }

  private initializeServerStats(server: ServerConfig): void {
    this.serverStats.set(server.id, {
      id: server.id,
      name: server.name,
      isHealthy: server.isHealthy,
      isActive: true,
      weight: server.weight,
      priority: server.priority,
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      lastRequest: null,
      uptime: Date.now()
    });
  }

  private startHealthChecking(): void {
    if (this.config.health_check_interval > 0) {
      this.healthCheckTimer = setInterval(async () => {
        await this.performHealthChecks();
      }, this.config.health_check_interval);
    }
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.servers.values()).map(server =>
      this.performSingleHealthCheck(server)
    );

    const results = await Promise.allSettled(healthPromises);
    let healthyCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.isHealthy) {
        healthyCount++;
      }
    });

    // Update balancer with current server states
    this.updateBalancer();

    this.logger.debug(`Health check completed: ${healthyCount}/${this.servers.size} servers healthy`, {
      operation: 'health_check_batch',
      metadata: { total: this.servers.size, healthy: healthyCount }
    });
  }

  private async performSingleHealthCheck(server: ServerConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const healthEndpoint = `${server.host.startsWith('http') ? server.host : `http://${server.host}`}:${server.port}/health`;

    try {
      const response = await this.makeHttpRequest(healthEndpoint, {
        method: 'GET',
        timeout: this.config.timeout / 2 // Use half timeout for health checks
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 300;

      // Update server health
      server.isHealthy = isHealthy;
      server.lastHealthCheck = new Date();

      // Update stats
      const stats = this.serverStats.get(server.id);
      if (stats) {
        stats.isHealthy = isHealthy;
      }

      this.logger.logHealthCheck(server.id, isHealthy, responseTime);

      return {
        server: server.id,
        isHealthy,
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      server.isHealthy = false;
      server.lastHealthCheck = new Date();

      const stats = this.serverStats.get(server.id);
      if (stats) {
        stats.isHealthy = false;
        stats.errorCount++;
      }

      this.logger.logHealthCheck(server.id, false, responseTime, (error as Error).message);

      return {
        server: server.id,
        isHealthy: false,
        responseTime,
        timestamp: new Date(),
        error: (error as Error).message
      };
    }
  }

  private async makeHttpRequest(url: string, options: RequestOptions): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || this.config.timeout
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsedData = data ? JSON.parse(data) : null;
            resolve({ status: res.statusCode || 0, data: parsedData });
          } catch (error) {
            resolve({ status: res.statusCode || 0, data: data });
          }
        });
      });

      req.on('error', (error) => {
        reject(new LoadBalancerError(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new LoadBalancerError('Request timeout'));
      });

      if (options.method !== 'GET' && options.method !== 'HEAD') {
        req.write(JSON.stringify(options));
      }

      req.end();
    });
  }

  private updateBalancer(): void {
    const serverArray = Array.from(this.servers.values());

    if (this.balancer instanceof RoundRobinBalancer) {
      this.balancer.updateServers(serverArray);
    } else if (this.balancer instanceof WeightedBalancer) {
      this.balancer.updateServers(serverArray);
    } else if (this.balancer instanceof FailoverBalancer) {
      this.balancer.updateServers(serverArray);
    }
  }

  selectServer(): ServerConfig | null {
    if (this.isPaused) {
      this.logger.warn('Load balancer is paused, cannot select server');
      return null;
    }

    return this.balancer.selectServer();
  }

  async executeRequest<T>(operation: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let fallbackUsed = false;
    let selectedServer: ServerConfig | null = null;
    let attempts = 0;
    const maxAttempts = options.retries || this.config.max_retries;

    while (attempts < maxAttempts) {
      attempts++;
      selectedServer = this.selectServer();

      if (!selectedServer) {
        throw new LoadBalancerError('No available servers');
      }

      // Update server stats
      const stats = this.serverStats.get(selectedServer.id);
      if (stats) {
        stats.requestCount++;
        stats.lastRequest = new Date();
      }

      try {
        const endpoint = `${selectedServer.host.startsWith('http') ? selectedServer.host : `http://${selectedServer.host}`}:${selectedServer.port}/api/${operation}`;

        const response = await this.makeHttpRequest(endpoint, {
          method: options.method || 'POST',
          timeout: options.timeout || this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...data
        });

        const responseTime = Date.now() - startTime;

        // Update server stats on success
        if (stats) {
          stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
        }

        this.logger.logRequestEnd(
          `req_${startTime}`,
          operation,
          responseTime,
          true,
          undefined,
          selectedServer.id
        );

        return {
          success: true,
          server: selectedServer.id,
          fallback_used: fallbackUsed,
          data: response.data,
          timestamp: new Date(),
          responseTime
        };

      } catch (error) {
        lastError = error as Error;
        fallbackUsed = true;

        // Update server stats on error
        if (stats) {
          stats.errorCount++;
        }

        this.logger.error(`Request failed on server ${selectedServer.id}`, error as Error, {
          operation,
          server: selectedServer.id,
          requestId: `req_${startTime}`,
          attempt: attempts
        });

        // Mark server as potentially unhealthy if multiple consecutive errors
        if (stats && stats.errorCount > 3) {
          selectedServer.isHealthy = false;
          this.updateBalancer();
        }

        // If this was our last attempt, break
        if (attempts >= maxAttempts) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    const responseTime = Date.now() - startTime;

    this.logger.logRequestEnd(
      `req_${startTime}`,
      operation,
      responseTime,
      false,
      undefined,
      selectedServer?.id
    );

    return {
      success: false,
      server: selectedServer?.id || 'unknown',
      fallback_used: fallbackUsed,
      error: lastError?.message || 'All servers failed',
      timestamp: new Date(),
      responseTime
    };
  }

  addServer(server: ServerConfig): void {
    this.servers.set(server.id, server);
    this.initializeServerStats(server);
    this.updateBalancer();

    this.logger.info(`Server added: ${server.id}`, {
      operation: 'server_add',
      metadata: { serverId: server.id, host: server.host, port: server.port }
    });
  }

  removeServer(serverId: string): void {
    this.servers.delete(serverId);
    this.serverStats.delete(serverId);
    this.updateBalancer();

    this.logger.info(`Server removed: ${serverId}`, {
      operation: 'server_remove',
      metadata: { serverId }
    });
  }

  updateServerConfig(serverId: string, config: Partial<ServerConfig>): void {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new LoadBalancerError(`Server not found: ${serverId}`);
    }

    Object.assign(server, config);
    this.updateBalancer();

    this.logger.info(`Server config updated: ${serverId}`, {
      operation: 'server_update',
      metadata: { serverId, updates: Object.keys(config) }
    });
  }

  getServerStatus(): ServerStatus[] {
    return Array.from(this.serverStats.values());
  }

  async healthCheck(serverId?: string): Promise<HealthCheckResult[]> {
    if (serverId) {
      const server = this.servers.get(serverId);
      if (!server) {
        throw new LoadBalancerError(`Server not found: ${serverId}`);
      }
      const result = await this.performSingleHealthCheck(server);
      return [result];
    } else {
      const results: HealthCheckResult[] = [];
      for (const server of this.servers.values()) {
        const result = await this.performSingleHealthCheck(server);
        results.push(result);
      }
      return results;
    }
  }

  setMode(mode: LoadBalancerConfig['mode']): void {
    const oldMode = this.config.mode;
    this.config.mode = mode;
    this.balancer = this.createBalancer();

    this.logger.info(`Load balancer mode changed: ${oldMode} -> ${mode}`, {
      operation: 'mode_change',
      metadata: { oldMode, newMode: mode }
    });
  }

  pause(): void {
    this.isPaused = true;
    this.logger.info('Load balancer paused', { operation: 'pause' });
  }

  resume(): void {
    this.isPaused = false;
    this.logger.info('Load balancer resumed', { operation: 'resume' });
  }

  // Configuration methods
  updateConfig(config: Partial<LoadBalancerConfig>): void {
    Object.assign(this.config, config);

    // Restart health checking if interval changed
    if (config.health_check_interval !== undefined) {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }
      this.startHealthChecking();
    }

    // Update balancer if mode changed
    if (config.mode) {
      this.balancer = this.createBalancer();
    }

    this.logger.info('Load balancer config updated', {
      operation: 'config_update',
      metadata: { updates: Object.keys(config) }
    });
  }

  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  // Statistics and monitoring
  getStatistics(): {
    totalRequests: number;
    totalErrors: number;
    avgResponseTime: number;
    healthyServers: number;
    totalServers: number;
    mode: string;
  } {
    const stats = Array.from(this.serverStats.values());
    const totalRequests = stats.reduce((sum, s) => sum + s.requestCount, 0);
    const totalErrors = stats.reduce((sum, s) => sum + s.errorCount, 0);
    const avgResponseTime = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.avgResponseTime, 0) / stats.length
      : 0;
    const healthyServers = stats.filter(s => s.isHealthy).length;

    return {
      totalRequests,
      totalErrors,
      avgResponseTime,
      healthyServers,
      totalServers: stats.length,
      mode: this.config.mode
    };
  }

  async getDetailedHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    servers: HealthCheckResult[];
    statistics: any;
  }> {
    const healthResults = await this.healthCheck();
    const statistics = this.getStatistics();

    const healthyCount = healthResults.filter(r => r.isHealthy).length;
    const totalCount = healthResults.length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      servers: healthResults,
      statistics
    };
  }

  // Cleanup
  cleanup(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.logger.info('Load balancer cleaned up', { operation: 'cleanup' });
  }
}

// Factory function
export function createLoadBalancer(
  config: LoadBalancerConfig,
  servers: ServerConfig[],
  logger: GlobalLogger
): LoadBalancer {
  return new LoadBalancer(config, servers, logger);
}

export default LoadBalancer;

