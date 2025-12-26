export interface NetworkNode {
  id: string;
  name: string;
  type: 'server' | 'router' | 'switch' | 'firewall' | 'load_balancer';
  ipAddress: string;
  location: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  lastCheck: string;
  responseTime: number; // in ms
  uptime: number; // in percentage
  cpuUsage: number; // in percentage
  memoryUsage: number; // in percentage
  diskUsage: number; // in percentage
  networkIn: number; // in Mbps
  networkOut: number; // in Mbps
  connections: number;
  maxConnections: number;
}

export interface NetworkAlert {
  id: string;
  nodeId: string;
  type: 'down' | 'high_latency' | 'high_cpu' | 'high_memory' | 'disk_full' | 'connection_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

export interface NetworkMetric {
  nodeId: string;
  timestamp: string;
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  connections: number;
}

export interface HealthCheck {
  id: string;
  nodeId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedStatus: number;
  timeout: number; // in seconds
  interval: number; // in seconds
  active: boolean;
  lastCheck: string;
  status: 'passing' | 'failing' | 'warning';
  responseTime: number;
  consecutiveFailures: number;
  maxFailures: number;
}

class NetworkMonitoringManager {
  private static instance: NetworkMonitoringManager;
  private nodes: Map<string, NetworkNode> = new Map();
  private alerts: Map<string, NetworkAlert> = new Map();
  private metrics: Map<string, NetworkMetric[]> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private monitoringTimer: NodeJS.Timeout | null = null;
  private alertThresholds = {
    responseTime: 1000, // 1 second
    cpuUsage: 80, // 80%
    memoryUsage: 85, // 85%
    diskUsage: 90, // 90%
    connectionLimit: 90 // 90%
  };

  private constructor() {
    this.initializeNodes();
    this.initializeHealthChecks();
    this.startMonitoring();
  }

  static getInstance(): NetworkMonitoringManager {
    if (!NetworkMonitoringManager.instance) {
      NetworkMonitoringManager.instance = new NetworkMonitoringManager();
    }
    return NetworkMonitoringManager.instance;
  }

  private initializeNodes() {
    // Primary server
    this.addNode({
      id: 'server_primary',
      name: 'Primary Production Server',
      type: 'server',
      ipAddress: '192.168.1.10',
      location: 'Data Center - US East',
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 45,
      uptime: 99.9,
      cpuUsage: 65,
      memoryUsage: 72,
      diskUsage: 45,
      networkIn: 125.5,
      networkOut: 98.2,
      connections: 450,
      maxConnections: 500
    });

    // Backup servers
    this.addNode({
      id: 'server_backup_1',
      name: 'Backup Server - US West',
      type: 'server',
      ipAddress: '192.168.2.10',
      location: 'Data Center - US West',
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 78,
      uptime: 99.7,
      cpuUsage: 35,
      memoryUsage: 42,
      diskUsage: 38,
      networkIn: 45.2,
      networkOut: 32.8,
      connections: 120,
      maxConnections: 300
    });

    this.addNode({
      id: 'server_backup_2',
      name: 'Backup Server - Europe',
      type: 'server',
      ipAddress: '192.168.3.10',
      location: 'Data Center - EU West',
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 120,
      uptime: 99.5,
      cpuUsage: 28,
      memoryUsage: 35,
      diskUsage: 32,
      networkIn: 28.7,
      networkOut: 22.3,
      connections: 85,
      maxConnections: 250
    });

    // Network infrastructure
    this.addNode({
      id: 'router_main',
      name: 'Main Router',
      type: 'router',
      ipAddress: '192.168.1.1',
      location: 'Data Center - US East',
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 5,
      uptime: 99.99,
      cpuUsage: 15,
      memoryUsage: 25,
      diskUsage: 12,
      networkIn: 500.8,
      networkOut: 485.3,
      connections: 1000,
      maxConnections: 1500
    });

    this.addNode({
      id: 'load_balancer',
      name: 'Load Balancer',
      type: 'load_balancer',
      ipAddress: '192.168.1.5',
      location: 'Data Center - US East',
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 12,
      uptime: 99.98,
      cpuUsage: 45,
      memoryUsage: 52,
      diskUsage: 18,
      networkIn: 380.5,
      networkOut: 365.2,
      connections: 800,
      maxConnections: 1000
    });

    this.addNode({
      id: 'firewall',
      name: 'Firewall',
      type: 'firewall',
      ipAddress: '192.168.1.254',
      location: 'Data Center - US East',
      status: 'online',
      lastCheck: new Date().toISOString(),
      responseTime: 8,
      uptime: 99.99,
      cpuUsage: 22,
      memoryUsage: 30,
      diskUsage: 15,
      networkIn: 450.3,
      networkOut: 435.8,
      connections: 1200,
      maxConnections: 2000
    });
  }

