export interface FailoverNode {
  id: string;
  name: string;
  url: string;
  type: 'primary' | 'secondary' | 'tertiary';
  region: string;
  status: 'active' | 'inactive' | 'maintenance' | 'failed';
  priority: number; // 1 = highest priority
  healthScore: number; // 0-100
  lastHealthCheck: string;
  responseTime: number; // in ms
  uptime: number; // in percentage
  load: number; // 0-1
  capabilities: string[];
  dataSyncStatus: 'synced' | 'syncing' | 'out_of_sync';
  lastSyncTime: string;
}

export interface FailoverRule {
  id: string;
  name: string;
  triggerConditions: {
    healthScoreThreshold: number;
    responseTimeThreshold: number;
    uptimeThreshold: number;
    consecutiveFailures: number;
    checkInterval: number; // in seconds
  };
  failoverStrategy: 'immediate' | 'graceful' | 'manual';
  rollbackConditions: {
    originalNodeHealthy: boolean;
    minStableTime: number; // in seconds
  };
  enabled: boolean;
  priority: number;
}

export interface FailoverEvent {
  id: string;
  timestamp: string;
  eventType: 'triggered' | 'completed' | 'rolled_back' | 'failed';
  primaryNode: string;
  targetNode: string;
  reason: string;
  duration: number; // in seconds
  dataLoss: number; // in percentage
  downtime: number; // in seconds
  success: boolean;
}

export interface HealthCheckResult {
  nodeId: string;
  timestamp: string;
  responseTime: number;
  statusCode: number;
  error?: string;
  healthScore: number;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

class AutoFailoverManager {
  private static instance: AutoFailoverManager;
  private nodes: Map<string, FailoverNode> = new Map();
  private rules: Map<string, FailoverRule> = new Map();
  private events: Map<string, FailoverEvent> = new Map();
  private healthHistory: Map<string, HealthCheckResult[]> = new Map();
  private failoverTimer: NodeJS.Timeout | null = null;
  private currentPrimary: string = 'primary_1';
  private isFailoverInProgress: boolean = false;
  private consecutiveFailures: Map<string, number> = new Map();

  private constructor() {
    this.initializeNodes();
    this.initializeRules();
    this.startHealthMonitoring();
  }

  static getInstance(): AutoFailoverManager {
    if (!AutoFailoverManager.instance) {
      AutoFailoverManager.instance = new AutoFailoverManager();
    }
    return AutoFailoverManager.instance;
  }

  private initializeNodes() {
    // Primary node
    this.addNode({
      id: 'primary_1',
      name: 'Primary Production Node',
      url: 'https://primary-api.deoraplaza.com',
      type: 'primary',
      region: 'us-east-1',
      status: 'active',
      priority: 1,
      healthScore: 95,
      lastHealthCheck: new Date().toISOString(),
      responseTime: 45,
      uptime: 99.9,
      load: 0.65,
      capabilities: ['orders', 'inventory', 'customers', 'staff', 'analytics'],
      dataSyncStatus: 'synced',
      lastSyncTime: new Date().toISOString()
    });

    // Secondary nodes
    this.addNode({
      id: 'secondary_1',
      name: 'Secondary Node - US West',
      url: 'https://secondary-west.deoraplaza.com',
      type: 'secondary',
      region: 'us-west-1',
      status: 'active',
      priority: 2,
      healthScore: 88,
      lastHealthCheck: new Date().toISOString(),
      responseTime: 78,
      uptime: 99.7,
      load: 0.35,
      capabilities: ['orders', 'inventory', 'customers'],
      dataSyncStatus: 'synced',
      lastSyncTime: new Date(Date.now() - 30000).toISOString()
    });

    this.addNode({
      id: 'secondary_2',
      name: 'Secondary Node - Europe',
      url: 'https://secondary-eu.deoraplaza.com',
      type: 'secondary',
      region: 'eu-west-1',
      status: 'active',
      priority: 3,
      healthScore: 82,
      lastHealthCheck: new Date().toISOString(),
      responseTime: 120,
      uptime: 99.5,
      load: 0.25,
      capabilities: ['orders', 'customers'],
      dataSyncStatus: 'synced',
      lastSyncTime: new Date(Date.now() - 60000).toISOString()
    });

    // Tertiary node
    this.addNode({
      id: 'tertiary_1',
      name: 'Tertiary Node - Asia',
      url: 'https://tertiary-asia.deoraplaza.com',
      type: 'tertiary',
      region: 'ap-southeast-1',
      status: 'active',
      priority: 4,
      healthScore: 75,
      lastHealthCheck: new Date().toISOString(),
      responseTime: 200,
      uptime: 99.2,
      load: 0.15,
      capabilities: ['orders'],
      dataSyncStatus: 'synced',
      lastSyncTime: new Date(Date.now() - 300000).toISOString()
    });

    this.currentPrimary = 'primary_1';
  }

