export interface ReplicationTask {
  id: string;
  sourceNode: string;
  targetNodes: string[];
  dataType: 'orders' | 'inventory' | 'customers' | 'staff' | 'all';
  replicationType: 'full' | 'incremental' | 'real-time';
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  startTime: string;
  endTime?: string;
  progress: number; // 0-100
  dataSize: number; // in MB
  recordsCount: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface ReplicationRule {
  id: string;
  name: string;
  sourceNode: string;
  targetNodes: string[];
  dataType: ReplicationTask['dataType'];
  replicationType: ReplicationTask['replicationType'];
  schedule: 'continuous' | 'hourly' | 'daily' | 'weekly';
  priority: ReplicationTask['priority'];
  enabled: boolean;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  conflictResolution: 'source_wins' | 'target_wins' | 'manual';
  retentionPolicy: {
    type: 'time_based' | 'count_based';
    value: number;
    unit?: 'days' | 'hours' | 'count';
  };
}

export interface ReplicationNode {
  id: string;
  name: string;
  url: string;
  type: 'primary' | 'secondary' | 'edge';
  status: 'active' | 'inactive' | 'maintenance';
  lastSync: string;
  latency: number; // in ms
  bandwidth: number; // in Mbps
  storageUsed: number; // in GB
  storageCapacity: number; // in GB
  replicationLag: number; // in seconds
}

export interface ReplicationMetrics {
  totalTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageLatency: number;
  totalDataTransferred: number; // in GB
  successRate: number;
  replicationLag: number;
}

class RealTimeReplicationManager {
  private static instance: RealTimeReplicationManager;
  private tasks: Map<string, ReplicationTask> = new Map();
  private rules: Map<string, ReplicationRule> = new Map();
  private nodes: Map<string, ReplicationNode> = new Map();
  private replicationTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isReplicationActive: boolean = true;

  private constructor() {
    this.initializeNodes();
    this.initializeRules();
    this.startReplication();
  }

  static getInstance(): RealTimeReplicationManager {
    if (!RealTimeReplicationManager.instance) {
      RealTimeReplicationManager.instance = new RealTimeReplicationManager();
    }
    return RealTimeReplicationManager.instance;
  }

  private initializeNodes() {
    // Primary node
    this.addNode({
      id: 'primary_1',
      name: 'Primary Production Node',
      url: 'https://primary-api.deoraplaza.com',
      type: 'primary',
      status: 'active',
      lastSync: new Date().toISOString(),
      latency: 15,
      bandwidth: 1000,
      storageUsed: 450,
      storageCapacity: 1000,
      replicationLag: 0
    });

    // Secondary nodes
    this.addNode({
      id: 'secondary_1',
      name: 'Secondary Node - US West',
      url: 'https://secondary-west.deoraplaza.com',
      type: 'secondary',
      status: 'active',
      lastSync: new Date(Date.now() - 30000).toISOString(),
      latency: 45,
      bandwidth: 500,
      storageUsed: 380,
      storageCapacity: 800,
      replicationLag: 5
    });

    this.addNode({
      id: 'secondary_2',
      name: 'Secondary Node - Europe',
      url: 'https://secondary-eu.deoraplaza.com',
      type: 'secondary',
      status: 'active',
      lastSync: new Date(Date.now() - 60000).toISOString(),
      latency: 120,
      bandwidth: 300,
      storageUsed: 320,
      storageCapacity: 600,
      replicationLag: 10
    });

    // Edge nodes
    this.addNode({
      id: 'edge_1',
      name: 'Edge Node - Asia',
      url: 'https://edge-asia.deoraplaza.com',
      type: 'edge',
      status: 'active',
      lastSync: new Date(Date.now() - 120000).toISOString(),
      latency: 200,
      bandwidth: 100,
      storageUsed: 150,
      storageCapacity: 300,
      replicationLag: 30
    });
  }

