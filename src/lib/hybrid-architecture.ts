export interface ServerNode {
  id: string;
  name: string;
  type: 'primary' | 'backup' | 'edge';
  url: string;
  status: 'active' | 'inactive' | 'maintenance' | 'failed';
  lastHeartbeat: string;
  responseTime: number;
  load: number;
  region: string;
  capabilities: string[];
  failures: number;
}

export interface FailoverConfig {
  healthCheckInterval: number;
  maxFailures: number;
  failoverTimeout: number;
  enableAutoFailover: boolean;
  enableLoadBalancing: boolean;
  stickySessions: boolean;
}

export interface ReplicationRule {
  id: string;
  sourceType: 'orders' | 'inventory' | 'customers' | 'staff' | 'all';
  targetNodes: string[];
  frequency: 'real-time' | 'hourly' | 'daily';
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

class HybridArchitectureManager {
  private static instance: HybridArchitectureManager;
  private nodes: Map<string, ServerNode> = new Map();
  private config: FailoverConfig;
  private replicationRules: ReplicationRule[] = [];
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private currentNode: string;
  private isPrimaryActive: boolean = true;

  private constructor() {
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      maxFailures: 3,
      failoverTimeout: 10000, // 10 seconds
      enableAutoFailover: true,
      enableLoadBalancing: true,
      stickySessions: true
    };
    this.currentNode = 'primary_1';
    this.initializeNodes();
    this.startHealthChecks();
    this.initializeReplication();
  }

  static getInstance(): HybridArchitectureManager {
    if (!HybridArchitectureManager.instance) {
      HybridArchitectureManager.instance = new HybridArchitectureManager();
    }
    return HybridArchitectureManager.instance;
  }

  private initializeNodes() {
    // Primary server
    this.addNode({
      id: 'primary_1',
      name: 'Primary Server - US East',
      type: 'primary',
      url: 'https://primary-api.deoraplaza.com',
      status: 'active',
      lastHeartbeat: new Date().toISOString(),
      responseTime: 45,
      load: 0.65,
      region: 'us-east-1',
      capabilities: ['orders', 'inventory', 'customers', 'staff', 'analytics']
    });

    // Backup servers
    this.addNode({
      id: 'backup_1',
      name: 'Backup Server - US West',
      type: 'backup',
      url: 'https://backup-api.deoraplaza.com',
      status: 'active',
      lastHeartbeat: new Date().toISOString(),
      responseTime: 78,
      load: 0.25,
      region: 'us-west-1',
      capabilities: ['orders', 'inventory', 'customers']
    });

    this.addNode({
      id: 'backup_2',
      name: 'Backup Server - EU',
      type: 'backup',
      url: 'https://eu-backup-api.deoraplaza.com',
      status: 'active',
      lastHeartbeat: new Date().toISOString(),
      responseTime: 120,
      load: 0.15,
      region: 'eu-west-1',
      capabilities: ['orders', 'customers']
    });

    // Edge nodes for specific regions
    this.addNode({
      id: 'edge_1',
      name: 'Edge Node - Asia',
      type: 'edge',
      url: 'https://asia-edge.deoraplaza.com',
      status: 'active',
      lastHeartbeat: new Date().toISOString(),
      responseTime: 35,
      load: 0.40,
      region: 'ap-southeast-1',
      capabilities: ['orders', 'customers']
    });
  }

  private initializeReplication() {
    this.replicationRules = [
      {
        id: 'orders_realtime',
        sourceType: 'orders',
        targetNodes: ['backup_1', 'backup_2', 'edge_1'],
        frequency: 'real-time',
        priority: 'high',
        enabled: true
      },
      {
        id: 'inventory_hourly',
        sourceType: 'inventory',
        targetNodes: ['backup_1'],
        frequency: 'hourly',
        priority: 'medium',
        enabled: true
      },
      {
        id: 'customers_realtime',
        sourceType: 'customers',
        targetNodes: ['backup_1', 'backup_2', 'edge_1'],
        frequency: 'real-time',
        priority: 'high',
        enabled: true
      },
      {
        id: 'staff_daily',
        sourceType: 'staff',
        targetNodes: ['backup_1'],
        frequency: 'daily',
        priority: 'low',
        enabled: true
      }
    ];
  }