  private initializeRules() {
    this.addRule({
      id: 'critical_failover',
      name: 'Critical Failover Rule',
      triggerConditions: {
        healthScoreThreshold: 50,
        responseTimeThreshold: 5000,
        uptimeThreshold: 95,
        consecutiveFailures: 3,
        checkInterval: 30
      },
      failoverStrategy: 'immediate',
      rollbackConditions: {
        originalNodeHealthy: true,
        minStableTime: 300
      },
      enabled: true,
      priority: 1
    });

    this.addRule({
      id: 'performance_degradation',
      name: 'Performance Degradation Rule',
      triggerConditions: {
        healthScoreThreshold: 70,
        responseTimeThreshold: 2000,
        uptimeThreshold: 98,
        consecutiveFailures: 5,
        checkInterval: 60
      },
      failoverStrategy: 'graceful',
      rollbackConditions: {
        originalNodeHealthy: true,
        minStableTime: 600
      },
      enabled: true,
      priority: 2
    });
  }

  private startHealthMonitoring() {
    this.failoverTimer = setInterval(() => {
      this.performHealthChecks();
      this.evaluateFailoverConditions();
      this.checkRollbackConditions();
    }, 10000); // Check every 10 seconds
  }

  private async performHealthChecks() {
    for (const node of this.nodes.values()) {
      const healthResult = await this.checkNodeHealth(node);
      this.updateNodeHealth(node.id, healthResult);
    }
  }

  private async checkNodeHealth(node: FailoverNode): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Mock health check - in real implementation, this would make HTTP requests
      const success = await this.mockHealthCheck(node);
      const responseTime = Date.now() - startTime;
      
      if (success) {
        // Generate mock metrics
        const metrics = {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          disk: Math.random() * 100,
          network: Math.random() * 100
        };

        const healthScore = this.calculateHealthScore(responseTime, metrics, node.uptime);

        return {
          nodeId: node.id,
          timestamp: new Date().toISOString(),
          responseTime,
          statusCode: 200,
          healthScore,
          metrics
        };
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      return {
        nodeId: node.id,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
        healthScore: 0,
        metrics: { cpu: 0, memory: 0, disk: 0, network: 0 }
      };
    }
  }