  private initializeRules() {
    // Real-time order replication
    this.addRule({
      id: 'orders_realtime',
      name: 'Real-time Order Replication',
      sourceNode: 'primary_1',
      targetNodes: ['secondary_1', 'secondary_2'],
      dataType: 'orders',
      replicationType: 'real-time',
      schedule: 'continuous',
      priority: 'critical',
      enabled: true,
      compressionEnabled: true,
      encryptionEnabled: true,
      conflictResolution: 'source_wins',
      retentionPolicy: {
        type: 'time_based',
        value: 30,
        unit: 'days'
      }
    });

    // Hourly inventory replication
    this.addRule({
      id: 'inventory_hourly',
      name: 'Hourly Inventory Replication',
      sourceNode: 'primary_1',
      targetNodes: ['secondary_1', 'secondary_2', 'edge_1'],
      dataType: 'inventory',
      replicationType: 'incremental',
      schedule: 'hourly',
      priority: 'high',
      enabled: true,
      compressionEnabled: true,
      encryptionEnabled: true,
      conflictResolution: 'source_wins',
      retentionPolicy: {
        type: 'time_based',
        value: 7,
        unit: 'days'
      }
    });

    // Daily customer data replication
    this.addRule({
      id: 'customers_daily',
      name: 'Daily Customer Data Replication',
      sourceNode: 'primary_1',
      targetNodes: ['secondary_1', 'secondary_2'],
      dataType: 'customers',
      replicationType: 'incremental',
      schedule: 'daily',
      priority: 'medium',
      enabled: true,
      compressionEnabled: true,
      encryptionEnabled: true,
      conflictResolution: 'manual',
      retentionPolicy: {
        type: 'time_based',
        value: 90,
        unit: 'days'
      }
    });

    // Weekly full backup
    this.addRule({
      id: 'full_backup_weekly',
      name: 'Weekly Full Backup',
      sourceNode: 'primary_1',
      targetNodes: ['secondary_1', 'secondary_2', 'edge_1'],
      dataType: 'all',
      replicationType: 'full',
      schedule: 'weekly',
      priority: 'low',
      enabled: true,
      compressionEnabled: true,
      encryptionEnabled: true,
      conflictResolution: 'source_wins',
      retentionPolicy: {
        type: 'count_based',
        value: 4
      }
    });
  }

  private startReplication() {
    this.replicationTimer = setInterval(() => {
      this.processReplicationTasks();
      this.checkScheduledReplications();
    }, 5000); // Check every 5 seconds
  }

  private async processReplicationTasks() {
    const runningTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'running');

    for (const task of runningTasks) {
      await this.processTask(task);
    }

    // Start new pending tasks
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    for (const task of pendingTasks.slice(0, 3)) { // Process max 3 tasks concurrently
      task.status = 'running';
      task.startTime = new Date().toISOString();
    }
  }