  private initializeHealthChecks() {
    // API endpoint checks
    this.addHealthCheck({
      id: 'api_health',
      nodeId: 'server_primary',
      endpoint: '/api/health',
      method: 'GET',
      expectedStatus: 200,
      timeout: 10,
      interval: 30,
      active: true,
      lastCheck: new Date().toISOString(),
      status: 'passing',
      responseTime: 45,
      consecutiveFailures: 0,
      maxFailures: 3
    });

    this.addHealthCheck({
      id: 'db_health',
      nodeId: 'server_primary',
      endpoint: '/api/db/health',
      method: 'GET',
      expectedStatus: 200,
      timeout: 5,
      interval: 60,
      active: true,
      lastCheck: new Date().toISOString(),
      status: 'passing',
      responseTime: 25,
      consecutiveFailures: 0,
      maxFailures: 2
    });

    this.addHealthCheck({
      id: 'backup_api_health',
      nodeId: 'server_backup_1',
      endpoint: '/api/health',
      method: 'GET',
      expectedStatus: 200,
      timeout: 15,
      interval: 60,
      active: true,
      lastCheck: new Date().toISOString(),
      status: 'passing',
      responseTime: 78,
      consecutiveFailures: 0,
      maxFailures: 3
    });
  }

  private startMonitoring() {
    this.monitoringTimer = setInterval(() => {
      this.performHealthChecks();
      this.updateNodeMetrics();
      this.checkAlertConditions();
    }, 10000); // Check every 10 seconds
  }

  private async performHealthChecks() {
    for (const healthCheck of this.healthChecks.values()) {
      if (!healthCheck.active) continue;

      const startTime = Date.now();
      let status: 'passing' | 'failing' | 'warning' = 'failing';
      let responseTime = 0;

      try {
        // Mock health check - in real implementation, this would make HTTP requests
        const success = await this.mockHealthCheck(healthCheck);
        responseTime = Date.now() - startTime;
        
        if (success) {
          status = responseTime > 5000 ? 'warning' : 'passing';
          healthCheck.consecutiveFailures = 0;
        } else {
          healthCheck.consecutiveFailures++;
        }
      } catch (error) {
        healthCheck.consecutiveFailures++;
        responseTime = Date.now() - startTime;
      }

      healthCheck.status = status;
      healthCheck.responseTime = responseTime;
      healthCheck.lastCheck = new Date().toISOString();

      // Create alert if health check fails
      if (healthCheck.consecutiveFailures >= healthCheck.maxFailures) {
        this.createAlert(
          healthCheck.nodeId,
          'down',
          'critical',
          `Health check ${healthCheck.id} failed ${healthCheck.consecutiveFailures} times`
        );
      }
    }
  }