  private startHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks() {
    for (const [nodeId, node] of this.nodes) {
      try {
        const startTime = Date.now();
        const isHealthy = await this.checkNodeHealth(node);
        const responseTime = Date.now() - startTime;

        if (isHealthy) {
          node.status = 'active';
          node.responseTime = responseTime;
          node.lastHeartbeat = new Date().toISOString();
          node.failures = 0;
        } else {
          node.failures = (node.failures || 0) + 1;
          
          if (node.failures >= this.config.maxFailures) {
            node.status = 'failed';
            
            if (node.type === 'primary' && this.config.enableAutoFailover) {
              this.performFailover(nodeId);
            }
          }
        }
      } catch (error) {
        console.error(`Health check failed for node ${nodeId}:`, error);
        node.status = 'failed';
      }
    }
  }

  private async checkNodeHealth(node: ServerNode): Promise<boolean> {
    // Mock health check - in real implementation, this would make HTTP requests
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate 95% success rate for active nodes
        const successRate = node.status === 'active' ? 0.95 : 0.7;
        resolve(Math.random() < successRate);
      }, Math.random() * 1000);
    });
  }

  private performFailover(failedNodeId: string) {
    console.log(`Performing failover from ${failedNodeId}`);
    
    const backupNodes = Array.from(this.nodes.values())
      .filter(node => node.type === 'backup' && node.status === 'active')
      .sort((a, b) => a.responseTime - b.responseTime);

    if (backupNodes.length > 0) {
      const newPrimary = backupNodes[0];
      this.currentNode = newPrimary.id;
      this.isPrimaryActive = false;
      
      console.log(`Failover completed. New primary: ${newPrimary.name}`);
      
      // Update node types
      newPrimary.type = 'primary';
      const failedNode = this.nodes.get(failedNodeId);
      if (failedNode) {
        failedNode.type = 'backup';
        failedNode.status = 'maintenance';
      }
    }
  }

  addNode(node: Omit<ServerNode, 'failures'>): void {
    this.nodes.set(node.id, { ...node, failures: 0 });
  }

  removeNode(nodeId: string): boolean {
    return this.nodes.delete(nodeId);
  }

  getNode(nodeId: string): ServerNode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): ServerNode[] {
    return Array.from(this.nodes.values());
  }

  getActiveNodes(): ServerNode[] {
    return Array.from(this.nodes.values()).filter(node => node.status === 'active');
  }

  getNodesByType(type: ServerNode['type']): ServerNode[] {
    return Array.from(this.nodes.values()).filter(node => node.type === type);
  }

  getOptimalNode(requestType?: string, region?: string): ServerNode | null {
    const activeNodes = this.getActiveNodes();
    
    // Filter by capability if specified
    let eligibleNodes = activeNodes;
    if (requestType) {
      eligibleNodes = activeNodes.filter(node => 
        node.capabilities.includes(requestType)
      );
    }

    // Filter by region if specified
    if (region) {
      eligibleNodes = eligibleNodes.filter(node => 
        node.region === region || node.type === 'primary'
      );
    }

    if (eligibleNodes.length === 0) {
      return null;
    }

    // Sort by response time and load
    return eligibleNodes.sort((a, b) => {
      const scoreA = a.responseTime * (1 + a.load);
      const scoreB = b.responseTime * (1 + b.load);
      return scoreA - scoreB;
    })[0];
  }

  updateNode(nodeId: string, updates: Partial<ServerNode>): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    Object.assign(node, updates);
    return true;
  }

  addReplicationRule(rule: Omit<ReplicationRule, 'id'>): string {
    const newRule: ReplicationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.replicationRules.push(newRule);
    return newRule.id;
  }

  removeReplicationRule(ruleId: string): boolean {
    const index = this.replicationRules.findIndex(rule => rule.id === ruleId);
    if (index === -1) {
      return false;
    }
    
    this.replicationRules.splice(index, 1);
    return true;
  }

  getReplicationRules(): ReplicationRule[] {
    return this.replicationRules;
  }

  async replicateData(dataType: string, data: any): Promise<void> {
    const rules = this.replicationRules.filter(rule => 
      rule.enabled && 
      (rule.sourceType === dataType || rule.sourceType === 'all')
    );

    for (const rule of rules) {
      for (const nodeId of rule.targetNodes) {
        const node = this.nodes.get(nodeId);
        if (node && node.status === 'active') {
          try {
            await this.sendDataToNode(node, dataType, data);
            console.log(`Replicated ${dataType} to ${node.name}`);
          } catch (error) {
            console.error(`Failed to replicate ${dataType} to ${node.name}:`, error);
          }
        }
      }
    }
  }

  private async sendDataToNode(node: ServerNode, dataType: string, data: any): Promise<void> {
    // Mock data replication - in real implementation, this would make HTTP requests
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Mock replication failure'));
        }
      }, Math.random() * 2000);
    });
  }

  getSystemStatus() {
    const totalNodes = this.nodes.size;
    const activeNodes = this.getActiveNodes().length;
    const primaryNode = this.getNodesByType('primary')[0];
    const backupNodes = this.getNodesByType('backup');
    const edgeNodes = this.getNodesByType('edge');

    return {
      totalNodes,
      activeNodes,
      currentNode: this.currentNode,
      isPrimaryActive: this.isPrimaryActive,
      primaryNode: primaryNode?.status || 'unknown',
      backupNodes: backupNodes.filter(n => n.status === 'active').length,
      edgeNodes: edgeNodes.filter(n => n.status === 'active').length,
      averageResponseTime: this.calculateAverageResponseTime(),
      systemLoad: this.calculateSystemLoad(),
      lastHealthCheck: new Date().toISOString()
    };
  }

  private calculateAverageResponseTime(): number {
    const activeNodes = this.getActiveNodes();
    if (activeNodes.length === 0) return 0;
    
    const totalTime = activeNodes.reduce((sum, node) => sum + node.responseTime, 0);
    return totalTime / activeNodes.length;
  }

  private calculateSystemLoad(): number {
    const activeNodes = this.getActiveNodes();
    if (activeNodes.length === 0) return 0;
    
    const totalLoad = activeNodes.reduce((sum, node) => sum + node.load, 0);
    return totalLoad / activeNodes.length;
  }

  updateConfig(newConfig: Partial<FailoverConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.healthCheckInterval !== undefined) {
      this.startHealthChecks();
    }
  }

  getConfig(): FailoverConfig {
    return { ...this.config };
  }

  async performManualFailover(targetNodeId?: string): Promise<boolean> {
    if (!this.config.enableAutoFailover) {
      return false;
    }

    const targetNode = targetNodeId ? this.nodes.get(targetNodeId) : this.getOptimalNode();
    
    if (!targetNode || targetNode.status !== 'active') {
      return false;
    }

    const currentPrimary = this.getNodesByType('primary')[0];
    if (currentPrimary) {
      currentPrimary.type = 'backup';
      currentPrimary.status = 'maintenance';
    }

    targetNode.type = 'primary';
    this.currentNode = targetNode.id;
    this.isPrimaryActive = true;

    console.log(`Manual failover completed. New primary: ${targetNode.name}`);
    return true;
  }

  // Mock data for demonstration
  loadMockData() {
    // Additional mock nodes can be added here
    console.log('Hybrid architecture system initialized with mock data');
  }
}

export const hybridArchitectureManager = HybridArchitectureManager.getInstance();

// Initialize mock data
hybridArchitectureManager.loadMockData();