  private async processTask(task: ReplicationTask): Promise<void> {
    // Simulate replication progress
    task.progress = Math.min(task.progress + Math.random() * 15, 100);

    // Update node replication lag
    task.targetNodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node) {
        node.replicationLag = Math.max(0, node.replicationLag - 1);
      }
    });

    if (task.progress >= 100) {
      task.status = 'completed';
      task.endTime = new Date().toISOString();
      
      // Update node last sync times
      task.targetNodes.forEach(nodeId => {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.lastSync = task.endTime ?? new Date().toISOString();
        }
      });

      this.emitEvent('task_completed', task);
    } else if (Math.random() < 0.02) { // 2% chance of failure
      task.status = 'failed';
      task.error = 'Network timeout';
      task.endTime = new Date().toISOString();
      task.retryCount++;

      if (task.retryCount < task.maxRetries) {
        // Schedule retry
        setTimeout(() => {
          task.status = 'pending';
          task.progress = 0;
        }, 30000); // Retry after 30 seconds
      }

      this.emitEvent('task_failed', task);
    }
  }

  private checkScheduledReplications() {
    const now = new Date();
    
    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      const shouldReplicate = this.shouldScheduleReplication(rule, now);
      
      if (shouldReplicate) {
        this.createReplicationTask(rule);
      }
    });
  }

  private shouldScheduleReplication(rule: ReplicationRule, now: Date): boolean {
    const lastTask = Array.from(this.tasks.values())
      .filter(task => 
        task.sourceNode === rule.sourceNode &&
        task.dataType === rule.dataType &&
        task.status === 'completed'
      )
      .sort((a, b) => new Date(b.endTime ?? 0).getTime() - new Date(a.endTime ?? 0).getTime())[0];

    if (!lastTask) return true;

    const lastReplicationTime = lastTask.endTime ? new Date(lastTask.endTime).getTime() : 0;
    const timeDiff = now.getTime() - lastReplicationTime;

    switch (rule.schedule) {
      case 'continuous':
        return timeDiff > 60000; // 1 minute
      case 'hourly':
        return timeDiff > 3600000; // 1 hour
      case 'daily':
        return timeDiff > 86400000; // 24 hours
      case 'weekly':
        return timeDiff > 604800000; // 7 days
      default:
        return false;
    }
  }

  private createReplicationTask(rule: ReplicationRule): string {
    const task: ReplicationTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNode: rule.sourceNode,
      targetNodes: rule.targetNodes,
      dataType: rule.dataType,
      replicationType: rule.replicationType,
      status: 'pending',
      priority: rule.priority,
      startTime: new Date().toISOString(),
      progress: 0,
      dataSize: Math.random() * 1000,
      recordsCount: Math.floor(Math.random() * 10000),
      retryCount: 0,
      maxRetries: 3
    };

    this.tasks.set(task.id, task);
    this.emitEvent('task_created', task);
    
    return task.id;
  }

  private addNode(node: ReplicationNode): string {
    const id = node.name.toLowerCase().replace(/\s+/g, '_');
    const newNode: ReplicationNode = { ...node, id };
    this.nodes.set(id, newNode);
    return id;
  }

  getNode(id: string): ReplicationNode | undefined {
    return this.nodes.get(id);
  }

  getAllNodes(): ReplicationNode[] {
    return Array.from(this.nodes.values());
  }

  getActiveNodes(): ReplicationNode[] {
    return Array.from(this.nodes.values()).filter(node => node.status === 'active');
  }

  updateNode(id: string, updates: Partial<ReplicationNode>): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    Object.assign(node, updates);
    return true;
  }

  private addRule(rule: ReplicationRule): string {
    const id = rule.name.toLowerCase().replace(/\s+/g, '_');
    const newRule: ReplicationRule = { ...rule, id };
    this.rules.set(id, newRule);
    return id;
  }

  getRule(id: string): ReplicationRule | undefined {
    return this.rules.get(id);
  }

  getAllRules(): ReplicationRule[] {
    return Array.from(this.rules.values());
  }

  updateRule(id: string, updates: Partial<ReplicationRule>): boolean {
    const rule = this.rules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  createManualReplication(
    sourceNode: string,
    targetNodes: string[],
    dataType: ReplicationTask['dataType'],
    replicationType: ReplicationTask['replicationType'] = 'incremental'
  ): string {
    const task: ReplicationTask = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNode,
      targetNodes,
      dataType,
      replicationType,
      status: 'pending',
      priority: 'high',
      startTime: new Date().toISOString(),
      progress: 0,
      dataSize: Math.random() * 500,
      recordsCount: Math.floor(Math.random() * 5000),
      retryCount: 0,
      maxRetries: 3
    };

    this.tasks.set(task.id, task);
    return task.id;
  }

  getTask(id: string): ReplicationTask | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): ReplicationTask[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getTasksByStatus(status: ReplicationTask['status']): ReplicationTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.status === status)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getTasksByNode(nodeId: string): ReplicationTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.sourceNode === nodeId || task.targetNodes.includes(nodeId))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  retryTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'failed') return false;

    task.status = 'pending';
    task.progress = 0;
    task.error = undefined;
    task.retryCount = 0;
    task.startTime = new Date().toISOString();
    task.endTime = undefined;

    return true;
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed') return false;

    task.status = 'failed';
    task.error = 'Cancelled by user';
    task.endTime = new Date().toISOString();

    return true;
  }

  getReplicationMetrics(): ReplicationMetrics {
    const totalTasks = this.tasks.size;
    const runningTasks = Array.from(this.tasks.values()).filter(task => task.status === 'running').length;
    const completedTasks = Array.from(this.tasks.values()).filter(task => task.status === 'completed').length;
    const failedTasks = Array.from(this.tasks.values()).filter(task => task.status === 'failed').length;

    const activeNodes = this.getActiveNodes();
    const averageLatency = activeNodes.reduce((sum, node) => sum + node.latency, 0) / activeNodes.length;

    const totalDataTransferred = Array.from(this.tasks.values())
      .filter(task => task.status === 'completed')
      .reduce((sum, task) => sum + task.dataSize, 0) / 1024; // Convert to GB

    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const replicationLag = activeNodes.reduce((sum, node) => sum + node.replicationLag, 0) / activeNodes.length;

    return {
      totalTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      averageLatency,
      totalDataTransferred,
      successRate,
      replicationLag
    };
  }

  pauseReplication(): void {
    this.isReplicationActive = false;
  }

  resumeReplication(): void {
    this.isReplicationActive = true;
  }

  // Event system
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Data cleanup
  cleanupOldTasks(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const oldTasks = Array.from(this.tasks.entries())
      .filter(([_, task]) => 
        task.status === 'completed' && 
        task.endTime && 
        new Date(task.endTime) < cutoffDate
      );

    oldTasks.forEach(([id]) => this.tasks.delete(id));
    
    return oldTasks.length;
  }

  exportReplicationData(): string {
    const exportData = {
      nodes: Array.from(this.nodes.values()),
      rules: Array.from(this.rules.values()),
      tasks: Array.from(this.tasks.values()),
      exportTime: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  importReplicationData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.nodes) {
        this.nodes.clear();
        importData.nodes.forEach((node: ReplicationNode) => {
          this.nodes.set(node.id, node);
        });
      }
      
      if (importData.rules) {
        this.rules.clear();
        importData.rules.forEach((rule: ReplicationRule) => {
          this.rules.set(rule.id, rule);
        });
      }
      
      if (importData.tasks) {
        this.tasks.clear();
        importData.tasks.forEach((task: ReplicationTask) => {
          this.tasks.set(task.id, task);
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to import replication data:', error);
      return false;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Real-time replication system initialized with mock data');
  }
}

export const realTimeReplicationManager = RealTimeReplicationManager.getInstance();

// Initialize mock data
realTimeReplicationManager.loadMockData();