  private async mockHealthCheck(healthCheck: HealthCheck): Promise<boolean> {
    // Simulate 95% success rate for healthy nodes
    const node = this.nodes.get(healthCheck.nodeId);
    if (!node || node.status !== 'online') return false;

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.05);
      }, Math.random() * 2000);
    });
  }

  private updateNodeMetrics() {
    for (const node of this.nodes.values()) {
      if (node.status !== 'online') continue;

      // Simulate metric fluctuations
      const metric: NetworkMetric = {
        nodeId: node.id,
        timestamp: new Date().toISOString(),
        responseTime: node.responseTime + (Math.random() - 0.5) * 20,
        cpuUsage: Math.max(0, Math.min(100, node.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(0, Math.min(100, node.memoryUsage + (Math.random() - 0.5) * 8)),
        diskUsage: Math.max(0, Math.min(100, node.diskUsage + (Math.random() - 0.5) * 2)),
        networkIn: Math.max(0, node.networkIn + (Math.random() - 0.5) * 50),
        networkOut: Math.max(0, node.networkOut + (Math.random() - 0.5) * 45),
        connections: Math.max(0, Math.min(node.maxConnections, node.connections + Math.floor((Math.random() - 0.5) * 20)))
      };

      // Update node with new metrics
      node.responseTime = metric.responseTime;
      node.cpuUsage = metric.cpuUsage;
      node.memoryUsage = metric.memoryUsage;
      node.diskUsage = metric.diskUsage;
      node.networkIn = metric.networkIn;
      node.networkOut = metric.networkOut;
      node.connections = metric.connections;
      node.lastCheck = metric.timestamp;

      // Store metric history
      if (!this.metrics.has(node.id)) {
        this.metrics.set(node.id, []);
      }
      
      const nodeMetrics = this.metrics.get(node.id)!;
      nodeMetrics.push(metric);
      
      // Keep only last 100 metrics per node
      if (nodeMetrics.length > 100) {
        nodeMetrics.shift();
      }
    }
  }

  private checkAlertConditions() {
    for (const node of this.nodes.values()) {
      // Check response time
      if (node.responseTime > this.alertThresholds.responseTime) {
        this.createAlert(
          node.id,
          'high_latency',
          node.responseTime > 2000 ? 'critical' : 'high',
          `High response time: ${node.responseTime}ms`
        );
      }

      // Check CPU usage
      if (node.cpuUsage > this.alertThresholds.cpuUsage) {
        this.createAlert(
          node.id,
          'high_cpu',
          node.cpuUsage > 95 ? 'critical' : 'high',
          `High CPU usage: ${node.cpuUsage.toFixed(1)}%`
        );
      }

      // Check memory usage
      if (node.memoryUsage > this.alertThresholds.memoryUsage) {
        this.createAlert(
          node.id,
          'high_memory',
          node.memoryUsage > 95 ? 'critical' : 'high',
          `High memory usage: ${node.memoryUsage.toFixed(1)}%`
        );
      }

      // Check disk usage
      if (node.diskUsage > this.alertThresholds.diskUsage) {
        this.createAlert(
          node.id,
          'disk_full',
          node.diskUsage > 98 ? 'critical' : 'high',
          `High disk usage: ${node.diskUsage.toFixed(1)}%`
        );
      }

      // Check connection limit
      const connectionUsage = (node.connections / node.maxConnections) * 100;
      if (connectionUsage > this.alertThresholds.connectionLimit) {
        this.createAlert(
          node.id,
          'connection_limit',
          connectionUsage > 98 ? 'critical' : 'medium',
          `High connection usage: ${connectionUsage.toFixed(1)}%`
        );
      }

      // Check if node is down
      if (node.status === 'offline') {
        this.createAlert(
          node.id,
          'down',
          'critical',
          `Node ${node.name} is offline`
        );
      }
    }
  }

  private createAlert(
    nodeId: string,
    type: NetworkAlert['type'],
    severity: NetworkAlert['severity'],
    message: string
  ) {
    // Check if similar alert already exists and is not acknowledged
    const existingAlert = Array.from(this.alerts.values()).find(
      alert => alert.nodeId === nodeId && 
               alert.type === type && 
               !alert.acknowledged &&
               !alert.resolvedAt
    );

    if (existingAlert) return;

    const alert: NetworkAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodeId,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.set(alert.id, alert);
  }

  private addNode(node: NetworkNode): string {
    const id = node.name.toLowerCase().replace(/\s+/g, '_');
    const newNode: NetworkNode = { ...node, id };
    this.nodes.set(id, newNode);
    return id;
  }

  getNode(id: string): NetworkNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesByType(type: NetworkNode['type']): NetworkNode[] {
    return Array.from(this.nodes.values()).filter(node => node.type === type);
  }

  getNodesByStatus(status: NetworkNode['status']): NetworkNode[] {
    return Array.from(this.nodes.values()).filter(node => node.status === status);
  }

  updateNode(id: string, updates: Partial<NetworkNode>): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    Object.assign(node, updates);
    return true;
  }

  deleteNode(id: string): boolean {
    this.nodes.delete(id);
    this.metrics.delete(id);
    return true;
  }

  private addHealthCheck(healthCheck: HealthCheck): string {
    const id = `${healthCheck.nodeId}_${healthCheck.endpoint.replace(/\//g, '_')}`;
    const newHealthCheck: HealthCheck = { ...healthCheck, id };
    this.healthChecks.set(id, newHealthCheck);
    return id;
  }

  getHealthCheck(id: string): HealthCheck | undefined {
    return this.healthChecks.get(id);
  }

  getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  updateHealthCheck(id: string, updates: Partial<HealthCheck>): boolean {
    const healthCheck = this.healthChecks.get(id);
    if (!healthCheck) return false;

    Object.assign(healthCheck, updates);
    return true;
  }

  deleteHealthCheck(id: string): boolean {
    return this.healthChecks.delete(id);
  }

  getAlert(id: string): NetworkAlert | undefined {
    return this.alerts.get(id);
  }

  getAllAlerts(): NetworkAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getActiveAlerts(): NetworkAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged && !alert.resolvedAt)
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.acknowledged) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolvedAt = new Date().toISOString();
    return true;
  }

  getNodeMetrics(nodeId: string, hours: number = 24): NetworkMetric[] {
    const metrics = this.metrics.get(nodeId) || [];
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return metrics.filter(metric => new Date(metric.timestamp) >= cutoffTime);
  }

  getNetworkStatus() {
    const totalNodes = this.nodes.size;
    const onlineNodes = this.getNodesByStatus('online').length;
    const offlineNodes = this.getNodesByStatus('offline').length;
    const degradedNodes = this.getNodesByStatus('degraded').length;

    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical').length;
    const highAlerts = activeAlerts.filter(alert => alert.severity === 'high').length;

    const avgResponseTime = Array.from(this.nodes.values())
      .filter(node => node.status === 'online')
      .reduce((sum, node) => sum + node.responseTime, 0) / onlineNodes || 0;

    const avgCpuUsage = Array.from(this.nodes.values())
      .filter(node => node.status === 'online')
      .reduce((sum, node) => sum + node.cpuUsage, 0) / onlineNodes || 0;

    const avgMemoryUsage = Array.from(this.nodes.values())
      .filter(node => node.status === 'online')
      .reduce((sum, node) => sum + node.memoryUsage, 0) / onlineNodes || 0;

    return {
      totalNodes,
      onlineNodes,
      offlineNodes,
      degradedNodes,
      activeAlerts: activeAlerts.length,
      criticalAlerts,
      highAlerts,
      avgResponseTime,
      avgCpuUsage,
      avgMemoryUsage,
      networkHealth: (onlineNodes / totalNodes) * 100
    };
  }

  updateAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  getAlertThresholds(): typeof this.alertThresholds {
    return { ...this.alertThresholds };
  }

  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Network monitoring system initialized with mock data');
  }
}

export const networkMonitoringManager = NetworkMonitoringManager.getInstance();

// Initialize mock data
networkMonitoringManager.loadMockData();