  private async mockHealthCheck(node: FailoverNode): Promise<boolean> {
    // Simulate health check based on node health score
    const successProbability = node.healthScore / 100;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() < successProbability);
      }, Math.random() * 2000);
    });
  }

  private calculateHealthScore(
    responseTime: number,
    metrics: HealthCheckResult['metrics'],
    uptime: number
  ): number {
    let score = 100;

    // Response time impact (30% weight)
    if (responseTime > 5000) score -= 30;
    else if (responseTime > 2000) score -= 20;
    else if (responseTime > 1000) score -= 10;

    // CPU usage impact (25% weight)
    if (metrics.cpu > 90) score -= 25;
    else if (metrics.cpu > 80) score -= 15;
    else if (metrics.cpu > 70) score -= 10;

    // Memory usage impact (25% weight)
    if (metrics.memory > 90) score -= 25;
    else if (metrics.memory > 80) score -= 15;
    else if (metrics.memory > 70) score -= 10;

    // Uptime impact (20% weight)
    if (uptime < 95) score -= 20;
    else if (uptime < 98) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private updateNodeHealth(nodeId: string, healthResult: HealthCheckResult) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Update node metrics
    node.healthScore = healthResult.healthScore;
    node.responseTime = healthResult.responseTime;
    node.lastHealthCheck = healthResult.timestamp;
    node.load = healthResult.metrics.cpu / 100;

    // Update status based on health score
    if (healthResult.healthScore < 30) {
      node.status = 'failed';
    } else if (healthResult.healthScore < 60) {
      node.status = 'inactive';
    } else {
      node.status = 'active';
    }

    // Track consecutive failures
    if (healthResult.healthScore < 50) {
      const currentFailures = this.consecutiveFailures.get(nodeId) || 0;
      this.consecutiveFailures.set(nodeId, currentFailures + 1);
    } else {
      this.consecutiveFailures.set(nodeId, 0);
    }

    // Store health history
    if (!this.healthHistory.has(nodeId)) {
      this.healthHistory.set(nodeId, []);
    }
    
    const history = this.healthHistory.get(nodeId)!;
    history.push(healthResult);
    
    // Keep only last 100 results
    if (history.length > 100) {
      history.shift();
    }
  }

  private evaluateFailoverConditions() {
    if (this.isFailoverInProgress) return;

    const primaryNode = this.nodes.get(this.currentPrimary);
    if (!primaryNode) return;

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (this.shouldTriggerFailover(primaryNode, rule)) {
        this.triggerFailover(primaryNode, rule);
        break;
      }
    }
  }

  private shouldTriggerFailover(node: FailoverNode, rule: FailoverRule): boolean {
    const { triggerConditions } = rule;

    return (
      node.healthScore < triggerConditions.healthScoreThreshold ||
      node.responseTime > triggerConditions.responseTimeThreshold ||
      node.uptime < triggerConditions.uptimeThreshold ||
      (this.consecutiveFailures.get(node.id) || 0) >= triggerConditions.consecutiveFailures
    );
  }

  private async triggerFailover(failedNode: FailoverNode, rule: FailoverRule) {
    this.isFailoverInProgress = true;

    const startTime = Date.now();
    const targetNode = this.selectBestTargetNode(failedNode);

    if (!targetNode) {
      this.createFailoverEvent(
        failedNode.id,
        '',
        'failed',
        'No suitable target node available',
        Date.now() - startTime,
        0,
        Date.now() - startTime,
        false
      );
      this.isFailoverInProgress = false;
      return;
    }

    try {
      console.log(`Triggering failover from ${failedNode.name} to ${targetNode.name}`);

      // Perform failover based on strategy
      if (rule.failoverStrategy === 'immediate') {
        await this.performImmediateFailover(failedNode, targetNode);
      } else if (rule.failoverStrategy === 'graceful') {
        await this.performGracefulFailover(failedNode, targetNode);
      }

      // Update primary node
      this.currentPrimary = targetNode.id;
      failedNode.type = 'secondary';
      targetNode.type = 'primary';

      const duration = Date.now() - startTime;
      const downtime = rule.failoverStrategy === 'immediate' ? 5 : 30; // seconds

      this.createFailoverEvent(
        failedNode.id,
        targetNode.id,
        'completed',
        `Failover completed using ${rule.failoverStrategy} strategy`,
        duration,
        0, // No data loss in this simulation
        downtime,
        true
      );

    } catch (error) {
      this.createFailoverEvent(
        failedNode.id,
        targetNode.id,
        'failed',
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime,
        0,
        Date.now() - startTime,
        false
      );
    } finally {
      this.isFailoverInProgress = false;
    }
  }

  private selectBestTargetNode(failedNode: FailoverNode): FailoverNode | null {
    const candidates = Array.from(this.nodes.values())
      .filter(node => 
        node.id !== failedNode.id &&
        node.status === 'active' &&
        node.dataSyncStatus === 'synced'
      )
      .sort((a, b) => {
        // Sort by priority first, then by health score
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.healthScore - a.healthScore;
      });

    return candidates.length > 0 ? candidates[0] : null;
  }

  private async performImmediateFailover(failedNode: FailoverNode, targetNode: FailoverNode): Promise<void> {
    // Simulate immediate failover (5 seconds)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Immediate failover completed: ${failedNode.name} -> ${targetNode.name}`);
        resolve();
      }, 5000);
    });
  }

  private async performGracefulFailover(failedNode: FailoverNode, targetNode: FailoverNode): Promise<void> {
    // Simulate graceful failover (30 seconds)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Graceful failover completed: ${failedNode.name} -> ${targetNode.name}`);
        resolve();
      }, 30000);
    });
  }

  private checkRollbackConditions() {
    const rules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of rules) {
      if (this.shouldTriggerRollback(rule)) {
        this.triggerRollback(rule);
        break;
      }
    }
  }

  private shouldTriggerRollback(rule: FailoverRule): boolean {
    const originalPrimary = Array.from(this.nodes.values())
      .find(node => node.type === 'secondary' && node.priority === 1);

    if (!originalPrimary || originalPrimary.status !== 'active') {
      return false;
    }

    const currentPrimary = this.nodes.get(this.currentPrimary);
    if (!currentPrimary) return false;

    // Check if original node has been stable for required time
    const lastFailoverEvent = Array.from(this.events.values())
      .filter(event => event.eventType === 'completed')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (!lastFailoverEvent) return false;

    const timeSinceFailover = Date.now() - new Date(lastFailoverEvent.timestamp).getTime();
    const minStableTimeMs = rule.rollbackConditions.minStableTime * 1000;

    return timeSinceFailover > minStableTimeMs && originalPrimary.healthScore > 80;
  }

  private async triggerRollback(rule: FailoverRule) {
    const currentPrimary = this.nodes.get(this.currentPrimary);
    const originalPrimary = Array.from(this.nodes.values())
      .find(node => node.type === 'secondary' && node.priority === 1);

    if (!currentPrimary || !originalPrimary) return;

    const startTime = Date.now();

    try {
      console.log(`Triggering rollback from ${currentPrimary.name} to ${originalPrimary.name}`);

      // Perform rollback
      await this.performRollback(currentPrimary, originalPrimary);

      // Update node types
      this.currentPrimary = originalPrimary.id;
      originalPrimary.type = 'primary';
      currentPrimary.type = 'secondary';

      this.createFailoverEvent(
        currentPrimary.id,
        originalPrimary.id,
        'rolled_back',
        'Automatic rollback triggered',
        Date.now() - startTime,
        0,
        10, // 10 seconds downtime
        true
      );

    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  private async performRollback(fromNode: FailoverNode, toNode: FailoverNode): Promise<void> {
    // Simulate rollback process
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Rollback completed: ${fromNode.name} -> ${toNode.name}`);
        resolve();
      }, 10000);
    });
  }

  private createFailoverEvent(
    primaryNode: string,
    targetNode: string,
    eventType: FailoverEvent['eventType'],
    reason: string,
    duration: number,
    dataLoss: number,
    downtime: number,
    success: boolean
  ) {
    const event: FailoverEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType,
      primaryNode,
      targetNode,
      reason,
      duration,
      dataLoss,
      downtime,
      success
    };

    this.events.set(event.id, event);
  }

  private addNode(node: FailoverNode): string {
    const id = node.name.toLowerCase().replace(/\s+/g, '_');
    const newNode: FailoverNode = { ...node, id };
    this.nodes.set(id, newNode);
    return id;
  }

  getNode(id: string): FailoverNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): FailoverNode[] {
    return Array.from(this.nodes.values());
  }

  getCurrentPrimary(): FailoverNode | undefined {
    return this.nodes.get(this.currentPrimary);
  }

  private addRule(rule: FailoverRule): string {
    const id = rule.name.toLowerCase().replace(/\s+/g, '_');
    const newRule: FailoverRule = { ...rule, id };
    this.rules.set(id, newRule);
    return id;
  }

  getRule(id: string): FailoverRule | undefined {
    return this.rules.get(id);
  }

  getAllRules(): FailoverRule[] {
    return Array.from(this.rules.values());
  }

  getFailoverEvents(limit?: number): FailoverEvent[] {
    const events = Array.from(this.events.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return limit ? events.slice(0, limit) : events;
  }

  getNodeHealthHistory(nodeId: string, hours: number = 24): HealthCheckResult[] {
    const history = this.healthHistory.get(nodeId) || [];
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return history.filter(result => new Date(result.timestamp) >= cutoffTime);
  }

  getFailoverStatus() {
    const currentPrimary = this.getCurrentPrimary();
    const totalNodes = this.nodes.size;
    const activeNodes = Array.from(this.nodes.values()).filter(node => node.status === 'active').length;
    const healthyNodes = Array.from(this.nodes.values()).filter(node => node.healthScore > 70).length;

    const recentEvents = this.getFailoverEvents(10);
    const lastFailover = recentEvents.find(event => event.eventType === 'completed');

    return {
      currentPrimary: currentPrimary?.name || 'None',
      totalNodes,
      activeNodes,
      healthyNodes,
      isFailoverInProgress: this.isFailoverInProgress,
      lastFailoverTime: lastFailover?.timestamp,
      totalFailovers: this.events.size,
      successfulFailovers: Array.from(this.events.values()).filter(e => e.success).length,
      averageFailoverTime: this.calculateAverageFailoverTime()
    };
  }

  private calculateAverageFailoverTime(): number {
    const completedEvents = Array.from(this.events.values())
      .filter(event => event.eventType === 'completed' && event.success);

    if (completedEvents.length === 0) return 0;

    const totalTime = completedEvents.reduce((sum, event) => sum + event.duration, 0);
    return totalTime / completedEvents.length;
  }

  async manualFailover(targetNodeId: string): Promise<boolean> {
    const currentPrimary = this.getCurrentPrimary();
    const targetNode = this.nodes.get(targetNodeId);

    if (!currentPrimary || !targetNode || this.isFailoverInProgress) {
      return false;
    }

    const startTime = Date.now();

    try {
      await this.performImmediateFailover(currentPrimary, targetNode);
      
      this.currentPrimary = targetNode.id;
      currentPrimary.type = 'secondary';
      targetNode.type = 'primary';

      this.createFailoverEvent(
        currentPrimary.id,
        targetNode.id,
        'completed',
        'Manual failover triggered',
        Date.now() - startTime,
        0,
        5,
        true
      );

      return true;
    } catch (error) {
      this.createFailoverEvent(
        currentPrimary.id,
        targetNode.id,
        'failed',
        `Manual failover failed: ${error}`,
        Date.now() - startTime,
        0,
        Date.now() - startTime,
        false
      );
      return false;
    }
  }

  stopMonitoring(): void {
    if (this.failoverTimer) {
      clearInterval(this.failoverTimer);
      this.failoverTimer = null;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Auto failover system initialized with mock data');
  }
}

export const autoFailoverManager = AutoFailoverManager.getInstance();

// Initialize mock data
autoFailoverManager.loadMockData();

